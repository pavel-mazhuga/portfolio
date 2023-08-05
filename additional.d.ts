import { Material } from 'three';
import NoiseMatCapMaterial from '@/app/lab/animated-blob/noise-matcap-material';

declare global {
    declare module 'lighthouse';
    declare module '*.glsl';

    declare namespace JSX {
        interface IntrinsicElements {
            noiseMatCapMaterial: ExtendedColors<
                Overwrite<Partial<NoiseMatCapMaterial>, NodeProps<NoiseMatCapMaterial, [ShaderMaterialParameters]>>
            >;
        }
    }
}
