import * as THREE from 'three';

export class NetworkLayer {
    constructor(scene) {
        this.scene = scene;
        this.maxConnections = 120; // Límite para control de rendimiento
        this.maxDistance = 8.5;    // Distancia máxima para trazar conexión

        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.maxConnections * 2 * 3); // 2 puntos por línea, 3 coords
        this.colors = new Float32Array(this.maxConnections * 2 * 3);

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        this.material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            linewidth: 1 // Nota: Los navegadores modernos limitan esto a 1px por especificación WebGL
        });

        this.lineSegments = new THREE.LineSegments(this.geometry, this.material);
        this.scene.add(this.lineSegments);
    }

    update(particleSystem) {
        // Enlazar con las partículas de la capa cercana (índice 1 en nuestro ParticleSystem)
        const nearLayer = particleSystem.pointsList[1];
        if (!nearLayer) return;

        const particlePositions = nearLayer.geometry.attributes.position.array;
        const count = nearLayer.geometry.attributes.position.count;
        
        // Ajustar paralaje heredado de la capa cercana
        this.lineSegments.position.copy(nearLayer.points.position);

        let lineIndex = 0;

        // Búsqueda de parejas cercanas
        for (let i = 0; i < count; i++) {
            if (lineIndex >= this.maxConnections) break;

            const ix = particlePositions[i * 3];
            const iy = particlePositions[i * 3 + 1];
            const iz = particlePositions[i * 3 + 2];

            for (let j = i + 1; j < count; j++) {
                if (lineIndex >= this.maxConnections) break;

                const jx = particlePositions[j * 3];
                const jy = particlePositions[j * 3 + 1];
                const jz = particlePositions[j * 3 + 2];

                // Distancia euclidiana aproximada
                const dx = ix - jx;
                const dy = iy - jy;
                const dz = iz - jz;
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < this.maxDistance * this.maxDistance) {
                    const dist = Math.sqrt(distSq);
                    
                    // Intensidad de la línea inversamente proporcional a la distancia (fade out)
                    const alpha = 1.0 - (dist / this.maxDistance);
                    
                    // Colores de los extremos (cian degradado a cian/esmeralda según la distancia)
                    const r = 0.0;
                    const g = 0.58 + alpha * 0.36; // Brillo
                    const b = 0.8 + alpha * 0.2;

                    // Punto de origen
                    const idx1 = lineIndex * 2 * 3;
                    this.positions[idx1] = ix;
                    this.positions[idx1 + 1] = iy;
                    this.positions[idx1 + 2] = iz;

                    this.colors[idx1] = r * alpha;
                    this.colors[idx1 + 1] = g * alpha;
                    this.colors[idx1 + 2] = b * alpha;

                    // Punto de destino
                    const idx2 = (lineIndex * 2 + 1) * 3;
                    this.positions[idx2] = jx;
                    this.positions[idx2 + 1] = jy;
                    this.positions[idx2 + 2] = jz;

                    this.colors[idx2] = r * alpha;
                    this.colors[idx2 + 1] = g * alpha;
                    this.colors[idx2 + 2] = b * alpha;

                    lineIndex++;
                }
            }
        }

        // Si tenemos menos conexiones que el máximo, limpiar los puntos restantes
        const resetStartIdx = lineIndex * 2 * 3;
        const totalElements = this.maxConnections * 2 * 3;
        for (let i = resetStartIdx; i < totalElements; i++) {
            this.positions[i] = 0;
            this.colors[i] = 0;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.setDrawRange(0, lineIndex * 2);
    }

    dispose() {
        this.scene.remove(this.lineSegments);
        this.geometry.dispose();
        this.material.dispose();
    }
}
