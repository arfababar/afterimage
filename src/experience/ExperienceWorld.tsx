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
    const ember = new THREE.Color('#E5A66D');
    const porcelain = new THREE.Color('#E9E1D6');
    const palette = [violet, ember, porcelain];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14.0;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22.0 - 2.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12.0 - 1.5;

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
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#afterimage',
        start: 'top bottom',
        end: 'top 20%',
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });

    tl.to(
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
          y: Math.PI * 0.7,
          ease: 'power1.inOut',
        },
        0
      )
      .to(
        camera.position,
        {
          z: 5.75,
          ease: 'power2.out',
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
        )
        .to(
          camera.position,
          {
            z: 6.25,
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
          )
          .to(
            camera.position,
            {
              z: 6.0,
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
            )
            .to(
              camera.position,
              {
                z: 5.75,
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
            )
            .to(
              camera.position,
              {
                z: 6.45,
                ease: 'power2.out',
              },
              0
            );

          if (fogRef.current) {
            codaTl.to(
              fogRef.current,
              {
                far: 25,
                near: 7.2,
                ease: 'power2.out',
              },
              0
            );
          }
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

    // Restrained optical 3D parallax: camera responds smoothly to pointer
    if (!prefersReduced) {
      const targetCamX = px * 0.22;
      const targetCamY = py * 0.16;
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.04);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.04);
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
