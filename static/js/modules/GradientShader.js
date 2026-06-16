import * as THREE from 'three';

export class GradientShader {
    constructor(scene) {
        this.scene = scene;

        // Uniforms para pasar datos al shader GLSL
        this.uniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uMouse: { value: new THREE.Vector2(0, 0) }
        };

        // Shaders GLSL incrustados
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            varying vec2 vUv;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f*f*(3.0-2.0*f);
                return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                           mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
            }

            void main() {
                vec2 uv = vUv;
                
                // Distorsión fluida orgánica basada en ruido y tiempo
                float n1 = noise(uv * 2.5 + uTime * 0.04 + uMouse * 0.08);
                float n2 = noise(uv * 5.0 - uTime * 0.05);
                vec2 distortedUv = uv + vec2(n1 * 0.07, n2 * 0.07);
                
                // Centros de los focos de color (Cian y Rojo) animados
                vec2 centerCyan = vec2(
                    0.25 + sin(uTime * 0.02) * 0.15 + uMouse.x * 0.04, 
                    0.75 + cos(uTime * 0.015) * 0.15 + uMouse.y * 0.04
                );
                vec2 centerRed = vec2(
                    0.82 + cos(uTime * 0.03) * 0.08 - uMouse.x * 0.02, 
                    0.20 + sin(uTime * 0.025) * 0.08 - uMouse.y * 0.02
                );
                
                float distCyan = length(distortedUv - centerCyan);
                float distRed = length(distortedUv - centerRed);
                
                // Fondo base: degradado azul oscuro profundo a negro
                vec3 baseColor = mix(vec3(0.005, 0.008, 0.018), vec3(0.015, 0.025, 0.05), distortedUv.y);
                
                // Capa de color cian brillante (glow tipo IA)
                float glowCyan = exp(-distCyan * 3.0) * 0.32;
                vec3 cyanColor = vec3(0.0, 0.94, 1.0) * glowCyan;
                
                // Capa de color rojo sutil (acentos de energía)
                float glowRed = exp(-distRed * 4.0) * 0.15;
                vec3 redColor = vec3(0.85, 0.12, 0.18) * glowRed;
                
                // Efecto de ruido analógico/digital fino
                float grain = (hash(uv * uResolution + uTime) - 0.5) * 0.022;
                
                vec3 finalColor = baseColor + cyanColor + redColor + vec3(grain);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Crear geometría del plano de fondo (colocado atrás en z = -10)
        this.geometry = new THREE.PlaneGeometry(160, 160);
        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.z = -20; // Ubicado detrás de las partículas
        this.scene.add(this.mesh);

        // Escuchar redimensionamientos
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize, { passive: true });
    }

    onResize() {
        this.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }

    update(time, mouseX, mouseY) {
        this.uniforms.uTime.value = time;
        this.uniforms.uMouse.value.set(mouseX, mouseY);
    }

    dispose() {
        window.removeEventListener('resize', this.onResize);
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
    }
}
