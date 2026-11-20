// Displacement map from gentpan/liquidglass renderLensMap().
// R/G = bend around 128, B = rim highlight, A = coverage. Keep the shader in Demo.ts in sync.

export type GlassParams = {
    refraction: number;
    bezel: number;
    curvature: number;
    ior: number;
    chroma: number;
    blur: number;
    specular: number;
    specularWidth: number;
    lightAngle: number;
    invert: boolean;
};

export const GLASS: GlassParams = {
    refraction: 55,
    bezel: 0.23,
    curvature: 3,
    ior: 1.3,
    chroma: 0.13,
    blur: 1.5,
    specular: 0.5,
    specularWidth: 2,
    lightAngle: -120,
    invert: false,
};

const NEUTRAL = 128;
const PROFILE_N = 512;
const profileCache = new Map<string, Float32Array>();

export function profileTable(curvature: number, ior: number): Float32Array {
    const key = `${curvature}|${ior}`;
    const cached = profileCache.get(key);

    if (cached) {
        return cached;
    }

    const table = new Float32Array(PROFILE_N + 1);
    let max = 0;

    for (let i = 0; i <= PROFILE_N; i++) {
        const s = Math.min(i / PROFILE_N, 1 - 1e-6);
        const a = (1 - s) ** curvature;
        const slope = (1 - s) ** (curvature - 1) * Math.max(1 - a, 1e-9) ** (1 / curvature - 1);
        const theta = Math.atan(slope);
        const refracted = Math.asin(Math.sin(theta) / ior);
        const bend = Math.tan(theta - refracted);

        table[i] = bend;

        if (bend > max) {
            max = bend;
        }
    }

    for (let i = 0; i <= PROFILE_N; i++) {
        table[i] /= max || 1;
    }

    table[PROFILE_N] = 0;
    profileCache.set(key, table);

    return table;
}

function rimLight(rim: number, facing: number): number {
    const shade = 0.12 + 0.88 * (facing > 0 ? facing : -0.4 * facing);

    return NEUTRAL + Math.round(127 * Math.min(1, rim * shade));
}

export function fillLensMap(
    pixels: Uint8ClampedArray,
    mapW: number,
    mapH: number,
    cssW: number,
    cssH: number,
    radius: number,
    glass: GlassParams = GLASS,
): void {
    const sx = cssW / mapW;
    const sy = cssH / mapH;
    const hw = cssW / 2;
    const hh = cssH / 2;
    const r = Math.max(0, Math.min(radius, hw, hh));
    const bezel = Math.max(0.5, glass.bezel * Math.min(hw, hh));
    const table = profileTable(glass.curvature, glass.ior);
    const n = table.length - 1;
    const rimWidth = Math.max(0.5, glass.specularWidth);
    const aa = Math.max(sx, sy);
    const angle = (glass.lightAngle * Math.PI) / 180;
    const lx = Math.cos(angle);
    const ly = Math.sin(angle);
    const qw = Math.ceil(mapW / 2);
    const qh = Math.ceil(mapH / 2);

    const write = (index: number, red: number, green: number, blue: number, alpha: number) => {
        const offset = index * 4;

        pixels[offset] = red;
        pixels[offset + 1] = green;
        pixels[offset + 2] = blue;
        pixels[offset + 3] = alpha;
    };

    for (let j = 0; j < qh; j++) {
        const y = (j + 0.5) * sy - hh;

        for (let i = 0; i < qw; i++) {
            const x = (i + 0.5) * sx - hw;
            const qx = -x - (hw - r);
            const qy = -y - (hh - r);
            const ox = Math.max(qx, 0);
            const oy = Math.max(qy, 0);
            const corner = Math.hypot(ox, oy);
            const dist = corner + Math.min(Math.max(qx, qy), 0) - r;
            const alpha = Math.min(1, Math.max(0, 0.5 - dist / aa));

            if (alpha <= 0) {
                continue;
            }

            let nx: number;
            let ny: number;

            if (qx > 0 && qy > 0) {
                nx = ox / corner;
                ny = oy / corner;
            } else if (qx > qy) {
                nx = 1;
                ny = 0;
            } else {
                nx = 0;
                ny = 1;
            }

            const inset = Math.max(0, -dist);
            const s = inset / bezel;
            const m = s >= 1 ? 0 : table[Math.min(n, Math.round(s * n))];
            const dir = glass.invert ? -1 : 1;
            const bx = Math.round(127 * m * nx * dir);
            const by = Math.round(127 * m * ny * dir);
            const crisp = Math.max(0, 1 - inset / rimWidth);
            const glow = Math.max(0, 1 - inset / (rimWidth * 5));
            const rim = glass.specular * (crisp * crisp + 0.3 * glow * glow);
            const a = Math.round(alpha * 255);
            const i2 = mapW - 1 - i;
            const j2 = mapH - 1 - j;

            write(j * mapW + i, NEUTRAL + bx, NEUTRAL + by, rimLight(rim, -nx * lx - ny * ly), a);

            if (i2 !== i) {
                write(j * mapW + i2, NEUTRAL - bx, NEUTRAL + by, rimLight(rim, nx * lx - ny * ly), a);
            }

            if (j2 !== j) {
                write(j2 * mapW + i, NEUTRAL + bx, NEUTRAL - by, rimLight(rim, -nx * lx + ny * ly), a);
            }

            if (i2 !== i && j2 !== j) {
                write(j2 * mapW + i2, NEUTRAL - bx, NEUTRAL - by, rimLight(rim, nx * lx + ny * ly), a);
            }
        }
    }
}
