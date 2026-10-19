/**
 * hudlab — Export & Clipboard Memory System
 * Provides:
 * 1) One-click "Copy Variables Only" (All JSON, Modified Diff JSON, ES Module const, CSS vars)
 * 2) "Paste / Restore Variables" from clipboard or text
 * 3) "Export Full Look & Feel + Stats" (.hudlab.json bundle, Markdown Spec & Stats report,
 *    Self-Contained Playable HTML, and High-DPI composite PNG snapshot)
 */

import { getModifiedFaders, computeHudStats } from './faders.js';

/**
 * Format variables-only payload for quick copy-paste to memory.
 */
export function formatVariablesOnly(faders, specimen, format = 'json-all') {
  const diff = getModifiedFaders(faders, specimen?.id);

  if (format === 'json-diff') {
    const payload = Object.keys(diff).length > 0 ? diff : faders;
    return JSON.stringify(payload, null, 2);
  }

  if (format === 'esm') {
    const constName = `HUD_${(specimen?.id || 'quiver').toUpperCase().replace(/[^A-Z0-9]/g, '_')}_VARS`;
    return `// hudlab variables for ${specimen?.name || 'Specimen'} (${specimen?.code || ''})\nexport const ${constName} = ${JSON.stringify(faders, null, 2)};\n`;
  }

  if (format === 'css') {
    return [
      `/* hudlab look variables — ${specimen?.name || 'HUD'} (Era: ${faders.eraMode || 'default'}) */`,
      `:root {`,
      `  --hud-era-mode: "${faders.eraMode || 'default'}";`,
      `  --hud-look: "${faders.look}";`,
      `  --hud-primary-color: ${faders.primaryColor};`,
      `  --hud-locked-color: ${faders.lockedColor};`,
      `  --hud-warning-color: ${faders.warningColor};`,
      `  --hud-stroke-width: ${faders.strokeWidth}px;`,
      `  --hud-halo-intensity: ${faders.haloIntensity ?? 0.15};`,
      `  --hud-particle-density: ${faders.particleDensity ?? 0};`,
      `  --hud-phosphor-persistence: ${faders.phosphorPersistence ?? 0};`,
      `  --hud-crt-curvature: ${faders.crtCurvature ?? 0};`,
      `  --hud-reticle-scale: ${faders.reticleScale};`,
      `  --hud-reticle-opacity: ${faders.reticleOpacity};`,
      `  --hud-bloom-strength: ${faders.bloomStrength};`,
      `  --hud-scanline-intensity: ${faders.scanlineIntensity};`,
      `  --hud-vignette: ${faders.vignette};`,
      `}`
    ].join('\n');
  }

  // Default: 'json-all'
  return JSON.stringify(faders, null, 2);
}

/**
 * Parse a pasted JSON object or ES module snippet back into a faders dictionary.
 */
export function parseVariablesFromText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Clipboard text is empty.');
  }
  let cleaned = rawText.trim();
  // Strip optional `export const XYZ =` wrapper if user pasted an ESM snippet
  const eqIndex = cleaned.indexOf('=');
  if (cleaned.startsWith('//') || cleaned.startsWith('export ') || cleaned.startsWith('const ')) {
    const braceStart = cleaned.indexOf('{');
    const braceEnd = cleaned.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      cleaned = cleaned.slice(braceStart, braceEnd + 1);
    }
  } else if (eqIndex !== -1 && cleaned.indexOf('{') > eqIndex) {
    const braceStart = cleaned.indexOf('{');
    const braceEnd = cleaned.lastIndexOf('}');
    cleaned = cleaned.slice(braceStart, braceEnd + 1);
  }

  const parsed = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object of HUD variables.');
  }
  // Support pasting either a raw variables object OR a full `.hudlab.json` bundle
  if (parsed.variables && typeof parsed.variables === 'object') {
    return {
      specimenId: parsed.specimen?.id || null,
      variables: parsed.variables
    };
  }
  return {
    specimenId: null,
    variables: parsed
  };
}

/**
 * Build the complete Look & Feel + Stats JSON bundle.
 */
export function buildFullLookAndFeelBundle(faders, specimen, frame = null) {
  const stats = computeHudStats(faders, specimen, frame);
  const modifiedVariables = getModifiedFaders(faders, specimen?.id);

  return {
    schema: 'hudlab-look-and-feel/v1',
    exportedAt: new Date().toISOString(),
    specimen: {
      id: specimen.id,
      code: specimen.code,
      name: specimen.name,
      family: specimen.family,
      familySlug: specimen.familySlug,
      platformType: specimen.platformType,
      hasInset: specimen.hasInset,
      insetMode: specimen.insetMode,
      summary: specimen.summary
    },
    lookAndFeel: {
      eraMode: faders.eraMode || 'default',
      lookPreset: faders.look,
      palette: {
        primaryColor: faders.primaryColor,
        lockedColor: faders.lockedColor,
        warningColor: faders.warningColor
      },
      vectorStyle: {
        strokeWidthPx: faders.strokeWidth,
        reticleScale: faders.reticleScale,
        reticleOpacity: faders.reticleOpacity,
        glyphDensity: faders.glyphDensity
      },
      opticalPostProcess: {
        bloomStrength: faders.bloomStrength,
        haloIntensity: faders.haloIntensity ?? 0.15,
        particleDensity: faders.particleDensity ?? 0.0,
        phosphorPersistence: faders.phosphorPersistence ?? 0.0,
        crtCurvature: faders.crtCurvature ?? 0.0,
        scanlineIntensity: faders.scanlineIntensity,
        noiseGrain: faders.noiseGrain,
        vignette: faders.vignette
      },
      ergonomicStudies: {
        lossLegibility: faders.lossLegibility,
        showShootLadder: faders.showShootLadder,
        dangerBeforeRelease: faders.dangerBeforeRelease,
        reducedMotion: faders.reducedMotion,
        phoneLayout: faders.phoneLayout
      }
    },
    stats,
    variables: { ...faders },
    modifiedFromDefault: modifiedVariables,
    specCard: specimen.specCard
  };
}

/**
 * Build a human-readable Markdown Look & Feel + Stats Engineering Report.
 */
export function buildMarkdownReport(faders, specimen, frame = null) {
  const bundle = buildFullLookAndFeelBundle(faders, specimen, frame);
  const { stats, lookAndFeel, specCard, modifiedFromDefault } = bundle;
  const modKeys = Object.keys(modifiedFromDefault);

  const lines = [
    `# HUD Look & Feel Spec: ${specimen.name} (\`${specimen.code}\`)`,
    ``,
    `- **Specimen ID**: \`${specimen.id}\` (Family ${specimen.family}: \`${specimen.familySlug}\`)`,
    `- **Master Era Look**: \`${lookAndFeel.eraMode}\` (${stats.ergonomicsAndPresentation.eraMode})`,
    `- **Idiom**: ${specCard.idiom}`,
    `- **Look Profile**: \`${lookAndFeel.lookPreset}\` | Primary \`${lookAndFeel.palette.primaryColor}\` | Locked \`${lookAndFeel.palette.lockedColor}\` | Warning \`${lookAndFeel.palette.warningColor}\``,
    ``,
    `## 1. Calculated Performance & Ergonomic Stats`,
    ``,
    `| Metric | Value | Category |`,
    `|---|---|---|`,
    `| **Nominal Time-to-Lock (TTL)** | \`${stats.acquisition.nominalLockTimeSec}s\` (\`${stats.acquisition.nominalLockTimeMs} ms\`) | Acquisition |`,
    `| **Rock-Edge Sight Grace Window** | \`${stats.acquisition.sightGraceMs} ms\` | Acquisition |`,
    `| **Angular Acquisition Gate** | \`${stats.acquisition.angularGateDeg}°\` | Optics & Gate |`,
    `| **Max Angular Tracking Rate** | \`${stats.acquisition.maxTrackingRateDegSec} °/s\` | Kinematics |`,
    `| **Magnetic Track Stickiness** | \`${stats.acquisition.stickinessIndex}\` | Acquisition |`,
    `| **Effective Field of View** | \`${stats.opticsAndEnvelope.effectiveFovDeg}°\` (\`${stats.opticsAndEnvelope.opticalMagnification}\` zoom) | Optics |`,
    `| **Inset Magnification** | \`${stats.opticsAndEnvelope.insetMagnification}\` | Optics |`,
    `| **Gimbal Slew Envelope** | \`${stats.opticsAndEnvelope.gimbalEnvelopeDeg}\` | Platform |`,
    `| **Engagement Slant Range** | \`${stats.opticsAndEnvelope.minRangeM}m\` – \`${stats.opticsAndEnvelope.maxRangeM}m\` (Rne \`${stats.opticsAndEnvelope.noEscapeRangeM}m\`) | Envelope |`,
    `| **Countermeasure Rejection Score** | \`${stats.countermeasuresAndSensors.decoyRejectionScore}\` | Sensor CCM |`,
    `| **Vector Line / Halo / Particles** | \`${stats.ergonomicsAndPresentation.strokeWidthPx}\` / \`${stats.ergonomicsAndPresentation.haloIntensity}\` / \`${stats.ergonomicsAndPresentation.particleDensity}\` | Era Style |`,
    `| **Visual Ink / Clutter Density** | \`${stats.ergonomicsAndPresentation.inkDensityPercent}\` | Ergonomics |`,
    `| **Accessibility & Legibility Score** | \`${stats.ergonomicsAndPresentation.accessibilityScore}\` | Ergonomics |`,
    ``,
    `## 2. Spec Card & Design Notes`,
    ``,
    `- **What Operator Holds**: ${specCard.operatorHolds}`,
    `- **Phases**: ${specCard.phases.map((p) => `\`${p}\``).join(' → ')}`,
    `- **Honest Limits**: ${specCard.honestLimits}`,
    `- **Reference Games**: ${specCard.referenceGames.join(', ')}`
  ];

  if (specCard.gameIdiomTradeoff) {
    lines.push(`- **Game Idiom Trade-off**: ${specCard.gameIdiomTradeoff}`);
  }

  lines.push(
    ``,
    `## 3. Modified Variables (${modKeys.length} tweaked from default)`,
    ``,
    '```json',
    JSON.stringify(modKeys.length > 0 ? modifiedFromDefault : faders, null, 2),
    '```',
    ``,
    `## 4. Complete Tunable Variable Set`,
    ``,
    '```json',
    JSON.stringify(faders, null, 2),
    '```'
  );

  return lines.join('\n');
}

/**
 * Copy text to system clipboard with fallback for restricted contexts.
 */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return true;
}

/**
 * Trigger browser file download for string content.
 */
export function downloadTextFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Composite the live 3D WebGL canvas + 2D HUD symbology canvas + stats footer into a downloadable PNG.
 */
export function exportCompositePng(canvases, faders, specimen, frame) {
  const { glCanvas, hudCanvas } = canvases;
  const w = hudCanvas.width;
  const h = hudCanvas.height;
  const footerH = 84;

  const out = document.createElement('canvas');
  out.width = w;
  out.height = h + footerH;
  const ctx = out.getContext('2d');

  // Draw 3D scene + 2D HUD overlay
  ctx.fillStyle = '#060c16';
  ctx.fillRect(0, 0, w, h + footerH);
  if (glCanvas) ctx.drawImage(glCanvas, 0, 0, w, h);
  if (hudCanvas) ctx.drawImage(hudCanvas, 0, 0, w, h);

  // Draw Stats & Look Footer Bar
  const stats = computeHudStats(faders, specimen, frame);
  ctx.fillStyle = '#09101d';
  ctx.fillRect(0, h, w, footerH);
  ctx.strokeStyle = faders.primaryColor || '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w, h);
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillText(
    `HUDLAB // ${specimen.code} ${specimen.name.toUpperCase()} [LOOK: ${faders.look.toUpperCase()}]`,
    20,
    h + 28
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 13px "JetBrains Mono", monospace';
  ctx.fillText(
    `TTL: ${stats.acquisition.nominalLockTimeSec}s | GRACE: ${stats.acquisition.sightGraceMs}ms | GATE: ${stats.acquisition.angularGateDeg}° | FOV: ${stats.opticsAndEnvelope.effectiveFovDeg}° (${stats.opticsAndEnvelope.opticalMagnification}) | CCM: ${stats.countermeasuresAndSensors.decoyRejectionScore} | CLUTTER: ${stats.ergonomicsAndPresentation.inkDensityPercent}`,
    20,
    h + 56
  );

  const dataUrl = out.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `hudlab-${specimen.id}-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
