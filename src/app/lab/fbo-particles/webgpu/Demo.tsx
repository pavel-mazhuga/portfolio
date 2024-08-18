'use client';

import { Instance, Instances, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useMemo } from 'react';
import {
    MeshBasicNodeMaterial,
    Node,
    ShaderNodeObject,
    SpriteNodeMaterial,
    StorageInstancedBufferAttribute,
    WebGPURenderer,
    cameraPosition,
    color,
    float,
    normalLocal,
    normalize,
    positionLocal,
    positionViewDirection,
    pow,
    storage,
    timerLocal,
    tslFn,
    uniform,
    varyingProperty,
    vec3,
    vec4,
} from 'three/webgpu';
import PageLoading from '@/app/components/shared/PageLoading';
import WebGPUCanvas from '@/app/components/webgl/WebGPUCanvas';

const Demo = () => {
    const { count } = useControls({
        count: {
            value: 800,
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

    const particlesPosition = useMemo(() => {
        const length = count * count;
        const particles = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            particles[i3 + 0] = (i % count) / count;
            particles[i3 + 1] = i / count / count;
            particles[i3 + 2] = 0;
        }

        return particles;
    }, [count]);

    const uniforms = useMemo(
        () => ({
            color: uniform(color('#04080d')),
            time: uniform(0),
        }),
        [],
    );

    const positionAttribute = useMemo(
        () => (storage(new StorageInstancedBufferAttribute(particlesPosition, 3), 'vec3', count) as any).toAttribute(),
        [count, particlesPosition],
    );

    // const updateCompute =

    const nodeMaterial = useMemo(() => {
        const material = new SpriteNodeMaterial();

        const timer = timerLocal();

        const colorNode = tslFn(() => {
            return vec4(uniforms.color, 1);
        });

        material.positionNode = positionAttribute;
        // material.scaleNode = float(2);
        material.colorNode = colorNode();

        return material;
    }, [uniforms, positionAttribute]);

    // useFrame(({ gl, scene, camera, invalidate }) => {
    //     if (gl instanceof WebGPURenderer) {
    //         // gl.compute(updateCompute)
    //         gl.renderAsync(scene, camera);
    //     } else {
    //         gl.render(scene, camera);
    //     }

    //     invalidate();
    // });

    return (
        <Instances material={nodeMaterial} matrixAutoUpdate={false} frustumCulled={false}>
            <planeGeometry args={[1, 1]} />
            {Array(count)
                .fill('')
                .map((_, i) => (
                    <Instance key={i} />
                ))}
        </Instances>
    );
};

const Experience = () => {
    return (
        <WebGPUCanvas
            canvasProps={{ alpha: false, antialias: false }}
            // frameloop="demand"
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
