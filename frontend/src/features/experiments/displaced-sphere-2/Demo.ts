import {
    ACESFilmicToneMapping,
    Clock,
    Color,
    IcosahedronGeometry,
    Mesh,
    PerspectiveCamera,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ExperimentBackground } from '../lib/ExperimentBackground';
import fragmentShader from './shaders/fragment.glsl?raw';
import vertexShader from './shaders/vertex.glsl?raw';

export type DisplacedSphere2Params = {
    gradientStrength: number;
    color: string;
    speed: number;
    noiseStrength: number;
    displacementStrength: number;
    fractAmount: number;
    remapPowerRange: [number, number];
    ambientLightColor: string;
    ambientLightIntensity: number;
    directionalLightColor: string;
    directionalLightIntensity: number;
    directionalLightPositionX: number;
    directionalLightPositionY: number;
    directionalLightPositionZ: number;
};

const defaultParams = (): DisplacedSphere2Params => ({
    gradientStrength: 1.3,
    color: '#2994ff',
    speed: 1.1,
    noiseStrength: 1,
    displacementStrength: 0.3,
    fractAmount: 6,
    remapPowerRange: [0.4, 0.7],
    ambientLightColor: '#fff',
    ambientLightIntensity: 0.35,
    directionalLightColor: '#fff',
    directionalLightIntensity: 1,
    directionalLightPositionX: -2,
    directionalLightPositionY: 2,
    directionalLightPositionZ: 3.5,
});

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();
    private readonly material: ShaderMaterial;
    private readonly mesh: Mesh<IcosahedronGeometry, ShaderMaterial>;
    private readonly experimentBackground: ExperimentBackground;
    private readonly boundResize: () => void;

    constructor(canvas: HTMLCanvasElement, isMobile: boolean, initialParams?: Partial<DisplacedSphere2Params>) {
        this.canvas = canvas;
        const params = { ...defaultParams(), ...initialParams };

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.outputColorSpace = SRGBColorSpace;

        this.scene = new Scene();
        this.scene.background = new Color(0xa6a6a6);

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, isMobile ? 9 : 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        const detail = isMobile ? 180 : 256;
        const geometry = new IcosahedronGeometry(1.3, detail);

        this.material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new Color(params.color) },
                uGradientStrength: { value: params.gradientStrength },
                uAmbientLightColor: { value: new Color(params.ambientLightColor) },
                uAmbientLightIntensity: { value: params.ambientLightIntensity },
                uDirectionalLightColor: { value: new Color(params.directionalLightColor) },
                uDirectionalLightIntensity: { value: params.directionalLightIntensity },
                uDirectionalLightPosition: {
                    value: new Vector3(
                        params.directionalLightPositionX,
                        params.directionalLightPositionY,
                        params.directionalLightPositionZ,
                    ),
                },
                uSpeed: { value: params.speed },
                uNoiseStrength: { value: params.noiseStrength },
                uDisplacementStrength: { value: params.displacementStrength },
                uFractAmount: { value: params.fractAmount },
                uRemapPower: { value: new Vector2(params.remapPowerRange[0], params.remapPowerRange[1]) },
            },
            vertexShader,
            fragmentShader,
        });

        this.mesh = new Mesh(geometry, this.material);
        this.mesh.matrixAutoUpdate = false;
        this.mesh.frustumCulled = false;
        this.scene.add(this.mesh);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.experimentBackground = new ExperimentBackground();
        this.scene.add(this.experimentBackground);

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private renderFrame() {
        this.controls.update();
        const elapsedTime = this.clock.getElapsedTime();

        this.material.uniforms.uTime.value = elapsedTime;
        this.experimentBackground.update(elapsedTime);
        this.renderer.render(this.scene, this.camera);
    }

    updateParams(p: Partial<DisplacedSphere2Params>) {
        const u = this.material.uniforms;

        if (p.gradientStrength !== undefined) u.uGradientStrength.value = p.gradientStrength;

        if (p.color !== undefined) u.uColor.value.set(p.color);

        if (p.speed !== undefined) u.uSpeed.value = p.speed;

        if (p.noiseStrength !== undefined) u.uNoiseStrength.value = p.noiseStrength;

        if (p.displacementStrength !== undefined) u.uDisplacementStrength.value = p.displacementStrength;

        if (p.fractAmount !== undefined) u.uFractAmount.value = p.fractAmount;

        if (p.remapPowerRange !== undefined) {
            u.uRemapPower.value.set(p.remapPowerRange[0], p.remapPowerRange[1]);
        }

        if (p.ambientLightColor !== undefined) u.uAmbientLightColor.value.set(p.ambientLightColor);

        if (p.ambientLightIntensity !== undefined) u.uAmbientLightIntensity.value = p.ambientLightIntensity;

        if (p.directionalLightColor !== undefined) u.uDirectionalLightColor.value.set(p.directionalLightColor);

        if (p.directionalLightIntensity !== undefined) u.uDirectionalLightIntensity.value = p.directionalLightIntensity;

        if (
            p.directionalLightPositionX !== undefined ||
            p.directionalLightPositionY !== undefined ||
            p.directionalLightPositionZ !== undefined
        ) {
            const pos = u.uDirectionalLightPosition.value as Vector3;

            if (p.directionalLightPositionX !== undefined) pos.x = p.directionalLightPositionX;

            if (p.directionalLightPositionY !== undefined) pos.y = p.directionalLightPositionY;

            if (p.directionalLightPositionZ !== undefined) pos.z = p.directionalLightPositionZ;
        }
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);
    }

    destroy() {
        window.removeEventListener('resize', this.boundResize);
        this.renderer.setAnimationLoop(null);
        this.controls.dispose();
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.experimentBackground);
        this.experimentBackground.dispose();
        this.renderer.dispose();
    }
}

export default Demo;
