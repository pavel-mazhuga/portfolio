import { denoise } from 'three/examples/jsm/tsl/display/DenoiseNode.js';
import { ao } from 'three/examples/jsm/tsl/display/GTAONode.js';
import {
    Fn,
    If,
    Loop,
    colorToDirection,
    deltaTime,
    directionToColor,
    hash,
    instanceIndex,
    length,
    max,
    min,
    mrt,
    mx_fractal_noise_vec3,
    nodeObject,
    normalView,
    not,
    output,
    pass,
    positionLocal,
    sample,
    screenUV,
    storage,
    time,
    uint,
    uniform,
    vec3,
    vec4,
} from 'three/tsl';
import {
    ComputeNode,
    DirectionalLight,
    InstancedMesh,
    MeshStandardNodeMaterial,
    type Node,
    Plane,
    RenderPipeline,
    SphereGeometry,
    type StorageBufferNode,
    StorageInstancedBufferAttribute,
    TimestampQuery,
    Vector3,
} from 'three/webgpu';
import { Pointer } from '../lib/Pointer';
import { compose } from '../lib/nodes/compose';
import { rotationXYZ } from '../lib/nodes/rotation-xyz';
import BaseExperience from '../model/BaseExperience';

class Demo extends BaseExperience {
    postProcessing: RenderPipeline;
    mesh!: InstancedMesh<SphereGeometry, MeshStandardNodeMaterial>;
    amount = 600;
    pointerHandler!: Pointer;

    positionsBuffer!: StorageBufferNode<'vec4'>;
    velocitiesBuffer!: StorageBufferNode<'vec4'>;

    computeAttractions!: ComputeNode;
    computeCollisions!: ComputeNode;

    private readonly dirLightLeft: DirectionalLight;
    private readonly dirLightRight: DirectionalLight;

    params = {
        usePostprocessing: true,
    };

    uniforms = {
        attractorPosition: uniform(new Vector3(0)),
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, {
            antialias: false,
        });

        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();

        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();

            color.mulAssign(0.1);

            return vec4(color, 1);
        })();

        this.pointerHandler = new Pointer(this.renderer, this.camera, new Plane(new Vector3(0, 0, 1), 0));
        this.pointerHandler.clientPointer.x = this.canvas.offsetWidth / 2;
        this.pointerHandler.clientPointer.y = this.canvas.offsetHeight / 2;

        this.positionsBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 4), 'vec4', this.amount).setPBO(
            true,
        );
        this.velocitiesBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 4), 'vec4', this.amount);

        const geometry = new SphereGeometry(1, 32, 32);

        geometry.deleteAttribute('uv');

        const attractorPosition = uniform(new Vector3(0));

        this.uniforms.attractorPosition = attractorPosition;
        const size = uniform(0.12);
        const attractorSize = uniform(8);
        const maxVelocity = uniform(0.04);
        const isAttractor = instanceIndex.equal(0);

        const hash0 = hash(instanceIndex).toVar('hash0');
        const hash1 = hash(instanceIndex.add(1)).toVar('hash1');
        const hash2 = hash(instanceIndex.add(2)).toVar('hash2');
        const hash3 = hash(instanceIndex.add(3)).toVar('hash3');
        const hash4 = hash(instanceIndex.add(4)).toVar('hash4');
        const hash5 = hash(instanceIndex.add(5)).toVar('hash5');

        const initCompute = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);
            const velocity = this.velocitiesBuffer.element(instanceIndex);

            velocity.xyz.assign(0);

            If(isAttractor, () => {
                position.xyz.assign(attractorPosition);
                position.w.assign(attractorSize);
                velocity.w.assign(0);
            }).Else(() => {
                position.xyz.assign(vec3(hash0.sub(0.5).mul(20), hash3.sub(0.5).mul(20), hash5.sub(0.5).mul(20)));
                position.w.assign(hash4.mul(0.3).add(0.7));
                velocity.w.assign(1);
            });
        })().compute(this.amount);

        this.renderer.computeAsync(initCompute);

        this.computeAttractions = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);
            const velocity = this.velocitiesBuffer.element(instanceIndex);

            const pos = position.xyz.toVar('pos');
            const vel = velocity.xyz.toVar('vel');

            const clampedDeltaTime = deltaTime.min(0.02).toVar();

            If(not(isAttractor), () => {
                const toAttractorVec = attractorPosition.sub(pos).toVar('toAttractorVec');
                const objSize = position.w.mul(size).toVar('objSize');
                const intensity = max(objSize.mul(objSize), 0.1);

                vel.addAssign(toAttractorVec.normalize().mul(clampedDeltaTime).mul(intensity));
                vel.assign(min(vel, vec3(maxVelocity)));
                vel.mulAssign(0.999);
                pos.addAssign(vel.mul(clampedDeltaTime.mul(60)));
            }).Else(() => {
                pos.assign(attractorPosition);
            });

            position.xyz.assign(pos);
            velocity.xyz.assign(vel);
        })().compute(this.amount);

        this.computeCollisions = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);
            const velocity = this.velocitiesBuffer.element(instanceIndex);
            const count = uint(this.amount);

            Loop({ start: uint(0), end: count, type: 'uint', condition: '<' }, ({ i }) => {
                If(uint(i).notEqual(instanceIndex), () => {
                    const neighbourPosition = this.positionsBuffer.element(i);
                    const toNeighbourVec = neighbourPosition.xyz.sub(position.xyz).toVar('toNeighbourVec');
                    const distance = length(toNeighbourVec).toVar('dist');
                    const minDistance = position.w.mul(size).add(neighbourPosition.w.mul(size)).toVar('minDist');

                    If(distance.lessThan(minDistance).and(not(isAttractor)), () => {
                        const toNeighbourDirection = toNeighbourVec.normalize().toVar('toNeighbourDirection');
                        const diff = minDistance.sub(distance).toVar('diff');
                        const correction = toNeighbourDirection.mul(diff.mul(0.5)).toVar('correction');
                        const velocityCorrection = correction.mul(max(length(velocity), 2));

                        position.xyz.subAssign(correction);
                        velocity.xyz.subAssign(velocityCorrection);
                    });
                });
            });
        })().compute(this.amount);

        const material = new MeshStandardNodeMaterial({
            roughness: 0.1,
            metalness: 0.1,
        });

        material.positionNode = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);

            const rMat = rotationXYZ(vec3(0));
            const iMat = compose(position.xyz, rMat, vec3(position.w).mul(size));

            return iMat.mul(positionLocal);
        })();

        material.colorNode = Fn(() => {
            const color = vec3(1).toVar('color');

            If(not(isAttractor), () => {
                color.assign(vec3(hash0, hash1, hash2).mul(0.8).add(0.2));
            });

            return vec4(color, 1);
        })();

        this.mesh = new InstancedMesh(geometry, material, this.amount);
        this.mesh.frustumCulled = false;
        this.mesh.matrixAutoUpdate = false;
        this.scene.add(this.mesh);

        this.dirLightLeft = new DirectionalLight('#b088fa', 2);
        this.dirLightLeft.position.set(-10, -2, 10);
        this.scene.add(this.dirLightLeft);

        this.dirLightRight = new DirectionalLight('#ff8b8b', 2);
        this.dirLightRight.position.set(15, 5, 5);
        this.scene.add(this.dirLightRight);

        this.postProcessing = new RenderPipeline(this.renderer);

        const prePass = pass(this.scene, this.camera);

        prePass.name = 'Pre-Pass';
        prePass.transparent = false;

        prePass.setMRT(
            mrt({
                output: directionToColor(normalView),
            }),
        );

        const prePassNormal = sample((uv) => {
            return colorToDirection(prePass.getTextureNode().sample(uv));
        });

        const prePassDepth = prePass.getTextureNode('depth');

        const scenePass = pass(this.scene, this.camera);

        scenePass.setMRT(
            mrt({
                output,
            }),
        );

        const scenePassColor = scenePass.getTextureNode('output');

        const aoPass = ao(prePassDepth, prePassNormal, this.camera);

        aoPass.resolutionScale = 0.5;
        aoPass.thickness.value = 2;
        aoPass.samples.value = 8;

        const denoisePass = denoise(
            aoPass.getTextureNode().sample(screenUV).r,
            prePassDepth,
            prePassNormal,
            this.camera,
        );

        this.postProcessing.outputNode = scenePassColor.mul(nodeObject(denoisePass) as unknown as Node<'vec4'>);

        this.initTweakPane();
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.5);
    }

    async render() {
        this.clock.update();
        const elapsedTime = this.clock.getElapsed();

        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        this.pointerHandler.update();
        this.uniforms.attractorPosition.value.lerp(this.pointerHandler.uPointer.value, 0.1);

        await this.renderer.computeAsync(this.computeAttractions);
        await this.renderer.computeAsync(this.computeCollisions);

        if (this.stats) {
            await this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        if (this.params.usePostprocessing) {
            this.postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        if (this.stats) {
            await this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER);
            this.stats.update();
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        this.scene.remove(this.dirLightLeft);
        this.scene.remove(this.dirLightRight);
        this.dirLightLeft.dispose();
        this.dirLightRight.dispose();

        this.pointerHandler.destroy();
        this.positionsBuffer.dispose();
        this.velocitiesBuffer.dispose();

        this.postProcessing.dispose();

        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        this.tweakPane?.addBinding(this.params, 'usePostprocessing');
    }
}

export default Demo;
