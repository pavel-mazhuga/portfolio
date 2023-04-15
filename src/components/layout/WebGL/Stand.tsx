import { useVideoTexture } from '@react-three/drei';
import { MeshProps } from '@react-three/fiber';
import { forwardRef } from 'react';
import { Mesh, sRGBEncoding } from 'three';

interface Props extends MeshProps {
    videoUrl: string;
}

const Stand = forwardRef<Mesh, Props>(({ videoUrl, ...props }, ref) => {
    const width = 4.5;
    const height = 8;
    const videoTexture = useVideoTexture(videoUrl, {
        loop: true,
        muted: true,
        autoplay: true,
        playsInline: true,
        crossOrigin: 'anonymous',
    });
    videoTexture.encoding = sRGBEncoding;

    return (
        <mesh ref={ref} {...props}>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={videoTexture} />
        </mesh>
    );
});

Stand.displayName = 'Stand';

export default Stand;
