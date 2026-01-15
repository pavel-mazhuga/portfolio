import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as tsl from 'three/tsl';
import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    InstancedMesh,
    Matrix4,
    Mesh,
    MeshStandardNodeMaterial,
    PMREMGenerator,
    Quaternion,
    SphereGeometry,
    TimestampQuery,
    Vector3,
} from 'three/webgpu';
import BaseExperience from '../BaseExperience';

const BLADE_WIDTH = 0.03;
const BLADE_HEIGHT = 0.03;
const BLADE_COUNT = 50000;
const SPHERE_RADIUS = 0.7;

class GrassSphere extends BaseExperience {
    params = {
        count: BLADE_COUNT,
    };
    controls: OrbitControls;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 5);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;

        const environment = new RoomEnvironment();
        const pmremGenerator = new PMREMGenerator(this.renderer);
        this.scene.environment = pmremGenerator.fromScene(environment).texture;

        // Base Sphere
        const baseSphere = new Mesh(
            new SphereGeometry(SPHERE_RADIUS, 32, 32),
            new MeshStandardNodeMaterial({ color: 0x000000 }),
        );
        this.scene.add(baseSphere);

        // Grass Blade Geometry
        const bladeGeo = new BufferGeometry();
        const positions = new Float32Array([
            -BLADE_WIDTH / 2,
            0,
            0,
            BLADE_WIDTH / 2,
            0,
            0,
            BLADE_WIDTH / 4,
            BLADE_HEIGHT / 2,
            0,
            -BLADE_WIDTH / 4,
            BLADE_HEIGHT / 2,
            0,
            0,
            BLADE_HEIGHT,
            0.05,
        ]);
        const indices = [0, 1, 2, 2, 4, 3, 3, 0, 2];
        bladeGeo.setAttribute('position', new BufferAttribute(positions, 3));
        bladeGeo.setIndex(indices);
        bladeGeo.computeVertexNormals();

        // Material
        const material = new MeshStandardNodeMaterial({
            side: DoubleSide,
        });

        const wave = tsl.Fn(() => {
            const isTip = tsl.vertexIndex.equal(4);
            const waveSize = tsl.hash(tsl.instanceIndex).mul(2.0);
            const waveDistance = tsl.select(isTip, tsl.float(0.05), tsl.float(0.01));
            return tsl.sin(tsl.time.add(waveSize)).mul(waveDistance);
        });

        material.positionNode = tsl.positionLocal.add(tsl.vec3(wave(), 0, 0));

        const grassColor = tsl.Fn(() => {
            const bottomColor = tsl.color(0x000000);
            const topColor = tsl.color(0x33aa33);
            const height = tsl.positionWorld.length().sub(SPHERE_RADIUS).div(BLADE_HEIGHT);

            return tsl.mix(bottomColor, topColor, height.clamp(0, 1));
        });

        material.colorNode = grassColor();

        // Instanced Mesh
        const mesh = new InstancedMesh(bladeGeo, material, this.params.count);

        const dummy = new Vector3();
        const matrix = new Matrix4();
        const quaternion = new Quaternion();
        const up = new Vector3(0, 1, 0);

        for (let i = 0; i < this.params.count; i++) {
            // Random point on sphere (Fibonacci lattice for even distribution)
            const phi = Math.acos(-1 + (2 * i) / this.params.count);
            const theta = Math.sqrt(this.params.count * Math.PI) * phi;

            const x = SPHERE_RADIUS * Math.cos(theta) * Math.sin(phi);
            const y = SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi);
            const z = SPHERE_RADIUS * Math.cos(phi);

            dummy.set(x, y, z);

            // Orient blade to face outward
            quaternion.setFromUnitVectors(up, dummy.clone().normalize());

            // Random rotation around the normal
            const randRotation = new Quaternion().setFromAxisAngle(up, Math.random() * Math.PI * 2);
            quaternion.multiply(randRotation);

            matrix.compose(dummy, quaternion, new Vector3(1, 1 + Math.random() * 0.5, 1));
            mesh.setMatrixAt(i, matrix);
        }

        this.scene.add(mesh);

        this.initTweakPane();
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        this.controls.update();

        super.render();
    }

    destroy() {
        this.controls.dispose();
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            //
        }
    }
}

export default GrassSphere;
