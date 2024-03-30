import { useGLTF } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';
import SwordParticles from './SwordParticles';
import { Color } from 'three';

const Sword = (props: GroupProps) => {
    const { nodes, materials } = useGLTF('/gltf/fantasy_sword.glb') as any;

    materials['Scene_-_Root'].color = new Color('#fff');
    materials['Scene_-_Root'].emissive = new Color('#fff');
    // materials['Scene_-_Root'].emissiveIntensity = 2;

    return (
        <group {...props} dispose={null}>
            <group scale={0.01}>
                <group>
                    <mesh
                        geometry={nodes.SurfCurve010__0.geometry}
                        material={materials['Scene_-_Root']}
                        rotation={[-Math.PI / 2, 0, 0]}
                        scale={100}
                    />
                    <SwordParticles particleGeometry={nodes.SurfCurve010__0.geometry} scale={100} />
                </group>
                <mesh
                    geometry={nodes.Cylinder007__0.geometry}
                    material={materials['Scene_-_Root']}
                    position={[0, 0, -88.623]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={100}
                />
            </group>
        </group>
    );
};

export default Sword;
