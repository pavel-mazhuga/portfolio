'use client';

import { Image as WebglImage, OrbitControls, useFBO, useTexture, MeshTransmissionMaterial } from '@react-three/drei';
import { Canvas, MeshProps, extend, useFrame, useThree } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';
import { useMemo, useRef } from 'react';
import { BackSide, BufferGeometry, FrontSide, Mesh, ShaderMaterial, Vector2, Vector3 } from 'three';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import { viewport } from '@/utils/viewport';

const BackgroundImage = () => {
    const texture = useTexture(
        'https://images.unsplash.com/photo-1691380303276-341a5ac56744?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80',
    );

    const scale = 15;

    return <WebglImage texture={texture} position={[0, 0, -1]} scale={[scale, scale]} />;
};

const Dispersion = (props: MeshProps) => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const mesh = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);
    const mainRenderTarget = useFBO({ stencilBuffer: false });
    // const backRenderTarget = useFBO({ stencilBuffer: false });

    const uniforms = useMemo(
        () => ({
            uTexture: {
                value: null,
            },
            winResolution: {
                value: new Vector2(viewport.width, viewport.height).multiplyScalar(dpr),
            },
            uIorR: { value: 1.15 },
            uIorY: { value: 1.16 },
            uIorG: { value: 1.18 },
            uIorC: { value: 1.22 },
            uIorB: { value: 1.22 },
            uIorV: { value: 1.22 },
            uChromaticAberration: { value: 0.2 },
            uRefractPower: { value: 0.4 },
            uSaturation: { value: 1.02 },
            uLight: { value: new Vector3(-1, 1, 1) },
            uShininess: { value: 20 },
            uDiffuseness: { value: 0.3 },
            uFresnelPower: { value: 8 },
        }),
        [dpr],
    );

    useFrame(({ gl, scene, camera }) => {
        if (mesh.current) {
            mesh.current.visible = false;

            // gl.setRenderTarget(backRenderTarget);
            // gl.render(scene, camera);

            // mesh.current.material.uniforms.uTexture.value = backRenderTarget.texture;
            // mesh.current.material.side = BackSide;

            // mesh.current.visible = true;

            gl.setRenderTarget(mainRenderTarget);
            gl.render(scene, camera);

            mesh.current.material.uniforms.uTexture.value = mainRenderTarget.texture;
            mesh.current.material.side = FrontSide;

            mesh.current.visible = true;
            gl.setRenderTarget(null);
        }
    });

    return (
        <mesh {...props} ref={mesh}>
            {/* <icosahedronGeometry args={[1, 16]} /> */}
            <torusGeometry args={[1.2, 0.5, 256, 80]} />
            <shaderMaterial
                key={uuidv4()}
                uniforms={uniforms}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
            {/* <MeshTransmissionMaterial
                color="#fff"
                attenuationColor="#fff"
                toneMapped={true}
                backside
                backsideThickness={1}
                samples={4}
                resolution={1024}
                backsideResolution={1024}
                transmission={1}
                roughness={0}
                ior={1.2}
                thickness={0.1}
                chromaticAberration={0.1}
                anisotropy={0.3}
                distortion={0.02}
            /> */}
        </mesh>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout>
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 100,
                    }}
                >
                    <BackgroundImage />
                    <Dispersion />
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
