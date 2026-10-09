export type AssetCategory = 'models' | 'textures' | 'audio' | 'fonts';

export interface BaseAssetMetadata {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly category: AssetCategory;
  readonly format: string;
  readonly notes?: string;
}

export interface ModelAssetMetadata extends BaseAssetMetadata {
  readonly category: 'models';
  readonly polyCountEstimate?: number;
}

export interface TextureAssetMetadata extends BaseAssetMetadata {
  readonly category: 'textures';
  readonly resolution?: `${number}x${number}`;
}

export interface AudioAssetMetadata extends BaseAssetMetadata {
  readonly category: 'audio';
  readonly durationSeconds?: number;
  readonly volume?: number;
  readonly loop?: boolean;
}

export interface FontAssetMetadata extends BaseAssetMetadata {
  readonly category: 'fonts';
  readonly weight?: string | number;
}

export interface AssetManifest {
  readonly models: Record<string, ModelAssetMetadata>;
  readonly textures: Record<string, TextureAssetMetadata>;
  readonly audio: Record<string, AudioAssetMetadata>;
  readonly fonts: Record<string, FontAssetMetadata>;
}

/**
 * Manifest defining asset references for AFTERIMAGE.
 */
export const assetManifest: AssetManifest = {
  models: {
    iridescentSculpture: {
      id: 'iridescent-sculpture-01',
      name: 'Iridescent Abstract Sculpture (Abalone Monolith)',
      path: '/models/iridescent_sculpture.glb',
      category: 'models',
      format: 'glb',
      polyCountEstimate: 3159,
      notes: 'Creative Commons Attribution 4.0 International (CC-BY 4.0). 3D scan by Abby Crawford (2015) with PBR iridescence materials by Eric Chadwick (2023) for Khronos Group glTF Sample Assets.',
    },
    crystalArtifact: {
      id: 'crystal-artifact-01',
      name: 'Crystal Cluster Monolith (Archive)',
      path: '/models/crystal_artifact.glb',
      category: 'models',
      format: 'glb',
      polyCountEstimate: 3200,
      notes: 'CC0 Public Domain 3D asset from Polygonal Mind (ToxSam/cc0-models-Polygonal-Mind). Faceted crystalline cluster artifact.',
    },
  },
  textures: {},
  audio: {
    ambientDrone: {
      id: 'ambient-drone-01',
      name: 'Kvartal prod. - Ambient (Atmospheric Synth Drone)',
      path: '/audio/ambient_drone.mp3',
      category: 'audio',
      format: 'mp3',
      durationSeconds: 41,
      volume: 0.22,
      loop: true,
      notes: 'Creative Commons Attribution 3.0 Unported (CC-BY 3.0). Created by Kvartal prod (https://soundcloud.com/kvarttal/ambient), hosted on Wikimedia Commons (File:Kvartal_prod._-_Ambient.ogg). Warm ambient electronic drone loop.',
    },
    archetypeSelect: {
      id: 'archetype-select-01',
      name: 'Singing Bowl Acoustic Resonance',
      path: '/audio/archetype_select.mp3',
      category: 'audio',
      format: 'mp3',
      durationSeconds: 12,
      volume: 0.28,
      loop: false,
      notes: 'Public Domain / CC0 equivalent. Self-made recording by BambooBeast (2008), hosted on Wikimedia Commons (File:SingingBowl1.ogg). Acoustic singing bowl strike with gentle harmonic decay.',
    },
  },
  fonts: {},
};
