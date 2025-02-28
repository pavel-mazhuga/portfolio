/**
 * Modified version of Christophe Choffel's Pointer class
 *
 * https://github.com/ULuIQ12/webgpu-tsl-linkedparticles/blob/main/src/lib/utils/Pointer.ts
 */
import { uniform } from 'three/tsl';
import { Camera, Plane, Raycaster, Vector2, Vector3, WebGPURenderer } from 'three/webgpu';

export class Pointer {
    camera: Camera;
    renderer: WebGPURenderer;
    delta = 0;
    rayCaster = new Raycaster();
    initPlane = new Plane(new Vector3(0, 0, 1));
    iPlane = new Plane(new Vector3(0, 0, 1));
    clientPointer = new Vector2(-999);
    pointer = new Vector2();
    scenePointer = new Vector3();
    pointerDown = false;
    uPointerDown = uniform(0);
    uPointer = uniform(new Vector3());
    uPointerVelocity = uniform(new Vector3());

    constructor(renderer: WebGPURenderer, camera: Camera, plane: Plane) {
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);

        this.camera = camera;
        this.renderer = renderer;
        this.initPlane = plane;
        this.iPlane = plane.clone();

        renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
        renderer.domElement.addEventListener('pointerup', this.onPointerUp);
        window.addEventListener('pointermove', this.onPointerMove);
    }

    onPointerDown(e: PointerEvent): void {
        if (e.pointerType !== 'mouse' || e.button === 0) {
            this.pointerDown = true;
            this.uPointerDown.value = 1;
        }

        this.clientPointer.set(e.clientX, e.clientY);
        this.updateScreenPointer(e);
    }

    onPointerUp(e: PointerEvent): void {
        this.clientPointer.set(e.clientX, e.clientY);
        this.updateScreenPointer(e);
        this.pointerDown = false;
        this.uPointerDown.value = 0;
    }

    onPointerMove(e: PointerEvent): void {
        this.clientPointer.set(e.clientX, e.clientY);
        this.updateScreenPointer(e);
    }

    updateScreenPointer(e?: PointerEvent): void {
        if (e == null || e == undefined) {
            e = { clientX: this.clientPointer.x, clientY: this.clientPointer.y } as PointerEvent;
        }

        this.pointer.set(
            (e.clientX / this.renderer.domElement.offsetWidth) * 2 - 1,
            -(e.clientY / this.renderer.domElement.offsetHeight) * 2 + 1,
        );
        this.rayCaster.setFromCamera(this.pointer, this.camera);
        this.rayCaster.ray.intersectPlane(this.iPlane, this.scenePointer);
        this.uPointerVelocity.value.addScalar(this.scenePointer.distanceTo(this.uPointer.value));
        const damp = 1 - Math.exp(-0.55 * 1000 * Math.max(0.001, this.delta));
        this.uPointerVelocity.value.multiplyScalar(damp);
        this.uPointer.value.x = this.scenePointer.x;
        this.uPointer.value.y = this.scenePointer.y;
        this.uPointer.value.z = this.scenePointer.z;
    }

    update(delta?: number): void {
        if (typeof delta === 'number') {
            this.delta = delta;
        }

        this.iPlane.normal.copy(this.initPlane.normal).applyEuler(this.camera.rotation);
        this.updateScreenPointer();
    }

    destroy() {
        this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
        this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
        window.removeEventListener('pointermove', this.onPointerMove);
    }
}
