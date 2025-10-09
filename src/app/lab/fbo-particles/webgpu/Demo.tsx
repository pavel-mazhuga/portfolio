'use client';

import { Instance, Instances, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useEffect, useMemo } from 'react';
import {
    Fn,
    ShaderNodeObject,
    cameraPosition,
    color,
    float,
    instanceIndex,
    normalLocal,
    normalize,
    positionLocal,
    positionViewDirection,
    pow,
    storage,
    uniform,
    varyingProperty,
    vec3,
    vec4,
} from 'three/tsl';
import {
    AdditiveBlending,
    MathUtils,
    MeshBasicNodeMaterial,
    Node,
    SpriteNodeMaterial,
    StorageInstancedBufferAttribute,
    WebGPURenderer,
} from 'three/webgpu';
import PageLoading from '@/app/components/shared/PageLoading';
import WebGPUCanvas from '@/app/components/webgl/WebGPUCanvas';

const generatePositions = (width: number, height: number) => {
    const length = width * height * 4;
    const data = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const stride = i * 4;

        const distance = Math.sqrt(Math.random()) * 2;
        const theta = MathUtils.randFloatSpread(360);
        const phi = MathUtils.randFloatSpread(360);

        data[stride] = distance * Math.sin(theta) * Math.cos(phi);
        data[stride + 1] = distance * Math.sin(theta) * Math.sin(phi);
        data[stride + 2] = distance * Math.cos(theta);
        data[stride + 3] = 0.3 + Math.random() * 1.7; // speed multiplier
    }

    return data;
};

const Demo = () => {
    const gl = useThree((state) => state.gl);

    const { size } = useControls({
        size: {
            value: 500,
            min: 0,
            max: 1000,
            step: 1,
        },
        frequency: {
            value: 0.2,
            min: 0,
            max: 1,
            step: 0.001,
        },
        speed: {
            value: 0.07,
            min: 0,
            max: 1,
            step: 0.001,
        },
        color: {
            value: '#04080d',
        },
    });
    const count = size * size;

    // const particlesPosition = useMemo(() => {
    //     const length = size * size;
    //     const particles = new Float32Array(length * 3);

    //     for (let i = 0; i < length; i++) {
    //         let i3 = i * 3;
    //         particles[i3 + 0] = (i % size) / size;
    //         particles[i3 + 1] = i / size / size;
    //         particles[i3 + 2] = 0;
    //     }

    //     return particles;
    // }, [size]);

    const uniforms = useMemo(
        () => ({
            color: uniform(color('#04080d')),
            time: uniform(0),
        }),
        [],
    );

    // const uvArray = new Float32Array(count * 2);
    const basePositionArray = generatePositions(size, size);

    // for (let i = 0; i < count; i++) {
    //     const i2 = i * 2;
    //     const i3 = i * 3;

    //     const uvX = (i % size) / size;
    //     const uvY = Math.floor(i / size) / size;

    //     uvArray[i2] = uvX;
    //     uvArray[i2 + 1] = uvY;

    //     // basePositionArray[i3    ] = (uvX - 0.5) * 10
    //     // basePositionArray[i3 + 1] = (uvY - 0.5) * 10
    //     // basePositionArray[i3 + 2] = 0

    //     // const spherical = new THREE.Spherical(1, Math.acos(2 * Math.random() - 1), Math.random() * Math.PI * 2)
    //     // const direction = new THREE.Vector3().setFromSpherical(spherical)

    //     // directionArray[i3    ] = direction.x
    //     // directionArray[i3 + 1] = direction.y
    //     // directionArray[i3 + 2] = direction.z
    // }

    // const uvBuffer = storage(new StorageInstancedBufferAttribute(uvArray, 2), 'vec2', count);
    // const uvAttribute = uvBuffer.toAttribute();

    const basePositionBuffer = useMemo(
        () => storage(new StorageInstancedBufferAttribute(basePositionArray, 3), 'vec3', count),
        [basePositionArray, count],
    );
    const positionBuffer = useMemo(
        () => storage(new StorageInstancedBufferAttribute(count, 3), 'vec3', count),
        [count],
    );

    // useEffect(() => {
    //     if (gl instanceof WebGPURenderer) {
    //         // Compute init
    //         const particlesInit = Fn(() => {
    //             const basePosition = basePositionBuffer.element(instanceIndex);
    //             const position = positionBuffer.element(instanceIndex);

    //             position.assign(basePosition);
    //         });

    //         const particlesInitCompute = particlesInit().compute(count);
    //         // gl.compute(particlesInitCompute);
    //     }
    // }, [count, gl, basePositionBuffer, positionBuffer]);

    const nodeMaterial = useMemo(() => {
        const material = new SpriteNodeMaterial({
            transparent: true,
            blending: AdditiveBlending,
            depthWrite: false,
        });

        const colorNode = Fn(() => {
            return vec4(uniforms.color, 1);
        });

        // material.positionNode = positionAttribute;
        material.positionNode = (positionBuffer as any).toAttribute();
        // material.scaleNode = float(2);
        material.colorNode = colorNode();

        return material;
    }, [uniforms, positionBuffer]);

    // useFrame(({ gl, scene, camera, invalidate }) => {
    //     if (gl instanceof WebGPURenderer) {
    //         // gl.compute(updateCompute)
    //         gl.renderAsync(scene, camera);
    //     } else {
    //         gl.render(scene, camera);
    //     }
    // });

    return (
        <Instances material={nodeMaterial}>
            <planeGeometry args={[1, 1]} />
            {Array(count)
                .fill('')
                .map((_, i) => (
                    <Instance key={i} position={[Math.random(), Math.random(), Math.random()]} />
                ))}
        </Instances>
        // <mesh>
        //     <planeGeometry />
        // </mesh>
    );
};

const Experience = () => {
    return (
        <WebGPUCanvas
            canvasProps={{ alpha: false, antialias: false }}
            camera={{
                position: [0, 0, 3],
                fov: 45,
                near: 0.1,
                far: 1000,
            }}
        >
            <Suspense fallback={<PageLoading />}>
                <Demo />
            </Suspense>
            <OrbitControls />
        </WebGPUCanvas>
    );
};

export default Experience;
