import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';

interface GenesisSanctumProps {
  opacityRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}

// Error boundary to gracefully catch missing or corrupt model files without crashing WebGL
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[Genesis] Model file not yet available, using celestial sanctum fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Nahida 3D Character Model Component
 * Loads /models/nahida.glb with auto-centering, scaling, and harmonic breathing animation
 */
const NahidaCharacter: React.FC<{ opacityRef: React.MutableRefObject<number> }> = ({ opacityRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/nahida.glb');
  const { actions, names } = useAnimations(gltf.animations, groupRef);

  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.y, 0.01);
    // Target height ~1.65 world units so it fits gracefully within the sanctum portal
    const scale = 1.65 / maxDim;

    clone.position.set(-center.x * scale, -center.y * scale - 0.22, -center.z * scale);
    clone.scale.set(scale, scale, scale);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = 1.0;
        }
      }
    });

    return { clonedScene: clone, targetScale: scale };
  }, [gltf.scene]);

  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Subtle living harmonic breath if static model
    if (names.length === 0) {
      groupRef.current.position.y = -0.55 + Math.sin(t * 1.5) * 0.025;
      groupRef.current.rotation.y = Math.sin(t * 0.4) * 0.04;
    }
    const opacity = opacityRef.current;
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, -0.55, 0]}>
      <primitive object={clonedScene.clonedScene} />
    </group>
  );
};

/**
 * Luminous Celestial Beacon Fallback
 * Displayed while nahida.glb is being placed or loaded
 */
const CelestialBeaconFallback: React.FC<{ opacityRef: React.MutableRefObject<number> }> = ({ opacityRef }) => {
  const crystalRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const crystalMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const opacity = opacityRef.current;
    if (crystalRef.current) {
      crystalRef.current.rotation.y = t * 0.5;
      crystalRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
      crystalRef.current.position.y = -0.25 + Math.sin(t * 1.6) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.7;
    }
    if (crystalMatRef.current) {
      crystalMatRef.current.opacity = 0.85 * opacity;
      crystalMatRef.current.emissiveIntensity = 0.45 * opacity;
    }
    if (ringMatRef.current) {
      ringMatRef.current.opacity = 0.8 * opacity;
      ringMatRef.current.emissiveIntensity = 0.6 * opacity;
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      <mesh ref={crystalRef}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshPhysicalMaterial
          ref={crystalMatRef}
          color="#BAC7E2"
          emissive="#C6A6FF"
          emissiveIntensity={0.45}
          roughness={0.12}
          metalness={0.3}
          transmission={0.7}
          thickness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.9, 0.015, 16, 64]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color="#E5A66D"
          emissive="#E5A66D"
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};

export const GenesisSanctum: React.FC<GenesisSanctumProps> = ({ opacityRef, pointerRef }) => {
  const sanctumGroupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const midRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  const keyLightRef = useRef<THREE.SpotLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const outerRingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const midRingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerRingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const monolithMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const monolithAccentLeftRef = useRef<THREE.MeshBasicMaterial>(null);
  const monolithAccentRightRef = useRef<THREE.MeshBasicMaterial>(null);
  const pedestalBaseMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const pedestalTopMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const starlightMatRef = useRef<THREE.PointsMaterial>(null);

  const [hasModelFile, setHasModelFile] = useState(false);

  // Probe localhost static route to see if nahida.glb exists without throwing 404 in Three.js
  useEffect(() => {
    let active = true;
    const probe = async () => {
      try {
        const res = await fetch('/models/nahida.glb', { method: 'HEAD' });
        // Vite SPA returns text/html for missing static files; check that response is actually a binary model
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.includes('text/html')) {
          if (active) setHasModelFile(true);
        } else {
          if (active) setHasModelFile(false);
        }
      } catch {
        if (active) setHasModelFile(false);
      }
    };
    probe();
    // Periodic check every 4 seconds in case user drops the file during session
    const timer = setInterval(probe, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Floating ambient starlight dust
  const starlightMotes = useMemo(() => {
    const count = 48;
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 7.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4.0;
      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = 0.5 + Math.random() * 0.8;
      seeds[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geom, pos, seeds, count };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const opacity = opacityRef.current;

    if (sanctumGroupRef.current) {
      const isVisible = opacity > 0.005;
      sanctumGroupRef.current.visible = isVisible;
      if (!isVisible) return;

      // Subtle parallax response to pointer
      const px = pointerRef.current.x;
      const py = pointerRef.current.y;
      sanctumGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        sanctumGroupRef.current.rotation.y,
        px * 0.12,
        0.05
      );
      sanctumGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        sanctumGroupRef.current.rotation.x,
        -py * 0.08,
        0.05
      );
      // As opacity drops (scrolling into Threshold), retreat into depth and sink gracefully
      sanctumGroupRef.current.position.z = THREE.MathUtils.lerp(-4.5, 0, opacity);
      sanctumGroupRef.current.position.y = THREE.MathUtils.lerp(-1.0, 0, opacity);
      sanctumGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.7, 1.0, opacity));
    }

    // Dynamic light intensities
    if (keyLightRef.current) keyLightRef.current.intensity = 1.4 * opacity;
    if (rimLightRef.current) rimLightRef.current.intensity = 1.9 * opacity;
    if (fillLightRef.current) fillLightRef.current.intensity = 0.65 * opacity;

    // Dynamic material opacities and emissives
    if (outerRingMatRef.current) {
      outerRingMatRef.current.opacity = 0.85 * opacity;
      outerRingMatRef.current.emissiveIntensity = 0.35 * opacity;
    }
    if (midRingMatRef.current) {
      midRingMatRef.current.opacity = 0.85 * opacity;
      midRingMatRef.current.emissiveIntensity = 0.45 * opacity;
    }
    if (innerRingMatRef.current) {
      innerRingMatRef.current.opacity = 0.9 * opacity;
      innerRingMatRef.current.emissiveIntensity = 0.5 * opacity;
    }
    if (monolithMatRef.current) {
      monolithMatRef.current.opacity = 0.95 * opacity;
    }
    if (monolithAccentLeftRef.current) {
      monolithAccentLeftRef.current.opacity = 0.6 * opacity;
    }
    if (monolithAccentRightRef.current) {
      monolithAccentRightRef.current.opacity = 0.6 * opacity;
    }
    if (pedestalBaseMatRef.current) {
      pedestalBaseMatRef.current.opacity = 0.95 * opacity;
    }
    if (pedestalTopMatRef.current) {
      pedestalTopMatRef.current.opacity = 0.95 * opacity;
      pedestalTopMatRef.current.emissiveIntensity = 0.18 * opacity;
    }
    if (starlightMatRef.current) {
      starlightMatRef.current.opacity = 0.65 * opacity;
    }

    // Concentric celestial halo rotations
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.12;
      outerRingRef.current.rotation.y = Math.sin(t * 0.2) * 0.15;
    }
    if (midRingRef.current) {
      midRingRef.current.rotation.z = -t * 0.18;
      midRingRef.current.rotation.x = Math.cos(t * 0.25) * 0.12;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = t * 0.24;
    }

    // Drifting starlight particles
    const positions = starlightMotes.geom.attributes.position.array as Float32Array;
    for (let i = 0; i < starlightMotes.count; i++) {
      const idx = i * 3;
      const seedY = starlightMotes.seeds[idx + 1];
      positions[idx + 1] += delta * seedY * 0.35;
      if (positions[idx + 1] > 3.0) {
        positions[idx + 1] = -2.5;
      }
      positions[idx] += Math.sin(t * 0.8 + starlightMotes.seeds[idx]) * 0.002;
    }
    starlightMotes.geom.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={sanctumGroupRef} position={[0, 0, 0]}>
      {/* Sanctum Key Spotlight */}
      <spotLight
        ref={keyLightRef}
        position={[0, 3.2, 3.8]}
        target-position={[0, 0, 0]}
        color="#FFF6EB"
        intensity={1.4}
        angle={0.65}
        penumbra={0.8}
      />

      {/* Magical Silhouette Rim Light */}
      <pointLight ref={rimLightRef} position={[0, 1.4, -2.2]} color="#C6A6FF" intensity={1.9} distance={8} />

      {/* Gentle Warm Fill Light */}
      <pointLight
        ref={fillLightRef}
        position={[2.0, -0.6, 1.6]}
        color="#E5A66D"
        intensity={0.65}
        distance={6}
      />

      {/* Concentric Celestial Rings (Reference B: Layered Geometric Depth) */}
      <group position={[0, 0.15, -0.2]}>
        {/* Outer Silver-Lavender Portal Halo */}
        <mesh ref={outerRingRef}>
          <torusGeometry args={[2.3, 0.018, 16, 100]} />
          <meshStandardMaterial
            ref={outerRingMatRef}
            color="#BAC7E2"
            emissive="#C6A6FF"
            emissiveIntensity={0.35}
            roughness={0.16}
            metalness={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Middle Champagne Amber Halo */}
        <mesh ref={midRingRef}>
          <torusGeometry args={[1.75, 0.014, 16, 80]} />
          <meshStandardMaterial
            ref={midRingMatRef}
            color="#E5A66D"
            emissive="#E5A66D"
            emissiveIntensity={0.45}
            roughness={0.2}
            metalness={0.85}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Inner Moonlit White Halo */}
        <mesh ref={innerRingRef}>
          <torusGeometry args={[1.22, 0.01, 16, 64]} />
          <meshStandardMaterial
            ref={innerRingMatRef}
            color="#E9E1D6"
            emissive="#E9E1D6"
            emissiveIntensity={0.5}
            roughness={0.12}
            metalness={0.95}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>

      {/* Flanking Architectural Obsidian Monoliths (Framing & Parallax) */}
      <group position={[0, 0, 0]}>
        {/* Left Monolith */}
        <mesh position={[-2.65, 0, -0.6]} rotation={[0, 0.28, 0]}>
          <boxGeometry args={[0.24, 4.4, 0.45]} />
          <meshStandardMaterial
            ref={monolithMatRef}
            color="#14121A"
            roughness={0.32}
            metalness={0.7}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Left Monolith Glowing Accent Ribbon */}
        <mesh position={[-2.52, 0, -0.58]} rotation={[0, 0.28, 0]}>
          <boxGeometry args={[0.02, 4.4, 0.02]} />
          <meshBasicMaterial ref={monolithAccentLeftRef} color="#C6A6FF" transparent opacity={0.6} />
        </mesh>

        {/* Right Monolith */}
        <mesh position={[2.65, 0, -0.6]} rotation={[0, -0.28, 0]}>
          <boxGeometry args={[0.24, 4.4, 0.45]} />
          <meshStandardMaterial
            color="#14121A"
            roughness={0.32}
            metalness={0.7}
            transparent
            opacity={0.95}
          />
        </mesh>
        {/* Right Monolith Glowing Accent Ribbon */}
        <mesh position={[2.52, 0, -0.58]} rotation={[0, -0.28, 0]}>
          <boxGeometry args={[0.02, 4.4, 0.02]} />
          <meshBasicMaterial ref={monolithAccentRightRef} color="#E5A66D" transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Stepped Sanctum Pedestal */}
      <group position={[0, -1.05, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[1.7, 1.85, 0.08, 36]} />
          <meshStandardMaterial
            ref={pedestalBaseMatRef}
            color="#14121A"
            roughness={0.25}
            metalness={0.75}
            transparent
            opacity={0.95}
          />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.35, 1.45, 0.06, 32]} />
          <meshStandardMaterial
            ref={pedestalTopMatRef}
            color="#191622"
            emissive="#C6A6FF"
            emissiveIntensity={0.18}
            roughness={0.18}
            metalness={0.8}
            transparent
            opacity={0.95}
          />
        </mesh>
      </group>

      {/* Ambient Drifting Starlight Particles */}
      <points geometry={starlightMotes.geom}>
        <pointsMaterial
          ref={starlightMatRef}
          size={0.038}
          color="#BAC7E2"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Center Character: Nahida with Graceful Fallback */}
      <ModelErrorBoundary fallback={<CelestialBeaconFallback opacityRef={opacityRef} />}>
        {hasModelFile ? (
          <Suspense fallback={<CelestialBeaconFallback opacityRef={opacityRef} />}>
            <NahidaCharacter opacityRef={opacityRef} />
          </Suspense>
        ) : (
          <CelestialBeaconFallback opacityRef={opacityRef} />
        )}
      </ModelErrorBoundary>
    </group>
  );
};
