import { BackgroundScene } from './modules/BackgroundScene.js';
import { GradientShader } from './modules/GradientShader.js';
import { ParticleSystem } from './modules/ParticleSystem.js';
import { NetworkLayer } from './modules/NetworkLayer.js';
import { MouseController } from './modules/MouseController.js';
import { PerformanceManager } from './modules/PerformanceManager.js';
import { AnimationLoop } from './modules/AnimationLoop.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('dynamic-bg');
    if (!canvas) return;

    try {
        // 1. Inicializar escena base, cámara y renderizador WebGL
        const scene = new BackgroundScene(canvas);

        // 2. Cargar el shader del gradiente fluido de fondo
        const shader = new GradientShader(scene.scene);

        // 3. Crear el sistema de partículas tridimensionales
        const particles = new ParticleSystem(scene.scene);

        // 4. Crear la capa de conexiones (red neuronal)
        const network = new NetworkLayer(scene.scene);

        // 5. Instanciar controladores de interacción y rendimiento
        const mouse = new MouseController();
        const performanceMgr = new PerformanceManager();

        // 6. Iniciar el bucle coordinado de animación
        const loop = new AnimationLoop(scene, shader, particles, network, mouse, performanceMgr);
        loop.start();

        // Guardar referencia para control de ciclo de vida
        window.dynamicBgInstance = {
            scene,
            shader,
            particles,
            network,
            mouse,
            performanceMgr,
            loop,
            destroy() {
                loop.dispose();
                performanceMgr.dispose();
                mouse.dispose();
                network.dispose();
                particles.dispose();
                shader.dispose();
                scene.dispose();
                console.log("Fondo dinámico destruido y recursos liberados.");
            }
        };

        console.log("Fondo dinámico WebGL inicializado con éxito.");
    } catch (error) {
        console.error("No se pudo iniciar el fondo WebGL: ", error);
        
        // Mecanismo de contingencia: Si falla WebGL, ocultamos el canvas
        canvas.style.display = 'none';
    }
});
