import { float } from 'three/tsl';

export function hexIntroStaggerScale(origin: any, maxDist: any, introStagger: any, introTransition: any): any {
    const radialT = origin.xy.length().div(maxDist.max(0.001)).clamp(0, 1);
    const delayW = radialT.mul(radialT).mul(float(3).sub(radialT.mul(2)));
    const introDenom = float(1).sub(delayW.mul(introStagger)).max(0.0001);
    const introP = introTransition.sub(delayW.mul(introStagger)).max(0).div(introDenom).clamp(0, 1);

    return float(1).sub(float(1).sub(introP).mul(float(1).sub(introP)));
}
