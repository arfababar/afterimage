import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

if (typeof window !== 'undefined') {
  (window as unknown as { ScrollTrigger: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
}

export { gsap, useGSAP, ScrollTrigger };
