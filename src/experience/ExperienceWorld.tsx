import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap, useGSAP, ScrollTrigger } from '../motion/registerGsap';
import { HeroArtifact } from './HeroArtifact';
import { SpatialArchitecture } from './SpatialArchitecture';
import { ArtifactsShowcase } from './ArtifactsShowcase';
import { ResonanceField } from './ResonanceField';
import { GenesisAtmosphere } from './GenesisAtmosphere';
import { GenesisSanctum } from './GenesisSanctum';

export interface ExperienceWorldProps {
  activeArchitectureId?: string;
  onSelectArchitecture?: (id: string) => void;
  hoveredArchitectureId?: string | null;
  onHoverArchitecture?: (id: string | null) => void;
  activeArtifactId?: string;
  onSelectArtifact?: (id: string) => void;
  hoveredArtifactId?: string | null;
  onHoverArtifact?: (id: string | null) => void;
  artifactTriggerTimestamp?: number;
  resonanceTriggerTimestamp?: number;
  onTriggerResonance?: () => void;
}

const GlobalAtmosphere: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const isReducedRef = useRef(false);

  React.useEffect(() => {
    isReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const particleData = React.useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);

    const softRoseHaze = new THREE.Color('#B98B9F');
    const dustyRose = new THREE.Color('#C49AAE');
    const mutedMauve = new THREE.Color('#96758F');
    const champagneGlow = new THREE.Color('#E8CDAF');
    const softRoseIvory = new THREE.Color('#F0E0E4');
    const roseAmber = new THREE.Color('#C98570');
    const palette = [softRoseHaze, dustyRose, mutedMauve, champagneGlow, softRoseIvory, roseAmber];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22.0 - 2.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12.0;

      const col = palette[i % palette.length];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 2] = 0.5 + Math.random() * 0.5;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geom, positions, seeds, count };
  }, []);

  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    return tex;
  }, []);

  const material = React.useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.042,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [texture]
  );

  React.useEffect(() => {
    return () => {
      particleData.geom.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [particleData, material, texture]);

  useFrame((state) => {
    if (isReducedRef.current) return;
    const time = state.clock.getElapsedTime();
    const pos = particleData.geom.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < particleData.count; i++) {
      const idx = i * 3;
      const sx = particleData.seeds[idx];
      const sy = particleData.seeds[idx + 1];
      const speed = particleData.seeds[idx + 2];

      arr[idx] += Math.sin(time * 0.22 * speed + sx) * 0.0028;
      arr[idx + 1] += Math.cos(time * 0.18 * speed + sy) * 0.0032;
      arr[idx + 2] += Math.sin(time * 0.15 * speed + sx + sy) * 0.0018;
    }
    pos.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={particleData.geom} material={material} raycast={() => null} />;
};

/**
 * Luminous Volumetric Horizon:
 * An expansive, living atmospheric light field spanning the deep horizon.
 * In Chapter 1 (Threshold): Projects a moonlit silver & ethereal lavender aura behind the dark silhouette.
 * In Chapter 2 (The Afterimage): Blooms into radiant champagne gold, warm glowing amber, pale rose, and iridescent blue.
 */
interface ChapterAtmosphere {
  core: THREE.Color;
  mid: THREE.Color;
  fringe: THREE.Color;
  alpha: number;
  fog: THREE.Color;
  fogFar: number;
  fogNear: number;
  keyColor: THREE.Color;
  keyIntensity: number;
  rimColor: THREE.Color;
  rimIntensity: number;
  topIntensity: number;
}

const CHAPTER_ATMOSPHERE: ChapterAtmosphere[] = [
  // 0: THRESHOLD (Section 02) — Luminous Dusty Rose, Warm Champagne, Velvet Rose Plum
  {
    core: new THREE.Color('#F0D5C4'),
    mid: new THREE.Color('#C49AAE'),
    fringe: new THREE.Color('#4E384A'),
    alpha: 0.88,
    fog: new THREE.Color('#3E2B3C'),
    fogFar: 24,
    fogNear: 6.5,
    keyColor: new THREE.Color('#F0E0E4'),
    keyIntensity: 1.35,
    rimColor: new THREE.Color('#E8CDAF'),
    rimIntensity: 1.1,
    topIntensity: 0.45,
  },
  // 1: AFTERIMAGE (Section 03) — Soft Rose Ivory, Soft Rose Haze & Rose Plum
  {
    core: new THREE.Color('#F0E0E4'),
    mid: new THREE.Color('#B98B9F'),
    fringe: new THREE.Color('#443042'),
    alpha: 0.86,
    fog: new THREE.Color('#3A2838'),
    fogFar: 26,
    fogNear: 6.5,
    keyColor: new THREE.Color('#E8CDAF'),
    keyIntensity: 1.6,
    rimColor: new THREE.Color('#C49AAE'),
    rimIntensity: 1.25,
    topIntensity: 0.65,
  },
  // 2: SPATIAL ARCHITECTURE (Section 04) — Pale Rose Travertine, Muted Mauve & Warm Plum Charcoal
  {
    core: new THREE.Color('#EAD5DE'),
    mid: new THREE.Color('#96758F'),
    fringe: new THREE.Color('#3C293A'),
    alpha: 0.85,
    fog: new THREE.Color('#352534'),
    fogFar: 25,
    fogNear: 6.5,
    keyColor: new THREE.Color('#F0E0E4'),
    keyIntensity: 1.5,
    rimColor: new THREE.Color('#C49AAE'),
    rimIntensity: 1.15,
    topIntensity: 0.6,
  },
  // 3: ARTIFACTS (Section 05) — Luminous Rose Pearl, Soft Rose Haze & Velvet Rose Shadow
  {
    core: new THREE.Color('#F3E4EA'),
    mid: new THREE.Color('#B98B9F'),
    fringe: new THREE.Color('#3A2737'),
    alpha: 0.84,
    fog: new THREE.Color('#332332'),
    fogFar: 25,
    fogNear: 6.5,
    keyColor: new THREE.Color('#E8CDAF'),
    keyIntensity: 1.55,
    rimColor: new THREE.Color('#96758F'),
    rimIntensity: 1.2,
    topIntensity: 0.65,
  },
  // 4: RESONANCE (Section 06) — Soft Mauve Silver, Muted Mauve & Velvet Rose Shadow
  {
    core: new THREE.Color('#DEC4D2'),
    mid: new THREE.Color('#96758F'),
    fringe: new THREE.Color('#382735'),
    alpha: 0.85,
    fog: new THREE.Color('#322230'),
    fogFar: 24,
    fogNear: 6.5,
    keyColor: new THREE.Color('#E8CDAF'),
    keyIntensity: 1.45,
    rimColor: new THREE.Color('#C98570'),
    rimIntensity: 1.15,
    topIntensity: 0.58,
  },
  // 5: CODA (Section 07) — Champagne Gold Dawn, Muted Rose Amber & Velvet Rose Plum
  {
    core: new THREE.Color('#F0D5BE'),
    mid: new THREE.Color('#C98570'),
    fringe: new THREE.Color('#5A3D50'),
    alpha: 0.90,
    fog: new THREE.Color('#422D3E'),
    fogFar: 27,
    fogNear: 7.5,
    keyColor: new THREE.Color('#F5E5D8'),
    keyIntensity: 1.65,
    rimColor: new THREE.Color('#C98570'),
    rimIntensity: 1.1,
    topIntensity: 0.72,
  },
];

interface LuminousVolumetricHorizonProps {
  progressRef: React.MutableRefObject<number>;
}

const LuminousVolumetricHorizon: React.FC<LuminousVolumetricHorizonProps> = ({ progressRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderMatRef = useRef<THREE.ShaderMaterial>(null);

  const tempCore = React.useMemo(() => new THREE.Color(), []);
  const tempMid = React.useMemo(() => new THREE.Color(), []);
  const tempFringe = React.useMemo(() => new THREE.Color(), []);

  const horizonMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uColorCore: { value: new THREE.Color('#F0D5C4') },
        uColorMid: { value: new THREE.Color('#C49AAE') },
        uColorFringe: { value: new THREE.Color('#4E384A') },
        uAlpha: { value: 0.88 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uPointer;
        uniform vec3 uColorCore;
        uniform vec3 uColorMid;
        uniform vec3 uColorFringe;
        uniform float uAlpha;

        varying vec2 vUv;

        void main() {
          vec2 centered = (vUv - vec2(0.5, 0.46)) * 2.0;
          centered.x += uPointer.x * 0.08;
          centered.y += uPointer.y * 0.05;
          centered.y *= 1.18;

          float dist = length(centered);
          float wave = sin(atan(centered.y, centered.x) * 3.0 + uTime * 0.22) * 0.035;
          float r = dist + wave;

          // Radial atmospheric color field: Core -> Mid -> Fringe
          float midBlend = smoothstep(0.06, 0.65, r);
          vec3 atmosphereColor = mix(uColorCore, uColorMid, midBlend);

          float fringeBlend = smoothstep(0.50, 1.35, r);
          atmosphereColor = mix(atmosphereColor, uColorFringe, fringeBlend);

          // Subtle organic vignette toward the far perimeter to frame the 3D scene
          float vig = 1.0 - smoothstep(1.25, 2.15, dist);
          atmosphereColor *= vig;

          // Gentle opacity curve ensuring rich colored background everywhere without empty voids
          float alpha = uAlpha * clamp(0.72 + (1.0 - smoothstep(0.0, 1.4, r)) * 0.24, 0.0, 1.0);

          gl_FragColor = vec4(atmosphereColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
  }, []);

  useFrame((state) => {
    if (!shaderMatRef.current) return;
    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 5);
    const idx = Math.floor(progress);
    const nextIdx = Math.min(idx + 1, CHAPTER_ATMOSPHERE.length - 1);
    const t = progress - idx;

    const curr = CHAPTER_ATMOSPHERE[idx];
    const nxt = CHAPTER_ATMOSPHERE[nextIdx];

    tempCore.lerpColors(curr.core, nxt.core, t);
    tempMid.lerpColors(curr.mid, nxt.mid, t);
    tempFringe.lerpColors(curr.fringe, nxt.fringe, t);
    const alpha = THREE.MathUtils.lerp(curr.alpha, nxt.alpha, t);

    shaderMatRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    shaderMatRef.current.uniforms.uColorCore.value.copy(tempCore);
    shaderMatRef.current.uniforms.uColorMid.value.copy(tempMid);
    shaderMatRef.current.uniforms.uColorFringe.value.copy(tempFringe);
    shaderMatRef.current.uniforms.uAlpha.value = alpha;
    shaderMatRef.current.uniforms.uPointer.value.set(
      state.pointer.x * 0.25,
      state.pointer.y * 0.2
    );
  });

  return (
    <mesh ref={meshRef} position={[0, 0.4, -14]} scale={[42, 28, 1]}>
      <planeGeometry args={[1, 1, 16, 16]} />
      <primitive object={horizonMaterial} ref={shaderMatRef} attach="material" />
    </mesh>
  );
};

export const ExperienceWorld: React.FC<ExperienceWorldProps> = ({
  activeArchitectureId,
  onSelectArchitecture,
  hoveredArchitectureId,
  onHoverArchitecture,
  activeArtifactId,
  onSelectArtifact,
  hoveredArtifactId,
  onHoverArtifact,
  artifactTriggerTimestamp,
  resonanceTriggerTimestamp,
  onTriggerResonance,
}) => {
  const scrollRigRef = useRef<THREE.Group>(null);
  const architectureGroupRef = useRef<THREE.Group>(null);
  const artifactsGroupRef = useRef<THREE.Group>(null);
  const resonanceGroupRef = useRef<THREE.Group>(null);
  const genesisGroupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const topLightRef = useRef<THREE.PointLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const prefersReducedRef = useRef(false);

  // Cinematic camera travel coordinates & continuous global chapter journey progress (0.0 to 5.0)
  // Section 1 (Genesis) starts at (0, 0.05, 3.8) for full-body character framing
  const baseCameraPos = useRef(new THREE.Vector3(0, 0.05, 3.8));
  const baseCameraRot = useRef(new THREE.Euler(0, 0, 0));
  const journeyProgress = useRef(0.0);
  const genesisOpacityRef = useRef(1.0);
  const genesisBloomRef = useRef(0.0);

  // Memoized temporary colors for zero-allocation per-frame lighting and fog interpolation
  const tempFog = React.useMemo(() => new THREE.Color(), []);
  const tempKeyColor = React.useMemo(() => new THREE.Color(), []);
  const tempRimColor = React.useMemo(() => new THREE.Color(), []);

  const { viewport, gl, scene, camera } = useThree();

  React.useEffect(() => {
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Pre-warm WebGL shader pipelines for all 3D installations so transitions never hitch
    if (architectureGroupRef.current) architectureGroupRef.current.visible = true;
    if (artifactsGroupRef.current) artifactsGroupRef.current.visible = true;
    if (resonanceGroupRef.current) resonanceGroupRef.current.visible = true;

    try {
      gl.compile(scene, camera);
    } catch {
      // Graceful fallback if compile is unsupported
    }

    if (architectureGroupRef.current) architectureGroupRef.current.visible = false;
    if (artifactsGroupRef.current) artifactsGroupRef.current.visible = false;
    if (resonanceGroupRef.current) resonanceGroupRef.current.visible = false;
  }, [gl, scene, camera]);

  // Smooth pointer interpolation targets for lights (no React state in animation loop)
  const lightPointer = useRef({ x: 0, y: 0 });

  useGSAP(() => {
    const rig = scrollRigRef.current;
    const archGroup = architectureGroupRef.current;
    if (!rig) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive coordinate calculation: framed on right in THRESHOLD, center-left in AFTERIMAGE
    const isDesktop = viewport.width >= 5.5;
    const startX = isDesktop ? Math.min(viewport.width * 0.22, 2.2) : 0;
    const startY = isDesktop ? 0.05 : 0.35;
    const startZ = isDesktop ? 0 : -0.6;
    const startScale = isDesktop ? 0.9 : Math.min(Math.max(viewport.width / 8.0, 0.48), 0.65);

    // Responsive scaling for spatial architecture portals on narrower viewports
    const archScale = isDesktop ? 1.0 : Math.min(Math.max(viewport.width / 8.0, 0.52), 0.78);
    const archEndY = isDesktop ? 0 : -0.35;

    // Responsive scaling for floating abstract artifacts (handled directly within ArtifactsShowcase for precise per-breakpoint framing)
    const artifactsScale = 1.0;
    const artifactsEndY = 0;

    // Responsive scaling for immersive resonance field
    const resonanceScale = isDesktop ? 1.0 : Math.min(Math.max(viewport.width / 7.5, 0.58), 0.85);
    const resonanceEndY = isDesktop ? 0 : -0.15;

    // Set initial position: rig starts submerged and hidden during Section 1
    rig.position.set(startX, startY - 18.0, startZ - 5.0);
    rig.scale.setScalar(startScale);
    rig.rotation.y = 0;
    rig.visible = false;

    // Initial position for spatial architecture group (submerged in lower fog)
    if (archGroup) {
      archGroup.position.set(0, -22.0, -8.0);
      archGroup.scale.setScalar(archScale);
    }

    // Initial position for artifacts group (submerged in lower fog)
    const artifactsGroup = artifactsGroupRef.current;
    if (artifactsGroup) {
      artifactsGroup.position.set(0, -22.0, -8.0);
      artifactsGroup.scale.setScalar(artifactsScale);
    }

    // Initial position for resonance field group (submerged in lower fog)
    const resonanceGroup = resonanceGroupRef.current;
    if (resonanceGroup) {
      resonanceGroup.position.set(0, -22.0, -8.0);
      resonanceGroup.scale.setScalar(resonanceScale);
    }

    // Initial visibility state: inactive groups start hidden to prevent cross-section bleed
    if (archGroup) archGroup.visible = false;
    if (artifactsGroup) artifactsGroup.visible = false;
    if (resonanceGroup) resonanceGroup.visible = false;
    const genesisGroup = genesisGroupRef.current;
    if (genesisGroup) genesisGroup.visible = true;

    // Isolate 3D installations to their respective sections (works in both normal and reduced motion)
    if (archGroup) {
      ScrollTrigger.create({
        trigger: '#architecture',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (archGroup) archGroup.visible = self.isActive;
        },
      });
    }

    if (artifactsGroup) {
      ScrollTrigger.create({
        trigger: '#artifacts',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (artifactsGroup) artifactsGroup.visible = self.isActive;
        },
      });
    }

    if (resonanceGroup) {
      ScrollTrigger.create({
        trigger: '#resonance',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (resonanceGroup) resonanceGroup.visible = self.isActive;
        },
      });
    }

    // Cull hero artifact when submerged beyond spatial architecture into artifacts/resonance/coda
    ScrollTrigger.create({
      trigger: '#artifacts',
      start: 'top 50%',
      onEnter: () => {
        if (rig) rig.visible = false;
      },
      onLeaveBack: () => {
        if (rig) {
          const genesisEl = document.querySelector('#genesis');
          const genesisBottom = genesisEl ? genesisEl.getBoundingClientRect().bottom : -1;
          // Only re-show rig if we are not back in Section 1
          if (genesisBottom <= 80) {
            rig.visible = true;
          }
        }
      },
    });

    if (genesisGroup) {
      genesisGroup.visible = true;
      ScrollTrigger.create({
        trigger: '#genesis',
        start: 'top 80px',
        end: 'bottom top',
        onLeave: () => {
          if (genesisGroup) genesisGroup.visible = false;
        },
        onEnterBack: () => {
          if (genesisGroup) genesisGroup.visible = true;
        },
        onLeaveBack: () => {
          if (genesisGroup) genesisGroup.visible = true;
        },
      });
    }

    if (prefersReduced) {
      if (genesisGroup) genesisGroup.visible = false;
      if (archGroup) {
        archGroup.position.set(0, archEndY, 0);
        archGroup.scale.setScalar(archScale);
      }
      if (artifactsGroup) {
        artifactsGroup.position.set(0, artifactsEndY, 0);
        artifactsGroup.scale.setScalar(artifactsScale);
      }
      if (resonanceGroup) {
        resonanceGroup.position.set(0, resonanceEndY, 0);
        resonanceGroup.scale.setScalar(resonanceScale);
      }
      return;
    }

    // Timeline 0: GENESIS -> THRESHOLD
    // Cinematic scroll-driven camera journey:
    // Phase 1 (0.00 -> 0.42): Full-body view approaches upper-body
    // Phase 2 (0.42 -> 0.76): Upper-body approaches intimate face close-up
    // Phase 3 (0.76 -> 0.92): Pushes through face into warm luminous veil/bloom
    // Phase 4 (0.92 -> 1.00): Handoff into Section 2 with zero coordinate snaps
    const genesisTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#genesis',
        start: 'top 80px',
        end: 'bottom top',
        scrub: 0.45,
        invalidateOnRefresh: true,
      },
    });

    genesisTl
      .fromTo(
        journeyProgress,
        { current: 0.0 },
        { current: 0.0, duration: 1.0 },
        0
      )
      // Phase 1: Camera approach from full-body (z: 3.8, y: 0.05) to upper-body (z: 1.7, y: 0.36)
      .fromTo(
        baseCameraPos.current,
        { x: 0, y: 0.05, z: 3.8 },
        { x: 0, y: 0.36, z: 1.7, duration: 0.42, ease: 'sine.inOut' },
        0
      )
      // Phase 2: Camera advances to face close-up (z: 0.72, y: 0.62)
      .to(
        baseCameraPos.current,
        { x: 0, y: 0.62, z: 0.72, duration: 0.34, ease: 'sine.inOut' },
        0.42
      )
      // Phase 3: Push-through past face into radiant veil (z: 0.28, y: 0.62)
      .to(
        baseCameraPos.current,
        { x: 0, y: 0.62, z: 0.28, duration: 0.16, ease: 'power2.in' },
        0.76
      )
      // Phase 4: Settle camera at Section 2 starting coordinates (z: 6.2, y: 0.0)
      .to(
        baseCameraPos.current,
        { x: 0, y: 0.0, z: 6.2, duration: 0.08, ease: 'power2.out' },
        0.92
      )
      // Character Opacity: 100% visible throughout approach, gently dissipates during veil penetration
      .fromTo(
        genesisOpacityRef,
        { current: 1.0 },
        { current: 1.0, duration: 0.76 },
        0
      )
      .to(
        genesisOpacityRef,
        { current: 0.0, duration: 0.16, ease: 'power2.in' },
        0.76
      )
      // Transition Bloom: warm peach & ivory screen bloom activates during face penetration, clears for Section 2
      .fromTo(
        genesisBloomRef,
        { current: 0.0 },
        { current: 0.0, duration: 0.76 },
        0
      )
      .to(
        genesisBloomRef,
        { current: 1.0, duration: 0.16, ease: 'power2.in' },
        0.76
      )
      .to(
        genesisBloomRef,
        { current: 0.0, duration: 0.08, ease: 'power2.out' },
        0.92
      );

    if (rig) {
      // Threshold sculpture is hidden in Section 1, becomes visible during bloom handoff to Section 2
      genesisTl.set(rig, { visible: false }, 0);
      genesisTl.set(rig, { visible: true }, 0.76);
      genesisTl.fromTo(
        rig.position,
        { x: startX, y: startY - 18.0, z: startZ - 5.0 },
        { x: startX, y: startY, z: startZ, duration: 0.24, ease: 'power2.out', immediateRender: false },
        0.76
      );
    }

    // Destination in Section 2 (AFTERIMAGE):
    // Framed gracefully on the left (desktop) with full height visibility
    // Avoids over-zooming so the crystalline spires and base are fully intact
    const endX = isDesktop ? -Math.min(viewport.width * 0.22, 2.1) : 0;
    const endY = isDesktop ? 0 : -0.2;
    const endZ = isDesktop ? 0.2 : -0.2;
    const endScale = isDesktop ? 1.0 : Math.min(Math.max(viewport.width / 7.5, 0.52), 0.72);

    // Timeline 1: THRESHOLD -> AFTERIMAGE
    // Cinematic Villa Aurelia-style camera flight and atmospheric transformation
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#afterimage',
        start: 'top bottom',
        end: 'top 40%',
        scrub: 0.45,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(journeyProgress, { current: 0.0 }, { current: 1.0, ease: 'power2.inOut', immediateRender: false }, 0)
      .fromTo(
        baseCameraPos.current,
        {
          x: 0,
          y: 0,
          z: 6.2,
        },
        {
          x: isDesktop ? 0.38 : 0.15,
          y: -0.22,
          z: 4.6,
          duration: 0.48,
          ease: 'power1.inOut',
          immediateRender: false,
        },
        0
      )
      .fromTo(
        baseCameraRot.current,
        { z: 0 },
        {
          z: -0.022,
          duration: 0.48,
          ease: 'power1.inOut',
          immediateRender: false,
        },
        0
      )
      .to(
        baseCameraPos.current,
        {
          x: isDesktop ? -0.32 : 0,
          y: 0.08,
          z: 5.6,
          duration: 0.52,
          ease: 'power2.out',
        },
        0.48
      )
      .to(
        baseCameraRot.current,
        {
          z: 0,
          duration: 0.52,
          ease: 'power2.out',
        },
        0.48
      )
      .to(
        rig.position,
        {
          x: endX,
          y: endY,
          z: endZ,
          ease: 'power2.out',
        },
        0
      )
      .to(
        rig.scale,
        {
          x: endScale,
          y: endScale,
          z: endScale,
          ease: 'power2.out',
        },
        0
      )
      .to(
        rig.rotation,
        {
          y: Math.PI * 0.85,
          x: 0.12,
          z: -0.06,
          ease: 'power1.inOut',
        },
        0
      );

    // Timeline 2: AFTERIMAGE -> SPATIAL ARCHITECTURE
    // Gracefully recedes the central iridescent sculpture into atmospheric fog
    // and brings the architectural installation into focal view
    if (archGroup) {
      const archTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#architecture',
          start: 'top bottom',
          end: 'top 15%',
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
      });

      archTl
        .fromTo(journeyProgress, { current: 1.0 }, { current: 2.0, ease: 'power2.inOut', immediateRender: false }, 0)
        .fromTo(
          baseCameraPos.current,
          {
            x: isDesktop ? -0.32 : 0,
            y: 0.08,
            z: 5.6,
          },
          {
            x: isDesktop ? 0.28 : 0.12,
            y: -0.14,
            z: 5.1,
            duration: 0.46,
            ease: 'power1.inOut',
            immediateRender: false,
          },
          0
        )
        .fromTo(
          baseCameraRot.current,
          { z: 0 },
          {
            z: 0.018,
            duration: 0.46,
            ease: 'power1.inOut',
            immediateRender: false,
          },
          0
        )
        .to(
          baseCameraPos.current,
          {
            x: 0,
            y: 0,
            z: 6.25,
            duration: 0.54,
            ease: 'power2.out',
          },
          0.46
        )
        .to(
          baseCameraRot.current,
          {
            z: 0,
            duration: 0.54,
            ease: 'power2.out',
          },
          0.46
        )
        .to(
          rig.position,
          {
            x: isDesktop ? -3.2 : -1.6,
            y: isDesktop ? 0.9 : 1.2,
            z: -3.6,
            ease: 'power2.out',
          },
          0
        )
        .to(
          rig.scale,
          {
            x: endScale * 0.4,
            y: endScale * 0.4,
            z: endScale * 0.4,
            ease: 'power2.out',
          },
          0
        )
        .to(
          rig.rotation,
          {
            y: Math.PI * 1.4,
            ease: 'power1.inOut',
          },
          0
        )
        .to(
          archGroup.position,
          {
            x: 0,
            y: archEndY,
            z: 0,
            ease: 'power2.out',
          },
          0
        )
        .to(
          archGroup.scale,
          {
            x: archScale,
            y: archScale,
            z: archScale,
            ease: 'power2.out',
          },
          0
        );

      // Timeline 3: SPATIAL ARCHITECTURE -> ARTIFACTS
      // The architectural installation softly recedes into the deep fog,
      // and the three floating abstract artifacts rise into the focal plane
      if (artifactsGroup) {
        const artifactsTl = gsap.timeline({
          scrollTrigger: {
            trigger: '#artifacts',
            start: 'top bottom',
            end: 'top 15%',
            scrub: 0.45,
            invalidateOnRefresh: true,
          },
        });

        artifactsTl
          .fromTo(journeyProgress, { current: 2.0 }, { current: 3.0, ease: 'power2.inOut', immediateRender: false }, 0)
          .fromTo(
            baseCameraPos.current,
            {
              x: 0,
              y: 0,
              z: 6.25,
            },
            {
              x: isDesktop ? -0.3 : -0.1,
              y: 0.12,
              z: 5.3,
              duration: 0.48,
              ease: 'power1.inOut',
              immediateRender: false,
            },
            0
          )
          .fromTo(
            baseCameraRot.current,
            { z: 0 },
            {
              z: -0.016,
              duration: 0.48,
              ease: 'power1.inOut',
              immediateRender: false,
            },
            0
          )
          .to(
            baseCameraPos.current,
            {
              x: 0,
              y: 0,
              z: 6.0,
              duration: 0.52,
              ease: 'power2.out',
            },
            0.48
          )
          .to(
            baseCameraRot.current,
            {
              z: 0,
              duration: 0.52,
              ease: 'power2.out',
            },
            0.48
          )
          .to(
            rig.position,
            {
              y: -22.0,
              z: -8.0,
              ease: 'power2.out',
            },
            0
          )
          .to(
            rig.scale,
            {
              x: endScale * 0.15,
              y: endScale * 0.15,
              z: endScale * 0.15,
              ease: 'power2.out',
            },
            0
          )
          .to(
            archGroup.position,
            {
              y: -22.0,
              z: -8.0,
              ease: 'power2.out',
            },
            0
          )
          .to(
            archGroup.scale,
            {
              x: archScale * 0.35,
              y: archScale * 0.35,
              z: archScale * 0.35,
              ease: 'power2.out',
            },
            0
          )
          .to(
            artifactsGroup.position,
            {
              x: 0,
              y: artifactsEndY,
              z: 0,
              ease: 'power2.out',
            },
            0
          )
          .to(
            artifactsGroup.scale,
            {
              x: artifactsScale,
              y: artifactsScale,
              z: artifactsScale,
              ease: 'power2.out',
            },
            0
          );

        // Timeline 4: ARTIFACTS -> RESONANCE
        // The floating abstract artifacts sink softly into the obsidian fog,
        // and the monolithic contemporary sculpture installation rises into focal view
        if (resonanceGroup) {
          const resonanceTl = gsap.timeline({
            scrollTrigger: {
              trigger: '#resonance',
              start: 'top bottom',
              end: 'top 15%',
              scrub: 0.45,
              invalidateOnRefresh: true,
            },
          });

          resonanceTl
            .fromTo(journeyProgress, { current: 3.0 }, { current: 4.0, ease: 'power2.inOut', immediateRender: false }, 0)
            .fromTo(
              baseCameraPos.current,
              {
                x: 0,
                y: 0,
                z: 6.0,
              },
              {
                x: isDesktop ? 0.24 : 0.08,
                y: -0.12,
                z: 5.1,
                duration: 0.46,
                ease: 'power1.inOut',
                immediateRender: false,
              },
              0
            )
            .fromTo(
              baseCameraRot.current,
              { z: 0 },
              {
                z: 0.015,
                duration: 0.46,
                ease: 'power1.inOut',
                immediateRender: false,
              },
              0
            )
            .to(
              baseCameraPos.current,
              {
                x: 0,
                y: -0.05,
                z: 5.75,
                duration: 0.54,
                ease: 'power2.out',
              },
              0.46
            )
            .to(
              baseCameraRot.current,
              {
                z: 0,
                duration: 0.54,
                ease: 'power2.out',
              },
              0.46
            )
            .to(
              artifactsGroup.position,
              {
                y: -22.0,
                z: -8.0,
                ease: 'power2.out',
              },
              0
            )
            .to(
              artifactsGroup.scale,
              {
                x: artifactsScale * 0.35,
                y: artifactsScale * 0.35,
                z: artifactsScale * 0.35,
                ease: 'power2.out',
              },
              0
            )
            .to(
              resonanceGroup.position,
              {
                x: 0,
                y: resonanceEndY,
                z: 0,
                ease: 'power2.out',
              },
              0
            )
            .to(
              resonanceGroup.scale,
              {
                x: resonanceScale,
                y: resonanceScale,
                z: resonanceScale,
                ease: 'power2.out',
              },
              0
            );

          // Timeline 5: RESONANCE -> CODA (Final Deliberate Ending)
          // The monolithic sculpture installation sinks softly into the deep obsidian fog,
          // leaving the quiet atmospheric depth for the finale
          const codaTl = gsap.timeline({
            scrollTrigger: {
              trigger: '#coda',
              start: 'top 70%',
              end: 'top 15%',
              scrub: 0.45,
              invalidateOnRefresh: true,
            },
          });

          codaTl
            .fromTo(journeyProgress, { current: 4.0 }, { current: 5.0, ease: 'power2.inOut', immediateRender: false }, 0)
            .fromTo(
              baseCameraPos.current,
              {
                x: 0,
                y: -0.05,
                z: 5.75,
              },
              {
                x: 0,
                y: 0.06,
                z: 6.1,
                duration: 0.48,
                ease: 'power1.inOut',
                immediateRender: false,
              },
              0
            )
            .to(
              baseCameraPos.current,
              {
                x: 0,
                y: 0.15,
                z: 6.45,
                duration: 0.52,
                ease: 'power2.out',
              },
              0.48
            )
            .to(
              resonanceGroup.position,
              {
                y: -22.0,
                z: -8.0,
                ease: 'power2.out',
              },
              0
            )
            .to(
              resonanceGroup.scale,
              {
                x: resonanceScale * 0.35,
                y: resonanceScale * 0.35,
                z: resonanceScale * 0.35,
                ease: 'power2.out',
              },
              0
            );
        }
      }
    }
  }, [viewport.width]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const prefersReduced = prefersReducedRef.current;

    // Organic living lighting atmosphere (subtle breathing even when visitor pauses)
    const breatheTime = time * 0.45;
    const breatheLight = Math.sin(breatheTime) * 0.05;
    const driftX = Math.sin(time * 0.32) * 0.16;
    const driftY = Math.cos(time * 0.28) * 0.12;

    // Graceful interpolation of normalized pointer coords for lighting
    lightPointer.current.x = THREE.MathUtils.lerp(
      lightPointer.current.x,
      state.pointer.x,
      0.035
    );
    lightPointer.current.y = THREE.MathUtils.lerp(
      lightPointer.current.y,
      state.pointer.y,
      0.035
    );

    const px = lightPointer.current.x;
    const py = lightPointer.current.y;

    // Subtly steer key light position to cast moving highlights across the translucent shell
    if (keyLightRef.current) {
      keyLightRef.current.position.x = 4 + px * 2.2 + driftX;
      keyLightRef.current.position.y = 6 + py * 1.8 + driftY;
      // Restrained specular highlight intensity modulation
      keyLightRef.current.intensity = 1.2 + breatheLight + (Math.abs(px) + Math.abs(py)) * 0.12;
    }

    // Top porcelain glance shifts subtly with pointer position and harmonic breathing
    if (topLightRef.current) {
      topLightRef.current.position.x = 1 + px * 1.5 - driftX * 0.8;
      topLightRef.current.position.z = 3 - py * 1.2;
      topLightRef.current.intensity = 0.35 + Math.cos(breatheTime * 1.1) * 0.035;
    }

    // Counter rim light responds inversely to maintain depth
    if (rimLightRef.current) {
      rimLightRef.current.position.x = -4 - px * 1.2;
      rimLightRef.current.position.y = -3 - py * 1.0;
      rimLightRef.current.intensity = 0.85 + Math.sin(breatheTime * 0.9) * 0.04;
    }

    // Cinematic 3D camera travel tracking with restrained pointer parallax
    // Camera depth (Z) and roll (rotation.z) track the scroll-driven trajectory directly with zero lag.
    // Optical pointer parallax is smoothly applied on X and Y via lightPointer.
    if (!prefersReduced) {
      state.camera.position.x = baseCameraPos.current.x + px * 0.22;
      state.camera.position.y = baseCameraPos.current.y + py * 0.16;
      state.camera.position.z = baseCameraPos.current.z;
      state.camera.rotation.z = baseCameraRot.current.z;
    } else {
      state.camera.position.set(baseCameraPos.current.x, baseCameraPos.current.y, baseCameraPos.current.z);
      state.camera.rotation.z = 0;
    }

    // Continuous multi-chapter atmospheric & lighting transformation across all 6 sections (0.0 to 5.0)
    const progress = THREE.MathUtils.clamp(journeyProgress.current, 0, 5);
    const idx = Math.min(Math.floor(progress), CHAPTER_ATMOSPHERE.length - 2);
    const nextIdx = Math.min(idx + 1, CHAPTER_ATMOSPHERE.length - 1);
    const t = progress - idx;

    const currAtm = CHAPTER_ATMOSPHERE[idx];
    const nxtAtm = CHAPTER_ATMOSPHERE[nextIdx];

    // Dynamic Fog: continuous smooth color & depth gradient
    if (fogRef.current) {
      tempFog.lerpColors(currAtm.fog, nxtAtm.fog, t);
      fogRef.current.color.copy(tempFog);
      fogRef.current.far = THREE.MathUtils.lerp(currAtm.fogFar, nxtAtm.fogFar, t);
      fogRef.current.near = THREE.MathUtils.lerp(currAtm.fogNear, nxtAtm.fogNear, t);
    }

    // Dynamic Key Light: spectral color, intensity & pointer-reactive specular highlights
    if (keyLightRef.current) {
      tempKeyColor.lerpColors(currAtm.keyColor, nxtAtm.keyColor, t);
      keyLightRef.current.color.copy(tempKeyColor);
      const baseKeyIntensity = THREE.MathUtils.lerp(currAtm.keyIntensity, nxtAtm.keyIntensity, t);
      keyLightRef.current.intensity = baseKeyIntensity + breatheLight + (Math.abs(px) + Math.abs(py)) * 0.12;
    }

    // Dynamic Rim / Counter Light: chromatic color balance & atmospheric separation
    if (rimLightRef.current) {
      tempRimColor.lerpColors(currAtm.rimColor, nxtAtm.rimColor, t);
      rimLightRef.current.color.copy(tempRimColor);
      const baseRimIntensity = THREE.MathUtils.lerp(currAtm.rimIntensity, nxtAtm.rimIntensity, t);
      rimLightRef.current.intensity = baseRimIntensity + Math.sin(breatheTime * 0.9) * 0.04;
    }

    // Dynamic Top Light: delicate porcelain accent
    if (topLightRef.current) {
      const baseTopIntensity = THREE.MathUtils.lerp(currAtm.topIntensity, nxtAtm.topIntensity, t);
      topLightRef.current.intensity = baseTopIntensity + Math.cos(breatheTime * 1.1) * 0.035;
    }
  });

  return (
    <group name="afterimage-world">
      {/* Restrained cinematic depth fog blending distant space into velvet rose shadow */}
      <fog ref={fogRef} attach="fog" args={['#382735', 6.5, 24]} />

      {/* Atmospheric base with warm rose-plum undertone to lift dark shadows */}
      <ambientLight intensity={0.68} color="#4A3445" />

      {/* Pointer-reactive Key Light: Soft Rose Ivory */}
      <directionalLight
        ref={keyLightRef}
        position={[4, 6, 4]}
        intensity={1.35}
        color="#F0E0E4"
      />

      {/* Dynamic Rim / Counter Light: Champagne Glow */}
      <pointLight
        ref={rimLightRef}
        position={[-4, -3, -1]}
        intensity={1.05}
        color="#E8CDAF"
        distance={22}
      />

      {/* Reactive Top Glance: Soft Rose Ivory */}
      <pointLight
        ref={topLightRef}
        position={[1, 5, 3]}
        intensity={0.45}
        color="#F0E0E4"
        distance={16}
      />

      {/* Low Back-depth Fill: Dusty Rose spatial separation */}
      <pointLight
        position={[-2, -2.5, -3.5]}
        intensity={0.65}
        color="#C49AAE"
        distance={18}
        decay={2}
      />

      {/* Section 1: Genesis Cosmic Shader Atmosphere & Sanctum */}
      <group ref={genesisGroupRef} name="genesis-rig">
        <GenesisAtmosphere opacityRef={genesisOpacityRef} pointerRef={lightPointer} />
        <GenesisSanctum
          opacityRef={genesisOpacityRef}
          pointerRef={lightPointer}
          bloomRef={genesisBloomRef}
        />
      </group>

      {/* Luminous Volumetric Horizon spanning the deep backdrop */}
      <LuminousVolumetricHorizon progressRef={journeyProgress} />

      {/* Global suspended micro-motes floating across the deep volume */}
      <GlobalAtmosphere />

      {/* Scroll-driven rig container owning global position, scale, and orbital rotation */}
      <group ref={scrollRigRef} name="scroll-rig">
        <HeroArtifact />
      </group>

      {/* Spatial Architecture Archetypes Group */}
      <group ref={architectureGroupRef} name="spatial-architecture-rig">
        <SpatialArchitecture
          activeId={activeArchitectureId}
          onSelect={onSelectArchitecture}
          hoveredId={hoveredArchitectureId}
          onHover={onHoverArchitecture}
        />
      </group>

      {/* Floating Abstract Artifacts Group */}
      <group ref={artifactsGroupRef} name="artifacts-showcase-rig">
        <ArtifactsShowcase
          activeId={activeArtifactId}
          onSelect={onSelectArtifact}
          hoveredId={hoveredArtifactId}
          onHover={onHoverArtifact}
          triggerTimestamp={artifactTriggerTimestamp}
        />
      </group>

      {/* Immersive Harmonic Particle Resonance Field */}
      <group ref={resonanceGroupRef} name="resonance-field-rig">
        <ResonanceField
          triggerTimestamp={resonanceTriggerTimestamp}
          onTrigger={onTriggerResonance}
        />
      </group>
    </group>
  );
};
