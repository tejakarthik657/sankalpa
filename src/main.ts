import './style.css';
import { SceneManager } from './lib/SceneManager';
import { AssetLoader } from './lib/AssetLoader';
import { ActManager } from './lib/ActManager';

class Application {
    constructor() {
        this.init();
    }

    private async init() {
        const container = document.getElementById('app-container') as HTMLDivElement;
        const loaderScreen = document.getElementById('loader-screen')!;
        const loadingText = document.querySelector('.loading-text') as HTMLElement;
        
        const assetLoader = new AssetLoader((_url, loaded, total) => {
            const progress = Math.round((loaded / total) * 100);
            loadingText.innerText = `Aligning the Cosmos... ${progress}%`;
        });
        
        const assets = await assetLoader.load();
        
        loaderScreen.classList.add('hidden');
        
        const sceneManager = new SceneManager(container);
        const actManager = new ActManager(sceneManager, assets);
        
        sceneManager.startRenderLoop((delta, elapsedTime) => {
            actManager.update(delta, elapsedTime);
        });

        actManager.startAct1();
    }
}

new Application();