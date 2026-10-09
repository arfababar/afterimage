import React, { useEffect, useRef } from 'react';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Activate strictly for fine-pointer devices and when reduced motion is not preferred
    const finePointerQuery = window.matchMedia('(pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (!finePointerQuery.matches || reducedMotionQuery.matches) {
      return;
    }

    const cursorEl = cursorRef.current;
    const dotEl = dotRef.current;
    const ringEl = ringRef.current;

    if (!cursorEl || !dotEl || !ringEl) return;

    // Apply cursor styling to body for fine pointer devices
    document.body.classList.add('has-custom-cursor');

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let isVisible = false;
    let rafId: number | null = null;

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;

      // Immediately translate the central dot to match exact pointer coordinates
      dotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      if (!isVisible) {
        isVisible = true;
        ringX = mouseX;
        ringY = mouseY;
        cursorEl.classList.remove('is-hidden');
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

    // RAF loop for smooth trailing ring animation (subtle lag, not a distracting delay)
    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      ringEl.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;

      rafId = requestAnimationFrame(animateRing);
    };

    rafId = requestAnimationFrame(animateRing);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
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
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('mouseleave', hideCursor);
      document.removeEventListener('mouseenter', showCursor);
      window.removeEventListener('blur', hideCursor);
      window.removeEventListener('focus', showCursor);
      finePointerQuery.removeEventListener('change', onPreferenceChange);
      reducedMotionQuery.removeEventListener('change', onPreferenceChange);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="custom-cursor is-hidden"
      aria-hidden="true"
    >
      <div ref={dotRef} className="custom-cursor__dot">
        <div className="custom-cursor__dot-inner" />
      </div>
      <div ref={ringRef} className="custom-cursor__ring" />
    </div>
  );
};
