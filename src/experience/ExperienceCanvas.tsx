import React, { Component, ErrorInfo, ReactNode, Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ExperienceWorld } from './ExperienceWorld';
import { LoadingFallback } from '../components/LoadingFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn('[AFTERIMAGE] WebGL canvas error caught gracefully:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export interface ExperienceCanvasProps {
  readonly className?: string;
  readonly activeArchitectureId?: string;
  readonly onSelectArchitecture?: (id: string) => void;
  readonly hoveredArchitectureId?: string | null;
  readonly onHoverArchitecture?: (id: string | null) => void;
  readonly activeArtifactId?: string;
  readonly onSelectArtifact?: (id: string) => void;
  readonly hoveredArtifactId?: string | null;
  readonly onHoverArtifact?: (id: string | null) => void;
  readonly artifactTriggerTimestamp?: number;
  readonly resonanceTriggerTimestamp?: number;
  readonly onTriggerResonance?: () => void;
}

export const ExperienceCanvas: React.FC<ExperienceCanvasProps> = ({
  className,
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
  const [canRenderWebGL, setCanRenderWebGL] = useState(false);

  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const supported = Boolean(
        window.WebGLRenderingContext &&
          (testCanvas.getContext('webgl2') ||
            testCanvas.getContext('webgl') ||
            testCanvas.getContext('experimental-webgl'))
      );
      setCanRenderWebGL(supported);
    } catch {
      setCanRenderWebGL(false);
    }
  }, []);

  if (!canRenderWebGL) {
    return null;
  }

  return (
    <div
      className={`experience-canvas-container ${className ?? ''}`.trim()}
      aria-hidden="true"
    >
      <CanvasErrorBoundary>
        <Suspense fallback={<LoadingFallback label="Loading scene" />}>
          <Canvas
            camera={{ position: [0, 0, 6], fov: 42, near: 0.1, far: 40 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            dpr={[1, 1.5]}
            eventSource={document.body}
            eventPrefix="client"
          >
            <ExperienceWorld
              activeArchitectureId={activeArchitectureId}
              onSelectArchitecture={onSelectArchitecture}
              hoveredArchitectureId={hoveredArchitectureId}
              onHoverArchitecture={onHoverArchitecture}
              activeArtifactId={activeArtifactId}
              onSelectArtifact={onSelectArtifact}
              hoveredArtifactId={hoveredArtifactId}
              onHoverArtifact={onHoverArtifact}
              artifactTriggerTimestamp={artifactTriggerTimestamp}
              resonanceTriggerTimestamp={resonanceTriggerTimestamp}
              onTriggerResonance={onTriggerResonance}
            />
          </Canvas>
        </Suspense>
      </CanvasErrorBoundary>
    </div>
  );
};
