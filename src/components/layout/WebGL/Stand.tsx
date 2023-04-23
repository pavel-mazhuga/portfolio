import { GroupProps } from '@react-three/fiber';
import { forwardRef, Suspense, useRef } from 'react';
import { mergeRefs } from 'react-merge-refs';
import { BoxGeometry, Color, Group, Material, MeshBasicMaterial } from 'three';
import StandScreen from './StandScreen';

interface Props extends GroupProps {
    width?: number;
    height?: number;
    geometry?: BoxGeometry;
    material?: Material;
    dimmed?: boolean;
    videoUrls: { src: string; type: string }[];
    color?: Color | string;
}

const Stand = forwardRef<Group, Props>(
    (
        {
            width = 1,
            height = 1,
            geometry = new BoxGeometry(),
            material = new MeshBasicMaterial({ color: '#000' }),
            videoUrls,
            dimmed = false,
            color = '#fff',
            ...props
        },
        ref,
    ) => {
        const meshRef = useRef<Group>(null);

        return (
            <group ref={mergeRefs([ref, meshRef])} {...props}>
                <mesh geometry={geometry} material={material}>
                    {/* <boxGeometry args={[width + 0.2, height + 0.2, 0.3]} /> */}
                    {/* <meshStandardMaterial color="#cbcbcb" /> */}
                </mesh>
                <Suspense>
                    <StandScreen
                        position={[0, 0, 0.3]}
                        width={width}
                        height={height}
                        videoUrls={videoUrls}
                        color={color}
                    />
                </Suspense>
            </group>
        );
    },
);

Stand.displayName = 'Stand';

export default Stand;
