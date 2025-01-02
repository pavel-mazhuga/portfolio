import { uniform } from 'three/tsl';
import { Camera, Plane, Raycaster, Vector2, Vector3, WebGPURenderer } from 'three/webgpu';

// import { Root } from '../Root';
// import { IAnimatedElement } from '../interfaces/IAnimatedElement';

export class Pointer /* implements IAnimatedElement */ {
    camera: Camera;
    renderer: WebGPURenderer;
    rayCaster: Raycaster = new Raycaster();
    initPlane: Plane = new Plane(new Vector3(0, 0, 1));
    iPlane: Plane = new Plane(new Vector3(0, 0, 1));
    clientPointer: Vector2 = new Vector2();
    pointer: Vector2 = new Vector2();
    scenePointer: Vector3 = new Vector3();
    pointerDown: boolean = false;
    uPointerDown = uniform(0);
    uPointer = uniform(new Vector3());

    constructor(renderer: WebGPURenderer, camera: Camera, plane: Plane, autoAlign: boolean = false) {
        this.camera = camera;
        this.renderer = renderer;
        this.initPlane = plane;
        this.iPlane = plane.clone();
        renderer.domElement.addEventListener('pointerdown', this.onPointerDown.bind(this));
        renderer.domElement.addEventListener('pointerup', this.onPointerUp.bind(this));
        window.addEventListener('pointermove', this.onPointerMove.bind(this));

        // if (autoAlign) {
        //     Root.registerAnimatedElement(this);
        // }
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
        this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
        this.rayCaster.setFromCamera(this.pointer, this.camera);
        this.rayCaster.ray.intersectPlane(this.iPlane, this.scenePointer);
        this.uPointer.value.x = this.scenePointer.x;
        this.uPointer.value.y = this.scenePointer.y;
        this.uPointer.value.z = this.scenePointer.z;
        //console.log( this.scenePointer );
    }

    update() {
        this.iPlane.normal.copy(this.initPlane.normal).applyEuler(this.camera.rotation);
        this.updateScreenPointer();
    }
}
