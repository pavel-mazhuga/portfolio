import { Fn, float, instanceIndex, max, mix, vec3 } from 'three/tsl';
import type { ComputeNode } from 'three/webgpu';
import {
    CURSOR_IMPULSE_RADIUS_K_COARSE,
    CURSOR_IMPULSE_RADIUS_K_FINE,
    CURSOR_IMPULSE_STRENGTH_K_COARSE,
    CURSOR_IMPULSE_STRENGTH_K_FINE,
    CURSOR_REPEL_DISPLACEMENT_SCALE_COARSE,
    CURSOR_REPEL_DISPLACEMENT_SCALE_FINE,
} from '../constants';
import type { HexGridGpuDeps } from '../types';

export function createUpdateCompute(instCount: number, deps: HexGridGpuDeps): ComputeNode {
    const {
        posStorage,
        velStorage,
        originStorage,
        targetAngleStorage,
        currentAngleStorage,
        deltaUniform,
        pointerUniform,
        uniforms,
    } = deps;

    return Fn(() => {
        const pos = posStorage.element(instanceIndex);
        const vel = velStorage.element(instanceIndex);
        const origin = originStorage.element(instanceIndex);
        const targetAngle = targetAngleStorage.element(instanceIndex);
        const currentAngle = currentAngleStorage.element(instanceIndex);

        const newPos = pos.toVar();
        const newVel = vel.toVar();
        const delta = deltaUniform;

        const newCurrentAngle = currentAngle.toVar();
        const angleDiff = targetAngle.sub(newCurrentAngle);

        newCurrentAngle.addAssign(angleDiff.mul(delta).mul(uniforms.flipSpeed));
        currentAngle.assign(newCurrentAngle);

        const attraction = origin.sub(newPos);
        const attractionInfluence = attraction.mul(uniforms.attractionStrength);

        const pressI = uniforms.pressBlend;
        const impulseI = max(pressI, uniforms.slideImpulse);
        const strengthK = mix(
            float(CURSOR_IMPULSE_STRENGTH_K_FINE),
            float(CURSOR_IMPULSE_STRENGTH_K_COARSE),
            uniforms.coarsePointerMix,
        );
        const radiusK = mix(
            float(CURSOR_IMPULSE_RADIUS_K_FINE),
            float(CURSOR_IMPULSE_RADIUS_K_COARSE),
            uniforms.coarsePointerMix,
        );
        const radiusMul = float(1).add(radiusK.mul(impulseI));
        const dentZ = float(-5).mul(float(1).sub(impulseI.mul(float(0.65))));
        const strengthMul = float(1).add(strengthK.mul(impulseI));

        const cursorDistance = pointerUniform.distance(newPos);
        const cursorR = uniforms.cursorRadius.mul(uniforms.pointerRadiusMul);
        const cursorInfluence = cursorR.mul(radiusMul).sub(cursorDistance).smoothstep(0, cursorR).div(cursorR);

        const diff = newPos.sub(pointerUniform);
        const dentDir = diff.div(diff.length().max(0.0001));
        const repelForce = dentDir
            .add(vec3(0, 0, dentZ))
            .normalize()
            .mul(cursorInfluence)
            .mul(uniforms.cursorStrength.mul(strengthMul));

        const repelScale = mix(float(1), impulseI, uniforms.coarsePointerMix);
        const repelDisplacementScale = mix(
            float(CURSOR_REPEL_DISPLACEMENT_SCALE_FINE),
            float(CURSOR_REPEL_DISPLACEMENT_SCALE_COARSE),
            uniforms.coarsePointerMix,
        );

        newVel.addAssign(repelForce.mul(repelDisplacementScale).mul(repelScale));
        newVel.addAssign(attractionInfluence);

        newVel.mulAssign(float(1).sub(delta.mul(uniforms.damping)));

        newPos.addAssign(newVel.mul(delta));

        pos.assign(newPos);
        vel.assign(newVel);
    })().compute(instCount);
}
