import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.texture = this.createCircleTexture();

        // Configuración de capas
        this.layers = [
            {
                count: 250,      // Capa lejana (más cantidad, más lentas, más pequeñas)
                size: 0.8,
                speedMultiplier: 0.15,
                depth: -15,      // Ubicación en Z
                spreadX: 80,
                spreadY: 50,
                spreadZ: 10
            },
            {
                count: 60,       // Capa cercana (menos cantidad, más rápidas, más grandes)
                size: 2.2,
                speedMultiplier: 0.35,
                depth: 5,        // Ubicación en Z
                spreadX: 60,
                spreadY: 40,
                spreadZ: 8
            }
        ];

        this.pointsList = [];
        this.init();
    }

    createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Gradiente radial para simular un glow suave de partícula
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        return texture;
    }

    init() {
        this.layers.forEach((layer, layerIdx) => {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(layer.count * 3);
            const colors = new Float32Array(layer.count * 3);
            const velocities = [];

            // Paleta de colores futuristas
            const palette = [
                new THREE.Color(0x00f0ff), // Cian
                new THREE.Color(0x10b981), // Esmeralda
                new THREE.Color(0xffffff), // Blanco
                new THREE.Color(0xef4444)  // Rojo sutil (pocas veces)
            ];

            for (let i = 0; i < layer.count; i++) {
                // Coordenadas iniciales
                positions[i * 3] = (Math.random() - 0.5) * layer.spreadX;
                positions[i * 3 + 1] = (Math.random() - 0.5) * layer.spreadY;
                positions[i * 3 + 2] = layer.depth + (Math.random() - 0.5) * layer.spreadZ;

                // Color aleatorio
                let color;
                const rng = Math.random();
                if (layerIdx === 0) {
                    // Capa lejana: mayormente blanco y cian suave
                    color = rng > 0.6 ? palette[0] : palette[2];
                } else {
                    // Capa cercana: cian, esmeralda, algún rojo ocasional
                    if (rng > 0.96) color = palette[3]; // Rojo sutil
                    else if (rng > 0.5) color = palette[0]; // Cian
                    else if (rng > 0.25) color = palette[1]; // Esmeralda
                    else color = palette[2]; // Blanco
                }

                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;

                // Velocidad
                velocities.push({
                    x: (Math.random() - 0.5) * 0.04 * layer.speedMultiplier,
                    y: (Math.random() - 0.5) * 0.04 * layer.speedMultiplier,
                    driftSpeed: 0.1 + Math.random() * 0.4
                });
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: layer.size,
                vertexColors: true,
                map: this.texture,
                transparent: true,
                opacity: layerIdx === 0 ? 0.45 : 0.85,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const points = new THREE.Points(geometry, material);
            this.scene.add(points);

            this.pointsList.push({
                points,
                geometry,
                material,
                velocities,
                layerInfo: layer
            });
        });
    }

    update(time, mouseX, mouseY) {
        this.pointsList.forEach((layerObj) => {
            const positions = layerObj.geometry.attributes.position.array;
            const velocities = layerObj.velocities;
            const layer = layerObj.layerInfo;

            // Suave empuje del mouse (Parallax)
            const targetX = mouseX * 4.5 * (layer.depth / -15);
            const targetY = mouseY * 3.5 * (layer.depth / -15);
            
            layerObj.points.position.x += (targetX - layerObj.points.position.x) * 0.06;
            layerObj.points.position.y += (targetY - layerObj.points.position.y) * 0.06;

            for (let i = 0; i < layer.count; i++) {
                // Movimiento base constante
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;

                // Movimiento orgánico senoidal (drift)
                positions[i * 3 + 1] += Math.sin(time * velocities[i].driftSpeed + i) * 0.003;

                // Límites de pantalla (si se salen por los bordes, reaparecen en el opuesto)
                const boundX = layer.spreadX / 2;
                const boundY = layer.spreadY / 2;

                if (positions[i * 3] < -boundX) positions[i * 3] = boundX;
                if (positions[i * 3] > boundX) positions[i * 3] = -boundX;
                if (positions[i * 3 + 1] < -boundY) positions[i * 3 + 1] = boundY;
                if (positions[i * 3 + 1] > boundY) positions[i * 3 + 1] = -boundY;
            }

            layerObj.geometry.attributes.position.needsUpdate = true;
        });
    }

    // Adaptación dinámica de partículas basada en rendimiento (PerformanceManager)
    adjustQuality(scaleFactor) {
        this.pointsList.forEach((layerObj) => {
            const count = Math.floor(layerObj.layerInfo.count * scaleFactor);
            layerObj.geometry.setDrawRange(0, count);
        });
    }

    dispose() {
        this.pointsList.forEach((layerObj) => {
            this.scene.remove(layerObj.points);
            layerObj.geometry.dispose();
            layerObj.material.dispose();
        });
        this.texture.dispose();
    }
}
