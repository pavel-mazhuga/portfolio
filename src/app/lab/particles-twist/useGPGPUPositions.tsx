import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import simulationFragmentShader from './shaders/positions/fragment.glsl';

function useGPGPUPositions(count: number) {
    const size = Math.ceil(Math.sqrt(count));
    const gl = useThree((state) => state.gl);

    const [gpgpuRenderer, variables] = useMemo(() => {
        const gpgpuRenderer = new GPUComputationRenderer(size, size, gl);

        const texture = gpgpuRenderer.createTexture();

        for (let i = 0; i < count; i++) {
            // const i3 = i * 3;
            const i4 = i * 4;

            texture.image.data[i4 + 0] = Math.random() - 0.5;
            texture.image.data[i4 + 1] = Math.random() - 0.5;
            texture.image.data[i4 + 2] = Math.random() - 0.5;
            texture.image.data[i4 + 3] = 0;
        }

        const positionsVariable = gpgpuRenderer.addVariable('uPositions', simulationFragmentShader, texture);
        gpgpuRenderer.setVariableDependencies(positionsVariable, [positionsVariable]);
        gpgpuRenderer.init();

        return [
            gpgpuRenderer,
            {
                positionsVariable,
            },
        ];
    }, [count, gl, size]);

    return { gpgpuRenderer, variables };
}

export default useGPGPUPositions;
