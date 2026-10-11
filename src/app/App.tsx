import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Volume2, VolumeX } from 'lucide-react';
import { ExperienceCanvas } from '../experience/ExperienceCanvas';
import { CustomCursor } from '../components/CustomCursor';
import { gsap, useGSAP } from '../motion/registerGsap';
import { ArchitectureId, ARCHITECTURE_DATA } from '../experience/SpatialArchitecture';
import { ArtifactId, ARTIFACTS_DATA } from '../experience/ArtifactsShowcase';
import { soundManager } from '../utils/soundManager';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeArchitectureId, setActiveArchitectureId] = useState<ArchitectureId>('vault');
  const [hoveredArchitectureId, setHoveredArchitectureId] = useState<string | null>(null);
  const [activeArtifactId, setActiveArtifactId] = useState<ArtifactId>('glass');
  const [hoveredArtifactId, setHoveredArtifactId] = useState<string | null>(null);
  const [artifactTriggerTimestamp, setArtifactTriggerTimestamp] = useState<number>(0);
  const [resonanceTriggerTimestamp, setResonanceTriggerTimestamp] = useState<number>(0);
  const [resonanceState, setResonanceState] = useState<'coherent' | 'dispersed' | 'reforming'>('coherent');
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // Sound starts OFF by default; subscribe to state changes
    const unsubscribe = soundManager.subscribe((state) => {
      setSoundEnabled(state.isEnabled);
    });

    return () => {
      unsubscribe();
      soundManager.dispose();
    };
  }, []);

  const handleToggleSound = () => {
    soundManager.toggle();
  };

  const handleSelectArchitecture = (id: string) => {
    const archId = id as ArchitectureId;
    setActiveArchitectureId(archId);
    // Trigger restrained interaction audio (throttled inside soundManager)
    soundManager.playArchetypeSelect(archId);
  };

  const handleSelectArtifact = (id: string) => {
    const artId = id as ArtifactId;
    setActiveArtifactId(artId);
    setArtifactTriggerTimestamp(Date.now());
    soundManager.playArchetypeSelect(artId);
  };

  const handleTriggerActiveArtifact = () => {
    setArtifactTriggerTimestamp(Date.now());
    soundManager.playArchetypeSelect(activeArtifactId);
  };

  const handleTriggerResonance = () => {
    setResonanceTriggerTimestamp(Date.now());
    setResonanceState('dispersed');
    soundManager.playArchetypeSelect();
    setTimeout(() => {
      setResonanceState('reforming');
    }, 850);
    setTimeout(() => {
      setResonanceState('coherent');
    }, 2600);
  };

  // Restrained magnetic cursor effect for primary buttons on desktop devices
  useEffect(() => {
    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      return;
    }

    const primaryButtons = containerRef.current?.querySelectorAll<HTMLElement>(
      '.artifacts-trigger-btn, .resonance-trigger-btn, .coda-return-button'
    );
    if (!primaryButtons || primaryButtons.length === 0) return;

    const cleanups: Array<() => void> = [];

    primaryButtons.forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.32, ease: 'power2.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.32, ease: 'power2.out' });

      let cachedCx = 0;
      let cachedCy = 0;
      let cachedHalfW = 1;
      let cachedHalfH = 1;
      let hasCachedRect = false;

      const cacheRect = () => {
        const rect = btn.getBoundingClientRect();
        cachedCx = rect.left + rect.width / 2;
        cachedCy = rect.top + rect.height / 2;
        cachedHalfW = rect.width / 2 || 1;
        cachedHalfH = rect.height / 2 || 1;
        hasCachedRect = true;
      };

      const onMouseEnter = () => {
        cacheRect();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!hasCachedRect) cacheRect();
        const maxOffset = 6; // Restrained magnetic threshold in px
        const relX = (e.clientX - cachedCx) / cachedHalfW;
        const relY = (e.clientY - cachedCy) / cachedHalfH;
        const targetX = Math.max(-maxOffset, Math.min(maxOffset, relX * maxOffset));
        const targetY = Math.max(-maxOffset, Math.min(maxOffset, relY * maxOffset));
        xTo(targetX);
        yTo(targetY);
      };

      const onMouseLeave = () => {
        hasCachedRect = false;
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.55,
          ease: 'elastic.out(1.1, 0.4)',
          overwrite: 'auto',
        });
      };

      btn.addEventListener('mouseenter', onMouseEnter, { passive: true });
      btn.addEventListener('mousemove', onMouseMove, { passive: true });
      btn.addEventListener('mouseleave', onMouseLeave);

      cleanups.push(() => {
        btn.removeEventListener('mouseenter', onMouseEnter);
        btn.removeEventListener('mousemove', onMouseMove);
        btn.removeEventListener('mouseleave', onMouseLeave);
        gsap.set(btn, { x: 0, y: 0 });
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [activeArtifactId]);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;

      // ========================================================================
      // 0. GENESIS (Section 01) — Initial mount entrance
      // Headings emerge from 3D depth, lines reveal progressively, prose glides up
      // ========================================================================
      const genesisIntroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      genesisIntroTl
        .fromTo(
          '.genesis-pretitle__indicator',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.85, ease: 'expo.out' },
          0.1
        )
        .fromTo(
          '.genesis-pretitle span:last-child',
          { opacity: 0, x: -12, letterSpacing: '0.24em' },
          { opacity: 1, x: 0, letterSpacing: '0.15em', duration: 0.85, ease: 'power2.out' },
          0.22
        )
        .fromTo(
          '#genesis-title .title-reveal-word',
          { y: '125%', rotateX: -28, z: -45, opacity: 0 },
          { y: '0%', rotateX: 0, z: 0, opacity: 1, duration: 1.4, ease: 'power3.out' },
          0.32
        )
        .fromTo(
          '.genesis-description',
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.95, ease: 'power2.out' },
          0.65
        )
        .fromTo(
          '.genesis-section .scroll-indicator',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
          0.90
        );

      // Departure scrubbed parallax from GENESIS to THRESHOLD (fades out smoothly as camera approaches)
      gsap.to('.genesis-content', {
        y: -40,
        opacity: 0,
        ease: 'power1.in',
        scrollTrigger: {
          trigger: '#genesis',
          start: 'top 80px',
          end: '40% top',
          scrub: 0.45,
        },
      });

      // ========================================================================
      // 1. THRESHOLD (Section 02) — Viewport arrival entrance
      // Headings emerge from 3D depth, lines reveal progressively, prose glides up
      // ========================================================================
      const introTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#threshold',
          start: 'top 30%',
          toggleActions: 'play reverse play reverse',
        },
        defaults: { ease: 'power2.out' },
      });

      introTl
        .fromTo(
          '.hero-pretitle__indicator',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.8, ease: 'expo.out' },
          0
        )
        .fromTo(
          '.hero-pretitle span:last-child',
          { opacity: 0, x: -8, letterSpacing: '0.22em' },
          { opacity: 1, x: 0, letterSpacing: '0.15em', duration: 0.75, ease: 'power2.out' },
          0.12
        )
        .fromTo(
          '#hero-title .title-reveal-word',
          { y: '115%', rotateX: -24, z: -35, opacity: 0 },
          { y: '0%', rotateX: 0, z: 0, opacity: 1, duration: 1.25, stagger: 0.18, ease: 'power3.out' },
          0.22
        )
        .fromTo(
          '.hero-description',
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.95, ease: 'power2.out' },
          0.55
        )
        .fromTo(
          '.hero-details .detail-item',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' },
          0.72
        )
        .fromTo(
          '.hero-section .scroll-indicator',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.75, ease: 'power2.out' },
          0.90
        );

      // Multi-layered editorial parallax and cinematic spatial departure between THRESHOLD & AFTERIMAGE
      gsap.to('#hero-title', {
        y: -36,
        opacity: 0.12,
        scale: 0.97,
        ease: 'none',
        scrollTrigger: {
          trigger: '#afterimage',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });
      gsap.to('.hero-description, .hero-details, .hero-section .scroll-indicator', {
        y: -65,
        opacity: 0.06,
        ease: 'none',
        scrollTrigger: {
          trigger: '#afterimage',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });

      // ========================================================================
      // 2. AFTERIMAGE (Section 03) — Cinematic Scroll-Driven Typography Sequence
      // Scrubbed multidirectional glide: large editorial text ribbons traverse
      // the viewport, revealing, converging around the 3D sculpture, and separating.
      // ========================================================================
      const typoTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#afterimage',
          start: 'top 80px',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
        defaults: { ease: 'none' },
      });

      // Track 1 (Top): "AFTER THE LIGHT" — Glides from right across to left
      typoTl
        .fromTo(
          '.cinema-typo-track--top',
          { x: '18vw', y: '0vh', opacity: 0, scale: 0.95 },
          { x: '0vw', y: '1vh', opacity: 0.95, scale: 1.0, duration: 0.45 },
          0
        )
        .to(
          '.cinema-typo-track--top',
          { x: '-18vw', y: '2.5vh', opacity: 0.85, scale: 1.02, duration: 0.40 },
          0.45
        )
        .to(
          '.cinema-typo-track--top',
          { x: '-32vw', y: '4vh', opacity: 0.1, scale: 0.96, duration: 0.15 },
          0.85
        );

      // Track 2 (Center): "SOME THINGS REMAIN" — Counter-glide from left across to right
      typoTl
        .fromTo(
          '.cinema-typo-track--center',
          { x: '-20vw', y: '3vh', opacity: 0, scale: 0.92 },
          { x: '0vw', y: '0vh', opacity: 0.98, scale: 1.04, duration: 0.42 },
          0.08
        )
        .to(
          '.cinema-typo-track--center',
          { x: '16vw', y: '-2vh', opacity: 0.88, scale: 1.01, duration: 0.35 },
          0.50
        )
        .to(
          '.cinema-typo-track--center',
          { x: '30vw', y: '-4vh', opacity: 0.1, scale: 0.94, duration: 0.15 },
          0.85
        );

      // Track 3 (Bottom): "WHAT WE LEAVE BEHIND" — Vertical float & horizontal drift
      typoTl
        .fromTo(
          '.cinema-typo-track--bottom',
          { x: '12vw', y: '5vh', opacity: 0 },
          { x: '-4vw', y: '0vh', opacity: 0.88, duration: 0.42 },
          0.18
        )
        .to(
          '.cinema-typo-track--bottom',
          { x: '-16vw', y: '-3vh', opacity: 0.65, duration: 0.28 },
          0.60
        )
        .to(
          '.cinema-typo-track--bottom',
          { x: '-26vw', y: '-5vh', opacity: 0.1, duration: 0.12 },
          0.88
        );

      // Docked Editorial Narrative Card: Emerges gracefully, remains anchored & readable, then gently recedes
      typoTl
        .fromTo(
          '.afterimage-content',
          { opacity: 0, y: 30, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1.0, duration: 0.25 },
          0.05
        )
        .to(
          '.afterimage-content',
          { y: -14, duration: 0.50 },
          0.30
        )
        .to(
          '.afterimage-content',
          { opacity: 0.15, y: -40, scale: 0.96, duration: 0.20 },
          0.80
        );

      // ========================================================================
      // 3. SPATIAL ARCHITECTURE (Section 03) — Triggered on viewport entrance
      // Heading emergence from depth, horizontal divider sweep, prose & tabs
      // ========================================================================
      const archTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#architecture',
          start: 'top 75%',
          toggleActions: 'play none none none',
          once: true,
        },
        defaults: { ease: 'power2.out' },
      });

      archTl
        .fromTo(
          '.architecture-pretitle__indicator',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.75, ease: 'expo.out' },
          0
        )
        .fromTo(
          '.architecture-pretitle span:last-child',
          { opacity: 0, x: -8, letterSpacing: '0.22em' },
          { opacity: 1, x: 0, letterSpacing: '0.15em', duration: 0.7, ease: 'power2.out' },
          0.1
        )
        .fromTo(
          '#architecture-title .title-reveal-word',
          { y: '115%', rotateX: -24, z: -35, opacity: 0 },
          { y: '0%', rotateX: 0, z: 0, opacity: 1, duration: 1.2, stagger: 0.18, ease: 'power3.out' },
          0.2
        )
        .fromTo(
          '.architecture-section .editorial-divider',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.85, ease: 'expo.out' },
          0.45
        )
        .fromTo(
          '.architecture-narrative-prose, .architecture-narrative-subprose',
          { opacity: 0, y: 20, filter: 'blur(3px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.14, ease: 'power2.out' },
          0.52
        )
        .fromTo(
          '.architecture-section .editorial-meta-item',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power2.out' },
          0.68
        )
        .fromTo(
          '.architecture-interface',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
          0.78
        );

      // Multi-layered editorial parallax between ARCHITECTURE & ARTIFACTS
      gsap.to('#architecture-title', {
        y: -28,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#artifacts',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });
      gsap.to('.architecture-narrative-block, .architecture-interface', {
        y: -50,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '#artifacts',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });

      // ========================================================================
      // 4. ARTIFACTS (Section 04) — Triggered on viewport entrance
      // Heading emergence from depth, horizontal divider sweep, prose & controls
      // ========================================================================
      const artifactsTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#artifacts',
          start: 'top 75%',
          toggleActions: 'play none none none',
          once: true,
        },
        defaults: { ease: 'power2.out' },
      });

      artifactsTl
        .fromTo(
          '.artifacts-pretitle__indicator',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.75, ease: 'expo.out' },
          0
        )
        .fromTo(
          '.artifacts-pretitle span:last-child',
          { opacity: 0, x: -8, letterSpacing: '0.22em' },
          { opacity: 1, x: 0, letterSpacing: '0.15em', duration: 0.7, ease: 'power2.out' },
          0.1
        )
        .fromTo(
          '#artifacts-title .title-reveal-word',
          { y: '115%', rotateX: -24, z: -35, opacity: 0 },
          { y: '0%', rotateX: 0, z: 0, opacity: 1, duration: 1.2, stagger: 0.18, ease: 'power3.out' },
          0.2
        )
        .fromTo(
          '.artifacts-divider',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.85, ease: 'expo.out' },
          0.45
        )
        .fromTo(
          '.artifacts-narrative-prose, .artifacts-narrative-subprose',
          { opacity: 0, y: 20, filter: 'blur(3px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, stagger: 0.14, ease: 'power2.out' },
          0.52
        )
        .fromTo(
          '.artifacts-section .editorial-meta-item',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power2.out' },
          0.68
        )
        .fromTo(
          '.artifacts-interface',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
          0.78
        );

      // Multi-layered editorial parallax between ARTIFACTS & RESONANCE
      gsap.to('#artifacts-title', {
        y: -28,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#resonance',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });
      gsap.to('.artifacts-narrative-block, .artifacts-interface', {
        y: -50,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '#resonance',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });

      // ========================================================================
      // 5. RESONANCE (Section 05) — Triggered on viewport entrance
      // Heading emergence from depth, horizontal divider sweep, prose & HUD
      // ========================================================================
      const resonanceTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#resonance',
          start: 'top 75%',
          toggleActions: 'play none none none',
          once: true,
        },
        defaults: { ease: 'power2.out' },
      });

      resonanceTl
        .fromTo(
          '.resonance-pretitle__indicator',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.75, ease: 'expo.out' },
          0
        )
        .fromTo(
          '.resonance-pretitle span:last-child',
          { opacity: 0, x: -8, letterSpacing: '0.22em' },
          { opacity: 1, x: 0, letterSpacing: '0.15em', duration: 0.7, ease: 'power2.out' },
          0.1
        )
        .fromTo(
          '#resonance-title .title-reveal-word',
          { y: '115%', rotateX: -24, z: -35, opacity: 0 },
          { y: '0%', rotateX: 0, z: 0, opacity: 1, duration: 1.2, ease: 'power3.out' },
          0.2
        )
        .fromTo(
          '.resonance-divider',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.85, ease: 'expo.out' },
          0.45
        )
        .fromTo(
          '.resonance-narrative-prose',
          { opacity: 0, y: 20, filter: 'blur(3px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out' },
          0.52
        )
        .fromTo(
          '.resonance-section .editorial-meta-item',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power2.out' },
          0.68
        )
        .fromTo(
          '.resonance-hud',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
          0.78
        );

      // Multi-layered editorial parallax between RESONANCE & CODA
      gsap.to('#resonance-title', {
        y: -28,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '#coda',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });
      gsap.to('.resonance-narrative-block, .resonance-hud', {
        y: -50,
        opacity: 0.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '#coda',
          start: 'top bottom',
          end: 'top 20%',
          scrub: 0.45,
        },
      });

      // ========================================================================
      // 6. CODA (Section 06) — The Quiet, Deliberate Arrival
      // Stately heading emergence, pristine statement clarity, serene resolution
      // ========================================================================
      const codaTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#coda',
          start: 'top 75%',
          toggleActions: 'play none none none',
          once: true,
        },
        defaults: { ease: 'power2.out' },
      });

      codaTl
        .fromTo(
          '.coda-pretitle__indicator',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.9, ease: 'expo.out' },
          0
        )
        .fromTo(
          '.coda-pretitle span:last-child',
          { opacity: 0, x: -10, letterSpacing: '0.24em' },
          { opacity: 1, x: 0, letterSpacing: '0.15em', duration: 0.8, ease: 'power2.out' },
          0.15
        )
        .fromTo(
          '#coda-title .title-reveal-word',
          { y: '120%', rotateX: -26, z: -40, opacity: 0 },
          { y: '0%', rotateX: 0, z: 0, opacity: 1, duration: 1.35, stagger: 0.22, ease: 'power3.out' },
          0.28
        )
        .fromTo(
          '.coda-statement',
          { opacity: 0, y: 24, filter: 'blur(3px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.05, ease: 'power2.out' },
          0.65
        )
        .fromTo(
          '.coda-divider',
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.95, ease: 'expo.out', transformOrigin: 'center center' },
          0.82
        )
        .fromTo(
          '.coda-meta-row .coda-meta-item',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' },
          0.95
        )
        .fromTo(
          '.coda-actions',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.85, ease: 'power2.out' },
          1.10
        );
    },
    { scope: containerRef }
  );

  return (
    <>
      {/* Polished Custom Cursor (Fine pointer devices only) */}
      <CustomCursor />

      {/* 3D WebGL Canvas Layer */}
      <ExperienceCanvas
        activeArchitectureId={activeArchitectureId}
        onSelectArchitecture={handleSelectArchitecture}
        hoveredArchitectureId={hoveredArchitectureId}
        onHoverArchitecture={setHoveredArchitectureId}
        activeArtifactId={activeArtifactId}
        onSelectArtifact={handleSelectArtifact}
        hoveredArtifactId={hoveredArtifactId}
        onHoverArtifact={setHoveredArtifactId}
        artifactTriggerTimestamp={artifactTriggerTimestamp}
        resonanceTriggerTimestamp={resonanceTriggerTimestamp}
        onTriggerResonance={handleTriggerResonance}
      />

      {/* Top Header / Navigation (Full Viewport Width) */}
      <header className="site-header">
        <div className="site-header__inner">
          <a href="#genesis" className="site-wordmark" aria-label="AFTERIMAGE Home">
            <span className="site-wordmark__glyph" aria-hidden="true" />
            <span>AFTERIMAGE</span>
          </a>

          <nav className="site-nav" aria-label="Primary Navigation">
            <a href="#genesis" className="nav-link">
              GENESIS
            </a>
            <a href="#threshold" className="nav-link">
              THRESHOLD
            </a>
            <a href="#afterimage" className="nav-link">
              LIGHT
            </a>
            <a href="#architecture" className="nav-link">
              FORMS
            </a>
            <a href="#artifacts" className="nav-link">
              ARTIFACTS
            </a>
            <a href="#resonance" className="nav-link">
              RESONANCE
            </a>
          </nav>

          <div className="site-header__controls">
            {/* Minimal Spatial Sound Toggle (Starts OFF, never autoplays) */}
            <button
              type="button"
              className={`site-sound-toggle ${soundEnabled ? 'is-active' : ''}`}
              onClick={handleToggleSound}
              aria-pressed={soundEnabled}
              aria-label={soundEnabled ? 'Mute ambient sound' : 'Unmute ambient sound'}
              title={soundEnabled ? 'Sound is on — click to mute' : 'Sound is off — click to enable'}
            >
              <span className="site-sound-toggle__icon" aria-hidden="true">
                {soundEnabled ? (
                  <Volume2 size={13} strokeWidth={1.75} />
                ) : (
                  <VolumeX size={13} strokeWidth={1.75} />
                )}
              </span>
              <span className="site-sound-toggle__label">
                {soundEnabled ? 'SOUND ON' : 'SOUND OFF'}
              </span>
              <span
                className={`site-sound-toggle__indicator ${soundEnabled ? 'is-live' : ''}`}
                aria-hidden="true"
              />
            </button>

            <span className="site-meta">STUDY 01</span>
          </div>
        </div>
      </header>

      {/* Editorial Page Container */}
      <div ref={containerRef} className="page-container">
        <main className="site-main" id="main-content">
          {/* Section 1: GENESIS / ORIGIN */}
          <section
            className="section-panel genesis-section"
            id="genesis"
            aria-labelledby="genesis-title"
          >
            <div className="genesis-sticky-wrap">
              <div className="genesis-content">
                <p className="genesis-pretitle">
                  <span className="genesis-pretitle__indicator" aria-hidden="true" />
                  <span>01 // THE AWAKENING</span>
                </p>

                <h1 id="genesis-title" className="genesis-title" aria-label="GENESIS">
                  <span className="title-reveal-line" aria-hidden="true">
                    <span className="title-reveal-word">GENESIS</span>
                  </span>
                </h1>

                <p className="genesis-description">
                  Before afterimages linger in perception, the eye opens to raw light.
                  A scroll-driven journey through celestial atmosphere and living memory.
                </p>

                <div className="scroll-indicator" aria-label="Scroll prompt">
                  <span className="scroll-indicator__line" aria-hidden="true" />
                  <span>Scroll to begin the journey</span>
                  <span className="scroll-indicator__icon" aria-hidden="true">
                    <ArrowDown size={12} strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: THRESHOLD */}
          <section
            className="section-panel hero-section"
            id="threshold"
            aria-labelledby="hero-title"
          >
            <div className="hero-content">
              <p className="hero-pretitle">
                <span className="hero-pretitle__indicator" aria-hidden="true" />
                <span>02 // THRESHOLD</span>
              </p>

              <h2 id="hero-title" className="hero-title" aria-label="AFTERIMAGE">
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">AFTER</span>
                </span>
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">IMAGE</span>
                </span>
              </h2>

              <p className="hero-description">
                When bright light hits the eye, the shape lingers long after you look away.
                An interactive study in light, silhouette, and memory.
              </p>

              <div className="hero-details">
                <div className="detail-item">
                  <span className="detail-item__label">Phase</span>
                  <span className="detail-item__value">02 / Threshold</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Medium</span>
                  <span className="detail-item__value">WebGL &amp; Real-Time Light</span>
                </div>
                <div className="detail-item">
                  <span className="detail-item__label">Focus</span>
                  <span className="detail-item__value">Silhouette &amp; Reflection</span>
                </div>
              </div>

              <div className="scroll-indicator" aria-label="Scroll prompt">
                <span className="scroll-indicator__line" aria-hidden="true" />
                <span>Scroll to explore</span>
                <span className="scroll-indicator__icon" aria-hidden="true">
                  <ArrowDown size={12} strokeWidth={1.5} />
                </span>
              </div>
            </div>
          </section>

          {/* Section 3: AFTERIMAGE — Cinematic Scroll-Driven Typography */}
          <section
            className="section-panel afterimage-section"
            id="afterimage"
            aria-labelledby="afterimage-title"
          >
            <div className="afterimage-sticky-wrap">
              {/* Cinematic Scroll-Driven Typography Stream (Non-blocking, pointer-events: none) */}
              <div className="cinema-typography-container" aria-hidden="true">
                {/* Track 1: Upper Gliding Stream (Right -> Left) */}
                <div className="cinema-typo-track cinema-typo-track--top">
                  <div className="cinema-typo-text cinema-typo-text--primary">
                    <span className="cinema-typo-phrase">AFTER THE LIGHT</span>
                    <span className="cinema-typo-separator">✦</span>
                    <span className="cinema-typo-subphrase">// RETINAL RETENTION STUDY</span>
                  </div>
                </div>

                {/* Track 2: Center Dramatic Stream (Counter-motion Left -> Right) */}
                <div className="cinema-typo-track cinema-typo-track--center">
                  <div className="cinema-typo-text cinema-typo-text--dramatic">
                    <span className="cinema-typo-accent">SOME THINGS REMAIN</span>
                  </div>
                </div>

                {/* Track 3: Lower Counter Stream (Left/Upward drift) */}
                <div className="cinema-typo-track cinema-typo-track--bottom">
                  <div className="cinema-typo-text cinema-typo-text--secondary">
                    <span className="cinema-typo-tag">PHASE 03</span>
                    <span className="cinema-typo-separator">✦</span>
                    <span className="cinema-typo-phrase">WHAT WE LEAVE BEHIND</span>
                  </div>
                </div>
              </div>

              {/* Accessible Editorial Narrative Card */}
              <div className="afterimage-content">
                <p className="afterimage-pretitle">
                  <span className="afterimage-pretitle__indicator" aria-hidden="true" />
                  <span>03 // RESIDUAL LIGHT</span>
                </p>

                <h2 id="afterimage-title" className="afterimage-title" aria-label="RESIDUAL LIGHT">
                  <span className="title-reveal-line" aria-hidden="true">
                    <span className="title-reveal-word">RESIDUAL</span>
                  </span>
                  <span className="title-reveal-line" aria-hidden="true">
                    <span className="title-reveal-word">LIGHT</span>
                  </span>
                </h2>

                <p className="afterimage-description">
                  The eye doesn't record light like a camera. It absorbs a flash and lets it fade
                  slowly, shifting colors as the optic nerve resets. What you see in the dark isn't
                  empty space—it's the shadow of what you just looked at.
                </p>

                <div className="afterimage-details">
                  <div className="detail-item">
                    <span className="detail-item__label">Optics</span>
                    <span className="detail-item__value">Spectral Dispersion</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-item__label">Surface</span>
                    <span className="detail-item__value">Thin-Film Iridescence</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-item__label">Behavior</span>
                    <span className="detail-item__value">Cursor Glint</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: SPATIAL ARCHITECTURE */}
          <section
            className="section-panel architecture-section"
            id="architecture"
            aria-labelledby="architecture-title"
          >
            <div className="architecture-header">
              <p className="architecture-pretitle">
                <span className="architecture-pretitle__indicator" aria-hidden="true" />
                <span>04 // THREE STRUCTURES</span>
              </p>

              <h2 id="architecture-title" className="architecture-title" aria-label="THREE FORMS">
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">THREE</span>
                </span>
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">FORMS</span>
                </span>
              </h2>

              {/* Original Editorial Narrative Block */}
              <div className="architecture-narrative-block">
                <div className="editorial-meta-row">
                  <span className="editorial-meta-item">STUDY 04</span>
                  <span className="editorial-meta-divider" aria-hidden="true">·</span>
                  <span className="editorial-meta-item">PROCEDURAL GEOMETRY</span>
                  <span className="editorial-meta-divider" aria-hidden="true">·</span>
                  <span className="editorial-meta-item">REAL-TIME LIGHT</span>
                </div>

                <div className="editorial-divider" aria-hidden="true" />

                <p className="architecture-narrative-prose">
                  Buildings leave their own afterimages. Long after a wall comes down,
                  you still remember where the doorway stood and how sunlight crossed the floor.
                </p>

                <p className="architecture-narrative-subprose">
                  Three geometric frames float in dark space. Select a form to shift the light and read the notes.
                </p>
              </div>
            </div>

            <div className="architecture-interface">
              {/* Accessible Keyboard-Operable Tab Navigation */}
              <div
                className="architecture-nav"
                role="tablist"
                aria-label="Select architectural form"
              >
                {(['vault', 'oculus', 'pylon'] as const).map((id, index) => {
                  const item = ARCHITECTURE_DATA[id];
                  const isSelected = activeArchitectureId === id;
                  const isHovered = hoveredArchitectureId === id;
                  return (
                    <button
                      key={id}
                      id={`arch-tab-${id}`}
                      role="tab"
                      type="button"
                      aria-selected={isSelected}
                      aria-controls={`arch-panel-${id}`}
                      tabIndex={isSelected ? 0 : -1}
                      className={`architecture-tab ${isSelected ? 'is-selected' : ''} ${
                        isHovered ? 'is-hovered' : ''
                      }`}
                      onClick={() => handleSelectArchitecture(id)}
                      onMouseEnter={() => setHoveredArchitectureId(id)}
                      onMouseLeave={() => setHoveredArchitectureId(null)}
                      onFocus={() => setHoveredArchitectureId(id)}
                      onBlur={() => setHoveredArchitectureId(null)}
                      onKeyDown={(e) => {
                        const tabs: ArchitectureId[] = ['vault', 'oculus', 'pylon'];
                        let newIdx = -1;
                        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          newIdx = (index + 1) % tabs.length;
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          newIdx = (index - 1 + tabs.length) % tabs.length;
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          newIdx = 0;
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          newIdx = tabs.length - 1;
                        }
                        if (newIdx !== -1) {
                          const nextId = tabs[newIdx];
                          handleSelectArchitecture(nextId);
                          document.getElementById(`arch-tab-${nextId}`)?.focus();
                        }
                      }}
                    >
                      <span className="architecture-tab__index">0{index + 1}</span>
                      <span className="architecture-tab__label">{item.title}</span>
                      <span
                        className="architecture-tab__accent"
                        style={{ backgroundColor: item.accentColor }}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Active Editorial Text Panel */}
              {(() => {
                const activeData = ARCHITECTURE_DATA[activeArchitectureId];
                return (
                  <div
                    key={activeArchitectureId}
                    id={`arch-panel-${activeArchitectureId}`}
                    role="tabpanel"
                    aria-labelledby={`arch-tab-${activeArchitectureId}`}
                    className="architecture-panel"
                  >
                    <div className="architecture-panel__top">
                      <span className="architecture-panel__phase">
                        {activeData.phase}
                      </span>
                      <span className="architecture-panel__subtitle">
                        {activeData.subtitle}
                      </span>
                    </div>

                    <h3 className="architecture-panel__title">
                      {activeData.title}
                    </h3>

                    <p className="architecture-panel__description">
                      {activeData.description}
                    </p>

                    <div className="architecture-panel__metrics">
                      <div className="metric-box">
                        <span className="metric-box__label">Position</span>
                        <span className="metric-box__value">{activeData.coordinates}</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-box__label">Materials</span>
                        <span className="metric-box__value">Obsidian frame · Tinted glass</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-box__label">Controls</span>
                        <span className="metric-box__value">Click in space or use arrow keys</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Section 5: ARTIFACTS — Floating Abstract Forms */}
          <section
            className="section-panel artifacts-section"
            id="artifacts"
            aria-labelledby="artifacts-title"
          >
            <div className="artifacts-header">
              <p className="artifacts-pretitle">
                <span className="artifacts-pretitle__indicator" aria-hidden="true" />
                <span>05 // THREE ARTIFACTS</span>
              </p>

              <h2 id="artifacts-title" className="artifacts-title" aria-label="KINETIC FORMS">
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">KINETIC</span>
                </span>
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">FORMS</span>
                </span>
              </h2>

              <div className="artifacts-narrative-block">
                <div className="editorial-meta-row">
                  <span className="editorial-meta-item">STUDY 05</span>
                  <span className="editorial-meta-divider" aria-hidden="true">·</span>
                  <span className="editorial-meta-item">SURFACE REFRACTION</span>
                  <span className="editorial-meta-divider" aria-hidden="true">·</span>
                  <span className="editorial-meta-item">KINETIC RESPONSE</span>
                </div>

                <div className="artifacts-divider" aria-hidden="true" />

                <p className="artifacts-narrative-prose">
                  Between physical sculpture and digital code sit these three studies in surface and light.
                  Each responds to contact differently: one ripples like thin glass, one shivers like liquid metal,
                  and one fractures into light.
                </p>

                <p className="artifacts-narrative-subprose">
                  Hover to illuminate edges and tilt in perspective. Click any object in 3D space to trigger its distinctive impulse wave.
                </p>
              </div>
            </div>

            <div className="artifacts-interface">
              {/* Accessible Keyboard-Operable Tab Navigation */}
              <div
                className="artifacts-nav"
                role="tablist"
                aria-label="Select abstract artifact"
              >
                {(['glass', 'chrome', 'crystal'] as const).map((id, index) => {
                  const item = ARTIFACTS_DATA[id];
                  const isSelected = activeArtifactId === id;
                  const isHovered = hoveredArtifactId === id;
                  return (
                    <button
                      key={id}
                      id={`artifact-tab-${id}`}
                      role="tab"
                      type="button"
                      aria-selected={isSelected}
                      aria-controls={`artifact-panel-${id}`}
                      tabIndex={isSelected ? 0 : -1}
                      className={`artifacts-tab ${isSelected ? 'is-selected' : ''} ${
                        isHovered ? 'is-hovered' : ''
                      }`}
                      onClick={() => handleSelectArtifact(id)}
                      onMouseEnter={() => setHoveredArtifactId(id)}
                      onMouseLeave={() => setHoveredArtifactId(null)}
                      onFocus={() => setHoveredArtifactId(id)}
                      onBlur={() => setHoveredArtifactId(null)}
                      onKeyDown={(e) => {
                        const tabs: ArtifactId[] = ['glass', 'chrome', 'crystal'];
                        let newIdx = -1;
                        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          newIdx = (index + 1) % tabs.length;
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          newIdx = (index - 1 + tabs.length) % tabs.length;
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          newIdx = 0;
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          newIdx = tabs.length - 1;
                        }
                        if (newIdx !== -1) {
                          const nextId = tabs[newIdx];
                          handleSelectArtifact(nextId);
                          document.getElementById(`artifact-tab-${nextId}`)?.focus();
                        }
                      }}
                    >
                      <span className="artifacts-tab__index">0{index + 1}</span>
                      <span className="artifacts-tab__label">{item.title}</span>
                      <span
                        className="artifacts-tab__accent"
                        style={{ backgroundColor: item.accentColor }}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Active Editorial Detail Panel */}
              {(() => {
                const activeData = ARTIFACTS_DATA[activeArtifactId];
                return (
                  <div
                    key={activeArtifactId}
                    id={`artifact-panel-${activeArtifactId}`}
                    role="tabpanel"
                    aria-labelledby={`artifact-tab-${activeArtifactId}`}
                    className="artifacts-panel"
                  >
                    <div className="artifacts-panel__top">
                      <span className="artifacts-panel__phase">
                        {activeData.phase}
                      </span>
                      <span className="artifacts-panel__subtitle">
                        {activeData.subtitle}
                      </span>
                    </div>

                    <h3 className="artifacts-panel__title">
                      {activeData.title}
                    </h3>

                    <p className="artifacts-panel__description">
                      {activeData.description}
                    </p>

                    <div className="artifacts-panel__metrics">
                      <div className="metric-box">
                        <span className="metric-box__label">Material</span>
                        <span className="metric-box__value">{activeData.material}</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-box__label">Response</span>
                        <span className="metric-box__value">{activeData.behavior}</span>
                      </div>
                      <div className="metric-box">
                        <span className="metric-box__label">Controls</span>
                        <span className="metric-box__value">Click in 3D space or press Trigger</span>
                      </div>
                    </div>

                    <div className="artifacts-panel__action">
                      <button
                        type="button"
                        className="artifacts-trigger-btn"
                        onClick={handleTriggerActiveArtifact}
                        aria-label={`Trigger kinetic response for ${activeData.title}`}
                      >
                        <span className="artifacts-trigger-btn__dot" aria-hidden="true" />
                        <span>TRIGGER KINETIC IMPULSE</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Section 6: RESONANCE (Sculptural Glass-Distortion Installation) */}
          <section
            className="section-panel resonance-section"
            id="resonance"
            aria-labelledby="resonance-title"
          >
            <div className="resonance-content">
              <div className="resonance-header">
                <p className="resonance-pretitle">
                  <span className="resonance-pretitle__indicator" aria-hidden="true" />
                  <span>06 // OPTICAL RESONANCE</span>
                </p>

                <h2 id="resonance-title" className="resonance-title" aria-label="RESONANCE">
                  <span className="title-reveal-line" aria-hidden="true">
                    <span className="title-reveal-word">RESONANCE</span>
                  </span>
                </h2>

                <div className="resonance-narrative-block">
                  <div className="editorial-meta-row">
                    <span className="editorial-meta-item">STUDY 06</span>
                    <span className="editorial-meta-divider" aria-hidden="true">·</span>
                    <span className="editorial-meta-item">CAST OBSIDIAN</span>
                    <span className="editorial-meta-divider" aria-hidden="true">·</span>
                    <span className="editorial-meta-item">REFRACTIVE MEMBRANE</span>
                  </div>

                  <div className="resonance-divider" aria-hidden="true" />

                  <p className="resonance-narrative-prose">
                    Suspended behind a curved acoustic lens sits a monolithic obsidian figure.
                    As your gaze moves across the glass, optical refraction bends light and parts the surface atmosphere,
                    revealing the sculpture beneath.
                  </p>
                </div>
              </div>

              {/* Accessible Interactive HUD Overlay */}
              <div className="resonance-hud">
                <div className="resonance-hud__status-box">
                  <span className="resonance-hud__label">Lens State</span>
                  <div className="resonance-status-pill">
                    <span
                      className={`resonance-status-pill__dot is-${resonanceState}`}
                      aria-hidden="true"
                    />
                    <span className="resonance-status-pill__text">
                      {resonanceState.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="resonance-hud__metrics">
                  <div className="metric-box">
                    <span className="metric-box__label">Medium</span>
                    <span className="metric-box__value">Cast Obsidian · Glass Lens</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-box__label">Optics</span>
                    <span className="metric-box__value">Dynamic Pointer Refraction</span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-box__label">Response</span>
                    <span className="metric-box__value">Localized Surface Clearing</span>
                  </div>
                </div>

                <div className="resonance-hud__action">
                  <button
                    type="button"
                    className="resonance-trigger-btn"
                    onClick={handleTriggerResonance}
                    aria-label="Trigger refractive pulse wave through the glass lens"
                  >
                    <span className="resonance-trigger-btn__dot" aria-hidden="true" />
                    <span>TRIGGER REFRACTIVE PULSE</span>
                  </button>
                  <span className="resonance-hud__hint">
                    Pointer deflection active · Click glass to send refractive wave
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: CODA — The Deliberate Ending */}
          <section
            className="section-panel coda-section"
            id="coda"
            aria-labelledby="coda-title"
          >
            <div className="coda-content">
              <p className="coda-pretitle">
                <span className="coda-pretitle__indicator" aria-hidden="true" />
                <span>07 // CLOSING</span>
              </p>

              <h2 id="coda-title" className="coda-title" aria-label="WHAT PERSISTS">
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">WHAT</span>
                </span>
                <span className="title-reveal-line" aria-hidden="true">
                  <span className="title-reveal-word">PERSISTS</span>
                </span>
              </h2>

              <div className="coda-statement-block">
                <p className="coda-statement">
                  Long after the light goes out, the shape stays behind.
                  An afterimage is not darkness—it is the memory of light fading quietly on its own time.
                </p>

                <div className="coda-divider" aria-hidden="true" />

                <div className="coda-meta-row">
                  <span className="coda-meta-item">AFTERIMAGE</span>
                  <span className="coda-meta-divider" aria-hidden="true">·</span>
                  <span className="coda-meta-item">AN INTERACTIVE STUDY</span>
                  <span className="coda-meta-divider" aria-hidden="true">·</span>
                  <span className="coda-meta-item">THREE.JS &amp; GSAP</span>
                </div>
              </div>

              <div className="coda-actions">
                <a
                  href="#threshold"
                  className="coda-return-button"
                  onClick={() => soundManager.playArchetypeSelect()}
                  aria-label="Return to the beginning of AFTERIMAGE"
                >
                  <span className="coda-return-button__icon" aria-hidden="true">
                    <ArrowUp size={13} strokeWidth={1.75} />
                  </span>
                  <span className="coda-return-button__label">RETURN TO THRESHOLD</span>
                  <span className="coda-return-button__indicator" aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="site-footer">
          <span className="footer-edition">AFTERIMAGE — REAL-TIME 3D &amp; CREATIVE CODE</span>
          <span className="footer-manifest-status">END OF INSTALLATION</span>
        </footer>
      </div>
    </>
  );
};

export default App;
