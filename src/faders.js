/**
 * hudlab — Tunable Faders Schema, Collapsible Groups, Era Looks, Look Presets & Live Stats Engine
 * Every tunable parameter is read from one unified fader state object so UI sliders,
 * keyboard shortcuts, presets, and `window.__hudlabTest` can drive them in real time.
 */

import { getSpecimen } from './catalogue.js';

/**
 * The 5 Master Visual Era Modes available across all 19 specimens:
 * 1) `default`: Default Tactical (Now)
 * 2) `retro-80s`: Old 1980s CRT Vector / Raster Oscilloscope Look
 * 3) `futuristic`: Advanced Futuristic Extreme Hi-Tech (ultra-thin lines, particles, soft halos)
 * 4) `default-thin`: Default Thin (same palette/look as Default, but razor-thin 0.75px strokes & hairline typography)
 * 5) `futuristic-low`: Futuristic Low Blow / Low Bloom (extreme hi-tech micro-geometry & particles with minimal bloom/glow)
 */
export const ERA_MODES = {
  'default': {
    id: 'default',
    name: '1) Default (Tactical Now)',
    shortLabel: '1) Default',
    description: 'Baseline modern tactical HUD with balanced vector strokes and clean glass.',
    preserveSpecimenPalette: true,
    overrides: {
      strokeWidth: 1.75,
      reticleScale: 1.0,
      reticleOpacity: 0.92,
      bloomStrength: 0.25,
      haloIntensity: 0.15,
      particleDensity: 0.0,
      phosphorPersistence: 0.0,
      crtCurvature: 0.0,
      scanlineIntensity: 0.1,
      noiseGrain: 0.04,
      vignette: 0.25
    }
  },
  'retro-80s': {
    id: 'retro-80s',
    name: "2) 80's CRT Oscilloscope",
    shortLabel: "2) 80's CRT",
    description: '1980s cathode-ray vector arcade & early cockpit CRT: phosphor persistence trails, thick stepped lines, scanline raster, curved tube bezel, and chromatic fringe.',
    preserveSpecimenPalette: false,
    overrides: {
      look: 'crt-inset',
      primaryColor: '#33ff66',
      lockedColor: '#ffcc00',
      warningColor: '#ff3333',
      strokeWidth: 2.5,
      reticleScale: 1.08,
      reticleOpacity: 0.96,
      bloomStrength: 0.65,
      haloIntensity: 0.35,
      particleDensity: 0.0,
      phosphorPersistence: 0.72,
      crtCurvature: 0.8,
      scanlineIntensity: 0.8,
      noiseGrain: 0.24,
      vignette: 0.65,
      terrainWireframe: true
    }
  },
  'futuristic': {
    id: 'futuristic',
    name: '3) Futuristic Extreme Hi-Tech',
    shortLabel: '3) Futuristic',
    description: 'Next-gen neural visor: razor-thin 0.8px micro-geometry, soft multi-layered optical halos, convergence particle streams, and volumetric spatial dust.',
    preserveSpecimenPalette: false,
    overrides: {
      look: 'glass-bloom',
      primaryColor: '#67e8f9',
      lockedColor: '#a78bfa',
      warningColor: '#fb7185',
      strokeWidth: 0.85,
      reticleScale: 1.05,
      reticleOpacity: 0.95,
      bloomStrength: 0.85,
      haloIntensity: 1.0,
      particleDensity: 1.25,
      phosphorPersistence: 0.18,
      crtCurvature: 0.0,
      scanlineIntensity: 0.02,
      noiseGrain: 0.0,
      vignette: 0.18,
      terrainWireframe: true
    }
  },
  'default-thin': {
    id: 'default-thin',
    name: '4) Default Thin (Hairline)',
    shortLabel: '4) Default Thin',
    description: 'Identical palette and optical rules as Default (Now), but with surgical 0.7px hairline vector strokes, thinner brackets, and lighter typography.',
    preserveSpecimenPalette: true,
    overrides: {
      strokeWidth: 0.7,
      reticleScale: 0.96,
      reticleOpacity: 0.9,
      bloomStrength: 0.1,
      haloIntensity: 0.06,
      particleDensity: 0.0,
      phosphorPersistence: 0.0,
      crtCurvature: 0.0,
      scanlineIntensity: 0.05,
      noiseGrain: 0.02,
      vignette: 0.2
    }
  },
  'futuristic-low': {
    id: 'futuristic-low',
    name: '5) Futuristic Low Blow (Low Glow)',
    shortLabel: '5) Futuristic Low Blow',
    description: 'Extreme hi-tech micro-geometry, vernier hair-rings, neural filaments, and convergence particles, but with restrained low bloom/halo for maximum crispness.',
    preserveSpecimenPalette: false,
    overrides: {
      look: 'raw',
      primaryColor: '#38bdf8',
      lockedColor: '#c084fc',
      warningColor: '#fb7185',
      strokeWidth: 0.65,
      reticleScale: 1.02,
      reticleOpacity: 0.92,
      bloomStrength: 0.08,
      haloIntensity: 0.12,
      particleDensity: 0.8,
      phosphorPersistence: 0.0,
      crtCurvature: 0.0,
      scanlineIntensity: 0.0,
      noiseGrain: 0.0,
      vignette: 0.14,
      terrainWireframe: true
    }
  }
};

export const LOOK_PRESETS = {
  'raw': {
    id: 'raw',
    name: 'Raw Tactical Vector',
    description: 'Clean, razor-sharp anti-aliased vector glass with neutral dark slate backdrop.',
    primaryColor: '#38bdf8',
    lockedColor: '#4ade80',
    warningColor: '#fb7185',
    bloomStrength: 0.15,
    scanlineIntensity: 0.0,
    noiseGrain: 0.02,
    vignette: 0.25
  },
  'flir-ironbow': {
    id: 'flir-ironbow',
    name: 'FLIR Thermal Ironbow',
    description: 'False-color thermal palette with warm target signatures, sensor grain, and AGC contrast.',
    primaryColor: '#fde047',
    lockedColor: '#4ade80',
    warningColor: '#f97316',
    bloomStrength: 0.35,
    scanlineIntensity: 0.25,
    noiseGrain: 0.22,
    vignette: 0.45
  },
  'crt-inset': {
    id: 'crt-inset',
    name: 'P1 Phosphor CRT Raster',
    description: 'Cathode-ray oscilloscope scanlines, phosphor persistence glow, and curved bezel vignette.',
    primaryColor: '#4ade80',
    lockedColor: '#facc15',
    warningColor: '#ef4444',
    bloomStrength: 0.55,
    scanlineIntensity: 0.65,
    noiseGrain: 0.12,
    vignette: 0.55
  },
  'glass-bloom': {
    id: 'glass-bloom',
    name: 'Collimated HUD Glass + Bloom',
    description: 'Collimated combiner glass with halation bloom around bright vector symbology.',
    primaryColor: '#22d3ee',
    lockedColor: '#4ade80',
    warningColor: '#f43f5e',
    bloomStrength: 0.75,
    scanlineIntensity: 0.08,
    noiseGrain: 0.0,
    vignette: 0.2
  },
  'monochrome-hmd': {
    id: 'monochrome-hmd',
    name: 'Monochrome Helmet Visor',
    description: 'Single-wavelength green/emerald visor projection relying on shape & cadence before hue.',
    primaryColor: '#34d399',
    lockedColor: '#a7f3d0',
    warningColor: '#fca5a5',
    bloomStrength: 0.4,
    scanlineIntensity: 0.15,
    noiseGrain: 0.04,
    vignette: 0.35
  },
  'amber-soviet': {
    id: 'amber-soviet',
    name: 'Amber Shkval / SPO Tube',
    description: 'High-contrast amber/gold electro-optical tube with heavy graticule and warm bloom.',
    primaryColor: '#fbbf24',
    lockedColor: '#fef08a',
    warningColor: '#ef4444',
    bloomStrength: 0.5,
    scanlineIntensity: 0.45,
    noiseGrain: 0.16,
    vignette: 0.5
  }
};

export const FADER_GROUPS = [
  {
    id: 'optics',
    title: '1. Optics & Platform',
    icon: '◎',
    defaultOpen: true,
    description: 'Camera field-of-view, optical zoom steps, scissored inset magnification, and platform stabilization.',
    controls: [
      { key: 'fov', label: 'Base Field of View', type: 'range', min: 15, max: 85, step: 1, unit: '°', default: 46 },
      { key: 'zoom', label: 'Main Optical Zoom', type: 'range', min: 1.0, max: 6.0, step: 0.1, unit: 'x', default: 1.4 },
      { key: 'insetZoom', label: 'Inset Seeker / Pod Zoom', type: 'range', min: 1.5, max: 12.0, step: 0.5, unit: 'x', default: 5.0 },
      { key: 'gimbalLimitDeg', label: 'Gimbal Cone Limit', type: 'range', min: 10, max: 85, step: 1, unit: '°', default: 45 },
      { key: 'slewRate', label: 'Turret / Seeker Slew Speed', type: 'range', min: 0.2, max: 3.0, step: 0.1, unit: 'x', default: 1.0 },
      { key: 'platformSpeed', label: 'Ownship Platform Speed', type: 'range', min: 0, max: 2.5, step: 0.1, unit: 'x', default: 1.0 },
      { key: 'platformTurbulence', label: 'Airframe / Hull Shake', type: 'range', min: 0, max: 1.0, step: 0.05, unit: '', default: 0.15 },
      { key: 'holdAim', label: 'World-Space Aim Stabilization', type: 'toggle', default: true }
    ]
  },
  {
    id: 'lock',
    title: '2. Lock & Sensor Domain',
    icon: '⌖',
    defaultOpen: true,
    description: 'Acquisition box geometry, lock integration rate, 0.5s rock-edge sight grace, stickiness, and missile flight timers.',
    controls: [
      { key: 'boxSizePx', label: 'Acquisition Gate Size', type: 'range', min: 36, max: 200, step: 2, unit: 'px', default: 92 },
      { key: 'lockRate', label: 'Lock Acquisition Speed', type: 'range', min: 0.2, max: 4.0, step: 0.05, unit: '/s', default: 1.35 },
      { key: 'lossGraceSec', label: 'Sight Grace ("Rock Edge")', type: 'range', min: 0.0, max: 2.5, step: 0.05, unit: 's', default: 0.5 },
      { key: 'stickiness', label: 'Magnetic Track Stickiness', type: 'range', min: 0.0, max: 1.0, step: 0.05, unit: '', default: 0.45 },
      { key: 'seekerConeDeg', label: 'Uncaged Seeker FOV Cone', type: 'range', min: 4, max: 40, step: 1, unit: '°', default: 16 },
      { key: 'maxRangeM', label: 'Max Engagement Slant Range', type: 'range', min: 1200, max: 6000, step: 100, unit: 'm', default: 3800 },
      { key: 'minRangeM', label: 'Min Arming / Danger Range', type: 'range', min: 100, max: 1200, step: 50, unit: 'm', default: 450 },
      { key: 'irSensitivity', label: 'Thermal / Signature Gain', type: 'range', min: 0.2, max: 2.0, step: 0.05, unit: 'x', default: 1.0 },
      { key: 'ccmResistance', label: 'IRCCM / Chaff Reject', type: 'range', min: 0.0, max: 1.0, step: 0.05, unit: '', default: 0.5 },
      { key: 'leadFactor', label: 'Ballistic Lead Multiplier', type: 'range', min: 0.0, max: 2.0, step: 0.05, unit: 'x', default: 1.0 },
      { key: 'wireTimeSec', label: 'Missile Max Flight / Wire Time', type: 'range', min: 3.0, max: 20.0, step: 0.5, unit: 's', default: 9.0 },
      { key: 'pitbullTimeSec', label: 'Active Handover (Pitbull) Time', type: 'range', min: 1.0, max: 10.0, step: 0.5, unit: 's', default: 4.0 }
    ]
  },
  {
    id: 'presentation',
    title: '3. Presentation & Aesthetics',
    icon: '◈',
    defaultOpen: true,
    description: 'Master Era Look (Default vs 80s CRT vs Futuristic Hi-Tech), line thickness, soft halos, particle streams, and CRT persistence.',
    controls: [
      {
        key: 'eraMode',
        label: 'Master Era Look',
        type: 'select',
        options: [
          { value: 'default', label: '1) Default (Tactical Now)' },
          { value: 'retro-80s', label: "2) Old 80's CRT Raster" },
          { value: 'futuristic', label: '3) Futuristic Extreme Hi-Tech' },
          { value: 'default-thin', label: '4) Default Thin (Hairline)' },
          { value: 'futuristic-low', label: '5) Futuristic Low Blow (Low Glow)' }
        ],
        default: 'default'
      },
      {
        key: 'look',
        label: 'Optical Palette Filter',
        type: 'select',
        options: [
          { value: 'raw', label: 'Raw Tactical Vector' },
          { value: 'flir-ironbow', label: 'FLIR Thermal Ironbow' },
          { value: 'crt-inset', label: 'P1 Phosphor CRT Raster' },
          { value: 'glass-bloom', label: 'Collimated Glass + Bloom' },
          { value: 'monochrome-hmd', label: 'Monochrome HMD Visor' },
          { value: 'amber-soviet', label: 'Amber Shkval Tube' }
        ],
        default: 'raw'
      },
      { key: 'primaryColor', label: 'Search / Ours Hue', type: 'color', default: '#38bdf8' },
      { key: 'lockedColor', label: 'Correlated / Locked Hue', type: 'color', default: '#4ade80' },
      { key: 'warningColor', label: 'Warning / Danger Hue', type: 'color', default: '#fb7185' },
      { key: 'strokeWidth', label: 'Vector Line Thickness', type: 'range', min: 0.4, max: 4.5, step: 0.05, unit: 'px', default: 1.75 },
      { key: 'haloIntensity', label: 'Optical Halo & Ring Glow', type: 'range', min: 0.0, max: 1.5, step: 0.05, unit: '', default: 0.15 },
      { key: 'particleDensity', label: 'Hi-Tech Particle Effects', type: 'range', min: 0.0, max: 2.0, step: 0.05, unit: 'x', default: 0.0 },
      { key: 'phosphorPersistence', label: '80s CRT Phosphor Trail', type: 'range', min: 0.0, max: 0.92, step: 0.02, unit: '', default: 0.0 },
      { key: 'crtCurvature', label: '80s CRT Curvature & Fringe', type: 'range', min: 0.0, max: 1.0, step: 0.05, unit: '', default: 0.0 },
      { key: 'reticleScale', label: 'Reticle Geometry Scale', type: 'range', min: 0.5, max: 2.0, step: 0.05, unit: 'x', default: 1.0 },
      { key: 'reticleOpacity', label: 'Symbology Opacity', type: 'range', min: 0.2, max: 1.0, step: 0.05, unit: '', default: 0.92 },
      { key: 'bloomStrength', label: 'Phosphor / Glass Bloom', type: 'range', min: 0.0, max: 1.0, step: 0.05, unit: '', default: 0.25 },
      { key: 'scanlineIntensity', label: 'CRT Raster Scanlines', type: 'range', min: 0.0, max: 1.0, step: 0.05, unit: '', default: 0.1 },
      { key: 'noiseGrain', label: 'Sensor Gain Noise', type: 'range', min: 0.0, max: 0.6, step: 0.02, unit: '', default: 0.04 },
      { key: 'vignette', label: 'Optical Tube Vignette', type: 'range', min: 0.0, max: 0.9, step: 0.05, unit: '', default: 0.25 },
      { key: 'glyphDensity', label: 'Telemetry Readout Detail', type: 'range', min: 0, max: 2, step: 1, unit: 'lvl', default: 2 }
    ]
  },
  {
    id: 'specimen',
    title: '4. Specimen-Specific Tunables',
    icon: '⚙',
    defaultOpen: true,
    description: 'Unique domain variables specific to the currently selected HUD specimen.',
    dynamicSpecimen: true,
    controls: []
  },
  {
    id: 'studies',
    title: '5. Cross-Cutting Studies (§5)',
    icon: '◫',
    defaultOpen: false,
    description: 'Shared ergonomic studies across all families: loss legibility, shoot ladder, reduced motion, phone layout, and audio.',
    controls: [
      { key: 'lossLegibility', label: 'Loss Legibility (Slip/Ghost/Word)', type: 'toggle', default: true },
      { key: 'showShootLadder', label: 'Shoot Cue Range Ladder', type: 'toggle', default: true },
      { key: 'dangerBeforeRelease', label: 'Danger Tag Stays With Round', type: 'toggle', default: true },
      { key: 'reducedMotion', label: 'Reduced Motion (Word Fallbacks)', type: 'toggle', default: false },
      { key: 'phoneLayout', label: 'Phone Layout (Reticle + Inset Only)', type: 'toggle', default: false },
      { key: 'showInset', label: 'Enable Picture-in-Picture Inset', type: 'toggle', default: true },
      { key: 'insetSizePx', label: 'Inset Viewport Size', type: 'range', min: 140, max: 340, step: 10, unit: 'px', default: 220 },
      { key: 'audioEnabled', label: 'Synthesize Seeker & Lock Tones', type: 'toggle', default: false },
      { key: 'audioVolume', label: 'Tone Synth Volume', type: 'range', min: 0.0, max: 1.0, step: 0.05, unit: '', default: 0.35 }
    ]
  },
  {
    id: 'scenario',
    title: '6. Scenario & Synthetic World',
    icon: '⛰',
    defaultOpen: false,
    description: 'Control scripted contacts, speed, terrain ridge masking, flare decoys, and atmosphere behind the glass.',
    controls: [
      {
        key: 'scenarioId',
        label: 'Scripted Contact Set',
        type: 'select',
        options: [
          { value: 'crossing', label: 'Crossing Convoy & Escort' },
          { value: 'pop-up', label: 'Pop-Up Ridge Ambush' },
          { value: 'masked', label: 'Rock-Edge Occlusion Stress' },
          { value: 'decoy', label: 'Flare & Chaff Furball' },
          { value: 'intercept', label: 'High-Altitude BVR Intercept' }
        ],
        default: 'crossing'
      },
      { key: 'contactCount', label: 'Active Target Contacts', type: 'range', min: 1, max: 8, step: 1, unit: '', default: 5 },
      { key: 'contactSpeed', label: 'Target Maneuver Speed', type: 'range', min: 0.0, max: 2.5, step: 0.1, unit: 'x', default: 1.0 },
      { key: 'terrainMasking', label: 'Ridge / Pillar Height Scale', type: 'range', min: 0.0, max: 1.5, step: 0.05, unit: 'x', default: 0.65 },
      { key: 'decoyRate', label: 'Flare / Chaff Dispense Rate', type: 'range', min: 0.0, max: 1.5, step: 0.05, unit: 'x', default: 0.45 },
      { key: 'fogDensity', label: 'Atmospheric Haze / Fog', type: 'range', min: 0.0, max: 1.0, step: 0.05, unit: '', default: 0.25 },
      { key: 'terrainWireframe', label: 'Synthetic Terrain Grid Overlay', type: 'toggle', default: true }
    ]
  }
];

/**
 * Build default fader dictionary for a given specimen ID, optionally applying an eraMode.
 */
export function buildDefaultFaders(specimenId = 'stalheart-quiver', eraMode = 'default') {
  const base = {};
  for (const group of FADER_GROUPS) {
    for (const ctrl of group.controls) {
      base[ctrl.key] = ctrl.default;
    }
  }
  const spec = getSpecimen(specimenId);
  if (spec) {
    if (spec.defaults) {
      Object.assign(base, spec.defaults);
    }
    if (spec.specimenFaders) {
      for (const sf of spec.specimenFaders) {
        base[sf.key] = sf.default;
      }
    }
  }
  if (eraMode && eraMode !== 'default' && ERA_MODES[eraMode]) {
    base.eraMode = eraMode;
    Object.assign(base, ERA_MODES[eraMode].overrides);
  }
  return base;
}

/**
 * Apply one of the 3 Master Era Modes (`default`, `retro-80s`, `futuristic`) onto a live faders object.
 */
export function applyEraModeToFaders(faders, specimenId, eraMode) {
  const specDefaults = buildDefaultFaders(specimenId, 'default');
  faders.eraMode = eraMode;

  const keysToRestore = [
    'look',
    'primaryColor',
    'lockedColor',
    'warningColor',
    'strokeWidth',
    'reticleScale',
    'reticleOpacity',
    'bloomStrength',
    'haloIntensity',
    'particleDensity',
    'phosphorPersistence',
    'crtCurvature',
    'scanlineIntensity',
    'noiseGrain',
    'vignette'
  ];

  if (eraMode === 'default' || ERA_MODES[eraMode]?.preserveSpecimenPalette) {
    // Restore specimen's own baseline presentation defaults first
    for (const k of keysToRestore) {
      faders[k] = specDefaults[k];
    }
  }
  if (eraMode !== 'default' && ERA_MODES[eraMode]) {
    Object.assign(faders, ERA_MODES[eraMode].overrides);
  }
  return faders;
}

/**
 * Compute diff between current faders and specimen defaults.
 */
export function getModifiedFaders(currentFaders, specimenId) {
  const defaults = buildDefaultFaders(specimenId, 'default');
  const diff = {};
  for (const [k, v] of Object.entries(currentFaders)) {
    if (defaults[k] !== undefined && defaults[k] !== v) {
      diff[k] = v;
    }
  }
  return diff;
}

/**
 * Calculate live HUD performance, acquisition timing, and ergonomic stats for export & inspection.
 */
export function computeHudStats(faders, specimen, frame = null) {
  const effectiveFovDeg = +(faders.fov / Math.max(0.5, faders.zoom)).toFixed(1);
  const angularGateDeg = +((faders.boxSizePx / 720) * effectiveFovDeg).toFixed(2);
  const nominalLockTimeSec = +(1 / Math.max(0.1, faders.lockRate)).toFixed(2);
  const sightGraceMs = Math.round(faders.lossGraceSec * 1000);
  const maxTrackingRateDegSec = +(faders.slewRate * 28 * (1 + faders.stickiness * 0.65)).toFixed(1);
  const decoyRejectionScore = Math.round(
    Math.min(100, Math.max(5, faders.ccmResistance * 75 + (40 - faders.seekerConeDeg) * 0.8))
  );
  const noEscapeRangeM = Math.round(
    faders.minRangeM + (faders.maxRangeM - faders.minRangeM) * 0.48
  );

  // Visual ink-to-glass / clutter index (lower is cleaner)
  let clutterPoints =
    faders.strokeWidth * 12 +
    faders.reticleScale * 18 +
    faders.glyphDensity * 14 +
    (faders.particleDensity ?? 0) * 8 +
    (faders.showShootLadder ? 8 : 0) +
    (faders.showInset && specimen?.hasInset ? 14 : 0) -
    (faders.phoneLayout ? 25 : 0);
  const clutterPercent = Math.min(98, Math.max(8, Math.round(clutterPoints)));

  const accessibilityScore = Math.min(
    100,
    60 +
      (faders.lossLegibility ? 15 : 0) +
      (faders.reducedMotion ? 15 : 0) +
      (faders.strokeWidth >= 1.5 ? 10 : 0)
  );

  return {
    specimenId: specimen?.id || 'stalheart-quiver',
    specimenName: specimen?.name || 'Stalheart Quiver',
    family: specimen?.family || 'E',
    eraMode: faders.eraMode || 'default',
    acquisition: {
      nominalLockTimeSec,
      nominalLockTimeMs: Math.round(nominalLockTimeSec * 1000),
      sightGraceMs,
      angularGateDeg,
      maxTrackingRateDegSec,
      stickinessIndex: +(faders.stickiness * 100).toFixed(0) + '%'
    },
    opticsAndEnvelope: {
      effectiveFovDeg,
      opticalMagnification: `${faders.zoom.toFixed(1)}x`,
      insetMagnification: specimen?.hasInset && faders.showInset ? `${faders.insetZoom.toFixed(1)}x` : 'OFF',
      gimbalEnvelopeDeg: `±${faders.gimbalLimitDeg}°`,
      minRangeM: faders.minRangeM,
      noEscapeRangeM,
      maxRangeM: faders.maxRangeM
    },
    countermeasuresAndSensors: {
      decoyRejectionScore: `${decoyRejectionScore}%`,
      thermalGain: `${faders.irSensitivity.toFixed(2)}x`,
      wireOrFlightTimeSec: faders.wireTimeSec,
      pitbullHandoverSec: faders.pitbullTimeSec
    },
    ergonomicsAndPresentation: {
      eraMode: ERA_MODES[faders.eraMode || 'default']?.shortLabel || '1) Default (Now)',
      lookProfile: faders.look,
      strokeWidthPx: `${faders.strokeWidth}px`,
      haloIntensity: `${Math.round((faders.haloIntensity ?? 0.15) * 100)}%`,
      particleDensity: `${(faders.particleDensity ?? 0).toFixed(2)}x`,
      inkDensityPercent: `${clutterPercent}%`,
      accessibilityScore: `${accessibilityScore}/100`,
      reducedMotionFallback: faders.reducedMotion ? 'ENABLED (WORD CUES)' : 'STANDARD',
      layoutMode: faders.phoneLayout ? 'PHONE (MINIMAL)' : 'FULL TACTICAL',
      livePhase: frame?.sensor?.phase || 'SEARCH',
      liveStatusWord: frame?.status?.text || 'READY'
    }
  };
}
