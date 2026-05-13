# Advanced TSL Raymarching Patterns

## 1. Domain Repetition (Infinite Grid)

Cheaply tile space using `mod` — effectively infinite copies of one SDF with a single evaluation.

```js
const opRepeat = Fn(([p, s]) => {
    // Tile every s units in XZ
    const q = mod(p.add(s.mul(0.5)), s).sub(s.mul(0.5));
    return sceneSDF(vec3(q.x, p.y, q.z)); // keep Y unmodified
});
```

## 2. Soft Shadows via Shadow Marching

```js
const calcSoftShadow = Fn(([ro, rd, mint, maxt, k]) => {
    const res = float(1.0).toVar();
    const t = mint.toVar();

    Loop({ start: 0, end: 32, type: 'int' }, () => {
        const h = sceneSDF(ro.add(rd.mul(t)));
        res.assign(min(res, k.mul(h).div(t)));
        t.addAssign(clamp(h, float(0.01), float(0.5)));
        If(h.lessThan(0.001).or(t.greaterThan(maxt)), () => {
            Break();
        });
    });

    return clamp(res, float(0), float(1));
});
```

## 3. Ambient Occlusion (AO)

```js
const calcAO = Fn(([pos, nor]) => {
    const occ = float(0).toVar();
    const sca = float(1).toVar();

    Loop({ start: 0, end: 5, type: 'int', condition: 'i' }, ({ i }) => {
        const h = float(0.01).add(float(0.12).mul(float(i).div(4)));
        const d = sceneSDF(pos.add(nor.mul(h)));
        occ.addAssign(h.sub(d).mul(sca));
        sca.mulAssign(float(0.95));
    });

    return clamp(float(1).sub(float(3).mul(occ)), float(0), float(1));
});
```

## 4. Using `uniform()` for Interactive Parameters

```js
import { uniform } from 'three/tsl';

const uBlend = uniform(0.3); // smoothing radius for metaballs
const uSpeed = uniform(1.0); // animation speed multiplier

// In the SDF:
const animTime = time.mul(uSpeed);

// From JavaScript (e.g., via dat.GUI or slider):
document.getElementById('blend').addEventListener('input', (e) => {
    uBlend.value = parseFloat(e.target.value);
});
```

## 5. Post-processing with TSL (BloomNode)

```js
import { bloom } from 'three/tsl';
import { PostProcessing } from 'three/webgpu';

const postProcessing = new PostProcessing(renderer);
const scenePass = pass(scene, camera);
postProcessing.outputNode = bloom(scenePass, 0.3, 0.5, 0.9);

// In render loop:
renderer.setAnimationLoop(() => {
    postProcessing.render();
});
```

## 6. Half-Resolution Render Target (Performance)

For complex scenes, render at half resolution and upscale:

```js
// Blit to screen via a second fullscreen quad
import { screenUV, texture } from 'three/tsl';

const halfW = Math.floor(window.innerWidth / 2);
const halfH = Math.floor(window.innerHeight / 2);
const rt = new THREE.RenderTarget(halfW, halfH);

// Render low-res pass
renderer.setRenderTarget(rt);
renderer.render(lowResScene, camera);
renderer.setRenderTarget(null);

const blitMat = new THREE.MeshBasicNodeMaterial();
blitMat.colorNode = texture(rt.texture, screenUV);
```

## 7. Useful SDF Deformations

```js
// Twist along Y axis
const opTwist = Fn(([p, k]) => {
    const a = sin(k.mul(p.y));
    const b = cos(k.mul(p.y));
    const q = vec3(b.mul(p.x).sub(a.mul(p.z)), p.y, a.mul(p.x).add(b.mul(p.z)));
    return sdBox(q, vec3(0.4, 0.8, 0.4));
});

// Displacement (adds detail at cost of accuracy — reduce step size)
const opDisplace = Fn(([p]) => {
    const d1 = sdSphere(p, float(0.5));
    const d2 = sin(p.x.mul(5))
        .mul(sin(p.y.mul(5)))
        .mul(sin(p.z.mul(5)))
        .mul(0.1);
    return d1.add(d2);
});
// ⚠️ When using displacement, reduce HIT_DIST or add a lipschitz correction factor
```

## 8. Performance Checklist for Production

- [ ] `MAX_STEPS` ≤ 64 (48 for mobile targets)
- [ ] `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`
- [ ] SDF primitive count ≤ 8 (each smooth-union adds complexity)
- [ ] Normal calc only when hit (wrap in `If(hit, ...)`)
- [ ] No nested `Fn` calls inside `Loop` body — define helpers outside
- [ ] Use `select(cond, a, b)` instead of `If/Else` for simple expressions
- [ ] Profile with Chrome DevTools GPU timeline if dropping below 30fps
