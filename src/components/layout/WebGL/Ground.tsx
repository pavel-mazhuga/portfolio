import { MeshReflectorMaterial, useTexture } from '@react-three/drei';

const Ground = () => {
    const [floor, normal] = useTexture([
        '/img/34TX-SurfaceImperfections003_1K_var1.jpg',
        '/img/Soy5-SurfaceImperfections003_1K_Normal.jpg',
        // '/img/aryd-SurfaceImperfections003_1K_Normal.jpg',
    ]);

    return (
        <mesh position={[25, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
                // color="#a0a0a0"
                color="lightblue"
                metalness={0}
                roughnessMap={floor}
                roughness={1}
                normalMap={normal}
            />
        </mesh>
    );
};

export default Ground;
