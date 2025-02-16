'use client';

import { useThree } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import {
    Break,
    Fn,
    If,
    dot,
    float,
    loop,
    max,
    normalize,
    reflect,
    sin,
    timerLocal,
    uv,
    vec2,
    vec3,
    viewport,
} from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import PageLoading from '@/app/components/shared/PageLoading';
import WebGPUCanvas from '@/app/components/webgl/WebGPUCanvas';
import { diffuseNode } from '@/utils/webgpu/nodes/lighting/diffuse';
import { createFresnelNode } from '@/utils/webgpu/nodes/lighting/fresnel';
import { createHemisphereLight } from '@/utils/webgpu/nodes/lighting/hemisphere';
import { sdSphere } from '@/utils/webgpu/nodes/sdf/sphere';
import { smoothmin } from '@/utils/webgpu/nodes/smooth-min';

const Demo = () => {
    const { width, height } = useThree((state) => state.viewport);

    const raymarchMaterial = useMemo(() => {
        const material = new MeshBasicNodeMaterial();

        const timer = timerLocal(1);

        const sdf = Fn<any>(([pos]) => {
            const translatedPos = pos.add(vec3(sin(timer), 0, 0));
            const sphere = sdSphere(translatedPos, 0.5);
            const secondSphere = sdSphere(pos, 0.3);

            return smoothmin(secondSphere, sphere, 0.3);
        });

        const calcNormal = Fn<any>(([ray]) => {
            const eps = float(0.0001);
            const h = vec2(eps, 0);

            return normalize(
                vec3(
                    sdf(ray.add(h.xyy)).sub(sdf(ray.sub(h.xyy))),
                    sdf(ray.add(h.yxy)).sub(sdf(ray.sub(h.yxy))),
                    sdf(ray.add(h.yyx)).sub(sdf(ray.sub(h.yyx))),
                ),
            );
        });

        const lighting = Fn<any>(([rayOrigin, ray]) => {
            const normal = calcNormal(ray);
            const viewDir = normalize(rayOrigin.sub(ray));
            const lightDir = normalize(vec3(1));

            const ambient = vec3(0.02);
            const diffuse = diffuseNode(vec3(1, 1, 0.9), lightDir, normal).mul(0.3);
            const hemi = createHemisphereLight(vec3(0, 0.3, 0.6), vec3(0.6, 0.3, 0.1), normal).mul(0.2);

            // Phong specular - Reflective light and highlights
            const ph = normalize(reflect(lightDir.negate(), normal));
            const phongValue = max(0, dot(viewDir, ph)).pow(32);
            const specular = vec3(phongValue).toVar();

            // Fresnel effect - makes our specular highlight more pronounced at different viewing angles
            const fresnel = createFresnelNode(viewDir, normal, 2);
            specular.mulAssign(fresnel);

            const lighting = ambient.add(diffuse).addAssign(hemi);

            const finalColor = vec3(0.1).mul(lighting).addAssign(specular);

            return finalColor;
        });

        const raymarch = Fn(() => {
            // Use frag coordinates to get an aspect-fixed UV
            const _uv = uv().mul(viewport.xy).mul(2).sub(viewport.xy).div(viewport.y);

            // Initialize the ray and its direction
            const rayOrigin = vec3(0, 0, -3);
            const rayDirection = vec3(_uv, 1).normalize();

            // Total distance travelled - note that toVar is important here so we can assign to this variable
            const t = float(0).toVar();

            // Calculate the initial position of the ray - this var is declared here so we can use it in lighting calculations later
            const ray = rayOrigin.add(rayDirection.mul(t)).toVar();

            loop({ start: 1, end: 80 }, () => {
                const d = sdf(ray); // current distance to the scene

                t.addAssign(d.mul(0.8)); // "march" the ray

                ray.assign(rayOrigin.add(rayDirection.mul(t))); // position along the ray

                // If we're close enough, it's a hit, so we can do an early return, or
                // If we've travelled too far, we can return now and consider that this ray didn't hit anything
                If(d.lessThan(0.005).or(t.greaterThan(50)), () => {
                    Break();
                });
            });

            return lighting(rayOrigin, ray);
        });

        material.colorNode = raymarch();

        return material;
    }, []);

    return (
        <mesh scale={[width, height, 1]}>
            <planeGeometry />
            <primitive object={raymarchMaterial} attach="material" />
        </mesh>
    );
};

const Experiment = () => {
    return (
        <WebGPUCanvas
            canvasProps={{ alpha: false }}
            camera={{
                position: [0, 0, 1],
                fov: 45,
                near: 0.1,
                far: 100,
            }}
        >
            <Suspense fallback={<PageLoading />}>
                <Demo />
            </Suspense>
        </WebGPUCanvas>
    );
};

export default Experiment;
