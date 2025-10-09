import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    Fn,
    If,
    ShaderNodeObject,
    abs,
    cameraViewMatrix,
    color,
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
    ComputeNode,
    InstancedMesh,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    SpriteNodeMaterial,
    StorageInstancedBufferAttribute,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { simplexNoise4d } from '@/utils/webgpu/nodes/noise/simplexNoise4d';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    controls: OrbitControls;
    stats: Stats;
    computeParticles: ShaderNodeObject<ComputeNode>;

    amount: number;

    tweakPane = new Pane();

    params = {
        count: 25000,
        pointSize: 20,
        color: '#ff6730',
    };

    uniforms = {
        color: uniform(color(this.params.color)),
        pointSize: uniform(this.params.pointSize),
    };

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({ canvas });
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.stats = new Stats({
            trackGPU: true,
        });
        this.stats.init(this.renderer);
        canvas.parentElement?.appendChild(this.stats.dom);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.#initEvents();
        this.#initTweakPane();
        this.renderer.setAnimationLoop(this.render);

        this.amount = 25000;

        const initialPositionAndLifeBuffer = storage(
            new StorageInstancedBufferAttribute(this.amount, 4),
            'vec4',
            this.amount,
        );
        const positionAndLifeBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 4), 'vec4', this.amount);

        const sizeBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 1), 'float', this.amount);

        // @ts-ignore
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

            // @ts-ignore
        })().compute(this.amount);

        this.renderer.compute(computeInit);

        const rotation3dY = Fn<[number]>(([angle]) => {
            const s = float(sin(angle)).toVar();
            const c = float(cos(angle)).toVar();
            return mat3(c, 0.0, s.negate(), 0.0, 1.0, 0.0, s, 0.0, c);
        });

        const uDeltaTime = float(0.01);

        // @ts-ignore
        const computeUpdate = Fn(() => {
            const initialPosition = initialPositionAndLifeBuffer.element(instanceIndex);
            const position = positionAndLifeBuffer.element(instanceIndex);

            If(position.w.greaterThan(1), () => {
                position.assign(initialPosition);
                // @ts-ignore
            }).Else(() => {
                position.w.addAssign(uDeltaTime);
                // @ts-ignore
                position.xyz.mulAssign(rotation3dY(max(0.03, distance(initialPosition.xyz, vec3(0)).mul(0.03))));
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

        // @ts-ignore
        this.computeParticles = computeUpdate().compute(this.amount);

        const material = new SpriteNodeMaterial({
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        const vAlpha = varying(float(1), 'alpha');

        material.positionNode = Fn<[any]>(([position]) => {
            const lifespan = position.w;
            vAlpha.assign(abs(lifespan.sub(0.5)).mul(2).oneMinus());
            vAlpha.assign(remap(vAlpha, 0.3, 0.7, 0, 1));

            return position;
            // @ts-ignore
        })(positionAndLifeBuffer.toAttribute());

        const viewPosition = vec4(cameraViewMatrix.mul(modelPosition));

        material.scaleNode = Fn<[number]>(([size]) => {
            return this.uniforms.pointSize
                .mul(0.000005)
                .mul(size)
                .mul(vAlpha)
                .mul(screenSize.y)
                .mul(float(1).div(viewPosition.z.negate()));

            // @ts-ignore
        })(sizeBuffer.toAttribute());

        material.outputNode = Fn(() => {
            const dist = float(distance(uv(), vec2(0.5))).toVar();
            const color = vec3(vec3(step(dist, 0.3)).mul(this.uniforms.color)).toVar();

            return vec4(color, vAlpha);
        })();

        const particles = new InstancedMesh(new PlaneGeometry(1, 1), material, this.amount);

        this.scene.add(particles);
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 2);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    #initEvents() {
        window.addEventListener('resize', this.onWindowResize);
    }

    #destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    #initTweakPane() {
        this.tweakPane = new Pane();

        this.tweakPane.addBinding(this.params, 'color').on('change', (event) => {
            (this.uniforms.color.value as any).set(event.value);
        });

        this.tweakPane.addBinding(this.params, 'count', { min: 0, max: 50000, step: 1 });

        this.tweakPane.addBinding(this.params, 'pointSize', { min: 0, max: 50, step: 0.001 }).on('change', (event) => {
            this.uniforms.pointSize.value = event.value;
        });
    }

    #destroyTweakPane() {
        this.tweakPane.dispose();
    }

    async render() {
        this.stats.update();
        await this.renderer.computeAsync(this.computeParticles);
        await this.renderer.renderAsync(this.scene, this.camera);
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#destroyEvents();
        this.#destroyTweakPane();
        this.controls.dispose();
        this.stats.dom.remove();
        this.renderer.dispose();
    }
}

export default Demo;
