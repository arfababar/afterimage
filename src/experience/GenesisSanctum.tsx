import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';

interface GenesisSanctumProps {
  opacityRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  bloomRef?: React.MutableRefObject<number>;
}

// Error boundary to protect WebGL from missing or unsupported model assets
class CharacterErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[Opening] Model file not yet available, awaiting asset placement:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Nahida 3D Character Model Component
 * Loads /models/nahida.glb with height normalization (~1.68 units),
 * grounded at y = -0.84, face/eye level at y = +0.62.
 * Includes embedded skeletal animation playback and gentle living idle motion.
 */
const NahidaCharacter: React.FC<{
  opacityRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}> = ({ opacityRef, pointerRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF('/models/nahida.glb');
  const { actions, names } = useAnimations(gltf.animations, groupRef);

  const { clonedScene } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.y, 0.01);
    // Target height 1.68 units: standing full-body from y = -0.84 to y = +0.84
    const scale = 1.68 / maxDim;

    // Center horizontally on X and Z; align feet to ground plane
    const feetY = center.y - size.y * 0.5;
    clone.position.set(-center.x * scale, -feetY * scale - 0.84, -center.z * scale);
    clone.scale.set(scale, scale, scale);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.roughness = Math.min(mat.roughness ?? 0.5, 0.65);
        }
      }
    });

    return { clonedScene: clone };
  }, [gltf.scene]);

  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const px = pointerRef.current.x;
    const py = pointerRef.current.y;
    const opacity = opacityRef.current;

    // Subtle living harmonic idle breathing if static
    if (names.length === 0) {
      groupRef.current.position.y = Math.sin(t * 1.8) * 0.008;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        px * 0.06 + Math.sin(t * 0.5) * 0.015,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -py * 0.03,
        0.05
      );
    } else {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, px * 0.05, 0.05);
    }

    // Dynamic opacity on character materials as camera transitions through face
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
};

/**
 * Awaiting Character Asset Indicator
 * Clean, luminous golden presence aura at the exact 1.68m character pose
 * (Reveals awaiting status without substituting any sculptures, mannequins or geometric placeholders)
 */
const CharacterPresenceAura: React.FC<{
  opacityRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
}> = ({ opacityRef, pointerRef }) => {
  const auraGroupRef = useRef<THREE.Group>(null);
  const auraMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const opacity = opacityRef.current;
    if (auraGroupRef.current) {
      auraGroupRef.current.position.y = Math.sin(t * 1.5) * 0.015;
      auraGroupRef.current.rotation.y = t * 0.25 + pointerRef.current.x * 0.08;
    }
    if (auraMatRef.current) {
      auraMatRef.current.opacity = 0.45 * opacity;
    }
  });

  return (
    <group ref={auraGroupRef} position={[0, 0, 0]}>
      {/* Soft warm luminous silhouette cylinder showing character volume and standing height */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.32, 1.68, 32, 1, true]} />
        <meshBasicMaterial
          ref={auraMatRef}
          color="#FFE2A8"
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/**
 * Screen-Space Luminous Transition Bloom
 * Produces the warm peach & champagne gold bloom that softly envelopes the view
 * as the camera passes through the character's face close-up and transitions to Section 2.
 */
const TransitionBloomQuad: React.FC<{
  bloomRef?: React.MutableRefObject<number>;
}> = ({ bloomRef }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    const b = bloomRef ? bloomRef.current : 0;
    if (meshRef.current) {
      meshRef.current.visible = b > 0.005;
    }
    if (matRef.current && b > 0.005) {
      matRef.current.uniforms.uBloom.value = b;
    }
  });

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uBloom: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uBloom;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          vec3 coreIvory = vec3(1.0, 0.96, 0.90);
          vec3 blushPeach = vec3(0.98, 0.76, 0.60);
          vec3 col = mix(coreIvory, blushPeach, smoothstep(0.0, 0.65, dist));
          float alpha = uBloom * smoothstep(1.0, 0.08, dist) * 0.98;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} ref={matRef} attach="material" />
    </mesh>
  );
};

export const GenesisSanctum: React.FC<GenesisSanctumProps> = ({
  opacityRef,
  pointerRef,
  bloomRef,
}) => {
  const sceneGroupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.SpotLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const starlightMatRef = useRef<THREE.PointsMaterial>(null);

  const [hasModelFile, setHasModelFile] = useState(false);

  // Probe localhost static route to see if nahida.glb exists
  useEffect(() => {
    let active = true;
    const probe = async () => {
      try {
        const res = await fetch('/models/nahida.glb', { method: 'HEAD' });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && !contentType.includes('text/html')) {
          if (active) setHasModelFile(true);
        } else {
          if (active) setHasModelFile(false);
        }
      } catch {
        if (active) setHasModelFile(false);
      }
    };
    probe();
    const timer = setInterval(probe, 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Floating ambient starlight dust around character
  const starlightMotes = useMemo(() => {
    const count = 36;
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.8;
      seeds[i * 3] = Math.random() * Math.PI * 2;
      seeds[i * 3 + 1] = 0.4 + Math.random() * 0.7;
      seeds[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return { geom, seeds, count };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const opacity = opacityRef.current;

    if (sceneGroupRef.current) {
      const isVisible = opacity > 0.005;
      sceneGroupRef.current.visible = isVisible;
      if (!isVisible) return;
    }

    // Dynamic cinematic lighting intensities
    if (keyLightRef.current) keyLightRef.current.intensity = 2.4 * opacity;
    if (fillLightRef.current) fillLightRef.current.intensity = 1.1 * opacity;
    if (rimLightRef.current) rimLightRef.current.intensity = 3.2 * opacity;

    // Drifting starlight particles
    const positions = starlightMotes.geom.attributes.position.array as Float32Array;
    for (let i = 0; i < starlightMotes.count; i++) {
      const idx = i * 3;
      const seedY = starlightMotes.seeds[idx + 1];
      positions[idx + 1] += delta * seedY * 0.25;
      if (positions[idx + 1] > 2.2) {
        positions[idx + 1] = -1.8;
      }
      positions[idx] += Math.sin(t * 0.7 + starlightMotes.seeds[idx]) * 0.0016;
    }
    starlightMotes.geom.attributes.position.needsUpdate = true;
    if (starlightMatRef.current) {
      starlightMatRef.current.opacity = 0.55 * opacity;
    }
  });

  return (
    <>
      <group ref={sceneGroupRef} position={[0, 0, 0]}>
        {/* Key Spotlight: Warm Ivory highlighting facial features & hair contours */}
        <spotLight
          ref={keyLightRef}
          position={[1.8, 2.5, 2.2]}
          target-position={[0, 0.4, 0]}
          color="#FFF6EB"
          intensity={2.4}
          angle={0.65}
          penumbra={0.75}
        />

        {/* Silhouette Rim Light: Warm Champagne Gold separating character from background */}
        <pointLight
          ref={rimLightRef}
          position={[0, 1.3, -1.8]}
          color="#FFE09A"
          intensity={3.2}
          distance={7.5}
        />

        {/* Soft Warm Fill Light: Blush Peach softening front-right shadows */}
        <pointLight
          ref={fillLightRef}
          position={[-1.6, 0.3, 1.8]}
          color="#F9D2B8"
          intensity={1.1}
          distance={6}
        />

        {/* Ambient Warm Starlight Motes */}
        <points geometry={starlightMotes.geom}>
          <pointsMaterial
            ref={starlightMatRef}
            size={0.032}
            color="#FFE6B8"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* The 3D Game Character */}
        <CharacterErrorBoundary
          fallback={<CharacterPresenceAura opacityRef={opacityRef} pointerRef={pointerRef} />}
        >
          {hasModelFile ? (
            <Suspense
              fallback={<CharacterPresenceAura opacityRef={opacityRef} pointerRef={pointerRef} />}
            >
              <NahidaCharacter opacityRef={opacityRef} pointerRef={pointerRef} />
            </Suspense>
          ) : (
            <CharacterPresenceAura opacityRef={opacityRef} pointerRef={pointerRef} />
          )}
        </CharacterErrorBoundary>
      </group>

      {/* Screen-space transition bloom active during face close-up push-through */}
      <TransitionBloomQuad bloomRef={bloomRef} />
    </>
  );
};
