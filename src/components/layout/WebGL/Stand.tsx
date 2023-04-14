import { useVideoTexture } from '@react-three/drei';
import { MeshProps } from '@react-three/fiber';
import { forwardRef } from 'react';
import { Mesh } from 'three';

interface Props extends MeshProps {
    videoUrl: string;
}

const Stand = forwardRef<Mesh, Props>(({ videoUrl, ...props }, ref) => {
    const videoTexture = useVideoTexture(videoUrl, {
        loop: true,
        muted: true,
        autoplay: true,
        playsInline: true,
        crossOrigin: 'anonymous',
    });

    return (
        <mesh ref={ref} {...props}>
            <planeGeometry args={[4, 6]} />
            <meshBasicMaterial map={videoTexture} />
        </mesh>
    );
});

Stand.displayName = 'Stand';

export default Stand;
