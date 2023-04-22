import { GroupProps } from '@react-three/fiber';
import { forwardRef, Suspense, useRef } from 'react';
import { mergeRefs } from 'react-merge-refs';
import { Color, Group } from 'three';
import StandScreen from './StandScreen';

interface Props extends GroupProps {
    dimmed?: boolean;
    videoUrls: { src: string; type: string }[];
    color?: Color | string;
}

const Stand = forwardRef<Group, Props>(({ videoUrls, dimmed = false, color = '#fff', ...props }, ref) => {
    const width = 4.5;
    const height = 8;
    const meshRef = useRef<Group>(null);

    return (
        <group ref={mergeRefs([ref, meshRef])} {...props}>
            <mesh>
                <boxGeometry args={[width + 0.2, height + 0.2, 0.3]} />
                <meshStandardMaterial color="#cbcbcb" />
            </mesh>
            <Suspense>
                <StandScreen position={[0, 0, 0.3]} width={width} height={height} videoUrls={videoUrls} color={color} />
            </Suspense>
        </group>
    );
});

Stand.displayName = 'Stand';

export default Stand;
