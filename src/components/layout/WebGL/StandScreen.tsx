import { useVideoTexture } from '@react-three/drei';
import { MeshProps } from '@react-three/fiber';
import { Color } from 'three';

interface Props extends MeshProps {
    videoUrls: { src: string; type: string }[];
    color?: Color | string;
    width?: number;
    height?: number;
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

const StandScreen = ({ videoUrls, width = 1, height = 1, color, ...props }: Props) => {
    const videoTexture = useVideoTexture(getVideoSrc(videoUrls), {
        loop: true,
        muted: true,
        autoplay: true,
        playsInline: true,
        crossOrigin: 'anonymous',
    });

    return (
        <mesh {...props} raycast={undefined}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={videoTexture} />
            {color && (
                <rectAreaLight
                    color={color}
                    position={[0, 0, 0.05]}
                    rotation={[0, Math.PI, 0]}
                    width={width}
                    height={height}
                    intensity={0.8}
                />
            )}
        </mesh>
    );
};

export default StandScreen;
