import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export type ArchitectureId = 'vault' | 'oculus' | 'pylon';

export interface ArchitectureItemData {
  id: ArchitectureId;
  title: string;
  subtitle: string;
  phase: string;
  description: string;
  coordinates: string;
  accentColor: string;
}

export const ARCHITECTURE_DATA: Record<ArchitectureId, ArchitectureItemData> = {
  vault: {
    id: 'vault',
    title: 'THE VAULT',
    subtitle: 'ARCHED FRAME',
    phase: 'FORM 01 // ARCH',
    description:
      'A curved obsidian archway framing an inner pane of tinted glass. Built from twin pillars and a smooth crown, it stands like a doorway open to the dark.',
    coordinates: 'X: -1.9 · Y: +0.2 · Z: -0.6',
    accentColor: '#C6A6FF',
  },
  oculus: {
    id: 'oculus',
    title: 'THE OCULUS',
    subtitle: 'INCLINED LENS',
    phase: 'FORM 02 // LENS',
    description:
      'A circular frame tilted forward toward the eye. A subtle amber rim light catches its outer edge, while the center holds a quiet, translucent lens.',
    coordinates: 'X: +1.8 · Y: +0.45 · Z: +0.3',
    accentColor: '#E5A66D',
  },
  pylon: {
    id: 'pylon',
    title: 'THE CANTILEVER',
    subtitle: 'BALANCED LINTEL',
    phase: 'FORM 03 // PYLON',
    description:
      'Two pillars of different heights carrying an offset horizontal beam. Resting low in the space, its upper ledge catches a pale violet gleam.',
    coordinates: 'X: -0.1 · Y: -1.25 · Z: -1.3',
    accentColor: '#E9E1D6',
  },
};

export interface SpatialArchitectureProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}

interface FormItemProps {
  id: ArchitectureId;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  baseScale: number;
  activeId?: string;
  hoveredId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  reducedMotion: boolean;
  children: (highlight: number) => React.ReactNode;
}

const ArchitecturalFormItem: React.FC<FormItemProps> = ({
  id,
  basePosition,
  baseRotation,
  baseScale,
  activeId,
  hoveredId,
  onSelect,
  onHover,
  reducedMotion,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentHighlight = useRef(0);

  const isActive = activeId === id;
  const isHovered = hoveredId === id;

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Compute target highlight (0 to 1)
    const targetHighlight = isActive ? 1.0 : isHovered ? 0.65 : 0.0;
    currentHighlight.current = THREE.MathUtils.lerp(
      currentHighlight.current,
      targetHighlight,
      delta * 7
    );

    if (reducedMotion) {
      group.position.set(basePosition[0], basePosition[1], basePosition[2]);
      group.rotation.set(baseRotation[0], baseRotation[1], baseRotation[2]);
      group.scale.setScalar(baseScale * (1 + currentHighlight.current * 0.06));
      return;
    }

    const time = state.clock.getElapsedTime();
    // Unique phase offset per form id
    const phaseOffset = id === 'vault' ? 0.0 : id === 'oculus' ? 2.1 : 4.2;

    // Organic idle floating movement
    const floatY = Math.sin(time * 0.65 + phaseOffset) * 0.07;
    const floatX = Math.cos(time * 0.5 + phaseOffset) * 0.04;
    const floatRotY = Math.sin(time * 0.35 + phaseOffset) * 0.04;

    // Interactive pointer tilt & forward step when active or hovered
    const pointerTiltX = -state.pointer.y * (isHovered ? 0.18 : 0.08);
    const pointerTiltY = state.pointer.x * (isHovered ? 0.22 : 0.1);
    const forwardZ = currentHighlight.current * 0.35;

    group.position.x = THREE.MathUtils.lerp(
      group.position.x,
      basePosition[0] + floatX,
      0.08
    );
    group.position.y = THREE.MathUtils.lerp(
      group.position.y,
      basePosition[1] + floatY,
      0.08
    );
    group.position.z = THREE.MathUtils.lerp(
      group.position.z,
      basePosition[2] + forwardZ,
      0.08
    );

    group.rotation.x = THREE.MathUtils.lerp(
      group.rotation.x,
      baseRotation[0] + pointerTiltX,
      0.08
    );
    group.rotation.y = THREE.MathUtils.lerp(
      group.rotation.y,
      baseRotation[1] + floatRotY + pointerTiltY,
      0.08
    );
    group.rotation.z = baseRotation[2];

    const targetScale = baseScale * (1 + currentHighlight.current * 0.06);
    group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, targetScale, 0.08));
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
          document.querySelector('.custom-cursor')?.classList.add('is-hovering');
        }
        onHover?.(id);
      }}
      onPointerOut={() => {
        if (typeof document !== 'undefined') {
          document.body.style.cursor = '';
          document.querySelector('.custom-cursor')?.classList.remove('is-hovering');
        }
        onHover?.(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(id);
      }}
    >
      {children(currentHighlight.current)}
    </group>
  );
};

export const SpatialArchitecture: React.FC<SpatialArchitectureProps> = ({
  activeId = 'vault',
  onSelect,
  hoveredId = null,
  onHover,
}) => {
  const reducedMotionRef = useRef(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const listener = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Shared obsidian frame material
  const obsidianMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#16121E'),
      roughness: 0.28,
      metalness: 0.85,
    });
  }, []);

  // Translucent dark glass inner aperture material
  const glassApertureMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#100D16'),
      transmission: 0.72,
      thickness: 1.2,
      roughness: 0.18,
      ior: 1.48,
      transparent: true,
      opacity: 0.85,
    });
  }, []);

  // Form 1 Geometries: Monolithic Vault
  const vaultArchGeom = useMemo(() => new THREE.TorusGeometry(0.85, 0.08, 16, 36, Math.PI), []);
  const vaultPillarGeom = useMemo(() => new THREE.BoxGeometry(0.16, 1.5, 0.16), []);
  const vaultVoidGeom = useMemo(() => new THREE.PlaneGeometry(1.54, 2.3), []);
  const vaultRimGeom = useMemo(() => new THREE.TorusGeometry(0.85, 0.018, 12, 36, Math.PI), []);

  // Form 2 Geometries: Oblique Oculus
  const oculusRingGeom = useMemo(() => new THREE.TorusGeometry(1.1, 0.08, 16, 48), []);
  const oculusLensGeom = useMemo(() => new THREE.CircleGeometry(1.04, 36), []);
  const oculusAccentGeom = useMemo(() => new THREE.TorusGeometry(1.1, 0.02, 12, 48), []);

  // Form 3 Geometries: Cantilever Pylon
  const pylonLeftGeom = useMemo(() => new THREE.BoxGeometry(0.18, 2.6, 0.18), []);
  const pylonRightGeom = useMemo(() => new THREE.BoxGeometry(0.18, 2.0, 0.18), []);
  const pylonLintelGeom = useMemo(() => new THREE.BoxGeometry(1.85, 0.18, 0.2), []);
  const pylonVoidGeom = useMemo(() => new THREE.PlaneGeometry(1.4, 2.1), []);
  const pylonAccentGeom = useMemo(() => new THREE.BoxGeometry(1.86, 0.025, 0.22), []);

  return (
    <group name="spatial-architecture-container">
      {/* 1. THE MONOLITHIC VAULT (Center-left, mid-depth, stately verticality) */}
      <ArchitecturalFormItem
        id="vault"
        basePosition={[-1.9, 0.2, -0.6]}
        baseRotation={[0.1, 0.38, -0.04]}
        baseScale={0.92}
        activeId={activeId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        reducedMotion={reducedMotionRef.current}
      >
        {(highlight) => (
          <group>
            {/* Vault Arch Crown */}
            <mesh
              geometry={vaultArchGeom}
              material={obsidianMaterial}
              position={[0, 0.75, 0]}
              rotation={[0, 0, 0]}
            />
            {/* Vault Left Pillar */}
            <mesh
              geometry={vaultPillarGeom}
              material={obsidianMaterial}
              position={[-0.85, 0, 0]}
            />
            {/* Vault Right Pillar */}
            <mesh
              geometry={vaultPillarGeom}
              material={obsidianMaterial}
              position={[0.85, 0, 0]}
            />
            {/* Inner Dark Glass Aperture */}
            <mesh
              geometry={vaultVoidGeom}
              material={glassApertureMaterial}
              position={[0, 0.35, -0.02]}
            />
            {/* Spectral Violet Glowing Rim Strip */}
            <mesh
              geometry={vaultRimGeom}
              position={[0, 0.75, 0.05]}
            >
              <meshStandardMaterial
                color="#C6A6FF"
                emissive="#C6A6FF"
                emissiveIntensity={0.35 + highlight * 0.65}
                roughness={0.2}
              />
            </mesh>
            {/* Localized Spectral Catchlight */}
            <pointLight
              color="#C6A6FF"
              intensity={0.2 + highlight * 1.1}
              distance={4.2}
              decay={2}
              position={[0, 0.5, 0.4]}
            />
          </group>
        )}
      </ArchitecturalFormItem>

      {/* 2. THE OBLIQUE OCULUS (Center-right, elevated foreground, circular lens) */}
      <ArchitecturalFormItem
        id="oculus"
        basePosition={[1.8, 0.45, 0.3]}
        baseRotation={[-0.18, -0.42, 0.12]}
        baseScale={1.02}
        activeId={activeId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        reducedMotion={reducedMotionRef.current}
      >
        {(highlight) => (
          <group>
            {/* Outer Obsidian Ring */}
            <mesh
              geometry={oculusRingGeom}
              material={obsidianMaterial}
              scale={[1.0, 1.25, 1.0]}
            />
            {/* Translucent Lens Disk */}
            <mesh
              geometry={oculusLensGeom}
              material={glassApertureMaterial}
              scale={[1.0, 1.25, 1.0]}
              position={[0, 0, -0.02]}
            />
            {/* Muted Ember Accent Ring */}
            <mesh
              geometry={oculusAccentGeom}
              scale={[1.0, 1.25, 1.0]}
              position={[0, 0, 0.05]}
            >
              <meshStandardMaterial
                color="#E5A66D"
                emissive="#E5A66D"
                emissiveIntensity={0.35 + highlight * 0.65}
                roughness={0.2}
              />
            </mesh>
            {/* Localized Ember Catchlight */}
            <pointLight
              color="#E5A66D"
              intensity={0.2 + highlight * 1.1}
              distance={4.2}
              decay={2}
              position={[0, 0, 0.4]}
            />
          </group>
        )}
      </ArchitecturalFormItem>

      {/* 3. THE CANTILEVER PYLON (Center-low, deep space, asymmetrical modernist gate) */}
      <ArchitecturalFormItem
        id="pylon"
        basePosition={[-0.1, -1.25, -1.3]}
        baseRotation={[0.22, 0.16, 0.08]}
        baseScale={0.88}
        activeId={activeId}
        hoveredId={hoveredId}
        onSelect={onSelect}
        onHover={onHover}
        reducedMotion={reducedMotionRef.current}
      >
        {(highlight) => (
          <group>
            {/* Left High Pylon */}
            <mesh
              geometry={pylonLeftGeom}
              material={obsidianMaterial}
              position={[-0.7, 0, 0]}
            />
            {/* Right Offset Pylon */}
            <mesh
              geometry={pylonRightGeom}
              material={obsidianMaterial}
              position={[0.7, -0.3, 0]}
            />
            {/* Asymmetrical Cantilever Lintel */}
            <mesh
              geometry={pylonLintelGeom}
              material={obsidianMaterial}
              position={[0.1, 1.25, 0]}
            />
            {/* Aperture Void Plane */}
            <mesh
              geometry={pylonVoidGeom}
              material={glassApertureMaterial}
              position={[0, 0.05, -0.03]}
            />
            {/* Porcelain-Violet Duotone Glowing Lintel Edge */}
            <mesh
              geometry={pylonAccentGeom}
              position={[0.1, 1.35, 0.02]}
            >
              <meshStandardMaterial
                color="#E9E1D6"
                emissive="#C6A6FF"
                emissiveIntensity={0.3 + highlight * 0.65}
                roughness={0.2}
              />
            </mesh>
            {/* Localized Duotone Catchlight */}
            <pointLight
              color="#C6A6FF"
              intensity={0.2 + highlight * 1.1}
              distance={4.2}
              decay={2}
              position={[0.1, 1.0, 0.4]}
            />
          </group>
        )}
      </ArchitecturalFormItem>
    </group>
  );
};
