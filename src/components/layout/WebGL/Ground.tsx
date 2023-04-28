import { MeshReflectorMaterial, useTexture } from '@react-three/drei';
import { MeshProps } from '@react-three/fiber';

const Ground = (props: MeshProps) => {
    const [floor, normal] = useTexture([
        '/img/34TX-SurfaceImperfections003_1K_var1.webp',
        '/img/Soy5-SurfaceImperfections003_1K_Normal.webp',
    ]);

    return (
        <mesh {...props} position={[25, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={undefined}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
                resolution={1024}
                mirror={0}
                mixBlur={0}
                mixStrength={1}
                blur={[0, 0]}
                minDepthThreshold={0.8}
                maxDepthThreshold={1.2}
                depthScale={0}
                depthToBlurRatioBias={0.2}
                distortion={0}
                color="lightblue"
                metalness={0}
                roughnessMap={floor}
                roughness={1}
                normalMap={normal}
                reflectorOffset={0.4}
            />
        </mesh>
    );
};

export default Ground;
