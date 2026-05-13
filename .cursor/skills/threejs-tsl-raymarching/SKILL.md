---
name: threejs-tsl-raymarching
description: >
    Build algorithmic procedural animations and raymarching scenes with Three.js Shading Language (TSL) and WebGPURenderer.
    Use this skill whenever the user asks to create: raymarching, signed distance fields (SDFs), procedural 3D scenes,
    metaballs, volumetric effects, implicit surfaces, or any shader-based animation using Three.js TSL / WebGPU.
    Also trigger for: "procedural shader", "SDF scene", "march along a ray".
    Always use this skill before writing any Three.js raymarching or TSL shader code — it contains critical patterns,
    performance rules, and import conventions that prevent common bugs.
---

# Three.js TSL Raymarching Skill

## Overview

Raymarching renders complex implicit-surface 3D scenes entirely inside a fragment shader, with no traditional geometry.
Combined with TSL (Three.js Shading Language), it compiles to WGSL (WebGPU) or falls back to GLSL (WebGL) automatically.

**All code must use TSL only — no raw GLSL strings.**

---

## 1. Canonical Setup

Always use `WebGPURenderer` with `forceWebGL` fallback and `import map` pattern.

```html
<script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.183.1/build/three.module.js",
            "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.183.1/build/three.webgpu.js",
            "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.183.1/build/three.tsl.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.183.1/examples/jsm/"
        }
    }
</script>
<script type="module">
    import {
        Break,
        Fn,
        If,
        Loop,
        abs,
        clamp,
        cos,
        dot,
        float,
        floor,
        fract,
        length,
        max,
        min,
        mix,
        mod,
        normalize,
        pow,
        reflect,
        screenSize,
        screenUV,
        sign,
        sin,
        smoothstep,
        step,
        time,
        uniform,
        uv,
        vec2,
        vec3,
        vec4,
    } from 'three/tsl';
    import * as THREE from 'three/webgpu';

    const renderer = new THREE.WebGPURenderer({ antialias: true });
    await renderer.init();
    renderer.setAnimationLoop(animate);
</script>
```

**Key imports from `three/tsl`** (never use GLSL strings):

| Category     | Imports                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core         | `Fn, float, vec2, vec3, vec4, int, uint, bool`                                                                                                                         |
| Control flow | `If, Else, Loop, Break, Continue, Return`                                                                                                                              |
| Variables    | `Var, Const, uniform, attribute`                                                                                                                                       |
| Math         | `sin, cos, abs, min, max, dot, cross, normalize, reflect, refract, mix, clamp, fract, floor, ceil, mod, sign, step, smoothstep, pow, sqrt, exp, log, length, distance` |
| Time         | `time` (auto-updating uniform)                                                                                                                                         |
| Screen       | `screenSize`, `screenUV`, `uv()`                                                                                                                                       |
| Camera       | `cameraPosition, cameraViewMatrix, cameraNear, cameraFar`                                                                                                              |

---

## 2. The Raymarching Loop Pattern

**Always use a fullscreen plane with `MeshBasicNodeMaterial`.**

```js
// Scene geometry: fullscreen quad
const geo = new THREE.PlaneGeometry(2, 2);
const mat = new THREE.MeshBasicNodeMaterial();
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

// Use an orthographic camera for fullscreen quads
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
```

**Core raymarching loop (TSL):**

```js
const MAX_STEPS = 80; // ⚠️ keep low for performance
const MAX_DIST = 100.0;
const HIT_DIST = 0.001;

const sceneSDF = Fn(([p]) => {
    // Build your scene here — return signed distance
    return sdSphere(p, float(1.0));
});

const raymarch = Fn(() => {
    // Aspect-corrected UV → ray direction
    const res = screenSize.xy;
    const fragUV = screenUV.mul(res).mul(2).sub(res).div(res.y);

    const ro = vec3(0, 0, -3).toVar(); // ray origin
    const rd = vec3(fragUV, float(1)).normalize(); // ray direction

    const t = float(0).toVar();
    const ray = ro.add(rd.mul(t)).toVar();

    Loop({ start: 0, end: MAX_STEPS, type: 'int' }, () => {
        const d = sceneSDF(ray);
        t.addAssign(d);
        ray.assign(ro.add(rd.mul(t)));

        If(d.lessThan(HIT_DIST), () => {
            Break();
        });
        If(t.greaterThan(MAX_DIST), () => {
            Break();
        });
    });

    return t; // use t for shading
});

mat.colorNode = Fn(() => {
    const t = raymarch();
    // Background
    If(t.greaterThanEqual(MAX_DIST), () => {
        Return(vec3(0.05, 0.05, 0.1)); // sky
    });
    return vec3(t.mul(0.1));
})();
```

---

## 3. SDF Primitives (TSL)

```js
// Sphere
const sdSphere = Fn(([p, r]) => p.length().sub(r));

// Box (half-extents b)
const sdBox = Fn(([p, b]) => {
    const q = abs(p).sub(b);
    return max(q, float(0))
        .length()
        .add(min(max(q.x, max(q.y, q.z)), float(0)));
});

// Torus (t.x = major radius, t.y = minor radius)
const sdTorus = Fn(([p, t]) => {
    const q = vec2(p.xz.length().sub(t.x), p.y);
    return q.length().sub(t.y);
});

// Capsule
const sdCapsule = Fn(([p, a, b, r]) => {
    const pa = p.sub(a);
    const ba = b.sub(a);
    const h = clamp(dot(pa, ba).div(dot(ba, ba)), float(0), float(1));
    return pa.sub(ba.mul(h)).length().sub(r);
});

// Plane (normal n, offset h)
const sdPlane = Fn(([p, n, h]) => dot(p, n).add(h));
```

**Boolean operations:**

```js
// Union (take closest)
const opUnion = Fn(([d1, d2]) => min(d1, d2));

// Subtraction
const opSub = Fn(([d1, d2]) => max(d1, d2.negate()));

// Intersection
const opIntersect = Fn(([d1, d2]) => max(d1, d2));

// Smooth union (metaballs / liquid)
const opSmoothUnion = Fn(([d1, d2, k]) => {
    const h = max(k.sub(abs(d1.sub(d2))), float(0)).div(k);
    return min(d1, d2).sub(h.mul(h).mul(k).mul(0.25));
});
```

---

## 4. Lighting (TSL)

```js
// Compute normal via central differences — 6 SDF calls per pixel, costly
const calcNormal = Fn(([p]) => {
    const eps = float(0.0001);
    const h = vec2(eps, float(0));
    return normalize(
        vec3(
            sceneSDF(p.add(h.xyy)).sub(sceneSDF(p.sub(h.xyy))),
            sceneSDF(p.add(h.yxy)).sub(sceneSDF(p.sub(h.yxy))),
            sceneSDF(p.add(h.yyx)).sub(sceneSDF(p.sub(h.yyx))),
        ),
    );
});

// Phong lighting
const phongLight = Fn(([ro, hitPos, baseColor]) => {
    const N = calcNormal(hitPos);
    const V = normalize(ro.sub(hitPos));
    const L = normalize(vec3(1, 2, 1));

    const ambient = baseColor.mul(0.1);
    const diffuse = baseColor.mul(max(float(0), dot(N, L))).mul(0.7);
    const R = reflect(L.negate(), N);
    const specular = vec3(pow(max(float(0), dot(V, R)), float(32))).mul(0.3);
    const fresnel = pow(float(1).sub(max(float(0), dot(V, N))), float(3)).mul(0.5);

    return ambient.add(diffuse).add(specular).add(vec3(fresnel));
});
```

---

## 5. Animation Patterns

```js
// time is a built-in auto-updating TSL uniform
import { time } from 'three/tsl';

// Oscillate along x over time
const animatedPos = p.add(vec3(sin(time), float(0), float(0)));

// Rotation matrix 2D
const rot2D = Fn(([angle]) => {
    const s = sin(angle);
    const c = cos(angle);
    // Use .xy swizzle assignment on the vec2
    return vec2(p.x.mul(c).sub(p.y.mul(s)), p.x.mul(s).add(p.y.mul(c)));
});

// Uniforms for interactive parameters
const myParam = uniform(1.0);
// Update from JS: myParam.value = newValue;
```

---

## 6. Performance Rules ⚠️

Raymarching is **extremely GPU-intensive**. Follow these rules strictly:

| Rule                          | Guidance                                                                 |
| ----------------------------- | ------------------------------------------------------------------------ |
| **Max steps**                 | Keep `MAX_STEPS` ≤ 80 for real-time; use 32–48 for mobile                |
| **SDF complexity**            | Minimize SDF evaluations. Normal calculation = 6× SDF, so it's expensive |
| **No branching inside loops** | Use `select()` / `mix()` instead of `If/Else` where possible             |
| **Resolution scaling**        | Render at half resolution via a render target, upscale with `screenUV`   |
| **Pixel ratio**               | `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))` — never 2+     |
| **Primitive count**           | Keep scene SDF to ≤ 6–8 primitives for smooth 60fps                      |
| **Domain repetition**         | Use `fract(p * scale)` for infinite repeating scenes cheaply             |
| **Early exit**                | Always `Break()` on hit and on max distance — never run the full loop    |
| **Avoid pow() in loops**      | Pre-calculate powers outside the march loop                              |
| **Use `toVar()`**             | Variables that are reassigned inside loops **must** use `.toVar()`       |

**Low-resolution render target pattern (for complex scenes):**

```js
const halfSize = { width: window.innerWidth / 2, height: window.innerHeight / 2 };
const rt = new THREE.RenderTarget(halfSize.width, halfSize.height);
// render scene to rt, then blit rt.texture to screen with a fullscreen quad
```

---

## 7. Common Mistakes to Avoid

```js
// ❌ WRONG — mutable loop var without toVar()
const t = float(0);
Loop(..., () => { t.addAssign(d); }); // silently broken

// ✅ CORRECT
const t = float(0).toVar();

// ❌ WRONG — raw GLSL string
mat.colorNode = glsl(`vec4(1.0, 0.0, 0.0, 1.0)`);

// ✅ CORRECT — pure TSL
mat.colorNode = vec4(1, 0, 0, 1);

// ❌ WRONG — WebGLRenderer with TSL
const renderer = new THREE.WebGLRenderer();

// ✅ CORRECT
const renderer = new THREE.WebGPURenderer();
await renderer.init();

// ❌ WRONG — requestAnimationFrame
requestAnimationFrame(animate);

// ✅ CORRECT
renderer.setAnimationLoop(animate);
```

---

## 8. Full Working Example

See `references/full-example.md` for a complete standalone HTML file with:

- Animated metaballs (smooth union of spheres)
- Phong lighting with normals
- Hemisphere ambient + specular + fresnel
- Performance-safe loop bounds
- WebGPU + WebGL fallback

---

## 9. Advanced Topics

For more advanced patterns, see `references/advanced.md`:

- Domain repetition / infinite grids
- Ambient occlusion (AO) via SDF
- Shadow marching
- Post-processing with TSL PassNode
- Compute shaders for GPGPU particles
