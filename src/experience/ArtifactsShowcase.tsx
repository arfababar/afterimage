import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

export type ArtifactId = 'glass' | 'chrome' | 'crystal';

export interface ArtifactItemData {
  id: ArtifactId;
  title: string;
  subtitle: string;
  phase: string;
  material: string;
  behavior: string;
  description: string;
  accentColor: string;
}

export const ARTIFACTS_DATA: Record<ArtifactId, ArtifactItemData> = {
  glass: {
    id: 'glass',
    title: 'THE PRISM',
    subtitle: 'IRIDESCENT GLASS',
    phase: 'ARTIFACT 01 // REFRACTION',
    material: 'Thin-film glass · Translucent core',
    behavior: 'Optical distortion wave on contact',
    description:
      'An intertwined Möbius loop sculpted from thin-film glass. When touched, it sends a ripple of refractive distortion through its curves, shifting colors across the spectrum.',
    accentColor: '#C49AAE',
  },
  chrome: {
    id: 'chrome',
    title: 'THE DROPLET',
    subtitle: 'LIQUID CHROME',
    phase: 'ARTIFACT 02 // SPECULAR',
    material: 'Polished liquid metal · Orbital ribbon',
    behavior: 'Surface magneto-shockwave on contact',
    description:
      'A dense mercury droplet encircled by a free-floating liquid band. When touched, high-frequency ripples shiver across its mirror surface before dissipating into calm.',
    accentColor: '#F0E0E4',
  },
  crystal: {
    id: 'crystal',
    title: 'THE CLUSTER',
    subtitle: 'TRANSLUCENT CRYSTAL',
    phase: 'ARTIFACT 03 // RESONANCE',
    material: 'Faceted obsidian crystal · Glowing ember core',
    behavior: 'Prismatic spark burst on contact',
    description:
      'A cluster of faceted geometric spires guarding a quiet internal flame. When touched, it releases a burst of glowing ember sparks that drift outward into the dark.',
    accentColor: '#E8CDAF',
  },
};

export interface ArtifactsShowcaseProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  triggerTimestamp?: number;
}

interface ArtifactObjectProps {
  id: ArtifactId;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  baseScale: number;
  activeId?: string;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  triggerTimestamp?: number;
  reducedMotion: boolean;
  children: (
    highlight: number,
    pulseProgress: number,
    pointerTilt: { x: number; y: number }
  ) => React.ReactNode;
}

function isTreeVisible(obj: THREE.Object3D | null): boolean {
  let curr = obj;
  while (curr) {
    if (!curr.visible) return false;
    curr = curr.parent;
  }
  return true;
}

const ArtifactObjectItem: React.FC<ArtifactObjectProps> = ({
  id,
  basePosition,
  baseRotation,
  baseScale,
  activeId,
  hoveredId,
  onSelect,
  onHover,
  triggerTimestamp,
  reducedMotion,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentHighlight = useRef(0);
  const activationTimeRef = useRef(-10);
  const pointerTiltRef = useRef({ x: 0, y: 0 });

  const isActive = activeId === id;
  const isHovered = hoveredId === id;

  // Trigger pulse when UI button or keyboard triggers the active item
  useEffect(() => {
    if (isActive && triggerTimestamp && triggerTimestamp > 0) {
      activationTimeRef.current = performance.now() / 1000;
    }
  }, [isActive, triggerTimestamp]);

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (typeof document !== 'undefined') {
      document.body.style.cursor = 'pointer';
      document.querySelector('.custom-cursor')?.classList.add('is-hovering');
    }
    onHover?.(id);
  };

  const handlePointerOut = () => {
    if (typeof document !== 'undefined') {
      document.body.style.cursor = '';
      document.querySelector('.custom-cursor')?.classList.remove('is-hovering');
    }
    onHover?.(null);
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    activationTimeRef.current = performance.now() / 1000;
    onSelect?.(id);
  };

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group || !isTreeVisible(group)) return;

    // Smooth highlight lerp
    const targetHighlight = isActive ? 1.0 : isHovered ? 0.7 : 0.0;
    currentHighlight.current = THREE.MathUtils.lerp(
      currentHighlight.current,
      targetHighlight,
      delta * 7
    );

    const now = state.clock.getElapsedTime();

    if (reducedMotion) {
      group.position.set(basePosition[0], basePosition[1], basePosition[2]);
      group.rotation.set(baseRotation[0], baseRotation[1], baseRotation[2]);
      group.scale.setScalar(baseScale * (1 + currentHighlight.current * 0.05));
      return;
    }

    // Unique multi-harmonic floating rhythm per artifact
    const phaseOffset = id === 'glass' ? 0.0 : id === 'chrome' ? 2.1 : 4.2;
    const floatY =
      Math.sin(now * 0.72 + phaseOffset) * 0.065 +
      Math.sin(now * 1.45 + phaseOffset * 1.5) * 0.015;
    const floatX =
      Math.cos(now * 0.52 + phaseOffset) * 0.04 +
      Math.cos(now * 1.1 + phaseOffset) * 0.012;
    const floatRotY =
      Math.sin(now * 0.38 + phaseOffset) * 0.05 +
      Math.cos(now * 0.8 + phaseOffset) * 0.015;
    const floatRotZ = Math.sin(now * 0.48 + phaseOffset) * 0.025;

    // Pointer-responsive tilt
    const pointerTiltX = -state.pointer.y * (isHovered ? 0.24 : 0.10);
    const pointerTiltY = state.pointer.x * (isHovered ? 0.28 : 0.12);
    const forwardZ = currentHighlight.current * 0.45;

    pointerTiltRef.current.x = pointerTiltX;
    pointerTiltRef.current.y = pointerTiltY;

    // Position interpolation
    group.position.x = THREE.MathUtils.lerp(group.position.x, basePosition[0] + floatX, 0.08);
    group.position.y = THREE.MathUtils.lerp(group.position.y, basePosition[1] + floatY, 0.08);
    group.position.z = THREE.MathUtils.lerp(group.position.z, basePosition[2] + forwardZ, 0.08);

    // Rotation interpolation
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, baseRotation[0] + pointerTiltX, 0.08);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, baseRotation[1] + floatRotY + pointerTiltY, 0.08);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, baseRotation[2] + floatRotZ, 0.08);

    const targetScale = baseScale * (1 + currentHighlight.current * 0.06);
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, targetScale, 0.08));
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Visual content rendered with highlight factor, pulse progress, and dynamic pointer tilt */}
      {children(
        currentHighlight.current,
        Math.max(0, 1 - (performance.now() / 1000 - activationTimeRef.current) / 1.5),
        pointerTiltRef.current
      )}
    </group>
  );
};

export const ArtifactsShowcase: React.FC<ArtifactsShowcaseProps> = ({
  activeId = 'glass',
  onSelect,
  hoveredId,
  onHover,
  triggerTimestamp,
}) => {
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = q.matches;
    const handler = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    q.addEventListener('change', handler);
    return () => q.removeEventListener('change', handler);
  }, []);

  const { viewport } = useThree();
  const isDesktop = viewport.width >= 5.5;
  const isTablet = viewport.width >= 3.0 && viewport.width < 5.5;

  const positions = useMemo(() => {
    if (isDesktop) {
      // Desktop: Balanced horizontal composition across the open right stage
      // Spanned with deliberate horizontal clearance: zero silhouette overlap
      // and slight vertical offsets for dynamic visual interest
      return {
        glass: [0.96, 0.24, 0.0] as [number, number, number],
        chrome: [2.14, -0.18, -0.05] as [number, number, number],
        crystal: [3.22, 0.16, 0.0] as [number, number, number],
      };
    }
    if (isTablet) {
      // Tablet: Balanced horizontal constellation across available width
      // Subtle vertical offsets maintain cohesive alignment with dynamic rhythm
      return {
        glass: [-1.15, 0.06, 0.05] as [number, number, number],
        chrome: [0.0, -0.06, -0.05] as [number, number, number],
        crystal: [1.15, 0.04, 0.0] as [number, number, number],
      };
    }
    // Mobile: Balanced horizontal trio across mobile viewport with zero clipping
    return {
      glass: [-0.64, 0.05, 0.05] as [number, number, number],
      chrome: [0.0, -0.05, -0.05] as [number, number, number],
      crystal: [0.64, 0.03, 0.0] as [number, number, number],
    };
  }, [isDesktop, isTablet]);

  // --- 1. GLASS GEOMETRIES & MATERIALS ---
  const glassGeometry = useMemo(() => new THREE.TorusKnotGeometry(0.60, 0.16, 96, 24, 2, 3), []);
  const glassRingGeometry = useMemo(() => new THREE.RingGeometry(0.65, 0.80, 48), []);
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#F0E0E4'),
        roughness: 0.08,
        metalness: 0.12,
        transmission: 0.72,
        thickness: 1.8,
        ior: 1.62,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        attenuationColor: new THREE.Color('#C49AAE'),
        attenuationDistance: 1.6,
      }),
    []
  );

  // --- 2. LIQUID CHROME GEOMETRIES & MATERIALS ---
  const chromeSphereGeom = useMemo(() => new THREE.IcosahedronGeometry(0.68, 4), []);
  const chromeRingGeom = useMemo(() => new THREE.TorusGeometry(1.08, 0.04, 20, 64), []);
  const chromeWaveGeom = useMemo(() => new THREE.RingGeometry(0.35, 0.48, 48), []);
  const chromeMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#F2EBEF'),
        metalness: 0.98,
        roughness: 0.04,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        reflectivity: 0.95,
      }),
    []
  );

  // --- 3. TRANSLUCENT CRYSTAL GEOMETRIES & MATERIALS ---
  const crystalMainGeom = useMemo(() => {
    const geom = new THREE.OctahedronGeometry(0.78, 0);
    geom.scale(0.75, 1.4, 0.75);
    return geom;
  }, []);
  const crystalLeftGeom = useMemo(() => {
    const geom = new THREE.OctahedronGeometry(0.40, 0);
    geom.scale(0.6, 1.1, 0.6);
    return geom;
  }, []);
  const crystalRightGeom = useMemo(() => {
    const geom = new THREE.OctahedronGeometry(0.34, 0);
    geom.scale(0.65, 1.0, 0.65);
    return geom;
  }, []);
  const crystalCoreGeom = useMemo(() => new THREE.OctahedronGeometry(0.32, 0), []);

  const crystalMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#F7F0F3'),
        flatShading: true,
        roughness: 0.12,
        metalness: 0.05,
        transmission: 0.74,
        thickness: 1.6,
        ior: 1.82,
        clearcoat: 1.0,
      }),
    []
  );

  // Particle burst velocities for Crystal artifact
  const crystalParticles = useMemo(() => {
    const count = 36;
    const items: Array<{ pos: [number, number, number]; vel: [number, number, number] }> = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 0.15;
      const sinPhi = Math.sin(phi);
      const x = r * sinPhi * Math.cos(theta);
      const y = r * sinPhi * Math.sin(theta);
      const z = r * Math.cos(phi);
      const speed = 1.6 + Math.random() * 1.4;
      items.push({
        pos: [x, y, z],
        vel: [x * speed * 4, y * speed * 4, z * speed * 4],
      });
    }
    return items;
  }, []);

  const particlePointsGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(crystalParticles.length * 3);
    for (let i = 0; i < crystalParticles.length; i++) {
      positions[i * 3] = crystalParticles[i].pos[0];
      positions[i * 3 + 1] = crystalParticles[i].pos[1];
      positions[i * 3 + 2] = crystalParticles[i].pos[2];
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [crystalParticles]);

  // Clean disposal of geometries & materials on unmount
  useEffect(() => {
    return () => {
      glassGeometry.dispose();
      glassRingGeometry.dispose();
      glassMaterial.dispose();
      chromeSphereGeom.dispose();
      chromeRingGeom.dispose();
      chromeWaveGeom.dispose();
      chromeMaterial.dispose();
      crystalMainGeom.dispose();
      crystalLeftGeom.dispose();
      crystalRightGeom.dispose();
      crystalCoreGeom.dispose();
      crystalMaterial.dispose();
      particlePointsGeom.dispose();
    };
  }, [
    glassGeometry,
    glassRingGeometry,
    glassMaterial,
    chromeSphereGeom,
    chromeRingGeom,
    chromeWaveGeom,
    chromeMaterial,
    crystalMainGeom,
    crystalLeftGeom,
    crystalRightGeom,
    crystalCoreGeom,
    crystalMaterial,
    particlePointsGeom,
  ]);

  // Animated refs for sub-elements in useFrame
  const showcaseRef = useRef<THREE.Group>(null);
  const glassPulseMeshRef = useRef<THREE.Mesh>(null);
  const glassKnotRef = useRef<THREE.Mesh>(null);
  const chromeRingMeshRef = useRef<THREE.Mesh>(null);
  const chromeWaveMeshRef = useRef<THREE.Mesh>(null);
  const chromeCoreMeshRef = useRef<THREE.Mesh>(null);
  const crystalParticlesRef = useRef<THREE.Points>(null);
  const crystalCoreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (showcaseRef.current && !isTreeVisible(showcaseRef.current)) return;
    const time = state.clock.getElapsedTime();

    // 1. Idle rotation for glass knot
    if (glassKnotRef.current) {
      glassKnotRef.current.rotation.x = time * 0.28;
      glassKnotRef.current.rotation.y = time * 0.38;
    }

    // 2. Liquid precession for chrome ring
    if (chromeRingMeshRef.current) {
      chromeRingMeshRef.current.rotation.x = THREE.MathUtils.degToRad(35) + Math.sin(time * 0.6) * 0.15;
      chromeRingMeshRef.current.rotation.y += 0.012;
      chromeRingMeshRef.current.rotation.z = Math.cos(time * 0.5) * 0.2;
    }

    // 3. Stately rotation for crystal core
    if (crystalCoreRef.current) {
      crystalCoreRef.current.rotation.y = time * 0.45;
    }
  });

  return (
    <group ref={showcaseRef} name="artifacts-showcase">
      {/* 1. ARTIFACT 01: THE PRISM (Dominant Focal Object: Iridescent Glass Möbius Loop) */}
      <ArtifactObjectItem
        id="glass"
        basePosition={positions.glass}
        baseRotation={[0.15, 0.45, -0.12]}
        baseScale={isDesktop ? 0.52 : isTablet ? 0.38 : 0.26}
        activeId={activeId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        triggerTimestamp={triggerTimestamp}
        reducedMotion={reducedMotionRef.current}
      >
        {(highlight, pulseStrength, tilt) => {
          // Dynamic scale and opacity during distortion wave
          const waveScale = 1.0 + (1 - pulseStrength) * 2.4;
          const waveOpacity = pulseStrength * 0.85;

          return (
            <group>
              {/* Glass Möbius Knot */}
              <mesh
                ref={glassKnotRef}
                geometry={glassGeometry}
                material={glassMaterial}
                scale={1 + (1 - pulseStrength) * Math.sin(pulseStrength * Math.PI) * 0.2}
              />

              {/* Expanding Optical Wave Ring on click/trigger */}
              <mesh
                ref={glassPulseMeshRef}
                geometry={glassRingGeometry}
                scale={waveScale}
                visible={pulseStrength > 0.02}
                rotation={[-Math.PI / 2, 0, 0]}
                raycast={() => null}
              >
                <meshBasicMaterial
                  color="#C49AAE"
                  transparent
                  opacity={waveOpacity}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Localized Dusty Rose Catchlight with dynamic specular tracking */}
              <pointLight
                color="#C49AAE"
                intensity={0.32 + highlight * 0.95 + pulseStrength * 2.2}
                distance={5.2}
                decay={2}
                position={[tilt.y * 1.4, tilt.x * 1.4, 0.4]}
              />
            </group>
          );
        }}
      </ArtifactObjectItem>

      {/* 2. ARTIFACT 02: THE DROPLET (Deep-Offset Object: Liquid Chrome with Precessing Ring) */}
      <ArtifactObjectItem
        id="chrome"
        basePosition={positions.chrome}
        baseRotation={[0.32, -0.28, 0.25]}
        baseScale={isDesktop ? 0.44 : isTablet ? 0.32 : 0.22}
        activeId={activeId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        triggerTimestamp={triggerTimestamp}
        reducedMotion={reducedMotionRef.current}
      >
        {(highlight, pulseStrength, tilt) => {
          const waveScale = 0.6 + (1 - pulseStrength) * 3.2;
          const waveOpacity = pulseStrength * 0.95;

          return (
            <group>
              {/* Central Liquid Chrome Sphere */}
              <mesh
                ref={chromeCoreMeshRef}
                geometry={chromeSphereGeom}
                material={chromeMaterial}
                scale={1 + (1 - pulseStrength) * Math.sin(pulseStrength * 8) * 0.14}
              />

              {/* Precessing Orbital Chrome Band */}
              <mesh
                ref={chromeRingMeshRef}
                geometry={chromeRingGeom}
                material={chromeMaterial}
              />

              {/* Expanding Magneto Shockwave Ring on click/trigger */}
              <mesh
                ref={chromeWaveMeshRef}
                geometry={chromeWaveGeom}
                scale={waveScale}
                visible={pulseStrength > 0.02}
                rotation={[-Math.PI / 2.5, 0, 0]}
                raycast={() => null}
              >
                <meshBasicMaterial
                  color="#F0E0E4"
                  transparent
                  opacity={waveOpacity}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Localized Champagne Ivory Catchlight with dynamic specular tracking */}
              <pointLight
                color="#F0E0E4"
                intensity={0.32 + highlight * 0.95 + pulseStrength * 2.2}
                distance={4.8}
                decay={2}
                position={[tilt.y * 1.3, 0.4 + tilt.x * 1.3, 0.45]}
              />
            </group>
          );
        }}
      </ArtifactObjectItem>

      {/* 3. ARTIFACT 03: THE CLUSTER (Secondary Offset Object: Faceted Translucent Crystal & Core) */}
      <ArtifactObjectItem
        id="crystal"
        basePosition={positions.crystal}
        baseRotation={[0.22, 0.5, 0.15]}
        baseScale={isDesktop ? 0.44 : isTablet ? 0.34 : 0.24}
        activeId={activeId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        triggerTimestamp={triggerTimestamp}
        reducedMotion={reducedMotionRef.current}
      >
        {(highlight, pulseStrength, tilt) => {
          return (
            <group>
              {/* Main Crystal Spire */}
              <mesh
                geometry={crystalMainGeom}
                material={crystalMaterial}
                position={[0, 0, 0]}
              />

              {/* Left Flanking Satellite */}
              <mesh
                geometry={crystalLeftGeom}
                material={crystalMaterial}
                position={[-0.45, -0.35, 0.2]}
                rotation={[0.1, 0.3, -0.15]}
              />

              {/* Right Flanking Satellite */}
              <mesh
                geometry={crystalRightGeom}
                material={crystalMaterial}
                position={[0.42, -0.4, -0.15]}
                rotation={[-0.15, -0.25, 0.2]}
              />

              {/* Internal Glowing Ember Core */}
              <mesh
                ref={crystalCoreRef}
                geometry={crystalCoreGeom}
                position={[0, 0.05, 0]}
              >
                <meshStandardMaterial
                  color="#E8CDAF"
                  emissive="#C98570"
                  emissiveIntensity={0.6 + highlight * 0.9 + pulseStrength * 3.0}
                  roughness={0.2}
                />
              </mesh>

              {/* Prismatic Spark Burst Particles */}
              <points
                ref={crystalParticlesRef}
                geometry={particlePointsGeom}
                scale={1.0 + (1 - pulseStrength) * 3.5}
                visible={pulseStrength > 0.02}
                raycast={() => null}
              >
                <pointsMaterial
                  color="#E8CDAF"
                  size={0.065}
                  transparent
                  opacity={pulseStrength * 0.9}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </points>

              {/* Localized Champagne Catchlight with dynamic specular tracking */}
              <pointLight
                color="#E8CDAF"
                intensity={0.38 + highlight * 1.0 + pulseStrength * 2.4}
                distance={5.0}
                decay={2}
                position={[tilt.y * 1.4, 0.2 + tilt.x * 1.4, 0.45]}
              />
            </group>
          );
        }}
      </ArtifactObjectItem>
    </group>
  );
};
