import { useTexture } from '@react-three/drei';
import { MeshProps, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';

interface Props extends MeshProps {}

const Screen = (props: Props) => {
    const screen = useRef<Mesh>(null);
    const texture = useTexture('/img/works/chipsa.png');

    useFrame(({ camera }) => {
        if (screen.current) {
            camera.lookAt(screen.current.position);
        }
    });

    return (
        <mesh {...props} ref={screen}>
            <planeGeometry args={[3.2, 2.7]} />
            <meshStandardMaterial map={texture} />
        </mesh>
    );
};

export default Screen;
