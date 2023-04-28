import { useTexture } from '@react-three/drei';
import { BackSide } from 'three';

const Walls = () => {
    const [floor, normal] = useTexture([
        '/img/34TX-SurfaceImperfections003_1K_var1.webp',
        '/img/Soy5-SurfaceImperfections003_1K_Normal.webp',
    ]);

    return (
        // <mesh position={[30, 22.9, 0]} raycast={undefined}>
        <mesh position={[30, 23.0, 0]} raycast={undefined}>
            <boxGeometry args={[90, 50, 50]} />
            <meshStandardMaterial color="lightblue" side={BackSide} normalMap={normal} roughnessMap={floor} />
        </mesh>
    );
};

export default Walls;
