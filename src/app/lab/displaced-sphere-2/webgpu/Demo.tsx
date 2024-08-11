'use client';

import { OrbitControls, useTexture } from '@react-three/drei';
import { useControls } from 'leva';
import { Suspense, useEffect, useMemo } from 'react';
import {
    MeshBasicNodeMaterial,
    Node,
    RepeatWrapping,
    ShaderNodeObject,
    cameraPosition,
    color,
    normalLocal,
    normalize,
    positionLocal,
    positionViewDirection,
    pow,
    texture,
    timerLocal,
    tslFn,
    uniform,
    varyingProperty,
    vec3,
    vec4,
} from 'three/webgpu';
import { useMediaQuery } from 'usehooks-ts';
import PageLoading from '@/app/components/shared/PageLoading';
import WebGPUCanvas from '@/app/components/webgl/WebGPUCanvas';
import { ambientLightNode } from '@/utils/webgpu/nodes/lighting/ambient';
import { directionalLightNode } from '@/utils/webgpu/nodes/lighting/directional';
import { cnoise } from '@/utils/webgpu/nodes/noise/cnoise';
import { snoise3 } from '@/utils/webgpu/nodes/noise/simplexNoise3d';
import { remapNode } from '@/utils/webgpu/nodes/remap';
import { smoothMod } from '@/utils/webgpu/nodes/smooth-mod';

const Demo = ({ isMobile }: { isMobile: boolean }) => {
    const noiseTexture = useTexture('/img/perlin.png');
    noiseTexture.wrapS = RepeatWrapping;
    noiseTexture.wrapT = RepeatWrapping;

    const controls = useControls({
        gradientStrength: {
            value: 1.3,
            min: 1,
            max: 3,
            step: 0.001,
        },
        color: '#2994ff',
        speed: {
            value: 1.1,
            min: 0,
            max: 20,
            step: 0.001,
        },
        noiseStrength: {
            value: 1,
            min: 0,
            max: 3,
            step: 0.001,
        },
        displacementStrength: {
            value: 0.3,
            min: 0,
            max: 1,
            step: 0.001,
        },
        fractAmount: {
            value: 6,
            min: 0,
            max: 10,
            step: 1,
        },
        remapPowerRange: {
            min: 0,
            max: 1,
            value: [0.4, 0.7],
        },
    });

    const ambientLightControls = useControls('Ambient light', {
        color: '#fff',
        intensity: {
            value: 0.35,
            min: 0,
            max: 1,
            step: 0.001,
        },
    });

    const directionalLightControls = useControls('Directional light', {
        color: '#fff',
        intensity: {
            value: 1,
            min: 0,
            max: 5,
            step: 0.001,
        },
        positionX: {
            value: -2,
            min: -10,
            max: 10,
            step: 0.001,
        },
        positionY: {
            value: 2,
            min: -10,
            max: 10,
            step: 0.001,
        },
        positionZ: {
            value: 3.5,
            min: -10,
            max: 10,
            step: 0.001,
        },
    });

    const uniforms = useMemo(
        () => ({
            color: uniform(color(controls.color)),
            gradientStrength: uniform(controls.gradientStrength),
            speed: uniform(controls.speed),
            noiseStrength: uniform(controls.noiseStrength),
            displacementStrength: uniform(controls.displacementStrength),
            fractAmount: uniform(controls.fractAmount),
            remapPowerRange: uniform(controls.remapPowerRange),
            ambientLight: {
                color: uniform(color(ambientLightControls.color)),
                intensity: uniform(ambientLightControls.intensity),
            },
            directionalLight: {
                color: uniform(color(directionalLightControls.color)),
                intensity: uniform(directionalLightControls.intensity),
                position: uniform(
                    vec3(
                        directionalLightControls.positionX,
                        directionalLightControls.positionY,
                        directionalLightControls.positionZ,
                    ),
                ),
            },
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        // uniforms.directionalLight.position.value = vec3(
        //     directionalLightControls.positionX,
        //     directionalLightControls.positionY,
        //     directionalLightControls.positionZ,
        // );
        uniforms.ambientLight.intensity.value = ambientLightControls.intensity;
    }, [uniforms, ambientLightControls]);

    useEffect(() => {
        // uniforms.directionalLight.position.value = vec3(
        //     directionalLightControls.positionX,
        //     directionalLightControls.positionY,
        //     directionalLightControls.positionZ,
        // );
        uniforms.directionalLight.intensity.value = directionalLightControls.intensity;
    }, [uniforms, directionalLightControls]);

    const nodeMaterial = useMemo(() => {
        const material = new MeshBasicNodeMaterial();

        const timer = timerLocal();

        const vPattern = varyingProperty('float');
        const vNormal = varyingProperty('vec3');
        const vViewDirection = varyingProperty('vec3');

        const positionNode = tslFn<ShaderNodeObject<Node>[]>(([position]) => {
            vNormal.assign(normalLocal);
            vViewDirection.assign(positionViewDirection);

            const noise = texture(noiseTexture, normalLocal.xy).toVar();

            const coords = normalLocal.toVar();
            coords.y.subAssign(timer.mul(0.05));
            coords.addAssign(snoise3(coords).mul(uniforms.noiseStrength));
            // coords.addAssign(noise.r.mul(uniforms.noiseStrength));

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

        const colorNode = tslFn(() => {
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
