import { GroupProps } from '@react-three/fiber';
import { useMemo } from 'react';
import { PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import Slide from './Slide';

type Props = GroupProps & {
    images: string[];
    gap: number;
    planeSize: Vector2;
};

const Slider = ({ images, gap, planeSize, ...props }: Props) => {
    const geometry = useMemo(() => new PlaneGeometry(planeSize.x, planeSize.y, 128), [planeSize.x, planeSize.y]);

    return (
        <group {...props}>
            {images.map((src, i) => (
                <Slide
                    key={i}
                    index={i}
                    src={src}
                    geometry={geometry}
                    planeSize={planeSize}
                    position={[(planeSize.x + gap) * i, 0, 0]}
                    images={images}
                />
            ))}
        </group>
    );
};

export default Slider;
