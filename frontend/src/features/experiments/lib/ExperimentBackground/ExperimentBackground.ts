import { BackSide, Color, type ColorRepresentation, Mesh, ShaderMaterial, SphereGeometry } from 'three';
import fragmentShader from './shaders/fragment.glsl?raw';
import vertexShader from './shaders/vertex.glsl?raw';

export type ExperimentBackgroundOptions = {
    color?: ColorRepresentation;
};

const DEFAULT_COLOR = '#a6a6a6';
const SCALE = 100;

export class ExperimentBackground extends Mesh<SphereGeometry, ShaderMaterial> {
    constructor(options?: ExperimentBackgroundOptions) {
        const geometry = new SphereGeometry(1, 1, 256, 256);
        const material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new Color(options?.color ?? DEFAULT_COLOR) },
            },
            vertexShader,
            fragmentShader,
            side: BackSide,
        });

        super(geometry, material);
        this.scale.setScalar(SCALE);
        this.frustumCulled = false;
    }

    update(elapsedTime: number) {
        this.material.uniforms.uTime.value = elapsedTime;
    }

    setColor(color: ColorRepresentation) {
        this.material.uniforms.uColor.value.set(color);
    }

    dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
}
