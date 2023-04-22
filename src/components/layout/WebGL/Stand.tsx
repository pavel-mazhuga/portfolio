import { useVideoTexture } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';
import { forwardRef, useRef } from 'react';
import { mergeRefs } from 'react-merge-refs';
import { Color, Group, sRGBEncoding } from 'three';

interface Props extends GroupProps {
    dimmed?: boolean;
    videoUrls: { src: string; type: string }[];
    color?: Color | string;
}

const getVideoSrc = (sources: { src: string; type: string }[]) => {
    const video = document.createElement('video');

    for (let i = 0; i < sources.length; i++) {
        const source = sources[i];

        if (video.canPlayType(source.type)) {
            return source.src;
        }
    }

    return sources[sources.length - 1].src;
};

const Stand = forwardRef<Group, Props>(({ videoUrls, dimmed = false, color = '#fff', ...props }, ref) => {
    const width = 4.5;
    const height = 8;
    const meshRef = useRef<Group>(null);
    const videoTexture = useVideoTexture(getVideoSrc(videoUrls), {
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
