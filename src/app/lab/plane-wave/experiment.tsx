import { Html, Text, useTexture } from '@react-three/drei';
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

function degToRad(degrees: number) {
    return degrees * (Math.PI / 180);
}

const PlaneWaveExperiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    const texture = useTexture(
        'https://images.unsplash.com/photo-1602826347632-fc49a8675be6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&w=2370',
    );

    useFrame(() => {
        plane.current!.material.uniforms.time.value += 5;
    });

    return (
        <mesh ref={plane}>
            <planeGeometry args={[1, 1, 64, 64]} />
            <shaderMaterial
                key={uuidv4()}
                uniforms={{
                    image: { value: texture },
                    sizeImage: {
                        value: new Vector2(texture.image.naturalWidth, texture.image.naturalHeight),
                    },
                    planeSize: {
                        value: new Vector2(1, 1),
                    },
                    rotation: { value: degToRad(6.27) },
                    amp: { value: 0.14 },
                    time: { value: 0 },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    );
};

export default PlaneWaveExperiment;
