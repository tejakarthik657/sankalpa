// AssetLoader.ts
// ...existing code...
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
// @ts-ignore
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export interface Assets {
    ganeshaModel: THREE.Group;
    environmentMap: THREE.DataTexture;
    planetTextures: { [key: string]: THREE.Texture };
    particleTextures: { [key: string]: THREE.Texture };
}

export class AssetLoader {
    private manager = new THREE.LoadingManager();

    constructor(onProgress: (url: string, loaded: number, total: number) => void) {
        this.manager.onProgress = onProgress;
    }

    public async load(): Promise<Assets> {
        const gltfLoader = new GLTFLoader(this.manager);
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        gltfLoader.setDRACOLoader(dracoLoader);
        
        const exrLoader = new EXRLoader(this.manager);
        const textureLoader = new THREE.TextureLoader(this.manager);

        const results = await Promise.all([
            gltfLoader.loadAsync('/models/ganesha/scene.gltf'),
            exrLoader.loadAsync('/textures/environment.exr'),
            textureLoader.loadAsync('/textures/planets/2k_sun.jpg'),
            textureLoader.loadAsync('/textures/planets/2k_mercury.jpg'),
            textureLoader.loadAsync('/textures/planets/2k_venus_surface.jpg'),
            textureLoader.loadAsync('/textures/planets/2k_earth_daymap.jpg'),
            textureLoader.loadAsync('/textures/planets/2k_mars.jpg'),
            textureLoader.loadAsync('/textures/planets/2k_jupiter.jpg'),
            textureLoader.loadAsync('/textures/particles/spark.png'),
            textureLoader.loadAsync('/textures/particles/petal.png'),
        ]);
        const ganeshaGltf = results[0];
        const envMap = results[1];
        const planetTexArray = results.slice(2, 8);
        const particleTexArray = results.slice(8);

        const planetNames = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter'];
        const planetTextures = planetTexArray.reduce((acc, tex, i) => {
            if (tex instanceof THREE.Texture) {
                acc[planetNames[i]] = tex;
            }
            return acc;
        }, {} as { [key: string]: THREE.Texture });

        const particleNames = ['spark', 'petal'];
        const particleTextures = particleTexArray.reduce((acc, tex, i) => {
            if (tex instanceof THREE.Texture) {
                acc[particleNames[i]] = tex;
            }
            return acc;
        }, {} as { [key: string]: THREE.Texture });

        envMap.mapping = THREE.EquirectangularReflectionMapping;

        return {
            ganeshaModel: ganeshaGltf.scene,
            environmentMap: envMap,
            planetTextures,
            particleTextures,
        };
    }
}