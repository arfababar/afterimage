import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { gsap, useGSAP, ScrollTrigger } from '../motion/registerGsap';
import { HeroArtifact } from './HeroArtifact';
import { SpatialArchitecture } from './SpatialArchitecture';

export interface ExperienceWorldProps {
  activeArchitectureId?: string;
  onSelectArchitecture?: (id: string) => void;
  hoveredArchitectureId?: string | null;
  onHoverArchitecture?: (id: string | null) => void;
}

export const ExperienceWorld: React.FC<ExperienceWorldProps> = ({
  activeArchitectureId,
  onSelectArchitecture,
  hoveredArchitectureId,
  onHoverArchitecture,
}) => {
  const scrollRigRef = useRef<THREE.Group>(null);
  const architectureGroupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const topLightRef = useRef<THREE.PointLight>(null);

  const { viewport } = useThree();

  // Smooth pointer interpolation targets for lights (no React state in animation loop)
  const lightPointer = useRef({ x: 0, y: 0 });

  useGSAP(() => {
    const rig = scrollRigRef.current;
    const archGroup = architectureGroupRef.current;
    if (!rig) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Responsive coordinate calculation: framed on right in THRESHOLD, center-left in AFTERIMAGE
    const isDesktop = viewport.width >= 7.5;
    const startX = isDesktop ? Math.min(viewport.width * 0.22, 2.2) : 0;
    const startY = isDesktop ? 0.05 : 0.35;
    const startZ = isDesktop ? 0 : -0.6;
    const startScale = isDesktop ? 0.9 : Math.min(Math.max(viewport.width / 8.0, 0.48), 0.65);

    // Responsive scaling for spatial architecture portals on narrower viewports
    const archScale = isDesktop ? 1.0 : Math.min(Math.max(viewport.width / 8.0, 0.52), 0.78);
    const archEndY = isDesktop ? 0 : -0.35;

    // Set initial position
    rig.position.set(startX, startY, startZ);
    rig.scale.setScalar(startScale);
    rig.rotation.y = 0;

    // Initial position for spatial architecture group (submerged in lower fog)
    if (archGroup) {
      archGroup.position.set(0, -6.5, -3.5);
      archGroup.scale.setScalar(archScale);
    }

    if (prefersReduced) {
      if (archGroup) {
        archGroup.position.set(0, archEndY, 0);
        archGroup.scale.setScalar(archScale);
        // Discrete visibility toggle without animated scrubbing
        ScrollTrigger.create({
          trigger: '#architecture',
          start: 'top 80%',
          end: 'bottom top',
          onToggle: (self) => {
            if (archGroup) archGroup.visible = self.isActive;
          },
        });
        archGroup.visible = false;
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
        );

      // Timeline 3: SPATIAL ARCHITECTURE -> CODA (Final Deliberate Ending)
      // The architectural installation softly sinks into the obsidian fog,
      // leaving only the gentle particle atmosphere and ambient depth for the finale
      const codaTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#coda',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });

      codaTl
        .to(
          archGroup.position,
          {
            y: -8.0,
            z: -4.5,
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
        );
    }
  }, [viewport.width]);

  useFrame((state) => {
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
      keyLightRef.current.position.x = 4 + px * 2.2;
      keyLightRef.current.position.y = 6 + py * 1.8;
      // Restrained specular highlight intensity modulation
      keyLightRef.current.intensity = 1.2 + (Math.abs(px) + Math.abs(py)) * 0.15;
    }

    // Top porcelain glance shifts subtly with pointer position
    if (topLightRef.current) {
      topLightRef.current.position.x = 1 + px * 1.5;
      topLightRef.current.position.z = 3 - py * 1.2;
    }

    // Counter rim light responds inversely to maintain depth
    if (rimLightRef.current) {
      rimLightRef.current.position.x = -4 - px * 1.2;
      rimLightRef.current.position.y = -3 - py * 1.0;
    }
  });

  return (
    <group name="afterimage-world">
      {/* Restrained cinematic depth fog blending distant space into obsidian void */}
      <fog attach="fog" args={['#17151B', 6.5, 22]} />

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
    </group>
  );
};
