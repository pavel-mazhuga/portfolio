import {
    Fn,
    abs,
    blendScreen,
    color,
    cos,
    float,
    instanceIndex,
    mat3,
    mix,
    mrt,
    positionLocal,
    select,
    sign,
    sin,
    smoothstep,
    time,
    varying,
    vec2,
    vec3,
    vec4,
} from 'three/tsl';
import { MeshPhysicalNodeMaterial, UniformNode } from 'three/webgpu';
import { coverTextureUv } from '../../../utils/tsl/uv-cover';
import { buildVideoSizeVec2, buildVideoTextureNode } from '../lib/video-texture-select';
import type { GridLayout, HexGridMaterialDeps } from '../types';
import { hexIntroStaggerScale } from './hex-intro-stagger-scale';

export function applyHexGridMaterial(
    material: MeshPhysicalNodeMaterial,
    deps: HexGridMaterialDeps,
    layout: GridLayout,
    videoWidths: UniformNode<'float', number>[],
    videoHeights: UniformNode<'float', number>[],
): void {
    const {
        posStorage,
        velStorage,
        originStorage,
        currentAngleStorage,
        isCentralStorage,
        frontVideoIndexStorage,
        backVideoIndexStorage,
        uniforms,
        videoTextures,
        colorPhaseStorage,
        rotPhaseStorage,
    } = deps;

    const { uCentralWidth, uCentralHeight } = layout;

    const vLocalPos = varying(vec3(0));
    const vNormal = varying(vec3(0));
    const vGridPos = varying(vec2(0));
    const vBackGridPos = varying(vec2(0));
    const vCoveredUvFront = varying(vec2(0));
    const vCoveredUvBack = varying(vec2(0));

    const planeSize = vec2(uCentralWidth, uCentralHeight);

    material.positionNode = Fn(() => {
        const pos = posStorage.element(instanceIndex);
        const origin = originStorage.element(instanceIndex);
        const rotPhase = rotPhaseStorage.element(instanceIndex);
        const currentAngle = currentAngleStorage.element(instanceIndex);
        const isCentral = isCentralStorage.element(instanceIndex);
        const transition = uniforms.projectTransition;

        const dist = origin.xy.length().sub(uniforms.minDist).max(0);
        const distRange = uniforms.maxDist.sub(uniforms.minDist).max(0.001);
        const localTransition = transition.mul(3.0).sub(dist.div(distRange).mul(2.0)).clamp(0, 1);

        const rotationX = mat3(
            1,
            0,
            0,
            0,
            cos(currentAngle),
            sin(currentAngle).negate(),
            0,
            sin(currentAngle),
            cos(currentAngle),
        );

        const baseScale = select(isCentral.greaterThan(0.5), float(1.0), float(1.0).sub(localTransition));

        vLocalPos.assign(positionLocal.mul(baseScale));

        const zOffset = sin(rotPhase.z.add(time.mul(0.5))).mul(0.125);
        const animatedPos = vec3(pos.x, pos.y, pos.z.add(zOffset));

        const angleX = cos(rotPhase.x.add(time.mul(sign(rotPhase.x)))).mul(Math.PI * 0.0625);
        const angleY = sin(rotPhase.y.add(time.mul(sign(rotPhase.y)))).mul(Math.PI * 0.0625);

        const cX = cos(angleX);
        const sX = sin(angleX);
        const cY = cos(angleY);
        const sY = sin(angleY);

        const rx = mat3(1, 0, 0, 0, cX, sX.negate(), 0, sX, cX);
        const ry = mat3(cY, 0, sY, 0, 1, 0, sY.negate(), 0, cY);

        const rotated = rx.mul(ry).mul(vLocalPos);
        const oriented = vec3(rotated.x, rotated.z, rotated.y.negate());

        const introScale = hexIntroStaggerScale(
            origin,
            uniforms.maxDist,
            uniforms.introStagger,
            uniforms.introTransition,
        );

        const finalPos = rotationX.mul(oriented.mul(introScale));

        vNormal.assign(rotationX.mul(vec3(0, 0, 1)));

        const localFacePos = vec2(positionLocal.x, positionLocal.z);

        vGridPos.assign(vec2(pos.x.add(localFacePos.x), pos.y.add(localFacePos.y)));
        vBackGridPos.assign(vec2(pos.x.add(localFacePos.x), pos.y.sub(localFacePos.y)));

        const globalUV = vGridPos.div(planeSize).add(0.5);
        const backGlobalUV = vBackGridPos.div(planeSize).add(0.5);
        const frontVideoIndexNode = frontVideoIndexStorage.element(instanceIndex);
        const backVideoIndexNode = backVideoIndexStorage.element(instanceIndex);
        const videoSizeFront = buildVideoSizeVec2(videoWidths, videoHeights, frontVideoIndexNode);
        const videoSizeBack = buildVideoSizeVec2(videoWidths, videoHeights, backVideoIndexNode);

        vCoveredUvFront.assign(coverTextureUv(videoSizeFront, planeSize, globalUV));
        vCoveredUvBack.assign(coverTextureUv(videoSizeBack, planeSize, backGlobalUV));

        return finalPos.add(animatedPos);
    })();

    material.colorNode = Fn(() => {
        const vel = velStorage.element(instanceIndex);
        const factor = vel.length().mul(2).smoothstep(0, 40);
        const videoTransition = uniforms.videoTransition;

        const baseColor = color(0x888888);
        const instColor = color(0xffffff);
        const cPhase = colorPhaseStorage.element(instanceIndex);

        const t = sin(time.mul(Math.PI).mul(cPhase.y).add(cPhase.x)).mul(0.3).add(0.5);
        const mixedColor = mix(baseColor, instColor, t);

        const borderA = smoothstep(0.06, float(0.08).add(float(1.0).sub(t).mul(0.03)), abs(vLocalPos.y));
        const baseRGB = mix(mixedColor.rgb, baseColor.rgb, borderA);

        const frontVideoIndexNode = frontVideoIndexStorage.element(instanceIndex);
        const backVideoIndexNode = backVideoIndexStorage.element(instanceIndex);

        const frontVideoNode = buildVideoTextureNode(videoTextures, frontVideoIndexNode, vCoveredUvFront);
        const backVideoNode = buildVideoTextureNode(videoTextures, backVideoIndexNode, vCoveredUvBack);
        const faceBlend = vNormal.z.mul(float(0.5)).add(float(0.5)).clamp(float(0), float(1));
        const activeVideoNode = mix(backVideoNode, frontVideoNode, faceBlend);

        const finalGridRGB = baseRGB.add(blendScreen(baseRGB, uniforms.trailColor)).clamp(0, 1).mul(0.55);
        const finalVideoRGB = activeVideoNode.rgb.mul(0.5);

        const finalRGB = mix(mix(baseRGB, finalGridRGB, factor), finalVideoRGB, videoTransition);

        return vec4(finalRGB, 1);
    })();

    material.emissiveNode = Fn(() => {
        const videoTransition = uniforms.videoTransition;

        const frontVideoIndexNode = frontVideoIndexStorage.element(instanceIndex);
        const backVideoIndexNode = backVideoIndexStorage.element(instanceIndex);

        const frontVideoNode = buildVideoTextureNode(videoTextures, frontVideoIndexNode, vCoveredUvFront);
        const backVideoNode = buildVideoTextureNode(videoTextures, backVideoIndexNode, vCoveredUvBack);
        const faceBlend = vNormal.z.mul(float(0.5)).add(float(0.5)).clamp(float(0), float(1));
        const activeVideoNode = mix(backVideoNode, frontVideoNode, faceBlend);

        return activeVideoNode.rgb.mul(1.5).mul(videoTransition).mul(0.5);
    })();

    material.mrtNode = mrt({
        bloomIntensity: Fn(() => {
            const cPhase = colorPhaseStorage.element(instanceIndex);
            const t = sin(time.mul(cPhase.y).add(cPhase.x)).mul(0.3);

            return t.mul(uniforms.bloomIntensity.mul(float(2)));
        })(),
    });
}
