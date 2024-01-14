import { Image as ThreeImage } from '@react-three/drei';
import { MeshProps } from '@react-three/fiber';
import { Color } from 'three';

interface Props extends MeshProps {
    imgSrc: string;
    color?: Color | string;
    width?: number;
    height?: number;
}

const StandImageScreen = ({ imgSrc, width = 1, height = 1, color, ...props }: Props) => {
    return (
        <ThreeImage {...props} url={imgSrc} scale={[width, height]}>
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
        </ThreeImage>
    );
};

export default StandImageScreen;
