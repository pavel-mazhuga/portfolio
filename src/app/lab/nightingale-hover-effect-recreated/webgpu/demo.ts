import { animate } from 'framer-motion';
import { ShaderNodeObject, positionLocal, texture, uniform, vec2 } from 'three/tsl';
import {
    ACESFilmicToneMapping,
    Color,
    Mesh,
    Node,
    NodeMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    SRGBColorSpace,
    Scene,
    Texture,
    TextureLoader,
    UniformNode,
    Vector2,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { effectColorNode, effectPositionNode } from './effect';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    geometry: PlaneGeometry;
    material: NodeMaterial;
    mesh: Mesh;
    textures: {
        texture: Texture;
        naturalSize: ShaderNodeObject<UniformNode<ShaderNodeObject<Node>>>;
    }[];

    isAnimating = false;

    tweakPane = new Pane();

    params = {
        speed: 10,
        frequency: 7.5,
        amplitude: 0.3,
        transitionDuration: 1,
    };

    uniforms = {
        uActiveTexture: texture(new Texture()),
        uActiveTextureNaturalSize: uniform(vec2()),
        uNextTexture: texture(new Texture()),
        uNextTextureNaturalSize: uniform(vec2()),
        uProgress: uniform(0),
        uSpeed: uniform(this.params.speed),
        uFrequency: uniform(this.params.frequency),
        uAmplitude: uniform(this.params.amplitude),
    };

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onCanvasClick = this.onCanvasClick.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();
        this.scene.background = new Color('#1b1b1b');

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
        this.camera.position.z = 1.8;

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
            const texture = textureLoader.load(obj.src, (t) => {
                this.textures[i].naturalSize.value.x = t.image.naturalWidth;
                this.textures[i].naturalSize.value.y = t.image.naturalHeight;
            });
            texture.colorSpace = SRGBColorSpace;

            return { texture, naturalSize: uniform(vec2()) };
        });

        const getNextIndex = (activeIndex: number) => {
            const restIndices = Array(this.textures.length)
                .fill('')
                .map((_, i) => i)
                .filter((i) => i !== activeIndex);
            return restIndices[Math.floor(Math.random() * restIndices.length)];
        };

        const initialIndex = 0;
        const activeTexture = this.textures[initialIndex];
        this.uniforms.uActiveTexture.value = activeTexture.texture;
        this.uniforms.uActiveTextureNaturalSize.value = vec2(activeTexture.naturalSize);

        const nextTexture = this.textures[getNextIndex(initialIndex)];
        this.uniforms.uNextTexture.value = nextTexture.texture;
        this.uniforms.uNextTextureNaturalSize.value = vec2(nextTexture.naturalSize);

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
            currentTextureNaturalSize: vec2(activeTexture.naturalSize),
            nextTexture: this.uniforms.uNextTexture,
            nextTextureNaturalSize: activeTexture.naturalSize,
            progress: this.uniforms.uProgress,
        });

        this.mesh = new Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        this.#initEvents();
        this.#initTweakPane();
        this.renderer.setAnimationLoop(this.render);
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 2);
    }

    get #activeIndex() {
        return this.textures.findIndex((t) => t.texture === this.uniforms.uActiveTexture.value);
    }

    #getNextIndex(activeIndex: number) {
        const restIndices = Array(this.textures.length)
            .fill('')
            .map((_, i) => i)
            .filter((i) => i !== activeIndex);
        return restIndices[Math.floor(Math.random() * restIndices.length)];
    }

    private onCanvasClick() {
        if (this.isAnimating) return;

        const activeTexture = this.textures[this.#activeIndex];
        this.uniforms.uActiveTexture.value = activeTexture.texture;
        this.uniforms.uActiveTextureNaturalSize.value = vec2(activeTexture.naturalSize);

        animate(this.uniforms.uProgress.value, 1, {
            duration: this.params.transitionDuration,
            onPlay: () => {
                this.isAnimating = true;
            },
            onUpdate: (val) => {
                this.uniforms.uProgress.value = val;
            },
            onComplete: () => {
                this.isAnimating = false;
                this.uniforms.uProgress.value = 0;
                this.uniforms.uActiveTexture.value = this.uniforms.uNextTexture.value;

                const nextTexture = this.textures[this.#getNextIndex(this.#activeIndex)];
                this.uniforms.uNextTexture.value = nextTexture.texture;
                this.uniforms.uNextTextureNaturalSize.value = vec2(nextTexture.naturalSize);
            },
        });
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    #initEvents() {
        this.canvas.addEventListener('click', this.onCanvasClick);
        window.addEventListener('resize', this.onWindowResize);
    }

    #destroyEvents() {
        this.canvas.removeEventListener('click', this.onCanvasClick);
        window.removeEventListener('resize', this.onWindowResize);
    }

    #initTweakPane() {
        this.tweakPane = new Pane();

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

    #destroyTweakPane() {
        this.tweakPane.dispose();
    }

    async render() {
        await this.renderer.renderAsync(this.scene, this.camera);
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
        this.textures.forEach((texture) => texture.texture.dispose());
        this.#destroyEvents();
        this.#destroyTweakPane();
        this.renderer.dispose();
    }
}

export default Demo;
