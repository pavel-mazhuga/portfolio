import { ShaderMaterial, Texture } from 'three';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

export default class NoiseMatCapMaterial extends ShaderMaterial {
    constructor(texture: Texture, offset: number) {
        super({
            uniforms: {
                u_time: { value: 0 },
                u_amplitude: { value: 1 },
                u_frequency: { value: 1 },
                u_offset: { value: offset },
                u_matCapMap: { value: texture },
            },
            vertexShader,
            fragmentShader,
        });
    }
}
