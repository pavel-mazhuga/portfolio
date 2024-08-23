import { Canvas, CanvasProps } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace, WebGPURenderer } from 'three/webgpu';

type Props = CanvasProps & {
    canvasProps?: any; // todo
};

const WebGPUCanvas = ({ frameloop = 'always', children, canvasProps = {}, ...props }: Props) => {
    const [canvasFrameloop, setCanvasFrameloop] = useState<'always' | 'never' | 'demand'>('never');
    const [initialising, setInitialising] = useState(true);

    useEffect(() => {
        if (!initialising) {
            setCanvasFrameloop(frameloop);
        }
    }, [initialising, frameloop]);

    return (
        <Canvas
            {...props}
            frameloop={canvasFrameloop}
            gl={(canvas) => {
                const renderer = new WebGPURenderer({
                    ...canvasProps,
                    canvas: canvas as HTMLCanvasElement,
                });
                renderer.toneMapping = ACESFilmicToneMapping;
                renderer.outputColorSpace = SRGBColorSpace;
                renderer.init().then(() => {
                    setInitialising(false);
                });

                return renderer;
            }}
        >
            {children}
        </Canvas>
    );
};

export default WebGPUCanvas;
