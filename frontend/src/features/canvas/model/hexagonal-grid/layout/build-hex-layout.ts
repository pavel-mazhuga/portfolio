import { uniform } from 'three/tsl';
import type { UniformNode } from 'three/webgpu';
import { Vector2, Vector3 } from 'three/webgpu';
import { GRID_SPACING_FACTOR, HEX_RADIUS, centralRegionDimensions } from '../constants';
import type { GridLayout } from '../types';

export type HexLayoutResult = {
    instCount: number;
    colorPhaseData: Float32Array;
    rotationPhaseData: Float32Array;
    uCentralWidth: UniformNode<'float', number>;
    uCentralHeight: UniformNode<'float', number>;
    targetAngleData: Float32Array;
    frontVideoIndexData: Float32Array;
    backVideoIndexData: Float32Array;
    isCentralData: Float32Array;
    initialPositionsData: Float32Array;
    maxDist: number;
    minDistNonCentral: number;
};

export function buildHexLayout(viewportSize: Vector2, hexRadius: number = HEX_RADIUS): HexLayoutResult {
    const halfW = viewportSize.x * 0.5;
    const halfH = viewportSize.y * 0.5;
    const halfDiagonal = Math.hypot(halfW, halfH);

    const unit = Math.sqrt(3) * hexRadius * GRID_SPACING_FACTOR;
    const apothemStep = unit * (Math.sqrt(3) / 2);

    const ringsForX = (halfW + hexRadius) / apothemStep;
    const ringsForY = (halfH + hexRadius) / apothemStep;
    const ringsForCorners = (halfDiagonal + hexRadius) / apothemStep;
    const circleCount = Math.max(1, Math.ceil(Math.max(ringsForX, ringsForY, ringsForCorners)));
    const instCount = ((circleCount * (circleCount + 1)) / 2) * 6 + 1;

    const { width: centralWidth, height: centralHeight } = centralRegionDimensions(viewportSize.x, viewportSize.y);

    const uCentralWidth = uniform(centralWidth);
    const uCentralHeight = uniform(centralHeight);

    const targetAngleData = new Float32Array(instCount);
    const frontVideoIndexData = new Float32Array(instCount);
    const backVideoIndexData = new Float32Array(instCount);
    const isCentralData = new Float32Array(instCount);
    const initialPositionsData = new Float32Array(instCount * 3);

    const colorPhaseData = new Float32Array(instCount * 2);
    const rotationPhaseData = new Float32Array(instCount * 3);

    const angle = Math.PI / 3;
    const axis = new Vector3(0, 0, 1);
    const axisVector = new Vector3(0, -unit, 0);
    const sideVector = new Vector3(0, unit, 0).applyAxisAngle(axis, -angle);
    const tempVec = new Vector3();

    let counter = 0;

    const setData = (pos: Vector3) => {
        initialPositionsData[counter * 3 + 0] = pos.x;
        initialPositionsData[counter * 3 + 1] = pos.y;
        initialPositionsData[counter * 3 + 2] = pos.z;

        const isCentral = Math.abs(pos.x) < centralWidth / 2 && Math.abs(pos.y) < centralHeight / 2;

        isCentralData[counter] = isCentral ? 1 : 0;

        colorPhaseData[counter * 2 + 0] = Math.random() * Math.PI * 2;
        colorPhaseData[counter * 2 + 1] = Math.random() * 0.5 + 1.0;

        rotationPhaseData[counter * 3 + 0] = 0;
        rotationPhaseData[counter * 3 + 1] = 0;
        rotationPhaseData[counter * 3 + 2] = 0;

        targetAngleData[counter] = 0;
        frontVideoIndexData[counter] = 0;
        backVideoIndexData[counter] = 1;

        counter++;
    };

    for (let seg = 0; seg < 6; seg++) {
        for (let ax = 1; ax <= circleCount; ax++) {
            for (let sd = 0; sd < ax; sd++) {
                tempVec
                    .copy(axisVector)
                    .multiplyScalar(ax)
                    .addScaledVector(sideVector, sd)
                    .applyAxisAngle(axis, angle * seg + Math.PI / 6);
                setData(tempVec);
            }
        }
    }

    setData(new Vector3());

    let maxDist = 0;
    let minDistNonCentral = Infinity;

    for (let i = 0; i < instCount; i++) {
        const x = initialPositionsData[i * 3 + 0];
        const y = initialPositionsData[i * 3 + 1];
        const d = Math.sqrt(x * x + y * y);

        if (d > maxDist) maxDist = d;

        if (isCentralData[i] < 0.5) {
            if (d < minDistNonCentral) minDistNonCentral = d;
        }
    }

    if (minDistNonCentral === Infinity) minDistNonCentral = 0;

    return {
        instCount,
        colorPhaseData,
        rotationPhaseData,
        uCentralWidth,
        uCentralHeight,
        targetAngleData,
        frontVideoIndexData,
        backVideoIndexData,
        isCentralData,
        initialPositionsData,
        maxDist,
        minDistNonCentral,
    };
}

export function hexLayoutToGridLayout(layout: HexLayoutResult): GridLayout {
    return {
        instCount: layout.instCount,
        colorPhaseData: layout.colorPhaseData,
        rotationPhaseData: layout.rotationPhaseData,
        uCentralWidth: layout.uCentralWidth,
        uCentralHeight: layout.uCentralHeight,
    };
}
