import { assetManifest } from './assetManifest';

export interface SoundState {
  isEnabled: boolean;
  isAvailable: boolean;
  isAmbientPlaying: boolean;
}

/**
 * Minimal spatial sound system for AFTERIMAGE.
 * 
 * Guarantees:
 * 1. Sound is disabled (OFF) by default; never autoplays.
 * 2. Only activates on explicit user interaction.
 * 3. Handles browser autoplay policies and missing audio assets gracefully.
 * 4. Master volume is restrained with smooth gain fades.
 * 5. Debounces interaction sounds to prevent overlapping audio noise.
 */
class SoundSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private interactionGain: GainNode | null = null;
  private ambientElement: HTMLAudioElement | null = null;
  private interactionElement: HTMLAudioElement | null = null;
  private isEnabled = false;
  private lastInteractionTime = 0;
  private listeners: Set<(state: SoundState) => void> = new Set();

  public subscribe(listener: (state: SoundState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SoundState {
    const isBrowser = typeof window !== 'undefined';
    const hasAudioCtx = isBrowser && Boolean(
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    );

    return {
      isEnabled: this.isEnabled,
      isAvailable: hasAudioCtx,
      isAmbientPlaying: Boolean(this.isEnabled && this.ambientElement && !this.ambientElement.paused),
    };
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.warn('[AFTERIMAGE Sound] Error in state listener:', err);
      }
    });
  }

  private ensureAudioContext(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.audioContext) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return false;

        this.audioContext = new AudioCtx();

        // Master Gain
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.masterGain.connect(this.audioContext.destination);

        // Ambient Gain: restrained max 0.22
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.setValueAtTime(0.22, this.audioContext.currentTime);
        this.ambientGain.connect(this.masterGain);

        // Interaction Gain: restrained max 0.28
        this.interactionGain = this.audioContext.createGain();
        this.interactionGain.gain.setValueAtTime(0.28, this.audioContext.currentTime);
        this.interactionGain.connect(this.masterGain);
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return true;
    } catch (err) {
      console.warn('[AFTERIMAGE Sound] AudioContext initialization failed:', err);
      return false;
    }
  }

  public async toggle(): Promise<boolean> {
    if (this.isEnabled) {
      await this.disable();
      return false;
    } else {
      return await this.enable();
    }
  }

  public async enable(): Promise<boolean> {
    const initialized = this.ensureAudioContext();
    if (!initialized || !this.audioContext || !this.masterGain) {
      this.isEnabled = false;
      this.notify();
      return false;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      this.isEnabled = true;

      // Smooth fade-in of master gain over 1.0s
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(1.0, now + 1.0);

      // Attempt ambient audio start if asset is registered
      this.startAmbient();

      this.notify();
      return true;
    } catch (err) {
      console.warn('[AFTERIMAGE Sound] Failed to enable audio:', err);
      this.isEnabled = false;
      this.notify();
      return false;
    }
  }

  public async disable(): Promise<void> {
    if (!this.isEnabled) return;
    this.isEnabled = false;

    if (this.audioContext && this.masterGain) {
      try {
        const now = this.audioContext.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        // Smooth fade-out over 0.4s
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.4);

        setTimeout(() => {
          this.pauseAmbient();
          if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend().catch(() => {});
          }
        }, 420);
      } catch {
        this.pauseAmbient();
      }
    } else {
      this.pauseAmbient();
    }

    this.notify();
  }

  private startAmbient(): void {
    const ambientMeta = assetManifest.audio?.ambientDrone;
    if (!ambientMeta || !ambientMeta.path) return;

    if (!this.ambientElement) {
      const audio = new Audio();
      audio.src = ambientMeta.path;
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      audio.volume = ambientMeta.volume ?? 0.22;

      // Connect to Web Audio graph if possible
      if (this.audioContext && this.ambientGain) {
        try {
          const source = this.audioContext.createMediaElementSource(audio);
          source.connect(this.ambientGain);
        } catch {
          // Fall back to direct element volume if already connected or restricted
          audio.volume = ambientMeta.volume ?? 0.22;
        }
      }

      audio.addEventListener('error', () => {
        // Handled silently when asset is not present on disk
        console.debug('[AFTERIMAGE Sound] Ambient audio asset not present on disk:', ambientMeta.path);
      });

      this.ambientElement = audio;
    }

    this.ambientElement.play().catch((err) => {
      console.debug('[AFTERIMAGE Sound] Ambient playback deferred or asset unavailable:', err.message);
    });
  }

  private pauseAmbient(): void {
    if (this.ambientElement) {
      this.ambientElement.pause();
    }
  }

  public playArchetypeSelect(_id?: string): void {
    if (!this.isEnabled || !this.audioContext) return;

    // Enforce 350ms cooldown to prevent overlapping audio noise
    const nowMs = Date.now();
    if (nowMs - this.lastInteractionTime < 350) {
      return;
    }
    this.lastInteractionTime = nowMs;

    const selectMeta = assetManifest.audio?.archetypeSelect;
    if (!selectMeta || !selectMeta.path) return;

    try {
      if (!this.interactionElement) {
        const audio = new Audio();
        audio.src = selectMeta.path;
        audio.crossOrigin = 'anonymous';
        audio.volume = selectMeta.volume ?? 0.28;

        audio.addEventListener('error', () => {
          console.debug('[AFTERIMAGE Sound] Interaction audio asset not present on disk:', selectMeta.path);
        });

        this.interactionElement = audio;
      } else {
        this.interactionElement.currentTime = 0;
      }

      this.interactionElement.play().catch((err) => {
        console.debug('[AFTERIMAGE Sound] Interaction sound deferred or asset unavailable:', err.message);
      });
    } catch (err) {
      console.debug('[AFTERIMAGE Sound] Interaction audio play error:', err);
    }
  }

  public dispose(): void {
    this.disable();
    this.pauseAmbient();
    if (this.interactionElement) {
      this.interactionElement.pause();
      this.interactionElement = null;
    }
    if (this.ambientElement) {
      this.ambientElement.pause();
      this.ambientElement = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.listeners.clear();
  }
}

export const soundManager = new SoundSystem();
