# Full Standalone Example: Animated Metaballs

A complete HTML file demonstrating raymarching with TSL — animated metaballs with full lighting.

```html
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>TSL Raymarching — Metaballs</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                background: #000;
                overflow: hidden;
            }
            canvas {
                display: block;
            }
        </style>
    </head>
    <body>
        <script type="importmap">
            {
                "imports": {
                    "three": "https://cdn.jsdelivr.net/npm/three@0.183.1/build/three.module.js",
                    "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.183.1/build/three.webgpu.js",
                    "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.183.1/build/three.tsl.js"
                }
            }
        </script>
        <script type="module">
            import {
                Break,
                Fn,
                If,
                Loop,
                Return,
                abs,
                clamp,
                cos,
                dot,
                float,
                length,
                max,
                min,
                mix,
                normalize,
                pow,
                reflect,
                screenSize,
                screenUV,
                sin,
                step,
                time,
                vec2,
                vec3,
                vec4,
            } from 'three/tsl';
            import * as THREE from 'three/webgpu';

            // --- Renderer ---
            const renderer = new THREE.WebGPURenderer({ antialias: true });
            renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
            renderer.setSize(window.innerWidth, window.innerHeight);
            document.body.appendChild(renderer.domElement);
            await renderer.init();

            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

            // --- SDF primitives ---
            const sdSphere = Fn(([p, r]) => p.length().sub(r));

            const opSmoothUnion = Fn(([d1, d2, k]) => {
                const h = max(k.sub(abs(d1.sub(d2))), float(0)).div(k);
                return min(d1, d2).sub(h.mul(h).mul(k).mul(0.25));
            });

            // --- Scene SDF ---
            const sceneSDF = Fn(([p]) => {
                const t = time;

                // Sphere 1: orbits in XY
                const p1 = p.sub(vec3(sin(t.mul(1.3)).mul(0.8), cos(t.mul(0.9)).mul(0.6), float(0)));
                const d1 = sdSphere(p1, float(0.4));

                // Sphere 2: orbits in XZ
                const p2 = p.sub(vec3(cos(t.mul(0.7)).mul(0.7), float(0), sin(t.mul(1.1)).mul(0.5)));
                const d2 = sdSphere(p2, float(0.35));

                // Sphere 3: center, bobs up/down
                const p3 = p.sub(vec3(float(0), sin(t.mul(2.0)).mul(0.3), float(0)));
                const d3 = sdSphere(p3, float(0.3));

                return opSmoothUnion(opSmoothUnion(d1, d2, float(0.4)), d3, float(0.35));
            });

            // --- Normal via central differences ---
            const calcNormal = Fn(([p]) => {
                const eps = float(0.001);
                const h = vec2(eps, float(0));
                return normalize(
                    vec3(
                        sceneSDF(p.add(h.xyy)).sub(sceneSDF(p.sub(h.xyy))),
                        sceneSDF(p.add(h.yxy)).sub(sceneSDF(p.sub(h.yxy))),
                        sceneSDF(p.add(h.yyx)).sub(sceneSDF(p.sub(h.yyx))),
                    ),
                );
            });

            // --- Lighting ---
            const calcLighting = Fn(([ro, hitPos]) => {
                const N = calcNormal(hitPos);
                const V = normalize(ro.sub(hitPos));
                const L = normalize(vec3(1.5, 2.0, 1.0));

                const baseColor = vec3(0.1, 0.5, 0.9);

                // Ambient
                const ambient = baseColor.mul(0.15);

                // Hemisphere
                const skyCol = vec3(0.1, 0.3, 0.7);
                const groundCol = vec3(0.4, 0.2, 0.05);
                const hemi = mix(groundCol, skyCol, N.y.mul(0.5).add(0.5));

                // Diffuse
                const diff = baseColor.mul(max(float(0), dot(N, L)));

                // Specular (Phong)
                const R = reflect(L.negate(), N);
                const spec = vec3(pow(max(float(0), dot(V, R)), float(48)));

                // Fresnel
                const fresnel = pow(float(1).sub(max(float(0), dot(V, N))), float(3));

                return ambient
                    .add(hemi.mul(0.2))
                    .add(diff.mul(0.6))
                    .add(spec.mul(0.4))
                    .add(vec3(fresnel.mul(0.3)));
            });

            // --- Main raymarching material ---
            const mat = new THREE.MeshBasicNodeMaterial();
            mat.colorNode = Fn(() => {
                const MAX_STEPS = 64;
                const MAX_DIST = 20.0;
                const HIT_DIST = 0.001;

                // Aspect-correct UV → ray direction
                const res = screenSize.xy;
                const fuv = screenUV.mul(res).mul(2).sub(res).div(res.y);

                const ro = vec3(0, 0, float(-3)).toVar();
                const rd = vec3(fuv, float(1.2)).normalize();

                const t = float(0).toVar();
                const ray = ro.add(rd.mul(t)).toVar();
                const hit = float(0).toVar(); // 1 = hit

                Loop({ start: 0, end: MAX_STEPS, type: 'int' }, () => {
                    const d = sceneSDF(ray);
                    t.addAssign(d);
                    ray.assign(ro.add(rd.mul(t)));

                    If(d.lessThan(HIT_DIST), () => {
                        hit.assign(float(1));
                        Break();
                    });
                    If(t.greaterThan(MAX_DIST), () => {
                        Break();
                    });
                });

                // Background gradient
                const bg = mix(vec3(0.02, 0.02, 0.06), vec3(0.08, 0.05, 0.15), fuv.y.mul(0.5).add(0.5));

                // Surface shading
                const surface = calcLighting(ro, ray);

                // Tone-map surface
                const tonemapped = surface.div(surface.add(float(1)));

                return mix(bg, tonemapped, hit);
            })();

            // --- Scene geometry (fullscreen quad) ---
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
            scene.add(mesh);

            // --- Resize ---
            window.addEventListener('resize', () => {
                renderer.setSize(window.innerWidth, window.innerHeight);
            });

            // --- Render loop ---
            renderer.setAnimationLoop(() => {
                renderer.render(scene, camera);
            });
        </script>
    </body>
</html>
```

## Key points in this example

- `screenSize` and `screenUV` used instead of manual viewport uniforms
- All variables mutated inside `Loop` use `.toVar()`
- `MAX_STEPS` capped at 64 — adequate for 3 smooth-unioned spheres
- Background is a simple vec3 mix — no extra SDF calls
- Tone-mapping applied in-shader: `x / (x + 1)` (Reinhard)
- WebGPU + WebGL fallback is automatic via `WebGPURenderer`
