'use client';

import { useAspect, useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import { ShaderMaterial } from 'three';

const vertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform vec2 uImgResolution;
    uniform vec2 uResolution;
    uniform sampler2D uTextureFrom;
    uniform sampler2D uTextureTo;

    void main() {
        float screenAspect = uResolution.x / uResolution.y;
        float imgAspect = uImgResolution.x / uImgResolution.y;
        vec2 mult = screenAspect > imgAspect ? vec2(screenAspect / imgAspect, 1.) : vec2(1., imgAspect / screenAspect);
        vec2 newUv = (vUv - vec2(0.5)) * mult + vec2(0.5);
        // vec2 newUv = vec2(min(vUv.x, vUv.y));
        // vec2 newUv = vec2(vUv.x * uResolution.x / uResolution.y, vUv.y);
        vec2 circleUv = newUv - vec2(0.5);
        float distance = smoothstep(0.3, 0.5, length(circleUv));
        vec4 textureFrom = texture2D(uTextureFrom, newUv);
        vec4 textureTo = texture2D(uTextureTo, newUv);

        gl_FragColor = mix(textureFrom, textureTo, distance);
    }
`;

const Works = () => {
    const scale = useAspect(2346, 1740);
    const workTexture = useTexture('/img/works/work-1.png');

    const material = useMemo(
        () =>
            new ShaderMaterial({
                uniforms: {
                    uResolution: { value: { x: window.innerWidth, y: window.innerHeight } },
                    uImgResolution: { value: { x: 2346, y: 1740 } },
                    uWorkTexture: { value: workTexture },
                },
                vertexShader,
                fragmentShader,
            }),
        [workTexture],
    );

    return (
        <mesh scale={scale} material={material}>
            <planeGeometry />
            {/* <shaderMaterial
                uniforms={{
                    uResolution: { value: { x: window.innerWidth, y: window.innerHeight } },
                    uImgResolution: { value: { x: 1920, y: 1080 } },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            /> */}
        </mesh>
    );
};

export default Works;
