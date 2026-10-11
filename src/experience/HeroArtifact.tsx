import React, { Component, ErrorInfo, ReactNode, Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';

interface ShaderUniforms {
  uTime: THREE.IUniform<number>;
  uPointer: THREE.IUniform<THREE.Vector2>;
  uRippleStrength: THREE.IUniform<number>;
  uReducedMotion: THREE.IUniform<number>;
  uHitPoint: THREE.IUniform<THREE.Vector3>;
  uHitIntensity: THREE.IUniform<number>;
}

interface CustomShader {
  uniforms: ShaderUniforms & Record<string, THREE.IUniform>;
  vertexShader: string;
  fragmentShader: string;
}

// Preload the premade iridescent abstract sculpture artifact
useGLTF.preload('/models/iridescent_sculpture.glb');

interface ModelErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

/**
 * Resilient error boundary guarding GLB loading and parsing.
 * If asset loading fails or is unavailable, falls back to the procedural geometric artifact.
 */
class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  public state: ModelErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('[AFTERIMAGE] 3D Model load error, utilizing procedural fallback:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface SculptureModelProps {
  material: THREE.Material;
}

/**
 * Premade Iridescent Abstract Sculpture Monolith
 * Creative Commons Attribution 4.0 International (CC-BY 4.0)
 * Scanned & modeled by Abby Crawford & Eric Chadwick for Khronos Group glTF Sample Assets
 */
const SculptureModel: React.FC<SculptureModelProps> = ({ material }) => {
  const { scene } = useGLTF('/models/iridescent_sculpture.glb');

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = material;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return clone;
  }, [scene, material]);

  return (
    <Center top={false}>
      <primitive
        object={clonedScene}
        scale={13.2}
        rotation={[-0.2, Math.PI * 0.25, 0.35]}
      />
    </Center>
  );
};

export const HeroArtifact: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const artifactHolderRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);

  // Surface cursor raycasting targets & interpolation refs
  const glowPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetGlowPos = useRef(new THREE.Vector3(0, 0, 0));
  const glowIntensity = useRef(0);
  const targetGlowIntensity = useRef(0);

  // Shader reference for high-performance GPU uniform updates
  const shaderRef = useRef<CustomShader | null>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const rippleIntensity = useRef(0.35);

  // Smooth pointer interpolation targets (no React state updates in render loop)
  const pointerSmooth = useRef({ x: 0, y: 0 });

  // Dynamically respect prefers-reduced-motion and fine-pointer input without re-renders
  const reducedMotionRef = useRef(false);
  const isFinePointerRef = useRef(true);
  const lastRayPointer = useRef({ x: 999, y: 999 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerQuery = window.matchMedia('(pointer: fine)');

    reducedMotionRef.current = mediaQuery.matches;
    isFinePointerRef.current = pointerQuery.matches;

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
    };
    const handlePointerChange = (event: MediaQueryListEvent) => {
      isFinePointerRef.current = event.matches;
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    pointerQuery.addEventListener('change', handlePointerChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMotionChange);
      pointerQuery.removeEventListener('change', handlePointerChange);
    };
  }, []);

  // Compute subtly asymmetrical deformed organic icosahedron geometry as fallback
  const deformedGeometry = useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(1.5, 5);
    const pos = geom.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      vertex.fromBufferAttribute(pos, i);
      const u = vertex.clone().normalize();

      // Atmospheric harmonic displacement base
      const displacement =
        Math.sin(u.x * 3.2 + 0.5) * 0.12 +
        Math.cos(u.y * 2.8 + 0.9) * 0.1 +
        Math.sin(u.z * 3.6) * 0.08 +
        Math.sin(u.x * 5.5 + u.y * 4.2) * 0.04;

      vertex.addScaledVector(u, displacement);
      pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geom.computeVertexNormals();
    return geom;
  }, []);

  // Concentric internal geometric core
  const innerGeometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(0.85, 2);
  }, []);

  // Subtle orbital halo ring
  const ringGeometry = useMemo(() => {
    return new THREE.TorusGeometry(2.25, 0.006, 16, 96);
  }, []);

  // Restrained atmospheric silhouette halo backdrop geometry & shader
  const haloGeometry = useMemo(() => new THREE.PlaneGeometry(5.2, 5.2), []);

  const haloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColorViolet: { value: new THREE.Color('#C49AAE') },
        uColorEmber: { value: new THREE.Color('#E8CDAF') },
        uIntensity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColorViolet;
        uniform vec3 uColorEmber;
        uniform float uIntensity;

        void main() {
          vec2 centered = (vUv - vec2(0.5)) * 2.0;
          centered.y *= 1.12; // subtle editorial vertical elongation
          float dist = length(centered);

          // Soft exponential falloff (confined strictly within unit circle)
          float halo = smoothstep(1.0, 0.0, dist);
          halo = pow(halo, 2.4);

          // Spectral violet core blending outward into subtle warm ember edge
          float blend = smoothstep(0.12, 0.85, dist);
          vec3 haloColor = mix(uColorViolet, uColorEmber, blend);

          // Luminous dusty rose backlight opacity (~0.26 max) to separate silhouette with warmth
          float alpha = halo * 0.26 * uIntensity;
          gl_FragColor = vec4(haloColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Enhanced floating micro-particles with varied sizes, depths, and seeds
  const particlesGeometry = useMemo(() => {
    const count = 110;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const dustyRoseColor = new THREE.Color('#C49AAE');
    const champagneGlowColor = new THREE.Color('#E8CDAF');
    const roseAmberColor = new THREE.Color('#C98570');
    const champagneIvoryColor = new THREE.Color('#F0E0E4');

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = 1.6 + Math.random() * 2.6;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.9;
      positions[i * 3 + 2] = radius * Math.cos(phi) * 0.75 + (Math.random() - 0.5) * 1.4;

      // Varied scales: mostly delicate dust motes (0.6 - 1.1), occasional larger embers (1.3 - 2.0)
      scales[i] = Math.random() > 0.82 ? 1.4 + Math.random() * 0.6 : 0.6 + Math.random() * 0.5;

      // Seeds for uncorrelated Lissajous drift frequencies
      seeds[i * 3] = 0.7 + Math.random() * 0.6;
      seeds[i * 3 + 1] = 0.7 + Math.random() * 0.6;
      seeds[i * 3 + 2] = Math.random();

      // Color distribution: blend between dusty rose, champagne glow, rose amber, and champagne ivory
      const pick = Math.random();
      let pointColor: THREE.Color;
      if (pick < 0.45) {
        pointColor = dustyRoseColor.clone().lerp(champagneGlowColor, Math.random() * 0.4);
      } else if (pick < 0.80) {
        pointColor = champagneGlowColor.clone().lerp(roseAmberColor, Math.random() * 0.45);
      } else {
        pointColor = champagneIvoryColor.clone().lerp(dustyRoseColor, 0.25);
      }

      colors[i * 3] = pointColor.r;
      colors[i * 3 + 1] = pointColor.g;
      colors[i * 3 + 2] = pointColor.b;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geom.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 3));
    geom.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, []);

  // Organic GPU particle shader material with pointer reactivity and circular disc sprites
  const particlesMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uReducedMotion: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uReducedMotion;

        attribute float aScale;
        attribute vec3 aSeed;
        attribute vec3 aColor;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = aColor;
          vec3 pos = position;

          if (uReducedMotion < 0.5) {
            // Slow, multi-harmonic organic wandering
            pos.x += sin(uTime * 0.32 * aSeed.x + aSeed.z * 6.28) * 0.24;
            pos.y += cos(uTime * 0.26 * aSeed.y + aSeed.x * 6.28) * 0.28;
            pos.z += sin(uTime * 0.29 * aSeed.z + aSeed.y * 6.28) * 0.20;

            // Gentle pointer influence on nearby particles
            vec3 pointerWorld = vec3(uPointer.x * 2.6, uPointer.y * 2.0, 0.4);
            vec3 deltaToPtr = pos - pointerWorld;
            float distToPtr = length(deltaToPtr);

            if (distToPtr < 2.2 && distToPtr > 0.05) {
              float influence = smoothstep(2.2, 0.2, distToPtr) * 0.28;
              vec3 dir = normalize(deltaToPtr);
              vec3 swirl = vec3(-dir.y, dir.x, 0.0) * 0.12;
              pos += (dir * 0.75 + swirl) * influence;
            }
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Dynamic point size with camera distance attenuation
          float baseSize = 42.0 * aScale;
          gl_PointSize = baseSize / (-mvPosition.z);

          // Distance-based depth fade
          float depthFade = smoothstep(9.0, 3.2, -mvPosition.z);
          vAlpha = 0.58 * depthFade;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          // Circular soft-edge point sprite
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Soft radial falloff for luminous organic dust motes
          float strength = smoothstep(0.5, 0.04, dist);
          strength = pow(strength, 1.7);

          gl_FragColor = vec4(vColor, strength * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Translucent obsidian physical material with surface motion, physical iridescence, and localized cursor-following glow
  const coreMaterial = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#2C1E2A'),
      roughness: 0.16,
      metalness: 0.14,
      transmission: 0.72,
      thickness: 1.6,
      ior: 1.48,
      reflectivity: 0.7,
      clearcoat: 0.85,
      clearcoatRoughness: 0.14,
      iridescence: 0.85,
      iridescenceIOR: 1.32,
      iridescenceThicknessRange: [120, 380],
      attenuationColor: new THREE.Color('#C49AAE'),
      attenuationDistance: 2.2,
      specularColor: new THREE.Color('#F0E0E4'),
      specularIntensity: 0.95,
      transparent: true,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uPointer = { value: new THREE.Vector2(0, 0) };
      shader.uniforms.uRippleStrength = { value: 0 };
      shader.uniforms.uReducedMotion = { value: 0 };
      shader.uniforms.uHitPoint = { value: new THREE.Vector3(0, 0, 0) };
      shader.uniforms.uHitIntensity = { value: 0 };
      shaderRef.current = shader as unknown as CustomShader;

      shader.vertexShader = `
        uniform float uTime;
        uniform vec2 uPointer;
        uniform float uRippleStrength;
        uniform float uReducedMotion;
        varying vec3 vWorldPos;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <defaultnormal_vertex>',
        `
        #include <defaultnormal_vertex>

        if (uReducedMotion < 0.5) {
          vec3 norm = normalize(position);
          // Harmonic normal perturbation to catch dynamic specular catchlights
          transformedNormal += vec3(
            cos(norm.x * 2.8 + uTime * 0.7) * 0.04,
            sin(norm.y * 2.6 + uTime * 0.6) * 0.04,
            cos(norm.z * 3.4 + uTime * 0.5) * 0.03
          );
          transformedNormal = normalize(transformedNormal);
        }
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        if (uReducedMotion < 0.5) {
          vec3 norm = normalize(position);

          // Slow, multi-frequency organic harmonic waves (subtle living breathing motion)
          float wave1 = sin(norm.x * 2.8 + uTime * 0.7) * cos(norm.y * 2.6 + uTime * 0.6);
          float wave2 = sin(norm.z * 3.4 + uTime * 0.5) * 0.5;
          float breathing = (wave1 + wave2) * 0.038;

          // Pointer-reactive surface influence & restrained ripple response
          vec3 pointerDir = normalize(vec3(uPointer.x * 1.4, uPointer.y * 1.4, 1.2));
          float dotPointer = dot(norm, pointerDir);
          float proximity = smoothstep(0.2, 1.0, dotPointer);

          // Concentric ripple wave radiating across facing facets
          float rippleWave = sin(dotPointer * 12.0 - uTime * 2.4) * 0.5 + 0.5;
          float pointerDisplacement = proximity * (0.032 + rippleWave * 0.028 * uRippleStrength);

          transformed += norm * (breathing + pointerDisplacement);
        }
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        `
        #include <worldpos_vertex>
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `
      );

      shader.fragmentShader = `
        uniform vec3 uHitPoint;
        uniform float uHitIntensity;
        varying vec3 vWorldPos;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        if (uHitIntensity > 0.005) {
          float hitDist = length(vWorldPos - uHitPoint);
          // Tight, compact radial falloff (confined strictly within ~0.25 radius)
          float roseHalo = smoothstep(0.25, 0.0, hitDist);
          // Subtle, delicate champagne core strictly at the tiny contact glint point (< 0.07 radius)
          float champagneCore = smoothstep(0.07, 0.0, hitDist);

          vec3 dustyRose = vec3(0.769, 0.604, 0.682); // #C49AAE
          vec3 champagneIvory = vec3(0.941, 0.878, 0.894); // #F0E0E4

          // Primary dusty rose glint with champagne ivory center
          vec3 glintColor = mix(dustyRose * 0.75, champagneIvory * 0.9, champagneCore * 0.35);
          float glintStrength = (roseHalo * 0.45 + champagneCore * 0.25) * uHitIntensity;

          totalEmissiveRadiance += glintColor * glintStrength;
        }
        `
      );
    };

    return mat;
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (group.parent && group.parent.visible === false) return;

    // Smooth pointer response with gentle damping
    const targetPointerX = state.pointer.x * 0.22;
    const targetPointerY = -state.pointer.y * 0.16;

    pointerSmooth.current.x = THREE.MathUtils.lerp(
      pointerSmooth.current.x,
      targetPointerX,
      0.04
    );
    pointerSmooth.current.y = THREE.MathUtils.lerp(
      pointerSmooth.current.y,
      targetPointerY,
      0.04
    );

    // Surface raycasting for cursor-following localized glow (fine pointer only)
    if (artifactHolderRef.current && !reducedMotionRef.current && isFinePointerRef.current) {
      const isNearActive =
        !group.parent ||
        (group.parent.position.y > -3.5 && group.parent.position.z > -1.5);
      if (isNearActive) {
        const dx = state.pointer.x - lastRayPointer.current.x;
        const dy = state.pointer.y - lastRayPointer.current.y;
        const pDistSq = dx * dx + dy * dy;

        if (pDistSq > 0.00004) {
          lastRayPointer.current.x = state.pointer.x;
          lastRayPointer.current.y = state.pointer.y;

          state.raycaster.setFromCamera(state.pointer, state.camera);
          const hits = state.raycaster.intersectObjects(
            artifactHolderRef.current.children,
            true
          );

          if (hits.length > 0) {
            targetGlowPos.current.copy(hits[0].point);
            targetGlowIntensity.current = 1.0;
          } else {
            targetGlowIntensity.current = 0.0;
          }
        }
      } else {
        targetGlowIntensity.current = 0.0;
      }
    } else {
      targetGlowIntensity.current = 0.0;
    }

    // Smooth interpolation with gentle fade-out decay when cursor leaves
    glowIntensity.current = THREE.MathUtils.lerp(
      glowIntensity.current,
      targetGlowIntensity.current,
      targetGlowIntensity.current > 0 ? 0.12 : 0.06
    );
    glowPos.current.lerp(targetGlowPos.current, 0.15);

    // Update localized surface glow point light (restrained specular catchlight)
    if (glowLightRef.current) {
      glowLightRef.current.position.copy(glowPos.current);
      glowLightRef.current.intensity = glowIntensity.current * 0.35;
    }

    // Update GPU shader uniforms directly without React re-renders
    if (shaderRef.current) {
      const isReduced = reducedMotionRef.current ? 1.0 : 0.0;
      shaderRef.current.uniforms.uReducedMotion.value = isReduced;

      shaderRef.current.uniforms.uHitPoint.value.copy(glowPos.current);
      shaderRef.current.uniforms.uHitIntensity.value = glowIntensity.current;

      if (!reducedMotionRef.current) {
        shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        shaderRef.current.uniforms.uPointer.value.set(
          pointerSmooth.current.x * 3.0,
          pointerSmooth.current.y * 3.0
        );

        // Dynamically compute pointer velocity to modulate ripple wave intensity
        const pointerSpeed = Math.hypot(
          state.pointer.x - lastPointer.current.x,
          state.pointer.y - lastPointer.current.y
        );
        lastPointer.current.x = state.pointer.x;
        lastPointer.current.y = state.pointer.y;

        // Smoothly blend ripple intensity with gentle decay
        rippleIntensity.current = THREE.MathUtils.lerp(
          rippleIntensity.current,
          Math.min(pointerSpeed * 10.0 + 0.35, 1.2),
          0.06
        );
        shaderRef.current.uniforms.uRippleStrength.value = rippleIntensity.current;
      }
    }

    // Update atmospheric halo breathing and organic particle shader uniforms
    const time = state.clock.getElapsedTime();

    if (haloMaterial) {
      haloMaterial.uniforms.uIntensity.value = reducedMotionRef.current
        ? 0.92
        : 0.92 + Math.sin(time * 0.45) * 0.08;
    }

    if (particlesMaterial) {
      particlesMaterial.uniforms.uReducedMotion.value = reducedMotionRef.current ? 1.0 : 0.0;
      if (!reducedMotionRef.current) {
        particlesMaterial.uniforms.uTime.value = time;
        particlesMaterial.uniforms.uPointer.value.set(
          pointerSmooth.current.x * 2.5,
          pointerSmooth.current.y * 2.5
        );
      }
    }

    if (reducedMotionRef.current) {
      // Under reduced motion: strictly damp to pointer tilt without continuous rotation or bobbing
      group.position.set(0, 0, 0);
      group.rotation.x = pointerSmooth.current.y;
      group.rotation.y = pointerSmooth.current.x;
      return;
    }

    // Subtle local floating bobbing (parent scroll rig controls global position)
    const floatY = Math.sin(time * 0.7) * 0.08;
    group.position.set(0, floatY, 0);

    // Continuous slow rotational movement + pointer tilt on the central artifact
    if (artifactHolderRef.current) {
      artifactHolderRef.current.rotation.y += delta * 0.09;
      artifactHolderRef.current.rotation.x = Math.sin(time * 0.25) * 0.06 + pointerSmooth.current.y;
      artifactHolderRef.current.rotation.z = pointerSmooth.current.x * 0.6;
    }

    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.07;
      innerRef.current.rotation.z += delta * 0.04;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
      ringRef.current.rotation.x = 0.5 + Math.sin(time * 0.2) * 0.08;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.015;
      particlesRef.current.rotation.x = Math.sin(time * 0.12) * 0.02;
    }
  });

  return (
    <group ref={groupRef} dispose={null}>
      {/* Restrained Atmospheric Silhouette Halo (Soft separation backdrop) */}
      <mesh
        geometry={haloGeometry}
        material={haloMaterial}
        position={[0, 0, -0.65]}
        raycast={() => null}
      />

      {/* Central Translucent Premade Iridescent Sculpture with Procedural Fallback */}
      <group ref={artifactHolderRef}>
        <ModelErrorBoundary fallback={<mesh geometry={deformedGeometry} material={coreMaterial} />}>
          <Suspense fallback={<mesh geometry={deformedGeometry} material={coreMaterial} />}>
            <SculptureModel material={coreMaterial} />
          </Suspense>
        </ModelErrorBoundary>
      </group>

      {/* Localized Cursor Surface Glow Point Light (dusty rose, compact micro-facet radius) */}
      <pointLight
        ref={glowLightRef}
        color="#C49AAE"
        distance={0.75}
        decay={2}
        intensity={0}
      />

      {/* Internal Concentric Echo / Dark Latent Core */}
      <mesh ref={innerRef} geometry={innerGeometry} raycast={() => null}>
        <meshStandardMaterial
          color="#2A1D28"
          emissive="#4A3445"
          emissiveIntensity={0.4}
          roughness={0.45}
          metalness={0.85}
        />
      </mesh>

      {/* Tilted Latent Orbital Ring */}
      <mesh ref={ringRef} geometry={ringGeometry} rotation={[0.55, 0.2, 0]} raycast={() => null}>
        <meshStandardMaterial
          color="#E8CDAF"
          roughness={0.3}
          metalness={0.9}
          transparent={true}
          opacity={0.3}
        />
      </mesh>

      {/* Floating Ambient Organic Micro-particles with Pointer Influence */}
      <points
        ref={particlesRef}
        geometry={particlesGeometry}
        material={particlesMaterial}
        raycast={() => null}
      />
    </group>
  );
};
