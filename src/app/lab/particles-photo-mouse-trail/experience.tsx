'use client';

import { useDetectGPU, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import {
    BufferAttribute,
    CanvasTexture,
    Mesh,
    MeshBasicMaterial,
    PlaneGeometry,
    Points,
    SRGBColorSpace,
    ShaderMaterial,
    Uniform,
    Vector2,
} from 'three';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const createDisplacementCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const glowImage = new Image();
    glowImage.src = '/img/glow.png';

    return { canvas, ctx: canvas.getContext('2d'), glowImage };
};

const Experiment = () => {
    const plane = useRef<Points<PlaneGeometry, ShaderMaterial>>(null);
    const size = useThree((state) => state.size);
    const planeSize = {
        width: 10,
        height: 10,
    };
    const gpu = useDetectGPU();

    const texture = useTexture(
        'https://images.unsplash.com/photo-1649706796644-c507eb2835bb?q=80&w=3121&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture.colorSpace = SRGBColorSpace;

    const {
        trailSize,
        trailSpeed,
        displacementIntensity,
        noisePower,
        noiseStrength,
        noiseSpeed,
        particleSizeDependsOnBrightness,
        grayscale,
        sickMode,
    } = useControls({
        trailSize: {
            value: 0.45,
            min: 0,
            max: 1,
            step: 0.001,
        },
        trailSpeed: {
            value: 0.03,
            min: 0.02,
            max: 0.1,
            step: 0.001,
        },
        displacementIntensity: {
            value: 3,
            min: 0,
            max: 7,
            step: 0.001,
        },
        noisePower: {
            value: 1,
            min: 1,
            max: 4,
            step: 0.001,
        },
        noiseStrength: {
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.001,
        },
        noiseSpeed: {
            value: 0.1,
            min: 0,
            max: 1,
            step: 0.001,
        },
        grayscale: {
            value: false,
        },
        sickMode: {
            value: false,
        },
        particleSizeDependsOnBrightness: {
            value: false,
        },
    });

    const amount = Number(gpu.fps) >= 60 ? 300 : 128;

    const { canvas, ctx, glowImage } = createDisplacementCanvas(amount, amount);
    const canvasTexture = useMemo(() => new CanvasTexture(canvas), [canvas]);

    const particlesGeometry = useMemo(() => {
        const geometry = new PlaneGeometry(planeSize.width, planeSize.height, amount, amount);
        geometry.setIndex(null);
        geometry.deleteAttribute('normal');
        return geometry;
    }, [planeSize.width, planeSize.height, amount]);

    useEffect(() => {
        const intensitiesArray = new Float32Array(particlesGeometry.attributes.position.count);
        const anglesArray = new Float32Array(particlesGeometry.attributes.position.count);

        for (let i = 0; i < particlesGeometry.attributes.position.count; i++) {
            intensitiesArray[i] = Math.random();
            anglesArray[i] = Math.random() * Math.PI * 2;
        }

        particlesGeometry.setAttribute('aIntensity', new BufferAttribute(intensitiesArray, 1));
        particlesGeometry.setAttribute('aAngle', new BufferAttribute(anglesArray, 1));
    }, [particlesGeometry]);

    const dpr = Math.min(devicePixelRatio, 2);

    const canvasCursor = useRef(new Vector2(9999, 9999));
    const canvasCursorPrevious = useRef(new Vector2(9999, 9999));

    const interactivePlane = useMemo(
        () => new Mesh(new PlaneGeometry(planeSize.width, planeSize.height), new MeshBasicMaterial()),
        [planeSize.width, planeSize.height],
    );

    const prevCursorDistance = useRef(0);

    useFrame(({ clock, pointer, camera, raycaster }) => {
        raycaster.setFromCamera(pointer, camera);
        const intersections = raycaster.intersectObject(interactivePlane);

        if (intersections.length) {
            const { uv } = intersections[0];

            if (uv) {
                canvasCursor.current.x = uv.x * canvas.width;
                canvasCursor.current.y = (1 - uv.y) * canvas.height;
            }
        }

        /**
         * Displacement
         */

        if (ctx) {
            // Fade out
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = trailSpeed;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Speed alpha
            let cursorDistance = canvasCursorPrevious.current.distanceTo(canvasCursor.current);
            const savedCursorDistance = cursorDistance;
            if (cursorDistance > 10 && prevCursorDistance.current === 0) {
                // When we enter the canvas, the value is large and we need to reduce it
                cursorDistance = 0;
            }
            prevCursorDistance.current = savedCursorDistance;

            canvasCursorPrevious.current.copy(canvasCursor.current);
            const alpha = Math.min(cursorDistance * 0.05, 1);

            // Draw glow
            const glowSize = canvas.width * trailSize;
            ctx.globalCompositeOperation = 'lighten';
            ctx.globalAlpha = alpha;
            ctx.drawImage(
                glowImage,
                canvasCursor.current.x - glowSize * 0.5,
                canvasCursor.current.y - glowSize * 0.5,
                glowSize,
                glowSize,
            );

            // We need to tell three.js to update the texture
            canvasTexture.needsUpdate = true;
        }

        if (plane.current) {
            plane.current.material.uniforms.uTime.value = clock.getElapsedTime();
            plane.current.material.uniforms.uDisplacementIntensity.value = displacementIntensity;
            plane.current.material.uniforms.uNoisePower.value = noisePower;
            plane.current.material.uniforms.uNoiseStrength.value = noiseStrength;
            plane.current.material.uniforms.uNoiseSpeed.value = noiseSpeed;
            plane.current.material.uniforms.uDependParticleSizeOnBrightness.value = particleSizeDependsOnBrightness;
            plane.current.material.uniforms.uGrayscale.value = grayscale;
            plane.current.material.uniforms.uSickMode.value = sickMode;
        }
    });

    return (
        <points ref={plane} geometry={particlesGeometry}>
            <shaderMaterial
                uniforms={{
                    uResolution: new Uniform(new Vector2(size.width * dpr, size.height * dpr)),
                    uPictureTexture: new Uniform(texture),
                    uImageSize: new Uniform(new Vector2(texture.image.naturalWidth, texture.image.naturalHeight)),
                    uPlaneSize: new Uniform(new Vector2(planeSize.width, planeSize.height)),
                    uDisplacementTexture: new Uniform(canvasTexture),
                    uTime: new Uniform(0),
                    uDisplacementIntensity: new Uniform(3),
                    uNoisePower: new Uniform(1),
                    uNoiseStrength: new Uniform(0.1),
                    uNoiseSpeed: new Uniform(0.1),
                    uSickMode: new Uniform(false),
                    uGrayscale: new Uniform(false),
                    uDependParticleSizeOnBrightness: new Uniform(false),
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                depthWrite={false}
            />
        </points>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-photo-mouse-trail">
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 18],
                        fov: 35,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ alpha: false, antialias: false }}
                    dpr={[1, 1.5]}
                    flat
                >
                    <Suspense fallback={<PageLoading />}>
                        <Experiment />
                    </Suspense>
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
