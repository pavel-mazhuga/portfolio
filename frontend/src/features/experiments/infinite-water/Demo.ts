import { vec4 } from 'three/tsl';
import { PointLight } from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import Water from './Water';

class Demo extends BaseExperience {
    mesh: Water;
    light: PointLight;

    #touchStart = {
        x: 0,
        y: 0,
        cameraX: 0,
        cameraZ: 0,
    };

    params = {
        position: { x: 0, y: 0, z: 0 },
    };

    uniforms = {};

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { antialias: true });

        this.onWheel = this.onWheel.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);

        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, 0.5, 0);

        this.scene.backgroundNode = vec4(0, 0, 0, 1);

        this.mesh = new Water();
        this.scene.add(this.mesh);

        this.light = new PointLight(0xffffff, 10, 50, 1);
        this.light.position.set(0, 3, 3);
        this.scene.add(this.light);

        // Listeners after bind: BaseExperience calls initEvents() inside super() before these bindings exist.
        window.addEventListener('wheel', this.onWheel, { passive: true });
        this.canvas.addEventListener('touchstart', this.onTouchStart);
        this.canvas.addEventListener('touchmove', this.onTouchMove);
    }

    override get dpr() {
        return Math.min(window.devicePixelRatio, 1.5);
    }

    #onCameraMove() {
        this.mesh.position.x = this.camera.position.x;
        this.mesh.position.z = this.camera.position.z;
        this.light.position.x = this.camera.position.x;
        this.light.position.z = 3 + this.camera.position.z;
    }

    onWheel(event: WheelEvent) {
        this.camera.position.x += event.deltaX * 0.003;
        this.camera.position.z += event.deltaY * 0.003;
        this.#onCameraMove();
    }

    onTouchStart(event: TouchEvent) {
        this.#touchStart.x = event.touches[0].clientX;
        this.#touchStart.y = event.touches[0].clientY;
        this.#touchStart.cameraX = this.camera.position.x;
        this.#touchStart.cameraZ = this.camera.position.z;
    }

    onTouchMove(event: TouchEvent) {
        const x = event.touches[0].clientX;
        const deltaX = (x - this.#touchStart.x) * 0.03;

        this.camera.position.x = this.#touchStart.cameraX - deltaX;

        const y = event.touches[0].clientY;
        const deltaY = (y - this.#touchStart.y) * 0.03;

        this.camera.position.z = this.#touchStart.cameraZ - deltaY;

        this.#onCameraMove();
    }

    protected override destroyEvents() {
        window.removeEventListener('wheel', this.onWheel);
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
        super.destroyEvents();
    }

    override destroy() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        this.scene.remove(this.light);
        this.light.dispose();

        super.destroy();
    }
}

export default Demo;
