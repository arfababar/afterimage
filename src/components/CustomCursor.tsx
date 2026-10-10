import React, { useEffect, useRef } from 'react';

interface FairyParticle {
  el: HTMLDivElement;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  isStar: boolean;
}

const POOL_SIZE = 36;
const PALETTE = [
  '#C6A6FF', // muted violet
  '#F4EFEB', // pearl white
  '#E5A66D', // warm amber
  '#D8C4FF', // soft iris
];

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const fairyWrapperRef = useRef<HTMLDivElement>(null);
  const poolContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Activate strictly for fine-pointer devices and when reduced motion is not preferred
    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      return;
    }

    const cursorEl = cursorRef.current;
    const fairyEl = fairyWrapperRef.current;
    const poolEl = poolContainerRef.current;

    if (!cursorEl || !fairyEl || !poolEl) return;

    // Apply cursor styling to body for fine pointer devices
    document.body.classList.add('has-custom-cursor');

    // Initialize particle pool DOM elements once
    poolEl.innerHTML = '';
    const particles: FairyParticle[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const el = document.createElement('div');
      el.className = 'fairy-particle';
      poolEl.appendChild(el);
      particles.push({
        el,
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        life: 0,
        maxLife: 0.5,
        color: PALETTE[0],
        isStar: false,
      });
    }

    let poolIdx = 0;
    const spawnParticle = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      maxLife: number,
      size: number,
      color: string,
      isStar = false
    ) => {
      const p = particles[poolIdx];
      poolIdx = (poolIdx + 1) % POOL_SIZE;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = 1.0;
      p.maxLife = maxLife;
      p.size = size;
      p.color = color;
      p.isStar = isStar;

      p.el.style.width = `${size}px`;
      p.el.style.height = `${size}px`;
      p.el.style.backgroundColor = color;
      p.el.style.boxShadow = isStar ? `0 0 6px ${color}` : `0 0 3px ${color}`;

      if (isStar) {
        p.el.classList.add('is-star');
      } else {
        p.el.classList.remove('is-star');
      }
      p.el.style.opacity = '0.9';
    };

    const burstSparkles = (x: number, y: number, count = 7) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        const speed = 25 + Math.random() * 55;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 15;
        const maxLife = 0.4 + Math.random() * 0.35;
        const size = Math.random() < 0.35 ? 4 : (1.5 + Math.random() * 2);
        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const isStar = Math.random() < 0.45;
        spawnParticle(x, y, vx, vy, maxLife, size, color, isStar);
      }
    };

    let mouseX = -100;
    let mouseY = -100;
    let fairyX = -100;
    let fairyY = -100;
    let tilt = 0;
    let isVisible = false;
    let lastEmitX = -100;
    let lastEmitY = -100;
    let lastEmitTime = 0;
    let lastWheelTime = 0;
    let rafId: number | null = null;

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      if (!isVisible) {
        isVisible = true;
        fairyX = mouseX;
        fairyY = mouseY;
        cursorEl.classList.remove('is-hidden');
      }

      // Delicate trailing particles as cursor moves
      const now = performance.now();
      const dist = Math.hypot(mouseX - lastEmitX, mouseY - lastEmitY);
      if (dist > 9 && now - lastEmitTime > 32) {
        lastEmitX = mouseX;
        lastEmitY = mouseY;
        lastEmitTime = now;

        const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const isStar = Math.random() < 0.25;
        const size = isStar ? 3.5 : (1.5 + Math.random() * 1.5);
        const vx = (Math.random() - 0.5) * 12;
        const vy = (Math.random() - 0.5) * 12 + 8;
        // Emit near fairy body/trailing gown
        spawnParticle(fairyX + 10, fairyY + 12, vx, vy, 0.4 + Math.random() * 0.25, size, color, isStar);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      burstSparkles(event.clientX, event.clientY, 8);
    };

    const onWheel = () => {
      const now = performance.now();
      if (now - lastWheelTime > 80 && isVisible) {
        lastWheelTime = now;
        burstSparkles(fairyX + 6, fairyY + 5, 3);
      }
    };

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const isInteractive = Boolean(
        target.closest('a, button, [role="button"], input, textarea, select, [data-interactive]')
      );
      if (isInteractive) {
        cursorEl.classList.add('is-hovering');
      } else {
        cursorEl.classList.remove('is-hovering');
      }
    };

    const onMouseOut = (event: MouseEvent) => {
      const related = event.relatedTarget as HTMLElement | null;
      if (
        !related ||
        !related.closest('a, button, [role="button"], input, textarea, select, [data-interactive]')
      ) {
        cursorEl.classList.remove('is-hovering');
      }
    };

    const hideCursor = () => {
      cursorEl.classList.add('is-hidden');
    };

    const showCursor = () => {
      if (mouseX > 0 && mouseY > 0) {
        cursorEl.classList.remove('is-hidden');
      }
    };

    let lastTime = performance.now();
    const animateFairy = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (isVisible) {
        // High-responsiveness exponential follow (crisp, zero lag, silky floating inertia)
        const followFactor = 1 - Math.exp(-26 * (dt || 0.016));
        const prevX = fairyX;
        fairyX += (mouseX - fairyX) * followFactor;
        fairyY += (mouseY - fairyY) * followFactor;

        // Gentle floating breath
        const t = now * 0.001;
        const floatY = Math.sin(t * 3.2) * 1.4;
        const floatX = Math.cos(t * 2.1) * 0.7;

        // Aerodynamic tilt banking towards motion
        const vx = fairyX - prevX;
        const targetTilt = Math.max(-16, Math.min(16, vx * 0.65));
        tilt += (targetTilt - tilt) * (1 - Math.exp(-18 * (dt || 0.016)));

        fairyEl.style.transform = `translate3d(${(fairyX + floatX).toFixed(1)}px, ${(fairyY + floatY).toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg)`;
      }

      // Update particle pool
      for (let i = 0; i < POOL_SIZE; i++) {
        const p = particles[i];
        if (!p.active) continue;

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= (1 - 2.8 * dt);
        p.vy *= (1 - 2.8 * dt);
        p.life -= dt / p.maxLife;

        if (p.life <= 0) {
          p.active = false;
          p.el.style.opacity = '0';
        } else {
          p.el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${p.life.toFixed(2)})`;
          p.el.style.opacity = (p.life * 0.85).toFixed(2);
        }
      }

      rafId = requestAnimationFrame(animateFairy);
    };

    rafId = requestAnimationFrame(animateFairy);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });
    document.addEventListener('mouseleave', hideCursor);
    document.addEventListener('mouseenter', showCursor);
    window.addEventListener('blur', hideCursor);
    window.addEventListener('focus', showCursor);

    // Dynamic listeners if device input characteristics or motion preferences change
    const onPreferenceChange = () => {
      if (!finePointerQuery.matches || reducedMotionQuery.matches) {
        document.body.classList.remove('has-custom-cursor');
        cursorEl.classList.add('is-hidden');
      } else {
        document.body.classList.add('has-custom-cursor');
      }
    };

    finePointerQuery.addEventListener('change', onPreferenceChange);
    reducedMotionQuery.addEventListener('change', onPreferenceChange);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      document.body.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('wheel', onWheel);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
      window.removeEventListener('blur', hideCursor);
      window.removeEventListener('focus', showCursor);
      finePointerQuery.removeEventListener('change', onPreferenceChange);
      reducedMotionQuery.removeEventListener('change', onPreferenceChange);
      if (poolEl) poolEl.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div
        ref={poolContainerRef}
        className="fairy-particle-pool"
        aria-hidden="true"
      />
      <div
        ref={cursorRef}
        className="custom-cursor is-hidden"
        aria-hidden="true"
      >
        <div ref={fairyWrapperRef} className="custom-cursor__fairy-wrapper">
          <svg viewBox="0 0 28 28" className="custom-cursor__fairy-svg">
            <defs>
              <filter id="fairyCoreGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="fairyWingGradFore" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#C6A6FF" stopOpacity="0.65" />
                <stop offset="75%" stopColor="#B896F8" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#E5A66D" stopOpacity="0.25" />
              </linearGradient>
              <linearGradient id="fairyWingGradBack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E9E1D6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#9B72CF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#C6A6FF" stopOpacity="0.15" />
              </linearGradient>
              <radialGradient id="fairySparkleGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#FFF2D6" />
                <stop offset="75%" stopColor="#E5A66D" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E5A66D" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Back gossamer wings */}
            <g className="fairy-wing-back">
              <path
                d="M 13 12 C 11 6, 4 3, 5 10 C 6 13, 10 14, 13 13 Z"
                fill="url(#fairyWingGradBack)"
                stroke="rgba(198,166,255,0.45)"
                strokeWidth="0.4"
              />
              <path
                d="M 13 14 C 10 16, 5 17, 7 21 C 9 22, 12 18, 13 15 Z"
                fill="url(#fairyWingGradBack)"
                stroke="rgba(198,166,255,0.3)"
                strokeWidth="0.4"
                opacity="0.75"
              />
            </g>

            {/* Slender ethereal body & flowing dress wisp */}
            <g className="fairy-body">
              <path
                d="M 13 15 C 13.5 18, 12 21, 14 25 C 14.8 23, 15.5 19, 14.5 15 Z"
                fill="#C6A6FF"
                opacity="0.7"
              />
              <path
                d="M 13.2 16 C 13.8 19, 13 22, 14.2 24 C 14.5 22, 14.8 18, 14 16 Z"
                fill="#E9E1D6"
                opacity="0.5"
              />
              <path
                d="M 12.8 10 C 13.2 11.5, 13.6 13.5, 13.3 15 C 13.8 15, 14.2 13.5, 13.9 11 Z"
                fill="#F4EFEB"
              />
              <circle cx="13.2" cy="9.2" r="1.3" fill="#FFFFFF" />
              <path
                d="M 13.2 11.2 C 11.5 9.5, 9.5 8, 7.5 7"
                fill="none"
                stroke="#F4EFEB"
                strokeWidth="0.6"
                strokeLinecap="round"
              />
            </g>

            {/* Fore gossamer wings */}
            <g className="fairy-wing-fore">
              <path
                d="M 13.5 12 C 16 5, 23 2, 22 9 C 21 13, 17 14, 13.5 13 Z"
                fill="url(#fairyWingGradFore)"
                stroke="#E9E1D6"
                strokeWidth="0.5"
              />
              <path
                d="M 13.5 12 C 17 8, 20 6, 21.5 8"
                fill="none"
                stroke="#C6A6FF"
                strokeWidth="0.4"
                opacity="0.8"
              />
              <path
                d="M 16 10 C 18 11, 20 11.5, 21 11"
                fill="none"
                stroke="#E5A66D"
                strokeWidth="0.3"
                opacity="0.7"
              />
              <path
                d="M 13.5 14 C 17 17, 22 18, 20 22 C 17.5 23, 15 19, 13.5 15 Z"
                fill="url(#fairyWingGradFore)"
                stroke="rgba(198,166,255,0.6)"
                strokeWidth="0.4"
                opacity="0.85"
              />
              <path
                d="M 13.5 14 C 16.5 17, 18.5 18, 19.5 20.5"
                fill="none"
                stroke="#C6A6FF"
                strokeWidth="0.3"
                opacity="0.6"
              />
            </g>

            {/* Luminous core spark */}
            <circle cx="13.3" cy="11.8" r="1.1" fill="#FFFFFF" filter="url(#fairyCoreGlow)" />
            <circle cx="13.3" cy="11.8" r="0.6" fill="#E5A66D" />

            {/* Guiding leading starlight aligned with pointer tip (6, 5) */}
            <g transform="translate(6, 5)">
              <circle cx="0" cy="0" r="1.6" fill="url(#fairySparkleGrad)" filter="url(#fairyCoreGlow)" />
              <polygon
                points="0,-2.6 0.6,-0.6 2.6,0 0.6,0.6 0,2.6 -0.6,0.6 -2.6,0 -0.6,-0.6"
                fill="#FFFFFF"
              />
              <polygon
                points="0,-1.5 0.35,-0.35 1.5,0 0.35,0.35 0,1.5 -0.35,0.35 -1.5,0 -0.35,-0.35"
                fill="#E5A66D"
              />
            </g>
          </svg>
        </div>
      </div>
    </>
  );
};
