import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    Fn,
    If,
    abs,
    cameraViewMatrix,
    cos,
    distance,
    float,
    hash,
    instanceIndex,
    mat3,
    max,
    modelPosition,
    normalize,
    remap,
    screenSize,
    sin,
    step,
    storage,
    time,
    uniform,
    uv,
    varying,
    vec2,
    vec3,
    vec4,
} from 'three/tsl';
import {
    AdditiveBlending,
    Color,
    ComputeNode,
    InstancedMesh,
    type Node,
    PlaneGeometry,
    SpriteNodeMaterial,
    StorageInstancedBufferAttribute,
} from 'three/webgpu';
import { simplexNoise4d } from '@/features/experiments/lib/nodes/noise/simplexNoise4d';
import BaseExperience from '../model/BaseExperience';

class Demo extends BaseExperience {
    controls: OrbitControls;
    computeParticles!: ComputeNode;

    amount: number;

    params = {
        count: 25000,
        pointSize: 20,
        color: '#ff6730',
    };

    uniforms = {
        color: uniform(new Color(this.params.color)),
        pointSize: uniform(this.params.pointSize),
    };

    private particles!: InstancedMesh<PlaneGeometry, SpriteNodeMaterial>;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();

        this.controls = new OrbitControls(this.camera, this.canvas);

        this.amount = 25000;

        const initialPositionAndLifeBuffer = storage(
            new StorageInstancedBufferAttribute(this.amount, 4),
            'vec4',
            this.amount,
        );
        const positionAndLifeBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 4), 'vec4', this.amount);

        const sizeBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 1), 'float', this.amount);

        const computeInit = Fn(() => {
            const initialPosition = initialPositionAndLifeBuffer.element(instanceIndex);
            const position = positionAndLifeBuffer.element(instanceIndex);

            const i = float(instanceIndex);

            const randX = hash(instanceIndex);
            const randY = hash(instanceIndex.add(2));
            const randZ = hash(instanceIndex.add(3));
            const randW = hash(instanceIndex.add(4));
            const randSize = hash(instanceIndex.add(1));

            initialPosition.x = randX.sub(0.5).mul(i.div(this.amount));
            initialPosition.y = randY.sub(0.5).mul(2).mul(i.div(this.amount));
            initialPosition.z = randZ.sub(0.5).mul(i.div(this.amount));
            initialPosition.w = float(randW);
            position.assign(initialPosition);

            sizeBuffer.element(instanceIndex).assign(float(0.5).add(randSize.mul(0.5)));
        })().compute(this.amount);

        this.renderer.computeAsync(computeInit);

        const rotation3dY = Fn(([angleImmutable]: [Node<'float'>]) => {
            const angle = float(angleImmutable).toVar();
            const s = float(sin(angle)).toVar();
            const c = float(cos(angle)).toVar();

            return mat3(c, 0.0, s.negate(), 0.0, 1.0, 0.0, s, 0.0, c);
        });

        const uDeltaTime = float(0.01);

        const computeUpdate = Fn(() => {
            const initialPosition = initialPositionAndLifeBuffer.element(instanceIndex);
            const position = positionAndLifeBuffer.element(instanceIndex);

            If(position.w.greaterThan(1), () => {
                position.assign(initialPosition);
            }).Else(() => {
                position.w.addAssign(uDeltaTime);
                const twistAngle = max(0.03, distance(initialPosition.xyz, vec3(0)).mul(0.03));

                position.xyz.assign(rotation3dY(twistAngle).mul(position.xyz));
                const flowField = vec3(
                    normalize(
                        vec3(
                            simplexNoise4d(vec4(position.xyz, time.mul(0.5))).mul(0.5),
                            abs(simplexNoise4d(vec4(position.xyz.add(1), time))),
                            simplexNoise4d(vec4(position.xyz.add(2), time.mul(0.5))).mul(0.5),
                        ),
                    ),
                ).toVar();

                position.xyz.addAssign(flowField.mul(uDeltaTime));
            });
        });

        this.computeParticles = computeUpdate().compute(this.amount);

        const material = new SpriteNodeMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        const vAlpha = varying(float(1), 'alpha');

        material.positionNode = Fn(() => {
            const position = positionAndLifeBuffer.element(instanceIndex);
            const lifespan = position.w;

            vAlpha.assign(abs(lifespan.sub(0.5)).mul(2).oneMinus());
            vAlpha.assign(remap(vAlpha, 0.3, 0.7, 0, 1));

            return position;
        })();

        const viewPosition = vec4(cameraViewMatrix.mul(modelPosition));

        material.scaleNode = Fn(() => {
            const size = sizeBuffer.element(instanceIndex);

            return this.uniforms.pointSize
                .mul(0.000005)
                .mul(size)
                .mul(vAlpha)
                .mul(screenSize.y)
                .mul(float(1).div(viewPosition.z.negate()));
        })();

        material.outputNode = Fn(() => {
            const dist = float(distance(uv(), vec2(0.5))).toVar();
            const outColor = vec3(vec3(step(dist, 0.3)).mul(this.uniforms.color)).toVar();

            return vec4(outColor, vAlpha);
        })();

        this.particles = new InstancedMesh(new PlaneGeometry(1, 1), material, this.amount);

        this.scene.add(this.particles);

        this.initTweakPane();
    }

    onWindowResize() {
        super.onWindowResize();
        this.controls?.update();
    }

    initTweakPane() {
        super.initTweakPane();

        if (!this.tweakPane) {
            return;
        }

        this.tweakPane.addBinding(this.params, 'color').on('change', () => {
            this.uniforms.color.value.set(this.params.color);
        });

        this.tweakPane.addBinding(this.params, 'count', { min: 0, max: 50000, step: 1 });

        this.tweakPane.addBinding(this.params, 'pointSize', { min: 0, max: 50, step: 0.001 }).on('change', () => {
            this.uniforms.pointSize.value = this.params.pointSize;
        });
    }

    render() {
        this.renderer.compute(this.computeParticles);

        super.render();
    }

    destroy() {
        this.controls?.dispose();

        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();

        super.destroy();
    }
}

export default Demo;
