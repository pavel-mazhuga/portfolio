import { GroupProps } from '@react-three/fiber';
import { forwardRef, Suspense, useRef } from 'react';
import { mergeRefs } from '@/utils/merge-refs';
import { BoxGeometry, Color, Group, Material, MeshBasicMaterial } from 'three';
import StandImageScreen from './StandImageScreen';

interface Props extends GroupProps {
    width?: number;
    height?: number;
    geometry?: BoxGeometry;
    material?: Material;
    imgSrc: string;
    color?: Color | string;
}

const Stand = forwardRef<Group, Props>(
    (
        {
            width = 1,
            height = 1,
            geometry = new BoxGeometry(),
            material = new MeshBasicMaterial({ color: '#000' }),
            imgSrc,
            color,
            ...props
        },
        ref,
    ) => {
        const meshRef = useRef<Group>(null);

        return (
            <group ref={mergeRefs([ref, meshRef])} {...props}>
                <mesh geometry={geometry} material={material}></mesh>
                <Suspense>
                    <StandImageScreen
                        position={[0, 0, 0.3]}
                        width={width}
                        height={height}
                        imgSrc={imgSrc}
                        color={color}
                    />
                </Suspense>
            </group>
        );
    },
);

Stand.displayName = 'Stand';

export default Stand;
