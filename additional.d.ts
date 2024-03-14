import { Material } from 'three';
import NoiseMatCapMaterial from '@/app/lab/animated-blob/noise-matcap-material';
import { SimulationMaterial } from '@/app/lab/fbo-particles/SimulationMaterial';

declare global {
    declare module 'lighthouse';
    declare module '*.glsl';

    declare namespace JSX {
        interface IntrinsicElements {
            noiseMatCapMaterial: ExtendedColors<
                Overwrite<Partial<NoiseMatCapMaterial>, NodeProps<NoiseMatCapMaterial, [ShaderMaterialParameters]>>
            >;
            simulationMaterial: ExtendedColors<
                Overwrite<Partial<SimulationMaterial>, NodeProps<SimulationMaterial, [ShaderMaterialParameters]>>
            >;
            sMat: ExtendedColors<
                Overwrite<Partial<SimulationMaterial>, NodeProps<SimulationMaterial, [ShaderMaterialParameters]>>
            >;
            sMaterial: ExtendedColors<
                Overwrite<Partial<SimulationMaterial>, NodeProps<SimulationMaterial, [ShaderMaterialParameters]>>
            >;
        }
    }
}
