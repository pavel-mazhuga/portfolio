import { useVideoTexture } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';
import { forwardRef, useRef } from 'react';
import { mergeRefs } from 'react-merge-refs';
import { Color, Group, sRGBEncoding } from 'three';

interface Props extends GroupProps {
    dimmed?: boolean;
    videoUrl: string;
    color?: Color | string;
}

const Stand = forwardRef<Group, Props>(({ videoUrl, dimmed = false, color = '#fff', ...props }, ref) => {
    const width = 4.5;
    const height = 8;
    const meshRef = useRef<Group>(null);
    const videoTexture = useVideoTexture(videoUrl, {
        loop: true,
        muted: true,
        autoplay: true,
        playsInline: true,
        crossOrigin: 'anonymous',
    });
    videoTexture.encoding = sRGBEncoding;

    return (
        <group ref={mergeRefs([ref, meshRef])} {...props}>
            <mesh>
                <boxGeometry args={[width + 0.2, height + 0.2, 0.3]} />
                <meshStandardMaterial color="#cbcbcb" />
                <rectAreaLight
                    color={color}
                    position={[0, 0, 0.35]}
                    rotation={[0, Math.PI, 0]}
                    width={width}
                    height={height}
                    intensity={0.8}
                />
            </mesh>
            <mesh position={[0, 0, 0.3]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial map={videoTexture} />
            </mesh>
        </group>
    );
});

Stand.displayName = 'Stand';

export default Stand;
