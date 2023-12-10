import { PropsWithChildren, useLayoutEffect, useState } from 'react';
import { Color } from 'three';
// @ts-ignore
import WebGPUCapabilities from 'three/examples/jsm/capabilities/WebGPU';
// @ts-ignore
import WebGPURenderer from 'three/examples/jsm/renderers/webgpu/WebGPURenderer';
import { useThree } from '@react-three/fiber';
import { toneMapping } from 'three/examples/jsm/nodes/Nodes';

export function WebGPU({ children }: PropsWithChildren) {
    const [renderer] = useState(new WebGPURenderer());

    const gl = useThree((state) => state.gl);
    const [originalGl] = useState(gl);

    const size = useThree((state) => state.size);
    const set = useThree((state) => state.set);
    const viewport = useThree((state) => state.viewport);
    const [root, setRoot] = useState(gl.domElement.parentElement);

    const [err, setErr] = useState(false);

    useLayoutEffect(() => {
        if (WebGPUCapabilities.isAvailable() === false) {
            setErr(true);
            alert('No WebGPU support');
            return;
        }

        renderer.setSize(size.width, size.height);
        renderer.setPixelRatio(viewport.dpr);

        renderer.toneMappingNode = toneMapping(gl.toneMapping, gl.toneMappingExposure, null!);
        renderer.outputEncoding = gl.outputEncoding;

        const clearColor = new Color();
        const clearAlpha = gl.getClearAlpha();
        gl.getClearColor(clearColor);

        renderer.setClearColor(clearColor, clearAlpha);

        renderer.shadowMap = gl.shadowMap;

        if (root) {
            root.appendChild(renderer.domElement);
            originalGl.domElement.remove();
            setRoot(renderer.domElement.parentElement);

            set({ gl: renderer });

            return () => {
                renderer.domElement.remove();
                root.appendChild(originalGl.domElement);
                setRoot(originalGl.domElement.parentElement);

                set({ gl: originalGl });
            };
        }
    }, [renderer]);

    return err ? null : <>{children}</>;
}
