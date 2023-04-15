import { MeshReflectorMaterial, useTexture } from '@react-three/drei';

const Ground = () => {
    const [floor, normal] = useTexture([
        '/img/34TX-SurfaceImperfections003_1K_var1.jpg',
        '/img/Soy5-SurfaceImperfections003_1K_Normal.jpg',
        // '/img/aryd-SurfaceImperfections003_1K_Normal.jpg',
    ]);

    return (
        <mesh position={[0, -2, -10]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[100, 200]} />
            <MeshReflectorMaterial
                resolution={1024}
                mirror={0.93}
                mixBlur={5}
                mixStrength={1}
                blur={[0, 0]}
                minDepthThreshold={0.8}
                maxDepthThreshold={1.2}
                depthScale={0}
                depthToBlurRatioBias={0.2}
                distortion={0}
                color="#a0a0a0"
                envMapIntensity={0.05}
                metalness={0}
                roughnessMap={floor}
                roughness={1}
                normalMap={normal}
            />
        </mesh>
    );
};

export default Ground;
//
