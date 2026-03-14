import {
    Break,
    Fn,
    If,
    Loop,
    ShaderNodeObject,
    cos,
    dot,
    float,
    max,
    mix,
    normalize,
    pow,
    reflect,
    screenSize,
    screenUV,
    sin,
    time,
    uniform,
    vec2,
    vec3,
} from 'three/tsl';
import { Color, Mesh, Node, NodeMaterial, OrthographicCamera, PlaneGeometry, UniformNode } from 'three/webgpu';
import { createFresnelNode } from '@/utils/webgpu/nodes/lighting/fresnel';
import { opSmoothUnion } from '@/utils/webgpu/sdf/math';
import { sdSphere } from '@/utils/webgpu/sdf/shapes';
import BaseExperience from '../BaseExperience';

class Metaballs extends BaseExperience {
    // @ts-expect-error - Overriding PerspectiveCamera with OrthographicCamera for fullscreen raymarching
    camera: OrthographicCamera;
    uniforms: {
        uK: ShaderNodeObject<UniformNode<number>>;
        uSpeed: ShaderNodeObject<UniformNode<number>>;
        uColorA: ShaderNodeObject<UniformNode<Color>>;
        uColorB: ShaderNodeObject<UniformNode<Color>>;
        uCameraDist: ShaderNodeObject<UniformNode<number>>;
    };

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.25);
    }
    params = {
        smoothing: 0.3,
        speed: 0.65,
        colorA: '#cc3380',
        colorB: '#3380cc',
        cameraDist: 1.5,
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const geometry = new PlaneGeometry(2, 2);
        const material = new NodeMaterial();

        const uK = uniform(this.params.smoothing);
        const uSpeed = uniform(this.params.speed);
        const uColorA = uniform(new Color(this.params.colorA));
        const uColorB = uniform(new Color(this.params.colorB));
        const uCameraDist = uniform(this.params.cameraDist);

        const sceneSDF = Fn<ShaderNodeObject<Node>[]>(([p]) => {
            const t = time.mul(uSpeed);
            let finalDist = null;

            for (let i = 0; i < 7; i++) {
                const off = i * 1.5;
                const pos = vec3(
                    sin(t.mul(1.1 + i * 0.1).add(off)).mul(0.7),
                    cos(t.mul(1.2 + i * 0.05).add(off * 0.5)).mul(0.5),
                    sin(t.mul(0.9 + i * 0.15).add(off * 2.0)).mul(0.4),
                );
                const d = sdSphere(p.add(pos), float(0.2 + (i % 3) * 0.1));

                if (finalDist === null) {
                    finalDist = d;
                } else {
                    finalDist = opSmoothUnion(finalDist, d, uK);
                }
            }

            return finalDist;
        });

        const calcNormal = Fn<ShaderNodeObject<Node>[]>(([p]) => {
            const e = vec2(1, -1).mul(0.0001);
            const n = e.xyy
                .mul(sceneSDF(p.add(e.xyy)))
                .add(e.yyx.mul(sceneSDF(p.add(e.yyx))))
                .add(e.yxy.mul(sceneSDF(p.add(e.yxy))))
                .add(e.xxx.mul(sceneSDF(p.add(e.xxx))));
            return normalize(n);
        });

        const phongLight = Fn<ShaderNodeObject<Node>[]>(([ro, hitPos, baseColor]) => {
            const normal = calcNormal(hitPos);
            const viewDirection = normalize(ro.sub(hitPos));
            const lightDirection = normalize(vec3(1, 2, 1));
            const ambient = baseColor.mul(0.1);
            const diffuse = baseColor.mul(max(float(0), dot(normal, lightDirection))).mul(0.7);
            const reflection = reflect(lightDirection.negate(), normal);
            const specular = vec3(pow(max(float(0), dot(viewDirection, reflection)), float(32))).mul(0.3);
            const fresnel = createFresnelNode(viewDirection, normal, float(3)).mul(0.5);

            return ambient.add(diffuse).add(specular).add(vec3(fresnel));
        });

        const MAX_STEPS = 64;
        const MAX_DIST = 20.0;
        const HIT_DIST = 0.0015;

        const raymarch = Fn(() => {
            const res = screenSize.xy;
            const fragUV = screenUV.mul(res).mul(2).sub(res).div(res.y);

            const ro = vec3(0, 0, uCameraDist.negate()).toVar();
            const rd = vec3(fragUV, float(1)).normalize();

            const t = float(0).toVar();
            const p = ro.add(rd.mul(t)).toVar();

            Loop(MAX_STEPS, () => {
                const d = sceneSDF(p);
                t.addAssign(d);
                p.assign(ro.add(rd.mul(t)));

                If(d.lessThan(HIT_DIST), () => {
                    Break();
                });

                If(t.greaterThan(MAX_DIST), () => {
                    Break();
                });
            });

            return t;
        });

        material.colorNode = Fn(() => {
            const t = raymarch();
            const res = screenSize.xy;
            const fragUV = screenUV.mul(res).mul(2).sub(res).div(res.y);

            const ro = vec3(0, 0, uCameraDist.negate());
            const rd = vec3(fragUV, float(1)).normalize();
            const hitPos = ro.add(rd.mul(t));

            const skyColor = mix(vec3(0.02, 0.05, 0.1), vec3(0.1, 0.2, 0.4), fragUV.y.add(0.5));
            const baseColor = mix(uColorA, uColorB, sin(time.mul(0.5)).add(1.0).div(2.0));
            const objectColor = phongLight(ro, hitPos, baseColor);

            return t.greaterThanEqual(MAX_DIST).select(skyColor, objectColor);
        })();

        const mesh = new Mesh(geometry, material);
        this.scene.add(mesh);

        this.uniforms = { uK, uSpeed, uColorA, uColorB, uCameraDist };

        this.initTweakPane();
    }

    async render() {
        super.render();
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);

        this.camera.updateProjectionMatrix();
    }

    destroy() {
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            const folder = this.tweakPane.addFolder({ title: 'Raymarching' });
            const { uK, uSpeed, uColorA, uColorB, uCameraDist } = this.uniforms;

            folder.addBinding(this.params, 'smoothing', { min: 0.1, max: 2.0 }).on('change', () => {
                uK.value = this.params.smoothing;
            });

            folder.addBinding(this.params, 'speed', { min: 0, max: 5 }).on('change', () => {
                uSpeed.value = this.params.speed;
            });

            folder.addBinding(this.params, 'colorA').on('change', () => {
                uColorA.value.set(this.params.colorA);
            });

            folder.addBinding(this.params, 'colorB').on('change', () => {
                uColorB.value.set(this.params.colorB);
            });

            folder.addBinding(this.params, 'cameraDist', { min: 0.1, max: 3.0 }).on('change', () => {
                uCameraDist.value = this.params.cameraDist;
            });
        }
    }
}

export default Metaballs;
