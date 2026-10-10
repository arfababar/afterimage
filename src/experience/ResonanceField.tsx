import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

export interface ResonanceFieldProps {
  triggerTimestamp?: number;
  onTrigger?: () => void;
  scrollProgress?: number;
}

/**
 * RESONANCE — Organic Particle Sculpture
 *
 * Visual Concept:
 * - A compact, distinctive organic sculpture formed from 4,000 tiny particles,
 *   similar in screen footprint to the abalone hero sculpture.
 * - Palette: Smoky silver, charcoal grey, and muted lavender that stand out
 *   delicately against AFTERIMAGE's dark obsidian void with plenty of negative space.
 * - Interaction: Localized disturbance beneath cursor. As the pointer approaches or
 *   moves over the sculpture, nearby particles smoothly scatter and scramble.
 *   As the cursor moves away, particles fluidly return to their exact original
 *   positions, reforming the sculpture.
 * - Fully responsive across desktop, tablet, and mobile, with touch and reduced-motion support.
 */
function isTreeVisible(obj: THREE.Object3D | null): boolean {
  let curr = obj;
  while (curr) {
    if (!curr.visible) return false;
    curr = curr.parent;
  }
  return true;
}

export const ResonanceField: React.FC<ResonanceFieldProps> = ({
  triggerTimestamp,
  onTrigger,
}) => {
  const containerGroupRef = useRef<THREE.Group>(null);
  const sculptureGroupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  const reducedMotionRef = useRef(false);
  const pulseTimeRef = useRef(-10);
  const hasPointerMovedRef = useRef(false);
  const isDisplacedRef = useRef(false);

  // Temporary vectors and matrix for allocation-free per-frame ray projection
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPointerVec = useMemo(() => new THREE.Vector2(), []);
  const localRayOrigin = useMemo(() => new THREE.Vector3(), []);
  const localRayDirection = useMemo(() => new THREE.Vector3(), []);
  const clientPointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const { viewport } = useThree();
  const isDesktop = viewport.width >= 5.5;
  const isTablet = viewport.width >= 3.0 && viewport.width < 5.5;

  // Compact responsive scale (similar in screen footprint to the hero abalone)
  const installationScale = isDesktop ? 1.0 : isTablet ? 0.86 : 0.74;

  // Track pointer presence and viewport coordinates directly from window events
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      hasPointerMovedRef.current = true;
      let cx = 0;
      let cy = 0;
      if ('touches' in e && e.touches.length > 0) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else if ('clientX' in e) {
        cx = (e as MouseEvent).clientX;
        cy = (e as MouseEvent).clientY;
      }
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      clientPointerRef.current.x = (cx / w) * 2 - 1;
      clientPointerRef.current.y = -(cy / h) * 2 + 1;
      clientPointerRef.current.active = true;
    };
    const onLeave = () => {
      hasPointerMovedRef.current = false;
      clientPointerRef.current.active = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('touchstart', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchstart', onMove);
      window.removeEventListener('touchmove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // Reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const listener = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // UI trigger button impulse
  useEffect(() => {
    if (triggerTimestamp && triggerTimestamp > 0) {
      pulseTimeRef.current = performance.now() / 1000;
      isDisplacedRef.current = true;
    }
  }, [triggerTimestamp]);

  // Soft circular antialiased point texture
  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.92)');
      gradient.addColorStop(0.75, 'rgba(255, 255, 255, 0.28)');
      gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }, []);

  // Generate 4,000 sculpture particles with base coordinates, colors, and scramble vectors
  const sculptureData = useMemo(() => {
    const count = 4000;
    const basePositions = new Float32Array(count * 3);
    const currentPositions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const scrambleSeeds = new Float32Array(count * 3);
    const frequencies = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const surfaceCount = Math.floor(count * 0.75); // 3000 surface particles
    const ribCount = count - surfaceCount; // 1000 concentric ridge particles

    // 1. Organic Surface Shell (Fibonacci sphere distribution with harmonic shell curvature)
    for (let i = 0; i < surfaceCount; i++) {
      const v = Math.asin(1 - (2 * (i + 0.5)) / surfaceCount); // [-PI/2, PI/2]
      const u = (i * Math.PI * (3 - Math.sqrt(5))) % (Math.PI * 2); // golden ratio spiral

      let r =
        1.18 +
        0.18 * Math.cos(u - 0.3) +
        0.14 * Math.cos(2 * u + 0.4) +
        0.12 * Math.sin(3 * v) +
        0.1 * Math.cos(u) * Math.sin(2 * v) +
        0.06 * Math.sin(5 * u + v);

      // Natural concave inner hollow on one quadrant (abalone-like opening)
      const hollowWeight = Math.cos(u + 0.7) * Math.cos(v);
      if (hollowWeight > 0.15) {
        r *= 1.0 - 0.42 * Math.pow(hollowWeight - 0.15, 1.3);
      }

      const x = r * Math.cos(u) * Math.cos(v) * 1.16;
      const y = (r * Math.sin(u) * Math.cos(v) + 0.14 * Math.cos(u)) * 0.94;
      const z = (r * Math.sin(v) + 0.18 * Math.sin(u)) * 0.72;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      currentPositions[i * 3] = x;
      currentPositions[i * 3 + 1] = y;
      currentPositions[i * 3 + 2] = z;

      // Unique 3D scramble direction vector per particle
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      scrambleSeeds[i * 3] = Math.sin(phi) * Math.cos(theta);
      scrambleSeeds[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      scrambleSeeds[i * 3 + 2] = Math.cos(phi);

      frequencies[i] = 1.6 + Math.random() * 1.2;
      phases[i] = Math.random() * Math.PI * 2;

      // Color Palette: Smoky silver, charcoal grey, and muted lavender
      const isCavity = hollowWeight > 0.2;
      const colorType = Math.random();

      let cr: number;
      let cg: number;
      let cb: number;

      if (isCavity) {
        // Charcoal grey with subtle depth
        const factor = 0.4 + Math.random() * 0.15;
        cr = 0.42 * factor + 0.22;
        cg = 0.39 * factor + 0.2;
        cb = 0.48 * factor + 0.25;
      } else if (colorType < 0.46) {
        // Smoky silver
        const brightness = 0.78 + Math.random() * 0.16;
        cr = 0.82 * brightness;
        cg = 0.8 * brightness;
        cb = 0.86 * brightness;
      } else if (colorType < 0.84) {
        // Muted lavender
        const factor = 0.72 + Math.random() * 0.16;
        cr = 0.72 * factor;
        cg = 0.64 * factor;
        cb = 0.82 * factor;
      } else {
        // Medium slate charcoal
        cr = 0.52;
        cg = 0.48;
        cb = 0.58;
      }

      colors[i * 3] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;
    }

    // 2. Concentric Ridge Striations (1000 particles creating fine contour lines)
    for (let j = 0; j < ribCount; j++) {
      const idx = surfaceCount + j;
      const fraction = j / ribCount;
      const spiralAngle = fraction * 4.5 * Math.PI * 2;
      const u = spiralAngle % (Math.PI * 2);
      const v = -0.75 + 1.5 * fraction;

      let r =
        1.14 +
        0.18 * Math.cos(u - 0.3) +
        0.14 * Math.cos(2 * u + 0.4) +
        0.12 * Math.sin(3 * v) +
        0.1 * Math.cos(u) * Math.sin(2 * v);

      const hollowWeight = Math.cos(u + 0.7) * Math.cos(v);
      if (hollowWeight > 0.15) {
        r *= 1.0 - 0.42 * Math.pow(hollowWeight - 0.15, 1.3);
      }

      // Subtle stratified ridge stepping
      r += Math.sin(spiralAngle * 3.0) * 0.04;

      const x = r * Math.cos(u) * Math.cos(v) * 1.16;
      const y = (r * Math.sin(u) * Math.cos(v) + 0.14 * Math.cos(u)) * 0.94;
      const z = (r * Math.sin(v) + 0.18 * Math.sin(u)) * 0.72;

      basePositions[idx * 3] = x;
      basePositions[idx * 3 + 1] = y;
      basePositions[idx * 3 + 2] = z;

      currentPositions[idx * 3] = x;
      currentPositions[idx * 3 + 1] = y;
      currentPositions[idx * 3 + 2] = z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      scrambleSeeds[idx * 3] = Math.sin(phi) * Math.cos(theta);
      scrambleSeeds[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      scrambleSeeds[idx * 3 + 2] = Math.cos(phi);

      frequencies[idx] = 1.6 + Math.random() * 1.2;
      phases[idx] = Math.random() * Math.PI * 2;

      // Striations: luminous smoky silver and muted lavender
      const isLavender = j % 3 === 0;
      if (isLavender) {
        colors[idx * 3] = 0.75;
        colors[idx * 3 + 1] = 0.66;
        colors[idx * 3 + 2] = 0.85;
      } else {
        colors[idx * 3] = 0.85;
        colors[idx * 3 + 1] = 0.83;
        colors[idx * 3 + 2] = 0.89;
      }
    }

    return {
      basePositions,
      currentPositions,
      velocities,
      scrambleSeeds,
      frequencies,
      phases,
      colors,
    };
  }, []);

  // Buffer geometry setup
  const pointsGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      'position',
      new THREE.BufferAttribute(sculptureData.currentPositions, 3)
    );
    geom.setAttribute(
      'color',
      new THREE.BufferAttribute(sculptureData.colors, 3)
    );
    return geom;
  }, [sculptureData]);

  // Points material with smooth circular disc map and vertex colors
  const pointsMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: isDesktop ? 0.038 : 0.032,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.94,
      alphaTest: 0.005,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.NormalBlending,
    });
  }, [particleTexture, isDesktop]);

  // Clean disposal on unmount
  useEffect(() => {
    return () => {
      pointsGeom.dispose();
      pointsMaterial.dispose();
      particleTexture.dispose();
    };
  }, [pointsGeom, pointsMaterial, particleTexture]);

  // Real-time particle interaction and spring-return physics loop
  useFrame((state, delta) => {
    const container = containerGroupRef.current;
    const sculptureGroup = sculptureGroupRef.current;
    if (!container || !sculptureGroup || !isTreeVisible(container)) return;

    const time = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.025);

    // If reduced motion is requested, keep sculpture static and particles at base positions
    if (reducedMotionRef.current) {
      sculptureGroup.rotation.set(0, 0, 0);
      sculptureGroup.position.set(0, 0, 0);
      return;
    }

    // Slow, stately organic rotation & breathing drift
    sculptureGroup.rotation.y = time * 0.07;
    sculptureGroup.rotation.x = Math.sin(time * 0.05) * 0.04;
    sculptureGroup.position.y = Math.sin(time * 0.45) * 0.03;

    // Track pointer movement
    if (
      !hasPointerMovedRef.current &&
      (state.pointer.x !== 0 || state.pointer.y !== 0)
    ) {
      hasPointerMovedRef.current = true;
    }

    let isPointerNear = false;
    let distToCenter = 999;

    if (hasPointerMovedRef.current) {
      // 1. Explicitly update raycaster from current normalized pointer (viewport-tracked) and active camera
      if (clientPointerRef.current.active) {
        tempPointerVec.set(clientPointerRef.current.x, clientPointerRef.current.y);
      } else {
        tempPointerVec.set(state.pointer.x, state.pointer.y);
      }
      state.raycaster.setFromCamera(tempPointerVec, state.camera);

      // 2. Ensure world matrix of sculpture is fully updated including parent transforms
      sculptureGroup.updateWorldMatrix(true, false);

      // 3. Transform world ray into the sculpture's local coordinate space
      tempMatrix.copy(sculptureGroup.matrixWorld).invert();
      localRayOrigin.copy(state.raycaster.ray.origin).applyMatrix4(tempMatrix);
      localRayDirection
        .copy(state.raycaster.ray.direction)
        .transformDirection(tempMatrix)
        .normalize();

      // 4. Test distance from local ray to sculpture center (0, 0, 0)
      const w0x = -localRayOrigin.x;
      const w0y = -localRayOrigin.y;
      const w0z = -localRayOrigin.z;
      const t0 =
        w0x * localRayDirection.x +
        w0y * localRayDirection.y +
        w0z * localRayDirection.z;

      const q0x = localRayOrigin.x + t0 * localRayDirection.x;
      const q0y = localRayOrigin.y + t0 * localRayDirection.y;
      const q0z = localRayOrigin.z + t0 * localRayDirection.z;
      distToCenter = Math.hypot(q0x, q0y, q0z);

      // Active when cursor sightline passes within sculpture proximity envelope
      isPointerNear = distToCenter < 2.0;
    }

    const pulseDt = time - pulseTimeRef.current;
    const isPulseActive = pulseDt >= 0 && pulseDt < 1.6;

    if (isPointerNear || isPulseActive) {
      isDisplacedRef.current = true;
    }

    // Skip expensive 4,000 particle loop and GPU attribute updates if particles are at rest
    if (!isDisplacedRef.current) {
      return;
    }

    const lox = localRayOrigin.x;
    const loy = localRayOrigin.y;
    const loz = localRayOrigin.z;
    const ldx = localRayDirection.x;
    const ldy = localRayDirection.y;
    const ldz = localRayDirection.z;

    const pulseRadius = pulseDt * 2.2;

    const posAttr = pointsGeom.attributes.position as THREE.BufferAttribute;
    const count = sculptureData.basePositions.length / 3;
    const interactionRadius = 1.10; // Generous perpendicular cylinder radius around ray sightline
    const interactionRadiusSq = interactionRadius * interactionRadius;
    let maxDispSq = 0;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const bx = sculptureData.basePositions[idx];
      const by = sculptureData.basePositions[idx + 1];
      const bz = sculptureData.basePositions[idx + 2];

      let cx = sculptureData.currentPositions[idx];
      let cy = sculptureData.currentPositions[idx + 1];
      let cz = sculptureData.currentPositions[idx + 2];

      let vx = sculptureData.velocities[idx];
      let vy = sculptureData.velocities[idx + 1];
      let vz = sculptureData.velocities[idx + 2];

      // 1. Hooke's spring restoration toward original resting position
      const restForceX = (bx - cx) * 12.0;
      const restForceY = (by - cy) * 12.0;
      const restForceZ = (bz - cz) * 12.0;

      // 2. Velocity damping (near-critical damping: 2 * sqrt(12) ~= 6.93)
      const dampForceX = -vx * 6.2;
      const dampForceY = -vy * 6.2;
      const dampForceZ = -vz * 6.2;

      let scatterForceX = 0;
      let scatterForceY = 0;
      let scatterForceZ = 0;

      // 3. Localized Pointer Scatter & Scramble
      if (isPointerNear) {
        // Vector from local ray origin to current particle position
        const wx = cx - lox;
        const wy = cy - loy;
        const wz = cz - loz;

        // Projection of particle onto ray sightline
        const t = wx * ldx + wy * ldy + wz * ldz;

        // Closest point on ray to particle
        const qx = lox + t * ldx;
        const qy = loy + t * ldy;
        const qz = loz + t * ldz;

        // Perpendicular vector from ray to particle
        const rx = cx - qx;
        const ry = cy - qy;
        const rz = cz - qz;
        const perpDistSq = rx * rx + ry * ry + rz * rz;

        if (perpDistSq < interactionRadiusSq) {
          const perpDist = Math.sqrt(perpDistSq);
          const normDist = perpDist / interactionRadius;
          // Smooth Hermite falloff: maximum at ray center, tapering smoothly to 0 at boundary
          const factor =
            (1.0 - normDist) *
            (1.0 - normDist) *
            (3.0 - 2.0 * (1.0 - normDist));

          // Strong radial push away from cursor ray line
          const rLen = perpDist + 0.001;
          const dirX = rx / rLen;
          const dirY = ry / rLen;
          const dirZ = rz / rLen;
          const pushMag = factor * 18.0;

          // Organic 3D scramble (unique per-particle seed)
          const freq = sculptureData.frequencies[i];
          const phase = sculptureData.phases[i];
          const osc = Math.sin(time * freq + phase);
          const scrambleMag = factor * 6.5 * osc;
          const sx = sculptureData.scrambleSeeds[idx] * scrambleMag;
          const sy = sculptureData.scrambleSeeds[idx + 1] * scrambleMag;
          const sz = sculptureData.scrambleSeeds[idx + 2] * scrambleMag;

          // Tangential curl around the ray for smooth fluid turbulence
          const curlX = -dirY * factor * 2.8;
          const curlY = dirX * factor * 2.8;
          const curlZ = dirZ * factor * 2.0;

          scatterForceX = dirX * pushMag + sx + curlX;
          scatterForceY = dirY * pushMag + sy + curlY;
          scatterForceZ = dirZ * pushMag + sz + curlZ;
        }
      }

      // 4. Click / HUD impulse wave (smooth outward ripple)
      if (isPulseActive) {
        const distCenter = Math.hypot(bx, by, bz);
        const waveDelta = Math.abs(distCenter - pulseRadius);
        if (waveDelta < 0.4) {
          const waveFactor =
            Math.exp(-(waveDelta * waveDelta) / 0.04) *
            Math.exp(-pulseDt * 1.6) *
            3.2;
          const dirC = distCenter + 0.001;
          scatterForceX += (bx / dirC) * waveFactor;
          scatterForceY += (by / dirC) * waveFactor;
          scatterForceZ += (bz / dirC) * waveFactor;
        }
      }

      // Acceleration & Euler integration
      const ax = restForceX + dampForceX + scatterForceX;
      const ay = restForceY + dampForceY + scatterForceY;
      const az = restForceZ + dampForceZ + scatterForceZ;

      vx += ax * dt;
      vy += ay * dt;
      vz += az * dt;

      cx += vx * dt;
      cy += vy * dt;
      cz += vz * dt;

      sculptureData.velocities[idx] = vx;
      sculptureData.velocities[idx + 1] = vy;
      sculptureData.velocities[idx + 2] = vz;

      sculptureData.currentPositions[idx] = cx;
      sculptureData.currentPositions[idx + 1] = cy;
      sculptureData.currentPositions[idx + 2] = cz;

      const dpx = cx - bx;
      const dpy = cy - by;
      const dpz = cz - bz;
      const dispSq = dpx * dpx + dpy * dpy + dpz * dpz;
      if (dispSq > maxDispSq) maxDispSq = dispSq;
    }

    posAttr.needsUpdate = true;

    // Check if particles have returned to rest and cursor is not disturbing them
    if (!isPointerNear && !isPulseActive && maxDispSq < 0.00003) {
      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        sculptureData.currentPositions[idx] = sculptureData.basePositions[idx];
        sculptureData.currentPositions[idx + 1] = sculptureData.basePositions[idx + 1];
        sculptureData.currentPositions[idx + 2] = sculptureData.basePositions[idx + 2];
        sculptureData.velocities[idx] = 0;
        sculptureData.velocities[idx + 1] = 0;
        sculptureData.velocities[idx + 2] = 0;
      }
      posAttr.needsUpdate = true;
      isDisplacedRef.current = false;
    }
  });

  return (
    <group
      ref={containerGroupRef}
      name="resonance-particle-sculpture-container"
      position={[isDesktop ? 1.5 : 0, isDesktop ? 0 : -0.2, 0]}
      scale={installationScale}
    >
      {/* Invisible interaction hit proxy sphere that receives native R3F pointer events */}
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          if (typeof document !== 'undefined') {
            document.body.style.cursor = 'pointer';
            document.querySelector('.custom-cursor')?.classList.add('is-hovering');
          }
        }}
        onPointerOut={() => {
          if (typeof document !== 'undefined') {
            document.body.style.cursor = '';
            document.querySelector('.custom-cursor')?.classList.remove('is-hovering');
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          pulseTimeRef.current = performance.now() / 1000;
          isDisplacedRef.current = true;
          onTrigger?.();
        }}
      >
        <sphereGeometry args={[1.75, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* The Particle Sculpture */}
      <group ref={sculptureGroupRef}>
        <points
          ref={pointsRef}
          geometry={pointsGeom}
          material={pointsMaterial}
          raycast={() => null}
        />
      </group>
    </group>
  );
};
