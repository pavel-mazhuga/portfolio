'use client';

import { OrbitControls } from '@react-three/drei';
import { useControls } from 'leva';
import { Suspense, useMemo } from 'react';
import {
    Fn,
    ShaderNodeObject,
    cameraPosition,
    color,
    normalLocal,
    normalize,
    positionLocal,
    positionViewDirection,
    pow,
    time,
    uniform,
    varyingProperty,
    vec3,
    vec4,
} from 'three/tsl';
import { MeshBasicNodeMaterial, Node } from 'three/webgpu';
import { useMediaQuery } from 'usehooks-ts';
import PageLoading from '@/app/components/shared/PageLoading';
import WebGPUCanvas from '@/app/components/webgl/WebGPUCanvas';
import { ambientLightNode } from '@/utils/webgpu/nodes/lighting/ambient';
import { directionalLightNode } from '@/utils/webgpu/nodes/lighting/directional';
import { simplexNoise4d } from '@/utils/webgpu/nodes/noise/simplexNoise4d';
import { remapNode } from '@/utils/webgpu/nodes/remap';
import { smoothMod } from '@/utils/webgpu/nodes/smooth-mod';

const Demo = ({ isMobile }: { isMobile: boolean }) => {
    useControls({
        gradientStrength: {
            value: 1.3,
            min: 1,
            max: 3,
            step: 0.001,
            onChange: (val: number) => {
                uniforms.gradientStrength.value = val;
            },
        },
        color: {
            value: '#2994ff',
            onChange: (val: string) => {
                (uniforms.color.value as any).set(val);
            },
        },
        speed: {
            value: 1.1,
            min: 0,
            max: 20,
            step: 0.001,
            onChange: (val: number) => {
                uniforms.speed.value = val;
            },
        },
        noiseStrength: {
            value: 1,
            min: 0,
            max: 3,
            step: 0.001,
            onChange: (val: number) => {
                uniforms.noiseStrength.value = val;
            },
        },
        displacementStrength: {
            value: 0.3,
            min: 0,
            max: 1,
            step: 0.001,
            onChange: (val: number) => {
                uniforms.displacementStrength.value = val;
            },
        },
        fractAmount: {
            value: 6,
            min: 0,
            max: 10,
            step: 1,
            onChange: (val: number) => {
                uniforms.fractAmount.value = val;
            },
        },
        // remapPowerRange: {
        //     min: 0,
        //     max: 1,
        //     value: [0.4, 0.7],
        //     onChange: (val: [number, number]) => {
        //         uniforms.remapPowerRange.value = val;
        //     },
        // },
    });

    useControls('Ambient light', {
        color: {
            value: '#fff',
            onChange: (val: string) => {
                (uniforms.ambientLight.color.value as any).set(val);
            },
        },
        intensity: {
            value: 0.3,
            min: 0,
            max: 1,
            step: 0.001,
            onChange: (val: number) => {
                uniforms.ambientLight.intensity.value = val;
            },
        },
    });

    useControls('Directional light', {
        color: {
            value: '#fff',
            onChange: (val: string) => {
                (uniforms.directionalLight.color.value as any).set(val);
            },
        },
        intensity: {
            value: 1,
            min: 0,
            max: 5,
            step: 0.001,
            onChange: (val: number) => {
                uniforms.directionalLight.intensity.value = val;
            },
        },
        positionX: {
            value: -2,
            min: -10,
            max: 10,
            step: 0.001,
            onChange: (val: number) => {
                (uniforms.directionalLight.position.value as any).x = val;
            },
        },
        positionY: {
            value: 2,
            min: -10,
            max: 10,
            step: 0.001,
            onChange: (val: number) => {
                (uniforms.directionalLight.position.value as any).y = val;
            },
        },
        positionZ: {
            value: 3.5,
            min: -10,
            max: 10,
            step: 0.001,
            onChange: (val: number) => {
                (uniforms.directionalLight.position.value as any).z = val;
            },
        },
    });

    const uniforms = useMemo(
        () => ({
            color: uniform(color('#2994ff')),
            gradientStrength: uniform(1.3),
            speed: uniform(1.1),
            noiseStrength: uniform(1),
            displacementStrength: uniform(0.3),
            fractAmount: uniform(6),
            // remapPowerRange: uniform([0.4, 0.7]),
            ambientLight: {
                color: uniform(color('#fff')),
                intensity: uniform(0.3),
            },
            directionalLight: {
                color: uniform(color('#fff')),
                intensity: uniform(1),
                position: uniform(vec3(-2, 2, 3.5)),
            },
        }),
        [],
    );

    const nodeMaterial = useMemo(() => {
        const material = new MeshBasicNodeMaterial();

        const timer = time;

        const vPattern = varyingProperty('float');
        const vNormal = varyingProperty('vec3');
        const vViewDirection = varyingProperty('vec3');

        const positionNode = Fn<ShaderNodeObject<Node>[]>(([position]) => {
            vNormal.assign(normalLocal);
            vViewDirection.assign(positionViewDirection);

            const coords = normalLocal.toVar();
            coords.y.subAssign(timer.mul(0.05));
            coords.addAssign(simplexNoise4d(vec4(coords, 1)).mul(uniforms.noiseStrength));

            const pattern = remapNode(
                smoothMod(coords.y.mul(uniforms.fractAmount), 1, 1.5),
                // uniforms.remapPowerRange.element(0),
                // uniforms.remapPowerRange.element(1),
                0.4,
                0.7,
                0,
                1,
            ).toVar();

            vPattern.assign(pattern);

            const newPosition = position.add(normalLocal.mul(pattern).mul(uniforms.displacementStrength));

            const viewDirection = normalize(newPosition.sub(cameraPosition));
            vViewDirection.assign(viewDirection);

            return newPosition;
        });

        const colorNode = Fn(() => {
            const color = pow(vPattern, uniforms.gradientStrength).mul(uniforms.color);

            const ambientLight = ambientLightNode(uniforms.ambientLight.color, uniforms.ambientLight.intensity);

            const directionalLight = directionalLightNode(
                uniforms.directionalLight.color,
                uniforms.directionalLight.intensity,
                vNormal,
                uniforms.directionalLight.position,
                vViewDirection,
                20,
            );

            const light = vec3(0).add(ambientLight).add(directionalLight);

            const finalColor = vec3(color).mul(light);

            return vec4(finalColor, 1);
        });

        material.positionNode = positionNode(positionLocal);
        material.colorNode = colorNode();

        return material;
    }, [uniforms]);

    return (
        <mesh matrixAutoUpdate={false} frustumCulled={false} material={nodeMaterial}>
            <icosahedronGeometry args={[1.3, isMobile ? 180 : 256]} />
        </mesh>
    );
};

const Experience = () => {
    const isMobile = useMediaQuery('(max-width: 1199px)');

    return (
        <WebGPUCanvas
            canvasProps={{ alpha: false }}
            camera={{
                position: [0, 0, isMobile ? 9 : 5],
                fov: 45,
                near: 0.1,
                far: 1000,
            }}
        >
            <Suspense fallback={<PageLoading />}>
                <Demo isMobile={isMobile} />
            </Suspense>
            <OrbitControls />
        </WebGPUCanvas>
    );
};

export default Experience;
