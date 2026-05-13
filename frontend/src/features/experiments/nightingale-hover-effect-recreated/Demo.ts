import gsap from 'gsap';
import { positionLocal, texture, uniform, vec2 } from 'three/tsl';
import {
    Color,
    Mesh,
    NodeMaterial,
    PlaneGeometry,
    SRGBColorSpace,
    Texture,
    TextureLoader,
    UniformNode,
    Vector2,
} from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import { effectColorNode, effectPositionNode } from './effect';

type TextureSlot = {
    texture: Texture;
    naturalSize: UniformNode<'vec2', Vector2>;
};

class Demo extends BaseExperience {
    geometry: PlaneGeometry;
    material: NodeMaterial;
    mesh: Mesh;
    textures: TextureSlot[];

    isAnimating = false;
    private progressTween?: gsap.core.Tween;

    params = {
        speed: 10,
        frequency: 7.5,
        amplitude: 0.3,
        transitionDuration: 1,
    };

    uniforms = {
        uActiveTexture: texture(new Texture()),
        uActiveTextureNaturalSize: uniform(new Vector2(0, 0)),
        uNextTexture: texture(new Texture()),
        uNextTextureNaturalSize: uniform(new Vector2(0, 0)),
        uProgress: uniform(0),
        uSpeed: uniform(this.params.speed),
        uFrequency: uniform(this.params.frequency),
        uAmplitude: uniform(this.params.amplitude),
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { antialias: true });

        this.scene.background = new Color('#1b1b1b');

        this.camera.fov = 45;
        this.camera.position.z = 1.8;
        this.camera.updateProjectionMatrix();

        const planeSize = new Vector2(0.7, 1);

        this.geometry = new PlaneGeometry(planeSize.x, planeSize.y, 32, 32);
        this.material = new NodeMaterial();

        const textureLoader = new TextureLoader();

        this.textures = [
            {
                src: 'https://images.unsplash.com/photo-1530090382228-7195e08d7a75?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fDl4MTYlMjBkYXJrfGVufDB8fDB8fHww',
            },
            {
                src: 'https://images.unsplash.com/photo-1535905496755-26ae35d0ae54?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fDl4MTYlMjBkYXJrfGVufDB8fDB8fHww',
            },
            {
                src: 'https://images.unsplash.com/photo-1488730792340-bdc88feffb98?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fDl4MTYlMjBkYXJrfGVufDB8fDB8fHww',
            },
            {
                src: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fDl4MTYlMjBkYXJrfGVufDB8fDB8fHww',
            },
            {
                src: 'https://images.unsplash.com/photo-1577892210326-4b00a7a9cb47?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fDl4MTYlMjBkYXJrfGVufDB8fDB8fHww',
            },
        ].map((obj, i) => {
            const tex = textureLoader.load(obj.src, (t) => {
                const slot = this.textures[i];

                slot.naturalSize.value.set(t.image.naturalWidth, t.image.naturalHeight);
                this.#syncDisplayNaturalSizeFromSlot(slot);
            });

            tex.colorSpace = SRGBColorSpace;

            return { texture: tex, naturalSize: uniform(new Vector2(0, 0)) };
        });

        const initialIndex = 0;
        const activeTexture = this.textures[initialIndex];

        this.uniforms.uActiveTexture.value = activeTexture.texture;
        this.uniforms.uActiveTextureNaturalSize.value.copy(activeTexture.naturalSize.value);

        const nextTexture = this.textures[this.#getNextIndex(initialIndex)];

        this.uniforms.uNextTexture.value = nextTexture.texture;
        this.uniforms.uNextTextureNaturalSize.value.copy(nextTexture.naturalSize.value);

        this.material.positionNode = effectPositionNode({
            position: positionLocal,
            progress: this.uniforms.uProgress,
            frequency: this.uniforms.uFrequency,
            speed: this.uniforms.uSpeed,
            amplitude: this.uniforms.uAmplitude,
        });

        this.material.colorNode = effectColorNode({
            planeSize: vec2(planeSize),
            currentTexture: this.uniforms.uActiveTexture,
            currentTextureNaturalSize: this.uniforms.uActiveTextureNaturalSize,
            nextTexture: this.uniforms.uNextTexture,
            nextTextureNaturalSize: this.uniforms.uNextTextureNaturalSize,
            progress: this.uniforms.uProgress,
        });

        this.mesh = new Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        this.initTweakPane();
        this.canvas.addEventListener('click', this.onCanvasClick);
    }

    private readonly onCanvasClick = () => {
        if (this.isAnimating) return;

        const activeTexture = this.textures[this.#activeIndex];

        this.uniforms.uActiveTexture.value = activeTexture.texture;
        this.uniforms.uActiveTextureNaturalSize.value.copy(activeTexture.naturalSize.value);

        const nextSlot = this.textures.find((s) => s.texture === this.uniforms.uNextTexture.value);

        if (nextSlot) {
            this.uniforms.uNextTextureNaturalSize.value.copy(nextSlot.naturalSize.value);
        }

        this.progressTween?.kill();
        this.progressTween = gsap.to(this.uniforms.uProgress, {
            value: 1,
            duration: this.params.transitionDuration,
            ease: 'sine.inOut',
            onStart: () => {
                this.isAnimating = true;
            },
            onComplete: () => {
                this.isAnimating = false;
                this.uniforms.uProgress.value = 0;
                this.uniforms.uActiveTexture.value = this.uniforms.uNextTexture.value;
                this.uniforms.uActiveTextureNaturalSize.value.copy(this.uniforms.uNextTextureNaturalSize.value);

                const nextTexture = this.textures[this.#getNextIndex(this.#activeIndex)];

                this.uniforms.uNextTexture.value = nextTexture.texture;
                this.uniforms.uNextTextureNaturalSize.value.copy(nextTexture.naturalSize.value);
                this.progressTween = undefined;
            },
        });
    };

    #syncDisplayNaturalSizeFromSlot(slot: TextureSlot) {
        if (slot.texture === this.uniforms.uActiveTexture.value) {
            this.uniforms.uActiveTextureNaturalSize.value.copy(slot.naturalSize.value);
        }

        if (slot.texture === this.uniforms.uNextTexture.value) {
            this.uniforms.uNextTextureNaturalSize.value.copy(slot.naturalSize.value);
        }
    }

    get #activeIndex() {
        return this.textures.findIndex((t) => t.texture === this.uniforms.uActiveTexture.value);
    }

    #getNextIndex(activeIndex: number) {
        const restIndices = Array.from({ length: this.textures.length }, (_, idx) => idx).filter(
            (idx) => idx !== activeIndex,
        );

        return restIndices[Math.floor(Math.random() * restIndices.length)];
    }

    protected override destroyEvents() {
        this.canvas.removeEventListener('click', this.onCanvasClick);
        super.destroyEvents();
    }

    protected override initTweakPane() {
        super.initTweakPane();

        if (!this.tweakPane) return;

        this.tweakPane.addBinding(this.params, 'speed', { min: 0, max: 15, step: 0.01 }).on('change', (event) => {
            this.uniforms.uSpeed.value = event.value;
        });

        this.tweakPane.addBinding(this.params, 'amplitude', { min: 0, max: 1, step: 0.01 }).on('change', (event) => {
            this.uniforms.uAmplitude.value = event.value;
        });

        this.tweakPane.addBinding(this.params, 'frequency', { min: 0, max: 10, step: 0.01 }).on('change', (event) => {
            this.uniforms.uFrequency.value = event.value;
        });

        this.tweakPane.addBinding(this.params, 'transitionDuration', { min: 0.3, max: 10, step: 0.01 });
    }

    override destroy() {
        this.progressTween?.kill();
        this.progressTween = undefined;

        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
        this.textures.forEach((t) => t.texture.dispose());

        super.destroy();
    }
}

export default Demo;
