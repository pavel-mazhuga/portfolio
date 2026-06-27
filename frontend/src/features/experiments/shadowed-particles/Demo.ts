import { chromaticAberration } from 'three/examples/jsm/tsl/display/ChromaticAberrationNode.js';
import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { pass, uniform } from 'three/tsl';
import { Color, Plane, Raycaster, RenderPipeline, TimestampQuery, Vector2, Vector3 } from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import { HOLOGRAM_DEFAULTS, HOLOGRAM_MODEL_URL } from './hologramDefaults';
import { ShadowedParticles } from './ShadowedParticles';

type TransitionState = 'idle' | 'deform-out' | 'morphing' | 'deform-in';

class Demo extends BaseExperience {
    particles?: ShadowedParticles;
    postProcessing!: RenderPipeline;
    bloomPass!: BloomNode;
    chromaticUniform = uniform(HOLOGRAM_DEFAULTS.chromaticStr);

    params = { ...HOLOGRAM_DEFAULTS };

    private transitionState: TransitionState = 'morphing';
    private transitionTime = 0;
    private isEntrance = true;

    private readonly raycaster = new Raycaster();
    private readonly mouseNDC = new Vector2();
    private readonly mousePlane = new Plane();
    private readonly mouseHit = new Vector3();
    private readonly modelCenter = new Vector3();
    private readonly cameraDir = new Vector3();
    private readonly targetMousePos = new Vector3();
    private readonly smoothMousePos = new Vector3();
    private readonly prevMousePos = new Vector3();
    private readonly frameVel = new Vector3();
    private readonly smoothVel = new Vector3();
    private readonly impVel = new Vector3();
    private readonly impulse = new Vector3();

    private glowEnergy = 0;
    private mouseMoving = false;
    private moveTimer = 0;
    private mouseEverMoved = false;
    private camX = 0;
    private camY = 0;
    private camRoll = 0;
    private camVelX = 0;
    private camVelY = 0;
    private camVelRoll = 0;

    private readonly camRadius = 6;
    private readonly moveTimeout = 0.06;

    private readonly onMouseMove = (e: MouseEvent) => {
        this.updatePointerFromCoords(e.clientX, e.clientY);
    };

    private readonly onMouseLeave = () => {
        this.mouseMoving = false;
    };

    private readonly onTouchStart = (e: TouchEvent) => {
        if (e.touches.length > 0) {
            this.updatePointerFromCoords(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    private readonly onTouchMove = (e: TouchEvent) => {
        e.preventDefault();

        if (e.touches.length > 0) {
            this.updatePointerFromCoords(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    private readonly onTouchEnd = () => {
        this.mouseMoving = false;
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.scene.background = new Color(0x000000);

        this.camera.fov = 50;
        this.camera.near = 0.1;
        this.camera.far = 200;
        this.camera.position.set(0, 0, this.camRadius);
        this.camera.updateProjectionMatrix();

        this.initPostProcessing();
        this.initPointerEvents();

        ShadowedParticles.sampleGLBGeometry(HOLOGRAM_MODEL_URL, this.params.particleCount).then((geometry) => {
            if (this.disposed) {
                return;
            }

            this.particles = new ShadowedParticles(geometry, this.params);
            this.scene.add(this.particles);
            this.initTweakPane();
        });
    }

    private initPostProcessing() {
        this.postProcessing = new RenderPipeline(this.renderer);

        const scenePass = pass(this.scene, this.camera);

        this.bloomPass = bloom(
            scenePass,
            this.params.bloomStrength,
            this.params.bloomRadius,
            this.params.bloomThreshold,
        );

        const combined = scenePass.add(this.bloomPass);

        this.postProcessing.outputNode = chromaticAberration(
            combined,
            this.chromaticUniform,
            new Vector2(0.5, 0.5),
        );
    }

    private initPointerEvents() {
        const el = this.canvas;

        el.addEventListener('mousemove', this.onMouseMove);
        el.addEventListener('mouseleave', this.onMouseLeave);
        el.addEventListener('touchstart', this.onTouchStart, { passive: true });
        el.addEventListener('touchmove', this.onTouchMove, { passive: false });
        el.addEventListener('touchend', this.onTouchEnd);
    }

    private destroyPointerEvents() {
        const el = this.canvas;

        el.removeEventListener('mousemove', this.onMouseMove);
        el.removeEventListener('mouseleave', this.onMouseLeave);
        el.removeEventListener('touchstart', this.onTouchStart);
        el.removeEventListener('touchmove', this.onTouchMove);
        el.removeEventListener('touchend', this.onTouchEnd);
    }

    private updatePointerFromCoords(clientX: number, clientY: number) {
        const rect = this.canvas.getBoundingClientRect();

        this.mouseNDC.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);

        this.particles?.getWorldPosition(this.modelCenter);
        this.camera.getWorldDirection(this.cameraDir);
        this.mousePlane.setFromNormalAndCoplanarPoint(this.cameraDir, this.modelCenter);

        this.raycaster.setFromCamera(this.mouseNDC, this.camera);

        if (!this.raycaster.ray.intersectPlane(this.mousePlane, this.mouseHit) || !this.particles) {
            return;
        }

        const localPos = this.mouseHit
            .clone()
            .sub(this.particles.position)
            .applyQuaternion(this.particles.rotGroup.quaternion.clone().invert());

        this.targetMousePos.copy(localPos);

        if (!this.mouseEverMoved) {
            this.smoothMousePos.copy(localPos);
            this.prevMousePos.copy(localPos);
            this.mouseEverMoved = true;
        }

        this.mouseMoving = true;
        this.moveTimer = 0;
    }

    private smoothstep(p: number) {
        return p * p * (3 - 2 * p);
    }

    private updateTransition(delta: number) {
        if (!this.particles) {
            return;
        }

        const u = this.particles.uniforms;
        const p = this.params;

        if (this.transitionState === 'deform-out') {
            this.transitionTime += delta;
            const progress = Math.min(this.transitionTime / p.transitionDeformDur, 1);
            const tmc = p.transitionMaskContrast;

            u.maskContrast.value = p.maskContrast + (tmc - p.maskContrast) * this.smoothstep(progress);

            if (progress >= 1) {
                u.maskContrast.value = tmc;
                this.transitionTime = 0;
                this.transitionState = 'morphing';
            }
        } else if (this.transitionState === 'morphing') {
            this.transitionTime += delta;
            const morphDur = this.isEntrance ? p.entranceMorphDur : p.transitionMorphDur;
            const progress = Math.min(this.transitionTime / morphDur, 1);

            u.transitionProgress.value = this.smoothstep(progress);

            if (progress >= 1) {
                const srcPos = this.particles.posAttr.array as Float32Array;
                const tgtPos = this.particles.posAttrTarget.array as Float32Array;
                const srcNorm = this.particles.normAttr.array as Float32Array;
                const tgtNorm = this.particles.normAttrTarget.array as Float32Array;

                srcPos.set(tgtPos);
                srcNorm.set(tgtNorm);
                this.particles.posAttr.needsUpdate = true;
                this.particles.normAttr.needsUpdate = true;
                u.transitionProgress.value = 0;
                this.transitionTime = 0;
                this.transitionState = 'deform-in';
            }
        } else if (this.transitionState === 'deform-in') {
            this.transitionTime += delta;
            const reformDur = this.isEntrance ? p.entranceReformDur : p.transitionReformDur;
            const progress = Math.min(this.transitionTime / reformDur, 1);
            const tmc = p.transitionMaskContrast;

            u.maskContrast.value = tmc + (p.maskContrast - tmc) * this.smoothstep(progress);

            if (this.isEntrance) {
                u.entranceGlow.value = 1 - this.smoothstep(progress);
            }

            if (progress >= 1) {
                u.maskContrast.value = p.maskContrast;
                this.transitionState = 'idle';

                if (this.isEntrance) {
                    this.isEntrance = false;
                }
            }
        }

        if (!this.isEntrance && this.mouseEverMoved && u.entranceGlow.value < 1) {
            u.entranceGlow.value = Math.min(u.entranceGlow.value + delta / 1.0, 1);
        }
    }

    private updateInteraction() {
        if (!this.particles) {
            return;
        }

        const delta = this.delta;
        const u = this.particles.uniforms;
        const p = this.params;

        this.updateTransition(delta);

        this.moveTimer += delta;

        if (this.moveTimer > this.moveTimeout) {
            this.mouseMoving = false;
        }

        const rotDelta = ((2 * Math.PI) / 60) * p.autoRotateSpeed * delta;

        this.particles.rotGroup.rotation.y += rotDelta;

        if (this.mouseEverMoved) {
            const alpha = 1 - Math.exp(-p.mouseLerp * delta);

            this.smoothMousePos.lerp(this.targetMousePos, alpha);
            u.mousePos.value.copy(this.smoothMousePos);
        }

        if (this.mouseMoving) {
            this.frameVel
                .subVectors(this.smoothMousePos, this.prevMousePos)
                .divideScalar(Math.max(delta, 0.001))
                .clampLength(0, 8.0);
            this.smoothVel.lerp(this.frameVel, 0.15);
        } else {
            this.smoothVel.multiplyScalar(0.85);
        }

        const k = p.springStiffness;
        const c = p.springDamping;

        this.impVel.x += (-k * this.impulse.x - c * this.impVel.x) * delta;
        this.impVel.y += (-k * this.impulse.y - c * this.impVel.y) * delta;
        this.impVel.z += (-k * this.impulse.z - c * this.impVel.z) * delta;

        if (this.mouseMoving) {
            this.impVel.x += this.smoothVel.x * p.pushStrength * delta;
            this.impVel.y += this.smoothVel.y * p.pushStrength * delta;
            this.impVel.z += this.smoothVel.z * p.pushStrength * delta;
        }

        this.impulse.x += this.impVel.x * delta;
        this.impulse.y += this.impVel.y * delta;
        this.impulse.z += this.impVel.z * delta;
        this.impulse.clampLength(0, 3.5);

        u.mouseVel.value.copy(this.impulse);
        this.prevMousePos.copy(this.smoothMousePos);

        const currentImpulse = this.impulse.length();

        if (currentImpulse > this.glowEnergy) {
            this.glowEnergy = currentImpulse;
        }

        this.glowEnergy *= Math.exp(-p.mouseGlowDecay * delta);
        u.mouseGlowEnergy.value = this.glowEnergy;

        const nx = this.mouseEverMoved ? this.mouseNDC.x : 0;
        const ny = this.mouseEverMoved ? this.mouseNDC.y : 0;
        const targetX = nx * p.camIntensity * 0.05;
        const targetY = ny * p.camIntensity * 0.05;
        const targetRoll = -nx * p.camIntensity * 0.008;

        this.camVelX += ((targetX - this.camX) * p.camStiffness - this.camVelX * p.camDamping) * delta;
        this.camVelY += ((targetY - this.camY) * p.camStiffness - this.camVelY * p.camDamping) * delta;
        this.camVelRoll += ((targetRoll - this.camRoll) * p.camStiffness - this.camVelRoll * p.camDamping) * delta;
        this.camX += this.camVelX * delta;
        this.camY += this.camVelY * delta;
        this.camRoll += this.camVelRoll * delta;
        this.camera.position.set(this.camX, this.camY, this.camRadius);
        this.camera.rotation.set(0, 0, this.camRoll);
    }

    replayEntrance() {
        if (!this.particles) {
            return;
        }

        this.transitionState = 'morphing';
        this.transitionTime = 0;
        this.isEntrance = true;
        this.particles.uniforms.transitionProgress.value = 0;
        this.particles.uniforms.entranceGlow.value = 1;

        const srcPos = this.particles.posAttr.array as Float32Array;

        srcPos.fill(0);
        this.particles.posAttr.needsUpdate = true;
    }

    render() {
        this.updateInteraction();

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render(this.postProcessing);
    }

    initTweakPane() {
        super.initTweakPane();

        if (!this.tweakPane || !this.particles) {
            return;
        }

        const onParticleChange = () => {
            this.particles?.syncUniformsFromParams();
        };

        const materialFolder = this.tweakPane.addFolder({ title: 'Material' });

        materialFolder.addBinding(this.params, 'color').on('change', onParticleChange);
        materialFolder.addBinding(this.params, 'ambient', { min: 0, max: 1, step: 0.01 }).on('change', onParticleChange);
        materialFolder.addBinding(this.params, 'wrap', { min: 0, max: 1, step: 0.01 }).on('change', onParticleChange);
        materialFolder
            .addBinding(this.params, 'volumeStrength', { min: 0, max: 1, step: 0.01 })
            .on('change', onParticleChange);
        materialFolder
            .addBinding(this.params, 'sphereSize', { min: 0.003, max: 0.08, step: 0.001 })
            .on('change', onParticleChange);

        const lightsFolder = this.tweakPane.addFolder({ title: 'Lights' });

        lightsFolder.addBinding(this.params, 'light1X', { min: -10, max: 10, step: 0.1 }).on('change', onParticleChange);
        lightsFolder.addBinding(this.params, 'light1Y', { min: -10, max: 10, step: 0.1 }).on('change', onParticleChange);
        lightsFolder.addBinding(this.params, 'light1Z', { min: -10, max: 10, step: 0.1 }).on('change', onParticleChange);
        lightsFolder.addBinding(this.params, 'light1Color').on('change', onParticleChange);
        lightsFolder
            .addBinding(this.params, 'light1Intensity', { min: 0, max: 5, step: 0.05 })
            .on('change', onParticleChange);
        lightsFolder.addBinding(this.params, 'light2X', { min: -10, max: 10, step: 0.1 }).on('change', onParticleChange);
        lightsFolder.addBinding(this.params, 'light2Y', { min: -10, max: 10, step: 0.1 }).on('change', onParticleChange);
        lightsFolder.addBinding(this.params, 'light2Z', { min: -10, max: 10, step: 0.1 }).on('change', onParticleChange);
        lightsFolder.addBinding(this.params, 'light2Color').on('change', onParticleChange);
        lightsFolder
            .addBinding(this.params, 'light2Intensity', { min: 0, max: 5, step: 0.05 })
            .on('change', onParticleChange);

        const waveFolder = this.tweakPane.addFolder({ title: 'Wave' });

        waveFolder.addBinding(this.params, 'floatAmp', { min: 0, max: 0.15, step: 0.001 }).on('change', onParticleChange);
        waveFolder.addBinding(this.params, 'noiseAmp', { min: 0, max: 1, step: 0.005 }).on('change', onParticleChange);
        waveFolder.addBinding(this.params, 'noiseScale', { min: 0.05, max: 3, step: 0.05 }).on('change', onParticleChange);
        waveFolder.addBinding(this.params, 'noiseSpeed', { min: 0, max: 2, step: 0.01 }).on('change', onParticleChange);
        waveFolder.addBinding(this.params, 'noiseGain', { min: 0.1, max: 0.9, step: 0.01 }).on('change', onParticleChange);
        waveFolder.addBinding(this.params, 'maskScale', { min: 0.05, max: 2, step: 0.05 }).on('change', onParticleChange);
        waveFolder.addBinding(this.params, 'maskSpeed', { min: 0, max: 0.5, step: 0.005 }).on('change', onParticleChange);
        waveFolder.addBinding(this.params, 'maskContrast', { min: 0.1, max: 8, step: 0.1 }).on('change', onParticleChange);

        const positionFolder = this.tweakPane.addFolder({ title: 'Position' });

        positionFolder.addBinding(this.params, 'modelX', { min: -5, max: 5, step: 0.05 }).on('change', onParticleChange);
        positionFolder.addBinding(this.params, 'modelY', { min: -5, max: 5, step: 0.05 }).on('change', onParticleChange);
        positionFolder.addBinding(this.params, 'modelZ', { min: -5, max: 5, step: 0.05 }).on('change', onParticleChange);

        const interactionFolder = this.tweakPane.addFolder({ title: 'Interaction' });

        interactionFolder
            .addBinding(this.params, 'mouseRadius', { min: 0.1, max: 5, step: 0.05 })
            .on('change', onParticleChange);
        interactionFolder
            .addBinding(this.params, 'mouseStrength', { min: 0, max: 10, step: 0.05 })
            .on('change', onParticleChange);
        interactionFolder.addBinding(this.params, 'pushStrength', { min: 0, max: 30, step: 0.5 });
        interactionFolder.addBinding(this.params, 'springStiffness', { min: 0.5, max: 60, step: 0.5 });
        interactionFolder.addBinding(this.params, 'springDamping', { min: 0.1, max: 40, step: 0.1 });
        interactionFolder
            .addBinding(this.params, 'mouseScatter', { min: 0, max: 3, step: 0.05 })
            .on('change', onParticleChange);
        interactionFolder.addBinding(this.params, 'mouseGlowColor').on('change', onParticleChange);
        interactionFolder
            .addBinding(this.params, 'mouseGlowPassive', { min: 0, max: 3, step: 0.05 })
            .on('change', onParticleChange);
        interactionFolder
            .addBinding(this.params, 'mouseGlowActive', { min: 0, max: 6, step: 0.05 })
            .on('change', onParticleChange);
        interactionFolder.addBinding(this.params, 'mouseGlowDecay', { min: 0.1, max: 10, step: 0.1 });
        interactionFolder
            .addBinding(this.params, 'mouseGlowPow', { min: 0.5, max: 6, step: 0.1 })
            .on('change', onParticleChange);
        interactionFolder.addBinding(this.params, 'mouseLerp', { min: 0.5, max: 30, step: 0.5 });
        interactionFolder.addBinding(this.params, 'camIntensity', { min: 0, max: 30, step: 0.1 });
        interactionFolder.addBinding(this.params, 'camStiffness', { min: 0, max: 10, step: 0.1 });
        interactionFolder.addBinding(this.params, 'camDamping', { min: 0, max: 10, step: 0.1 });

        const animationFolder = this.tweakPane.addFolder({ title: 'Animation' });

        animationFolder.addBinding(this.params, 'autoRotateSpeed', { min: 0, max: 5, step: 0.05 });

        const postFolder = this.tweakPane.addFolder({ title: 'PostFX' });

        postFolder.addBinding(this.params, 'bloomStrength', { min: 0, max: 3, step: 0.05 }).on('change', () => {
            this.bloomPass.strength.value = this.params.bloomStrength;
        });
        postFolder.addBinding(this.params, 'bloomRadius', { min: 0, max: 1, step: 0.01 }).on('change', () => {
            this.bloomPass.radius.value = this.params.bloomRadius;
        });
        postFolder.addBinding(this.params, 'bloomThreshold', { min: 0, max: 1, step: 0.01 }).on('change', () => {
            this.bloomPass.threshold.value = this.params.bloomThreshold;
        });
        postFolder.addBinding(this.params, 'chromaticStr', { min: 0, max: 3, step: 0.05 }).on('change', () => {
            this.chromaticUniform.value = this.params.chromaticStr;
        });

        const transitionFolder = this.tweakPane.addFolder({ title: 'Transition', expanded: false });

        transitionFolder.addBinding(this.params, 'transitionDeformDur', { min: 0.1, max: 3, step: 0.05 });
        transitionFolder.addBinding(this.params, 'transitionMorphDur', { min: 0.1, max: 4, step: 0.05 });
        transitionFolder.addBinding(this.params, 'transitionReformDur', { min: 0.1, max: 3, step: 0.05 });
        transitionFolder
            .addBinding(this.params, 'transitionMaskContrast', { min: 0, max: 2, step: 0.05 })
            .on('change', onParticleChange);
        transitionFolder
            .addBinding(this.params, 'transitionGlowScale', { min: 0, max: 4, step: 0.05 })
            .on('change', onParticleChange);

        const entranceFolder = this.tweakPane.addFolder({ title: 'Entrance', expanded: false });

        entranceFolder.addBinding(this.params, 'entranceMorphDur', { min: 0.1, max: 3, step: 0.05 });
        entranceFolder.addBinding(this.params, 'entranceReformDur', { min: 0.05, max: 2, step: 0.05 });
        entranceFolder.addButton({ title: 'Replay entrance' }).on('click', () => {
            this.replayEntrance();
        });
    }

    destroy() {
        this.destroyPointerEvents();

        if (this.particles) {
            this.scene.remove(this.particles);
            this.particles.dispose();
        }

        this.bloomPass?.dispose();
        this.postProcessing?.dispose();

        super.destroy();
    }
}

export default Demo;
