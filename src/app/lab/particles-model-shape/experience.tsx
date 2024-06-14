'use client';

import { useFBO, useGLTF } from '@react-three/drei';
import { Canvas, createPortal, extend, useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    FloatType,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    OrthographicCamera,
    PlaneGeometry,
    Points,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    Vector2,
} from 'three';
import { useMediaQuery } from 'usehooks-ts';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import { lerp } from '@/utils/lerp';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import { SimulationMaterial as SMat } from './SimulationMaterial';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

extend({ SMat });

const Experiment = () => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
    const simulationMaterialRef = useRef<SMat>(null);
    const { nodes } = useGLTF('/gltf/face2.glb') as any;

    const { gl, size, raycaster, camera } = useThree(({ gl, size, raycaster, camera }) => ({
        gl,
        raycaster,
        camera,
        size,
    }));

    const pointerVec = useMemo(() => new Vector2(), []);

    const { count, speed, color, power, distribution, particleSize } = useControls({
        count: {
            value: 256,
            min: 0,
            max: 400,
            step: 1,
        },
        particleSize: {
            value: 200,
            min: 0,
            max: 1000,
            step: 0.001,
        },
        speed: {
            value: 0.04,
            min: 0,
            max: 1,
            step: 0.001,
        },
        power: {
            value: 5,
            min: 0,
            max: 10,
            step: 0.001,
        },
        distribution: {
            value: 0.7,
            min: 0,
            max: 1,
            step: 0.001,
        },
        color: '#164e24',
    });

    const dummyPlane = useMemo(() => new Mesh(new PlaneGeometry(50, 50), new MeshBasicMaterial()), []);

    const scene = new Scene();
    const fboCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);
    const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
    const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

    const renderTarget = useFBO(count, count, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });

    const particlesPosition = useMemo(() => {
        const length = count * count;
        const particles = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            particles[i3 + 0] = (i % count) / count;
            particles[i3 + 1] = i / count / count;
        }

        return particles;
    }, [count]);

    const uniforms = useMemo(
        () => ({
            uPositions: { value: null },
            uTime: { value: 0 },
            uSpeed: { value: 0 },
            uParticleSize: { value: 200 },
            uColor: { value: new Color(color) },
        }),
        [color],
    );

    useEffect(() => {
        const onTouchmove = (event: TouchEvent) => {
            pointerVec.x = ((event.changedTouches[0].clientX - size.width / 2) / size.width) * 2;
            pointerVec.y = (-(event.changedTouches[0].clientY - size.height / 2) / size.height) * 2;
            raycaster.setFromCamera(pointerVec, camera);
            const intersects = raycaster.intersectObject(dummyPlane);

            if (intersects.length > 0) {
                const { x, y } = intersects[0].point;
                simulationMaterialRef.current!.uniforms.uMouse.value.x = x;
                simulationMaterialRef.current!.uniforms.uMouse.value.y = y;
            }
        };

        gl.domElement.addEventListener('touchmove', onTouchmove);

        return () => {
            gl.domElement.removeEventListener('touchmove', onTouchmove);
        };
    }, [camera, dummyPlane, raycaster, gl.domElement, size.width, size.height, pointerVec]);

    const supportsTouch = useMediaQuery('(pointer: coarse)');

    useFrame(({ gl, clock, pointer, camera, raycaster }) => {
        const time = clock.getElapsedTime();

        gl.setRenderTarget(renderTarget);
        gl.clear();
        gl.render(scene, fboCamera);
        gl.setRenderTarget(null);

        if (!supportsTouch) {
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObject(dummyPlane);

            if (intersects.length > 0) {
                const { x, y } = intersects[0].point;

                if (simulationMaterialRef.current!.uniforms.uMouse) {
                    simulationMaterialRef.current!.uniforms.uMouse.value.x = lerp(
                        simulationMaterialRef.current!.uniforms.uMouse.value.x,
                        x,
                        0.15,
                    );
                    simulationMaterialRef.current!.uniforms.uMouse.value.y = lerp(
                        simulationMaterialRef.current!.uniforms.uMouse.value.y,
                        y,
                        0.15,
                    );
                }
            }
        }

        meshRef.current!.material.uniforms.uPositions.value = renderTarget.texture;
        meshRef.current!.material.uniforms.uTime.value = time;
        meshRef.current!.material.uniforms.uParticleSize.value = particleSize;

        simulationMaterialRef.current!.uniforms.uTime.value = time;
        simulationMaterialRef.current!.uniforms.uSpeed.value = speed;
    });

    return (
        <>
            {createPortal(
                <mesh>
                    <sMat
                        ref={simulationMaterialRef}
                        args={[nodes.Object_2.geometry, count, speed, power, distribution]}
                    />
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={positions.length / 3}
                            array={positions}
                            itemSize={3}
                        />
                        <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} />
                    </bufferGeometry>
                </mesh>,
                scene,
            )}
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        key={particlesPosition.length}
                        attach="attributes-position"
                        count={particlesPosition.length / 3}
                        array={particlesPosition}
                        itemSize={3}
                    />
                </bufferGeometry>
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    depthWrite={false}
                    blending={AdditiveBlending}
                />
            </points>
        </>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-model-shape">
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 50],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ alpha: false, antialias: false }}
                >
                    <Suspense fallback={<PageLoading />}>
                        <Experiment />
                    </Suspense>
                    {/* <OrbitControls /> */}
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
