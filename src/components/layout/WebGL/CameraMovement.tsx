import { useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RefObject, useRef } from 'react';
import { Light, Object3D, Vector3 } from 'three';
import { lerp } from '@/utils/lerp';

type Props = {
    light: RefObject<Light>;
};

const CameraMovement = ({ light }: Props) => {
    const cameraLookAtObject = useRef<Object3D>(null);
    const cameraLookAtObjectPosition = useRef(new Vector3());
    const scroll = useScroll();

    useFrame(({ camera }) => {
        const isTouch = matchMedia('(hover: none)').matches;
        camera.position.x = lerp(camera.position.x, scroll.offset * scroll.pages * 8.5, isTouch ? 0.1 : 0.07);

        cameraLookAtObjectPosition.current.x = camera.position.x;
        cameraLookAtObjectPosition.current.y = 2;
        cameraLookAtObjectPosition.current.z = 0;

        if (cameraLookAtObject.current) {
            cameraLookAtObject.current.position.lerp(cameraLookAtObjectPosition.current, 0.08);
            camera.lookAt(cameraLookAtObject.current.position);
        }

        if (light.current) {
            light.current.position.x = lerp(light.current.position.x, camera.position.x, isTouch ? 0.06 : 0.02);
        }
    });

    return <object3D ref={cameraLookAtObject} />;
};

export default CameraMovement;
