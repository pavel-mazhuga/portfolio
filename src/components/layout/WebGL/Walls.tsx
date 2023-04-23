import { useTexture } from '@react-three/drei';
import { BackSide } from 'three';

const Walls = () => {
    const [floor, normal] = useTexture([
        '/img/34TX-SurfaceImperfections003_1K_var1.jpg',
        '/img/Soy5-SurfaceImperfections003_1K_Normal.jpg',
    ]);

    return (
        <mesh position={[30, 22, 0]} raycast={undefined}>
            <boxGeometry args={[90, 50, 50]} />
            <meshStandardMaterial color="lightblue" side={BackSide} normalMap={normal} roughnessMap={floor} />
        </mesh>
    );
};

export default Walls;
