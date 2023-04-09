'use client';

import { CameraShake, Environment } from '@react-three/drei';
import { KernelSize } from 'postprocessing';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Ground from './Ground';
import Screen from './Screen';
import OldTV from './models/OldTV';
import SittingPerson from './models/SittingPerson';

const MainScene = () => {
    return (
        <>
            <SittingPerson position={[0, -2.2, 0]} />
            <OldTV position={[0, 0, -5]} />
            {/* <Screen position={[-0.45, 0.35, 0]} /> */}
            <Ground />
            <fog attach="fog" args={['#000', 0, 50]} />
            <ambientLight intensity={1} />
            {/* <CameraShake /> */}
            <Environment preset="night" />
            <EffectComposer multisampling={8}>
                <Bloom kernelSize={3} luminanceThreshold={0} luminanceSmoothing={0.4} intensity={0.6} />
                <Bloom kernelSize={KernelSize.HUGE} luminanceThreshold={0} luminanceSmoothing={0} intensity={0.5} />
            </EffectComposer>
        </>
    );
};

export default MainScene;
