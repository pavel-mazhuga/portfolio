import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BackSide, Color, ColorRepresentation, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

type Props = {
    color?: ColorRepresentation;
};

const ExperimentBackground = ({ color = '#a6a6a6' }: Props) => {
    const scale = 100;
    const material = useRef<ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (material.current) {
            material.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    return (
        <mesh scale={[scale, scale, scale]}>
            <sphereGeometry args={[1, 1, 256, 256]} />
            <shaderMaterial
                ref={material}
                key={uuidv4()}
                uniforms={{
                    uTime: { value: 0 },
                    uColor: { value: new Color(color) },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                side={BackSide}
            />
        </mesh>
    );
};

export default ExperimentBackground;
