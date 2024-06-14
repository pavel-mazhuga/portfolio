import { useScroll, useTexture } from '@react-three/drei';
import { MeshProps, useFrame } from '@react-three/fiber';
import { forwardRef, useRef } from 'react';
import { Mesh, SRGBColorSpace, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { remap } from '@/utils/math';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

type Props = MeshProps & {
    src: string;
    planeSize: Vector2;
    index: number;
    images: string[];
};

const Slide = forwardRef<Mesh, Props>(({ images, index, src, planeSize, ...props }, ref) => {
    const img = useTexture(src);
    img.colorSpace = SRGBColorSpace;
    const materialRef = useRef<ShaderMaterial>(null);
    const scroll = useScroll();

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
            materialRef.current.uniforms.uFactor.value = remap(
                scroll.range(0.1 * index - 0.11 * (1 - (index + 1) / images.length), 0.3),
                [0, 1],
                [-1, 1],
            );
        }
    });

    return (
        <mesh {...props} ref={ref}>
            <shaderMaterial
                ref={materialRef}
                uniforms={{
                    uImage: { value: img },
                    uImageSize: { value: new Vector2(img.image.naturalWidth, img.image.naturalHeight) },
                    uPlaneSize: { value: planeSize },
                    uTime: { value: 0 },
                    uFactor: { value: 0 },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    );
});

Slide.displayName = 'Slide';

export default Slide;
