import { uniform } from 'three/tsl';
import { Camera, Plane, Raycaster, Vector2, Vector3 } from 'three/webgpu';

export class Pointer {
    canvasDomWidth: number;
    canvasDomHeight: number;
    camera: Camera;
    delta = 0;
    rayCaster = new Raycaster();
    initPlane = new Plane(new Vector3(0, 0, 1));
    iPlane = new Plane(new Vector3(0, 0, 1));
    clientPointer = new Vector2(-999);
    pointer = new Vector2();
    scenePointer = new Vector3();
    uPointer = uniform(new Vector3());
    uPointerVelocity = uniform(new Vector3());
    prevScenePointer = new Vector3();

    constructor(canvasDomWidth: number, canvasDomHeight: number, camera: Camera, plane: Plane) {
        this.canvasDomWidth = canvasDomWidth;
        this.canvasDomHeight = canvasDomHeight;
        this.camera = camera;
        this.initPlane = plane;
        this.iPlane = plane.clone();
    }

    updateScreenPointer(): void {
        const e = {
            clientX: this.clientPointer.x,
            clientY: this.clientPointer.y,
        };

        this.pointer.set((e.clientX / this.canvasDomWidth) * 2 - 1, -(e.clientY / this.canvasDomHeight) * 2 + 1);
        this.rayCaster.setFromCamera(this.pointer, this.camera);
        this.rayCaster.ray.intersectPlane(this.iPlane, this.scenePointer);

        const velocity = this.scenePointer.clone().sub(this.prevScenePointer);

        const damp = Math.exp(-0.8 * this.delta);

        this.uPointerVelocity.value.multiplyScalar(damp).add(velocity.multiplyScalar(1 - damp));

        this.uPointer.value.copy(this.scenePointer);

        this.prevScenePointer.copy(this.scenePointer);
    }

    update(delta: number): void {
        this.delta = delta;
        this.iPlane.normal.copy(this.initPlane.normal).applyEuler(this.camera.rotation);
        this.updateScreenPointer();
    }

    intersectWith(plane: Plane, target: Vector3): Vector3 | null {
        this.rayCaster.setFromCamera(this.pointer, this.camera);

        return this.rayCaster.ray.intersectPlane(plane, target);
    }

    updatePosition(x: number, y: number) {
        this.clientPointer.set(x, y);
    }

    updateCanvasDomSize(canvasDomWidth: number, canvasDomHeight: number) {
        this.canvasDomWidth = canvasDomWidth;
        this.canvasDomHeight = canvasDomHeight;
    }
}
