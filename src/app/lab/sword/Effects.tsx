import { Bloom, EffectComposer } from '@react-three/postprocessing';

const Effects = () => {
    return (
        <EffectComposer disableNormalPass>
            <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.1} intensity={2} />
        </EffectComposer>
    );
};

export default Effects;
