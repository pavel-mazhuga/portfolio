'use client';

import { ComputedAttribute, OrbitControls, Sampler, useGLTF } from '@react-three/drei';
import { Canvas, GroupProps, useFrame, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import {
    BufferAttribute,
    BufferGeometry,
    Material,
    MathUtils,
    MeshBasicMaterial,
    Object3D,
    ShaderMaterial,
    Vector2,
    Vector3,
} from 'three';
import ExperimentLayout from '../ExperimentLayout';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

function remap(x: number, [low1, high1]: number[], [low2, high2]: number[]) {
    return low2 + ((x - low1) * (high2 - low2)) / (high1 - low1);
}

const transformInstances = ({ dummy, position }: { dummy: Object3D; position: Vector3 }) => {
    dummy.position.copy(position);
    dummy.scale.setScalar(Math.random() * 0.75);
};

const computeUpness = (geometry: BufferGeometry) => {
    const { array, count } = geometry.attributes.normal;
    const arr = Float32Array.from({ length: count });

    const normalVector = new Vector3();
    const up = new Vector3(0, 1, 0);

    for (let i = 0; i < count; i++) {
        const n = array.slice(i * 3, i * 3 + 3);
        normalVector.set(n[0], n[1], n[2]);

        const dot = normalVector.dot(up);
        const value = dot > 0.4 ? remap(dot, [0.4, 1], [0, 1]) : 0;
        arr[i] = Number(value);
    }

    return new BufferAttribute(arr, 1);
};

const SampledGeometry = ({
    geometry,
    material = new MeshBasicMaterial(),
    count = 3000,
}: {
    geometry: BufferGeometry;
    material: Material;
    count?: number;
}) => {
    const { viewport } = useThree();
    const attrName = 'upness';

    return (
        <Sampler weight={attrName} transform={transformInstances} count={count}>
            <mesh visible={false} material={material}>
                <bufferGeometry attach="geometry" {...geometry}>
                    <ComputedAttribute name={attrName} compute={computeUpness} />
                </bufferGeometry>
            </mesh>
            <instancedMesh args={[undefined, undefined, count]} material={material}>
                <sphereGeometry args={[MathUtils.randFloat(0.003, 0.005) / viewport.dpr, 8, 8]} />
            </instancedMesh>
        </Sampler>
    );
};

const ParticledShoe = (props: GroupProps) => {
    const { nodes } = useGLTF('/gltf/shoe.gltf') as any;
    const material = useMemo(
        () =>
            new ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uMouse: { value: new Vector2() },
                },
                vertexShader,
                fragmentShader,
            }),
        [],
    );

    useFrame(({ clock, pointer }) => {
        material.uniforms.uTime.value = clock.getElapsedTime();
        material.uniforms.uMouse.value.x = pointer.x;
        material.uniforms.uMouse.value.y = pointer.y;
    });

    return (
        <group {...props} dispose={null}>
            <SampledGeometry geometry={nodes.shoe.geometry} material={material} />
            <SampledGeometry geometry={nodes.shoe_1.geometry} material={material} count={4000} />
            <SampledGeometry geometry={nodes.shoe_2.geometry} material={material} count={1200} />
            <SampledGeometry geometry={nodes.shoe_3.geometry} material={material} />
            <SampledGeometry geometry={nodes.shoe_4.geometry} material={material} />
            <SampledGeometry geometry={nodes.shoe_5.geometry} material={material} />
            <SampledGeometry geometry={nodes.shoe_6.geometry} material={material} count={1200} />
            <SampledGeometry geometry={nodes.shoe_7.geometry} material={material} count={1200} />
        </group>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-on-model-surface">
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 35,
                        near: 0.1,
                        far: 1000,
                    }}
                >
                    <ParticledShoe />
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;

useGLTF.preload('/gltf/shoe.gltf');
