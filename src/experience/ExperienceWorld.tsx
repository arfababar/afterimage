import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap, useGSAP, ScrollTrigger } from '../motion/registerGsap';
import { HeroArtifact } from './HeroArtifact';
import { SpatialArchitecture } from './SpatialArchitecture';
import { ArtifactsShowcase } from './ArtifactsShowcase';
import { ResonanceField } from './ResonanceField';

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

    const violet = new THREE.Color('#C6A6FF');
    const amber = new THREE.Color('#E5A66D');
    const porcelain = new THREE.Color('#E9E1D6');
    const champagne = new THREE.Color('#F6DEC8');
    const moonlitSilver = new THREE.Color('#BAC7E2');
    const paleRose = new THREE.Color('#E0B0B8');
    const iridescentBlue = new THREE.Color('#98B6F8');
    const palette = [violet, amber, porcelain, champagne, moonlitSilver, paleRose, iridescentBlue];

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
  // 0: THRESHOLD (Section 01) — Moonlit Silver, Ethereal Lavender, Obsidian
  {
    core: new THREE.Color('#BAC7E2'),
    mid: new THREE.Color('#C6A6FF'),
    fringe: new THREE.Color('#7886B8'),
    alpha: 0.24,
    fog: new THREE.Color('#14121A'),
    fogFar: 22,
    fogNear: 6.5,
    keyColor: new THREE.Color('#C6A6FF'),
    keyIntensity: 1.2,
    rimColor: new THREE.Color('#E5A66D'),
    rimIntensity: 0.85,
    topIntensity: 0.35,
  },
  // 1: AFTERIMAGE (Section 02) — Radiant Champagne Gold, Warm Amber, Pale Rose & Iridescent Blue
  {
    core: new THREE.Color('#F6DEC8'),
    mid: new THREE.Color('#E5A66D'),
    fringe: new THREE.Color('#7B9FF2'),
    alpha: 0.38,
    fog: new THREE.Color('#221A28'),
    fogFar: 25.5,
    fogNear: 6.5,
    keyColor: new THREE.Color('#F6DEC8'),
    keyIntensity: 1.65,
    rimColor: new THREE.Color('#A5C4F8'),
    rimIntensity: 1.2,
    topIntensity: 0.65,
  },
  // 2: SPATIAL ARCHITECTURE (Section 03) — Translucent Alabaster, Pale Rose & Champagne Travertine
  {
    core: new THREE.Color('#F2EAE0'),
    mid: new THREE.Color('#E0B0B8'),
    fringe: new THREE.Color('#C8A882'),
    alpha: 0.35,
    fog: new THREE.Color('#201924'),
    fogFar: 25,
    fogNear: 6.5,
    keyColor: new THREE.Color('#FAF3EB'),
    keyIntensity: 1.5,
    rimColor: new THREE.Color('#E0B0B8'),
    rimIntensity: 1.05,
    topIntensity: 0.6,
  },
  // 3: ARTIFACTS (Section 04) — Crystalline Pearl-White, Prismatic Refraction Blue & Violet
  {
    core: new THREE.Color('#FFFFFF'),
    mid: new THREE.Color('#98B6F8'),
    fringe: new THREE.Color('#C6A6FF'),
    alpha: 0.36,
    fog: new THREE.Color('#181622'),
    fogFar: 24,
    fogNear: 6.5,
    keyColor: new THREE.Color('#F0F4FF'),
    keyIntensity: 1.55,
    rimColor: new THREE.Color('#C6A6FF'),
    rimIntensity: 1.15,
    topIntensity: 0.65,
  },
  // 4: RESONANCE (Section 05) — Smoky Silver, Cosmic Lavender & Warm Starlight Amber
  {
    core: new THREE.Color('#D1D7E4'),
    mid: new THREE.Color('#A78BFA'),
    fringe: new THREE.Color('#E5A66D'),
    alpha: 0.33,
    fog: new THREE.Color('#16131F'),
    fogFar: 23,
    fogNear: 6.5,
    keyColor: new THREE.Color('#C4B5FD'),
    keyIntensity: 1.45,
    rimColor: new THREE.Color('#E5A66D'),
    rimIntensity: 1.1,
    topIntensity: 0.55,
  },
  // 5: CODA (Section 06) — Ethereal Dawn: Champagne Gold, Morning Rose & Moonlit Horizon
  {
    core: new THREE.Color('#F7E5D0'),
    mid: new THREE.Color('#E8C5D0'),
    fringe: new THREE.Color('#BAC7E2'),
    alpha: 0.42,
    fog: new THREE.Color('#241C28'),
    fogFar: 26,
    fogNear: 7.5,
    keyColor: new THREE.Color('#F5E0C8'),
    keyIntensity: 1.6,
    rimColor: new THREE.Color('#D4C4F4'),
    rimIntensity: 0.9,
    topIntensity: 0.7,
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
        uColorCore: { value: new THREE.Color('#BAC7E2') },
        uColorMid: { value: new THREE.Color('#C6A6FF') },
        uColorFringe: { value: new THREE.Color('#7886B8') },
        uAlpha: { value: 0.24 },
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
          centered.x += uPointer.x * 0.12;
          centered.y += uPointer.y * 0.08;
          centered.y *= 1.32;

          float dist = length(centered);
          float wave = sin(atan(centered.y, centered.x) * 4.0 + uTime * 0.3) * 0.035;
          float r = dist + wave;

          float coreFalloff = smoothstep(1.35, 0.0, r);
          coreFalloff = pow(coreFalloff, 2.1);

          float midBlend = smoothstep(0.10, 0.75, r);
          vec3 atmosphereColor = mix(uColorCore, uColorMid, midBlend);

          float fringeBlend = smoothstep(0.60, 1.20, r);
          atmosphereColor = mix(atmosphereColor, uColorFringe, fringeBlend);

          gl_FragColor = vec4(atmosphereColor, coreFalloff * uAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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
    <mesh ref={meshRef} position={[0, 0.4, -13.5]} scale={[30, 20, 1]}>
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
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const topLightRef = useRef<THREE.PointLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const prefersReducedRef = useRef(false);

  // Cinematic camera travel coordinates & continuous global chapter journey progress (0.0 to 5.0)
  const baseCameraPos = useRef(new THREE.Vector3(0, 0, 6.2));
  const baseCameraRot = useRef(new THREE.Euler(0, 0, 0));
  const journeyProgress = useRef(0.0);

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

    // Set initial position
    rig.position.set(startX, startY, startZ);
    rig.scale.setScalar(startScale);
    rig.rotation.y = 0;

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
        if (rig) rig.visible = true;
      },
    });

    if (prefersReduced) {
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
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(journeyProgress, { current: 0.0 }, { current: 1.0, ease: 'power2.inOut' }, 0)
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
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      archTl
        .fromTo(journeyProgress, { current: 1.0 }, { current: 2.0, ease: 'power2.inOut' }, 0)
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
            scrub: 1.2,
            invalidateOnRefresh: true,
          },
        });

        artifactsTl
          .fromTo(journeyProgress, { current: 2.0 }, { current: 3.0, ease: 'power2.inOut' }, 0)
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
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          });

          resonanceTl
            .fromTo(journeyProgress, { current: 3.0 }, { current: 4.0, ease: 'power2.inOut' }, 0)
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
              scrub: 1.2,
              invalidateOnRefresh: true,
            },
          });

          codaTl
            .fromTo(journeyProgress, { current: 4.0 }, { current: 5.0, ease: 'power2.inOut' }, 0)
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
      {/* Restrained cinematic depth fog blending distant space into obsidian void */}
      <fog ref={fogRef} attach="fog" args={['#17151B', 6.5, 22]} />

      {/* Dark atmospheric base with subtle violet undertone */}
      <ambientLight intensity={0.42} color="#1A1524" />

      {/* Pointer-reactive Key Light: Spectral violet */}
      <directionalLight
        ref={keyLightRef}
        position={[4, 6, 4]}
        intensity={1.2}
        color="#C6A6FF"
      />

      {/* Dynamic Rim / Counter Light: Muted ember */}
      <pointLight
        ref={rimLightRef}
        position={[-4, -3, -1]}
        intensity={0.85}
        color="#E5A66D"
        distance={22}
      />

      {/* Reactive Top Glance: Warm porcelain */}
      <pointLight
        ref={topLightRef}
        position={[1, 5, 3]}
        intensity={0.35}
        color="#E9E1D6"
        distance={16}
      />

      {/* Low Back-depth Fill: Subtle warm-ember spatial separation */}
      <pointLight
        position={[-2, -2.5, -3.5]}
        intensity={0.45}
        color="#E5A66D"
        distance={18}
        decay={2}
      />

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
