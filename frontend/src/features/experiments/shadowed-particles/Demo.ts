import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import { Color, Plane, Raycaster, RenderPipeline, TimestampQuery, Vector2, Vector3 } from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import { ShadowedParticles } from './ShadowedParticles';

const MODEL_URL = '/static/gltf/suzanne.glb';
const PARTICLE_COUNT = 40_000;

class Demo extends BaseExperience {
    particles?: ShadowedParticles;
    postProcessing!: RenderPipeline;
    bloomPass!: BloomNode;

    params = {
        autoRotateSpeed: 0.8,
        bloomStrength: 0.4,
        bloomRadius: 0.4,
        bloomThreshold: 0.1,
        springStiffness: 5.0,
        springDamping: 3.0,
        pushStrength: 12.0,
        mouseScatter: 0.6,
        mouseGlowDecay: 1.5,
        mouseLerp: 6.0,
        camIntensity: 12,
        camStiffness: 3.0,
        camDamping: 4.0,
        usePostprocessing: true,
    };

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
        this.camera.position.set(0, 0, this.camRadius);

        this.initPostProcessing();
        this.initPointerEvents();
        this.initTweakPane();

        ShadowedParticles.sampleGLBGeometry(MODEL_URL, PARTICLE_COUNT).then((geometry) => {
            if (this.disposed) {
                return;
            }

            this.particles = new ShadowedParticles(geometry, PARTICLE_COUNT);
            this.scene.add(this.particles);
        });
    }

    private initPostProcessing() {
        this.postProcessing = new RenderPipeline(this.renderer);

        const scenePass = pass(this.scene, this.camera);

        this.bloomPass = bloom(
            scenePass,
            this.params.bloomStrength,
            this.params.bloomThreshold,
            this.params.bloomRadius,
        );
        this.postProcessing.outputNode = scenePass.add(this.bloomPass);
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

        {
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
        }

        this.mouseMoving = true;
        this.moveTimer = 0;
    }

    private updateInteraction() {
        if (!this.particles) {
            return;
        }

        const delta = this.delta;
        const u = this.particles.uniforms;

        this.moveTimer += delta;

        if (this.moveTimer > this.moveTimeout) {
            this.mouseMoving = false;
        }

        const rotDelta = ((2 * Math.PI) / 60) * this.params.autoRotateSpeed * delta;

        this.particles.rotGroup.rotation.y += rotDelta;

        if (this.mouseEverMoved) {
            const alpha = 1 - Math.exp(-this.params.mouseLerp * delta);

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

        const k = this.params.springStiffness;
        const c = this.params.springDamping;

        this.impVel.x += (-k * this.impulse.x - c * this.impVel.x) * delta;
        this.impVel.y += (-k * this.impulse.y - c * this.impVel.y) * delta;
        this.impVel.z += (-k * this.impulse.z - c * this.impVel.z) * delta;

        if (this.mouseMoving) {
            const push = this.params.pushStrength;

            this.impVel.x += this.smoothVel.x * push * delta;
            this.impVel.y += this.smoothVel.y * push * delta;
            this.impVel.z += this.smoothVel.z * push * delta;
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

        this.glowEnergy *= Math.exp(-this.params.mouseGlowDecay * delta);
        u.mouseGlowEnergy.value = this.glowEnergy;

        const intensity = this.params.camIntensity;
        const camK = this.params.camStiffness;
        const camC = this.params.camDamping;
        const nx = this.mouseEverMoved ? this.mouseNDC.x : 0;
        const ny = this.mouseEverMoved ? this.mouseNDC.y : 0;
        const targetX = nx * intensity * 0.05;
        const targetY = ny * intensity * 0.05;
        const targetRoll = -nx * intensity * 0.008;

        this.camVelX += ((targetX - this.camX) * camK - this.camVelX * camC) * delta;
        this.camVelY += ((targetY - this.camY) * camK - this.camVelY * camC) * delta;
        this.camVelRoll += ((targetRoll - this.camRoll) * camK - this.camVelRoll * camC) * delta;
        this.camX += this.camVelX * delta;
        this.camY += this.camVelY * delta;
        this.camRoll += this.camVelRoll * delta;
        this.camera.position.set(this.camX, this.camY, this.camRadius);
        this.camera.rotation.set(0, 0, this.camRoll);
    }

    render() {
        this.updateInteraction();

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render(this.params.usePostprocessing ? this.postProcessing : undefined);
    }

    initTweakPane() {
        super.initTweakPane();

        if (!this.tweakPane) {
            return;
        }

        this.tweakPane.addBinding(this.params, 'autoRotateSpeed', { min: 0, max: 3, step: 0.01 });

        const bloomFolder = this.tweakPane.addFolder({ title: 'Bloom' });

        bloomFolder.addBinding(this.params, 'usePostprocessing');
        bloomFolder.addBinding(this.params, 'bloomStrength', { min: 0, max: 1, step: 0.01 }).on('change', () => {
            this.bloomPass.strength.value = this.params.bloomStrength;
        });
        bloomFolder.addBinding(this.params, 'bloomThreshold', { min: 0, max: 1, step: 0.01 }).on('change', () => {
            this.bloomPass.threshold.value = this.params.bloomThreshold;
        });
        bloomFolder.addBinding(this.params, 'bloomRadius', { min: 0, max: 1, step: 0.01 }).on('change', () => {
            this.bloomPass.radius.value = this.params.bloomRadius;
        });

        const interactionFolder = this.tweakPane.addFolder({ title: 'Interaction' });

        interactionFolder.addBinding(this.params, 'springStiffness', { min: 0, max: 20, step: 0.1 });
        interactionFolder.addBinding(this.params, 'springDamping', { min: 0, max: 10, step: 0.1 });
        interactionFolder.addBinding(this.params, 'pushStrength', { min: 0, max: 30, step: 0.1 });
        interactionFolder.addBinding(this.params, 'mouseLerp', { min: 0, max: 20, step: 0.1 });
        interactionFolder.addBinding(this.params, 'camIntensity', { min: 0, max: 30, step: 0.1 });
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
