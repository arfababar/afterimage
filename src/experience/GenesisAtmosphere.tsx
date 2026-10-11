import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface GenesisAtmosphereProps {
  opacityRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}

export const GenesisAtmosphere: React.FC<GenesisAtmosphereProps> = ({ opacityRef, pointerRef }) => {
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uPointer;
        uniform float uOpacity;
        varying vec2 vUv;

        // Returns pseudo random noise
        float rnd(vec2 p) {
          p = fract(p * vec2(12.9898, 78.233));
          p += dot(p, p + 34.56);
          return fract(p.x * p.y);
        }

        // Value noise
        float noise(in vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          float a = rnd(i);
          float b = rnd(i + vec2(1.0, 0.0));
          float c = rnd(i + vec2(0.0, 1.0));
          float d = rnd(i + 1.0);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        // Fractal Brownian motion
        float fbm(vec2 p) {
          float t = 0.0;
          float a = 1.0;
          mat2 m = mat2(1.0, -0.5, 0.2, 1.2);
          for (int i = 0; i < 4; i++) {
            t += a * noise(p);
            p *= 2.0 * m;
            a *= 0.5;
          }
          return t;
        }

        // Evolving clouds
        float clouds(vec2 p) {
          float d = 1.0;
          float t = 0.0;
          for (float i = 0.0; i < 3.0; i += 1.0) {
            float a = d * fbm(i * 10.0 + p.x * 0.2 + 0.2 * (1.0 + i) * p.y + d + i * i + p);
            t = mix(t, d, a);
            d = a;
            p *= 2.0 / (i + 1.0);
          }
          return t;
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
          uv += uPointer * 0.05;
          vec2 st = uv * vec2(1.8, 1.0);
          float t = uTime * 0.22;
          float bg = clouds(vec2(st.x + t * 0.35, -st.y));

          uv *= 1.0 - 0.22 * (sin(t * 0.28) * 0.5 + 0.5);

          vec3 col = vec3(0.0);
          // Warm muted terracotta / bronze ambient base
          vec3 baseColor = vec3(0.11, 0.065, 0.05) * (1.0 + bg * 0.45);

          for (float i = 1.0; i < 9.0; i += 1.0) {
            uv += 0.08 * cos(i * vec2(0.1 + 0.01 * i, 0.8) + i * i + t * 0.35 + 0.1 * uv.x);
            vec2 p = uv;
            float d = length(p);

            // Flowing ethereal warm filaments: Blush Pink & Peach to Warm Champagne Gold & Soft Amber
            vec3 blushPeach = vec3(0.97, 0.68, 0.60);
            vec3 champagneGold = vec3(0.98, 0.82, 0.54);
            vec3 softAmber = vec3(0.92, 0.60, 0.34);
            vec3 warmIvory = vec3(1.0, 0.95, 0.88);

            vec3 filamentTint = mix(
              blushPeach,
              champagneGold,
              sin(i * 0.75 + t * 0.15) * 0.5 + 0.5
            );
            filamentTint = mix(filamentTint, softAmber, cos(i * 0.5) * 0.3 + 0.3);

            col += (0.00135 / max(d, 0.012)) * filamentTint;
            float b = noise(i + p + bg * 1.731);
            col += (0.0020 * b / max(length(max(p, vec2(b * p.x * 0.02, p.y))), 0.01)) * warmIvory;
            // Warm golden-peach atmospheric cloud depth
            col = mix(col, vec3(bg * 0.28, bg * 0.16, bg * 0.11), clamp(d * 0.45, 0.0, 1.0));
          }

          vec3 finalColor = baseColor + col;
          float vig = 1.0 - smoothstep(0.42, 1.5, length(vUv - 0.5));
          finalColor *= vig;

          float alpha = uOpacity * clamp(length(finalColor) * 1.45, 0.0, 0.94);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, []);

  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const opacity = opacityRef.current;
    if (meshRef.current) {
      meshRef.current.visible = opacity > 0.005;
    }
    if (!shaderMatRef.current || opacity <= 0.005) return;
    const uniforms = shaderMatRef.current.uniforms;
    uniforms.uTime.value += delta;
    uniforms.uResolution.value.set(state.size.width, state.size.height);
    uniforms.uPointer.value.set(pointerRef.current.x, pointerRef.current.y);
    uniforms.uOpacity.value = opacity;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]} scale={[34, 22, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <primitive object={material} ref={shaderMatRef} attach="material" />
    </mesh>
  );
};
