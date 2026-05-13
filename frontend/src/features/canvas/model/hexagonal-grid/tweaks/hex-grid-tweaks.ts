import type { FolderApi } from 'tweakpane';
import type { HexGridShaderUniforms } from '../types';

export function setupHexGridTweaks(folder: FolderApi, uniforms: HexGridShaderUniforms): void {
    folder.addBinding(uniforms.trailColor, 'value', {
        label: 'Trail Color',
    });
    folder.addBinding(uniforms.bloomIntensity, 'value', {
        label: 'Bloom Intensity',
        min: 0,
        max: 10,
    });
    folder.addBinding(uniforms.cursorRadius, 'value', {
        label: 'Cursor Radius',
        min: 0,
        max: 20,
    });
    folder.addBinding(uniforms.cursorStrength, 'value', {
        label: 'Cursor Strength',
        min: 0,
        max: 100,
    });
    folder.addBinding(uniforms.damping, 'value', {
        label: 'Damping',
        min: 0,
        max: 20,
    });
    folder.addBinding(uniforms.attractionStrength, 'value', {
        label: 'Attraction',
        min: 0,
        max: 2,
    });
    folder.addBinding(uniforms.flipSpeed, 'value', {
        label: 'Flip Speed',
        min: 0.1,
        max: 20,
    });
}
