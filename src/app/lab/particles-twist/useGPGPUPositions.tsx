import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import simulationFragmentShader from './shaders/positions/fragment.glsl';

function useGPGPUPositions(count: number) {
    const size = Math.ceil(Math.sqrt(count));
    const gl = useThree((state) => state.gl);

    const [gpgpuRenderer, data] = useMemo(() => {
        const gpgpuRenderer = new GPUComputationRenderer(size, size, gl);

        const texture = gpgpuRenderer.createTexture();

        for (let i = 0; i < count; i++) {
            // const i3 = i * 3;
            const i4 = i * 4;

            (texture.image.data as any)[i4 + 0] = (Math.random() - 0.5) * (i / count); // x
            (texture.image.data as any)[i4 + 1] = (Math.random() - 0.5) * 2 * (i / count); // y
            (texture.image.data as any)[i4 + 2] = (Math.random() - 0.5) * (i / count); // z
            (texture.image.data as any)[i4 + 3] = Math.random(); // lifespan
        }

        const positionsVariable = gpgpuRenderer.addVariable('uPositions', simulationFragmentShader, texture);
        positionsVariable.material.uniforms.uTime = { value: 0 };
        positionsVariable.material.uniforms.uDeltaTime = { value: 0 };
        positionsVariable.material.uniforms.uInitialPositions = { value: texture };
        gpgpuRenderer.setVariableDependencies(positionsVariable, [positionsVariable]);
        gpgpuRenderer.init();

        return [
            gpgpuRenderer,
            {
                positions: {
                    texture,
                    variables: {
                        positionsVariable,
                    },
                },
            },
        ];
    }, [count, gl, size]);

    useEffect(() => {
        return () => {
            gpgpuRenderer.dispose();
        };
    }, [gpgpuRenderer]);

    return { gpgpuRenderer, data };
}

export default useGPGPUPositions;
