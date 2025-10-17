import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import BaseWebglExperience from '../BaseWebglExperience';
import simulationFragmentShader from './shaders/positions/fragment.glsl';

class ParticlesSphereFresnel extends BaseWebglExperience {
    params = {
        size: 30.0,
        edgeBlur: 0.5,
        glow: 0.3,
    };
    points?: Points;
    controls?: OrbitControls;
    gpgpuRenderer?: GPUComputationRenderer;
    positionsVariable?: any;
    particleCount = 10000;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 5);

        this.initGPGPU();
        this.createParticleSphere();
        this.initControls();
        this.initTweakPane();
    }

    initGPGPU() {
        const size = Math.ceil(Math.sqrt(this.particleCount));
        this.gpgpuRenderer = new GPUComputationRenderer(size, size, this.renderer);

        const texture = this.gpgpuRenderer.createTexture();

        // Initialize texture with initial positions using Fibonacci sphere
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleIncrement = Math.PI * 2 * goldenRatio;

        for (let i = 0; i < this.particleCount; i++) {
            const i4 = i * 4;
            const t = i / this.particleCount;
            const inclination = Math.acos(1 - 2 * t);
            const azimuth = angleIncrement * i;

            const radius = 1;
            const x = radius * Math.sin(inclination) * Math.cos(azimuth);
            const y = radius * Math.sin(inclination) * Math.sin(azimuth);
            const z = radius * Math.cos(inclination);

            (texture.image.data as any)[i4 + 0] = x; // x
            (texture.image.data as any)[i4 + 1] = y; // y
            (texture.image.data as any)[i4 + 2] = z; // z
            (texture.image.data as any)[i4 + 3] = (Math.random() * 0.5 + 0.5) * 2; // scale
        }

        this.positionsVariable = this.gpgpuRenderer.addVariable('uPositions', simulationFragmentShader, texture);
        this.positionsVariable.material.uniforms.uTime = { value: 0 };
        this.positionsVariable.material.uniforms.uDeltaTime = { value: 0 };
        this.positionsVariable.material.uniforms.uInitialPositions = { value: texture };
        this.gpgpuRenderer.setVariableDependencies(this.positionsVariable, [this.positionsVariable]);
        this.gpgpuRenderer.init();
    }

    createParticleSphere() {
        const geometry = new BufferGeometry();

        // Create dummy positions - will be replaced by GPU texture
        const positions = new Float32Array(this.particleCount * 3);
        geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

        // Create particle indices for texture lookup
        const particleIndices = new Float32Array(this.particleCount);
        for (let i = 0; i < this.particleCount; i++) {
            particleIndices[i] = i;
        }
        geometry.setAttribute('aParticleIndex', new Float32BufferAttribute(particleIndices, 1));

        const material = new ShaderMaterial({
            vertexShader: /* glsl */ `
                uniform float uTime;
                uniform float uSize;
                uniform float uEdgeBlur;
                uniform float uGlow;
                uniform sampler2D uPositions;
                uniform vec2 uTextureSize;
                
                attribute float aParticleIndex;
                
                varying vec3 vColor;
                varying float vFresnel;
                varying float vScale;
                
                void main() {
                    // Calculate UV coordinates for texture lookup
                    vec2 uv = vec2(
                        mod(aParticleIndex, uTextureSize.x) / uTextureSize.x,
                        floor(aParticleIndex / uTextureSize.x) / uTextureSize.y
                    );
                    
                    // Get position and scale from GPU texture
                    vec4 gpuData = texture2D(uPositions, uv);
                    vec3 gpuPosition = gpuData.xyz;
                    vScale = gpuData.w;
                    
                    vec4 modelPosition = modelMatrix * vec4(gpuPosition, 1.0);
                    vec4 viewPosition = viewMatrix * modelPosition;
                    vec4 projectedPosition = projectionMatrix * viewPosition;
                    
                    gl_Position = projectedPosition;
                    
                    // Size attenuation
                    gl_PointSize = uSize * vScale * (1.0 / -viewPosition.z);
                    
                    // Calculate Fresnel effect
                    vec3 viewDirection = normalize(cameraPosition - modelPosition.xyz);
                    vec3 normal = normalize(gpuPosition);
                    vFresnel = pow(1.0 - abs(dot(viewDirection, normal)), 2.0);
                    gl_PointSize += vFresnel * 10.0;
                    
                    // Color based on position
                    vColor = vec3(
                        0.5 + 0.5 * sin(gpuPosition.x * 3.0 + uTime),
                        0.5 + 0.5 * sin(gpuPosition.y * 3.0 + uTime * 0.7),
                        0.5 + 0.5 * sin(gpuPosition.z * 3.0 + uTime * 0.5)
                    );
                }
            `,
            fragmentShader: /* glsl */ `
                uniform float uEdgeBlur;
                uniform float uGlow;
                
                varying vec3 vColor;
                varying float vFresnel;
                varying float vScale;
                
                void main() {
                    // Create circular particles
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    // Soft edges with blur effect
                    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                    
                    // Apply Fresnel effect
                    alpha *= vFresnel;
                    
                    // Add subtle glow at edges
                    float glow = pow(1.0 - vFresnel, 2.0) * uGlow;
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
                uSize: { value: this.params.size },
                uEdgeBlur: { value: this.params.edgeBlur },
                uGlow: { value: this.params.glow },
                uPositions: { value: null },
                uTextureSize: { value: { x: 0, y: 0 } },
            },
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        this.points = new Points(geometry, material);
        this.scene.add(this.points);
    }

    initControls() {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
    }

    async render() {
        if (this.controls) {
            this.controls.update();
        }

        // Update GPU computation
        if (this.gpgpuRenderer && this.positionsVariable) {
            this.positionsVariable.material.uniforms.uTime.value = this.clock.getElapsedTime();
            this.positionsVariable.material.uniforms.uDeltaTime.value = this.delta;
            this.gpgpuRenderer.compute();
        }

        if (this.points) {
            const material = this.points.material as ShaderMaterial;
            material.uniforms.uTime.value = this.clock.getElapsedTime();

            // Update GPU texture uniforms
            if (this.gpgpuRenderer && this.positionsVariable) {
                material.uniforms.uPositions.value = this.gpgpuRenderer.getCurrentRenderTarget(
                    this.positionsVariable,
                ).texture;
                const size = Math.ceil(Math.sqrt(this.particleCount));
                material.uniforms.uTextureSize.value = { x: size, y: size };
            }
        }

        super.render();
    }

    destroy() {
        this.controls?.dispose();
        this.gpgpuRenderer?.dispose();
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.tweakPane
                .addBinding(this.params, 'size', {
                    min: 1,
                    max: 100,
                    step: 1,
                })
                .on('change', (ev) => {
                    if (this.points) {
                        const material = this.points.material as ShaderMaterial;
                        material.uniforms.uSize.value = ev.value;
                    }
                });

            this.tweakPane
                .addBinding(this.params, 'edgeBlur', {
                    min: 0,
                    max: 2,
                    step: 0.1,
                })
                .on('change', (ev) => {
                    if (this.points) {
                        const material = this.points.material as ShaderMaterial;
                        material.uniforms.uEdgeBlur.value = ev.value;
                    }
                });

            this.tweakPane
                .addBinding(this.params, 'glow', {
                    min: 0,
                    max: 1,
                    step: 0.01,
                })
                .on('change', (ev) => {
                    if (this.points) {
                        const material = this.points.material as ShaderMaterial;
                        material.uniforms.uGlow.value = ev.value;
                    }
                });
        }
    }
}

export default ParticlesSphereFresnel;
