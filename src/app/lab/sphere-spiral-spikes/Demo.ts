import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Fn, PI2, atan2, cos, normalLocal, positionLocal, select, sin, smoothstep, time, vec3 } from 'three/tsl';
import {
    AmbientLight,
    DirectionalLight,
    IcosahedronGeometry,
    Mesh,
    MeshStandardNodeMaterial,
    TimestampQuery,
} from 'three/webgpu';
import BaseExperience from '../BaseExperience';

class SphereSpiralSpikes extends BaseExperience {
    params = {};
    controls: OrbitControls;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 5);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;

        const material = new MeshStandardNodeMaterial({
            color: 0xffaa00,
            roughness: 0.5,
            metalness: 0,
        });

        const getDisplacedPosition = Fn(([pos]: [any]) => {
            const p = pos.normalize();

            // Дистанция от верхнего полюса (от 0 до 2)
            const dist = p.y.oneMinus();
            // Угол вокруг оси Y
            const angle = atan2(p.x, p.z);

            // Формула спирали
            const spiralAngle = angle.add(dist.mul(3.0)).sub(time.mul(0));
            const branches = 6;

            const mask = cos(spiralAngle.mul(branches))
                .smoothstep(0.7, 1.0)
                .pow(2.0)
                .mul(dist.smoothstep(0.0, 0.2))
                .mul(p.y.add(1.0).smoothstep(0.0, 0.5));

            return pos.add(p.mul(mask).mul(0.05));
        });

        const displacedPos = getDisplacedPosition(positionLocal).toVar();
        material.positionNode = displacedPos;

        // Пересчет нормалей на основе соседей
        const epsilon = 0.001;
        const objNormal = positionLocal.normalize();

        const objTangent = select(
            objNormal.y.abs().greaterThan(0.999),
            vec3(1, 0, 0).cross(objNormal),
            vec3(0, 1, 0).cross(objNormal),
        ).normalize();

        const objBitangent = objNormal.cross(objTangent);

        const posT = getDisplacedPosition(positionLocal.add(objTangent.mul(epsilon)));
        const posB = getDisplacedPosition(positionLocal.add(objBitangent.mul(epsilon)));

        material.normalNode = posT.sub(displacedPos).cross(posB.sub(displacedPos)).normalize();

        // Маска для цвета (рассчитываем один раз для текущей позиции)
        const mask = getDisplacedPosition(positionLocal).sub(positionLocal).length().div(0.05).toVar();

        // Золотистый цвет сферы и белое свечение спиралей
        const baseColor = vec3(1.0, 0.7, 0.1);
        material.colorNode = baseColor;
        // material.emissiveNode = baseColor.mul(mask).mul(1);

        const mesh = new Mesh(new IcosahedronGeometry(0.7, 256), material);
        this.scene.add(mesh);

        const ambientLight = new AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        this.initTweakPane();
    }

    async render() {
        this.controls.update();

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

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

export default SphereSpiralSpikes;
