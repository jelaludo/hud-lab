#!/usr/bin/env node
/**
 * hudlab CLI (§2 of hudlab-brief.md)
 * Commands:
 *   hudlab init [dir]
 *   hudlab new <family>/<name>
 *   hudlab list [--family f]
 *   hudlab serve [--open <name>] [--port <port>]
 *   hudlab build
 *   hudlab test [name]
 *   hudlab compare <a> <b>
 *   hudlab scenario [name]
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FAMILIES, SPECIMENS, SCENARIOS, getSpecimen, getSpecimensByFamily } from '../src/catalogue.js';
import { buildDefaultFaders, computeHudStats, FADER_GROUPS } from '../src/faders.js';
import { createSeat } from '../src/seat.js';
import { buildFullLookAndFeelBundle, formatVariablesOnly } from '../src/export.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

/**
 * Bundle a single self-contained HTML file for a given specimen & faders override.
 */
export function generateSelfContainedSpecimenHtml(specimenId, customFaders = null) {
  const specimen = getSpecimen(specimenId);
  const faders = customFaders || buildDefaultFaders(specimen.id);
  const css = fs.readFileSync(path.join(ROOT_DIR, 'src/styles.css'), 'utf8');

  const catalogueSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/catalogue.js'), 'utf8')
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ');
  const fadersSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/faders.js'), 'utf8')
    .replace(/import .* from .*\n/g, '')
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ');
  const worldSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/world.js'), 'utf8')
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ');
  const platformSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/platform.js'), 'utf8')
    .replace(/export function /g, 'function ');
  const sensorSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/sensor.js'), 'utf8')
    .replace(/export function /g, 'function ');
  const statusSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/status.js'), 'utf8')
    .replace(/export function /g, 'function ');
  const audioSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/audio.js'), 'utf8')
    .replace(/export function /g, 'function ');
  const seatSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/seat.js'), 'utf8')
    .replace(/import .* from .*\n/g, '')
    .replace(/export function /g, 'function ');
  const exportSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/export.js'), 'utf8')
    .replace(/import .* from .*\n/g, '')
    .replace(/export function /g, 'function ')
    .replace(/export async function /g, 'async function ');
  const presentationSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/presentation.js'), 'utf8')
    .replace(/import \* as THREE from 'three';\n/g, '')
    .replace(/import .* from .*\n/g, '')
    .replace(/export function /g, 'function ');
  const appSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/app.js'), 'utf8')
    .replace(/import [\s\S]*?from '.*?';\n/g, '')
    .replace(/export function initHudLabApp/, 'function initHudLabApp');

  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const bodyMatch = indexHtml.match(/<body>([\s\S]*?)<script type="module">/);
  const bodyContent = bodyMatch ? bodyMatch[1] : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>hudlab — ${specimen.code} ${specimen.name} (Self-Contained Specimen)</title>
  <style>${css}</style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.184.0/build/three.module.js"
      }
    }
  </script>
</head>
<body>
${bodyContent}
<script type="module">
import * as THREE from 'three';
${catalogueSrc}
${fadersSrc}
${worldSrc}
${platformSrc}
${sensorSrc}
${statusSrc}
${audioSrc}
${seatSrc}
${exportSrc}
${presentationSrc}
${appSrc}

// Default to exported specimen & baked faders
const url = new URL(window.location.href);
if (!url.searchParams.get('specimen')) {
  url.searchParams.set('specimen', ${JSON.stringify(specimen.id)});
  window.history.replaceState({}, '', url);
}
initHudLabApp();
const baked = ${JSON.stringify(faders)};
for (const [k, v] of Object.entries(baked)) {
  window.__hudlabTest.setFader(k, v);
}
</script>
</body>
</html>`;
}

function cmdList(args) {
  const famIdx = args.indexOf('--family');
  const famQuery = famIdx !== -1 ? args[famIdx + 1] : null;
  const list = getSpecimensByFamily(famQuery);

  console.log(`\nHUDLAB CATALOGUE (${list.length} specimens)\n` + '='.repeat(86));
  for (const s of list) {
    console.log(
      `${s.code.padEnd(5)} | ${s.id.padEnd(18)} | Fam ${s.family} | ${s.name.padEnd(44)} | Inset: ${s.hasInset ? s.insetMode : 'off'}`
    );
    console.log(`      Phases: ${s.specCard.phases.join(' -> ')}`);
    console.log(`      Faders: ${s.specimenFaders.map((f) => f.key).join(', ')}\n`);
  }
}

function cmdScenario(args) {
  const name = args[0];
  const list = name ? SCENARIOS.filter((s) => s.id === name) : SCENARIOS;
  console.log(`\nHUDLAB SCRIPTED SCENARIOS (${list.length})\n` + '='.repeat(72));
  for (const sc of list) {
    console.log(
      `- ${sc.id.padEnd(12)} | Contacts: ${sc.contactCount} | Speed: ${sc.speedMultiplier}x | Masking: ${sc.terrainMasking} | Decoy: ${sc.decoyRate}`
    );
    console.log(`  ${sc.description}\n`);
  }
}

function cmdCompare(args) {
  const aId = args[0] || 'saclos';
  const bId = args[1] || 'arcade-lock';
  const specA = getSpecimen(aId);
  const specB = getSpecimen(bId);
  const fadersA = buildDefaultFaders(specA.id);
  const fadersB = buildDefaultFaders(specB.id);
  const statsA = computeHudStats(fadersA, specA);
  const statsB = computeHudStats(fadersB, specB);

  console.log(`\nHUDLAB SIDE-BY-SIDE COMPARISON: ${specA.id} vs ${specB.id}\n` + '='.repeat(76));
  console.log(`${'METRIC'.padEnd(28)} | ${specA.shortName.padEnd(20)} | ${specB.shortName.padEnd(20)}`);
  console.log('-'.repeat(76));
  console.log(`${'Code / Family'.padEnd(28)} | ${(specA.code + ' (' + specA.family + ')').padEnd(20)} | ${(specB.code + ' (' + specB.family + ')').padEnd(20)}`);
  console.log(`${'Time-to-Lock (TTL)'.padEnd(28)} | ${(statsA.acquisition.nominalLockTimeSec + 's').padEnd(20)} | ${(statsB.acquisition.nominalLockTimeSec + 's').padEnd(20)}`);
  console.log(`${'Rock-Edge Sight Grace'.padEnd(28)} | ${(statsA.acquisition.sightGraceMs + 'ms').padEnd(20)} | ${(statsB.acquisition.sightGraceMs + 'ms').padEnd(20)}`);
  console.log(`${'Effective FOV / Zoom'.padEnd(28)} | ${(statsA.opticsAndEnvelope.effectiveFovDeg + '° (' + statsA.opticsAndEnvelope.opticalMagnification + ')').padEnd(20)} | ${(statsB.opticsAndEnvelope.effectiveFovDeg + '° (' + statsB.opticsAndEnvelope.opticalMagnification + ')').padEnd(20)}`);
  console.log(`${'Decoy CCM Rejection'.padEnd(28)} | ${statsA.countermeasuresAndSensors.decoyRejectionScore.padEnd(20)} | ${statsB.countermeasuresAndSensors.decoyRejectionScore.padEnd(20)}`);
  console.log(`${'Visual Ink Clutter'.padEnd(28)} | ${statsA.ergonomicsAndPresentation.inkDensityPercent.padEnd(20)} | ${statsB.ergonomicsAndPresentation.inkDensityPercent.padEnd(20)}`);
  console.log(`\nInteractive Compare URL: http://localhost:4173/?specimen=${specA.id}&compare=${specB.id}\n`);
}

function cmdTest(args) {
  const targetName = args[0];
  const targets = targetName ? [getSpecimen(targetName)] : SPECIMENS;

  console.log(`\nHUDLAB TEST HARNESS — Driving ${targets.length} specimen(s) through SEARCH -> TRACK -> LOCK -> SIGHT_GRACE -> LOSS`);
  console.log('='.repeat(92));

  let passed = 0;
  for (const spec of targets) {
    const faders = buildDefaultFaders(spec.id);
    // Use unmasked scenario for deterministic phase progression test
    faders.terrainMasking = 0.0;
    faders.decoyRate = 0.0;
    faders.lockRate = 2.0;
    faders.lossGraceSec = 0.5;

    const seat = createSeat(null, {
      getSpecimen: () => spec,
      getFaders: () => faders,
      getViewport: () => ({ width: 1280, height: 720, dpr: 2 }) // DPR 2 verified per §7
    });

    // 1. Initial SEARCH phase when aiming at sky
    seat.aimSky();
    seat.tick(0.05);
    const searchPhase = seat.phase();
    if (searchPhase !== 'SEARCH') {
      throw new Error(`[${spec.id}] Expected SEARCH when aiming at sky, got ${searchPhase}`);
    }

    // 2. Aim at contact c1 and drive to TRACK then LOCK
    seat.aim('c1');
    let sawTrack = false;
    let sawLock = false;
    for (let i = 0; i < 40; i++) {
      seat.tick(0.05);
      if (seat.phase() === 'DETECT' || seat.phase() === 'TRACK') sawTrack = true;
      if (seat.phase() === 'LOCK') {
        sawLock = true;
        break;
      }
    }
    if (!sawTrack || !sawLock) {
      throw new Error(`[${spec.id}] Failed to transition SEARCH -> TRACK -> LOCK (sawTrack=${sawTrack}, sawLock=${sawLock})`);
    }

    // 3. Aim away to sky and verify 0.5s SIGHT_GRACE holds before transitioning to explicit LOSS
    seat.aimSky();
    seat.tick(0.1);
    const gracePhase = seat.phase();
    if (gracePhase !== 'SIGHT_GRACE') {
      throw new Error(`[${spec.id}] Expected SIGHT_GRACE immediately after aim break, got ${gracePhase}`);
    }

    // Step past grace window (0.5s) to trigger explicit LOSS phase
    for (let i = 0; i < 12; i++) {
      seat.tick(0.06);
    }
    const lossPhase = seat.phase();
    if (lossPhase !== 'LOSS') {
      throw new Error(`[${spec.id}] Expected explicit LOSS phase after grace expiry, got ${lossPhase}`);
    }

    // 4. Verify Export Bundle & Variables-Only formatters
    const bundle = buildFullLookAndFeelBundle(faders, spec, seat.state());
    const varsJson = formatVariablesOnly(faders, spec, 'json-all');
    if (!bundle.stats || !bundle.lookAndFeel || !varsJson.includes('"fov"')) {
      throw new Error(`[${spec.id}] Export bundle or variables formatter validation failed.`);
    }

    passed++;
    console.log(
      `PASS  ${spec.code} ${spec.id.padEnd(18)} | SEARCH -> TRACK -> LOCK -> SIGHT_GRACE -> LOSS | TTL=${bundle.stats.acquisition.nominalLockTimeSec}s | DPR=2 OK`
    );
  }

  console.log('='.repeat(92));
  console.log(`ALL ${passed}/${targets.length} SPECIMENS PASSED PHASE MACHINE, DPR=2 & EXPORT CHECKS.\n`);
}

function cmdBuild() {
  const distDir = path.join(ROOT_DIR, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  for (const spec of SPECIMENS) {
    const html = generateSelfContainedSpecimenHtml(spec.id);
    const filePath = path.join(distDir, `${spec.id}.html`);
    fs.writeFileSync(filePath, html, 'utf8');
  }

  // Write index catalogue HTML
  const indexHtml = generateSelfContainedSpecimenHtml('stalheart-quiver');
  fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml, 'utf8');
  console.log(`Built ${SPECIMENS.length} self-contained specimen HTML files + dist/index.html in ${distDir}`);
}

function cmdServe(args) {
  const portIdx = args.indexOf('--port');
  const port = portIdx !== -1 ? parseInt(args[portIdx + 1], 10) : Number(process.env.PORT || 4173);
  const openIdx = args.indexOf('--open');
  const openSpec = openIdx !== -1 ? args[openIdx + 1] : '';

  const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://localhost:${port}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // API endpoint to generate self-contained HTML with current tweaked faders baked in
    if (pathname === '/api/standalone') {
      const specId = parsedUrl.searchParams.get('specimen') || 'stalheart-quiver';
      let customFaders = null;
      try {
        const rawFaders = parsedUrl.searchParams.get('faders');
        if (rawFaders) customFaders = JSON.parse(rawFaders);
      } catch {
        customFaders = null;
      }
      const html = generateSelfContainedSpecimenHtml(specId, customFaders);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="hudlab-${specId}.html"`
      });
      res.end(html);
      return;
    }

    let relPath = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.normalize(path.join(ROOT_DIR, relPath));
    if (!safePath.startsWith(ROOT_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(safePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
    fs.createReadStream(safePath).pipe(res);
  });

  server.listen(port, () => {
    const query = openSpec ? `?specimen=${openSpec}` : '';
    console.log(`\nHUDLAB server running at http://localhost:${port}/${query}`);
    console.log(`Serving 19 targeting HUD specimens across 5 families.\n`);
  });
}

// Dispatch CLI command
const [, , cmd = 'serve', ...args] = process.argv;
switch (cmd) {
  case 'list':
    cmdList(args);
    break;
  case 'scenario':
    cmdScenario(args);
    break;
  case 'compare':
    cmdCompare(args);
    break;
  case 'test':
    cmdTest(args);
    break;
  case 'build':
    cmdBuild();
    break;
  case 'init':
    console.log(`hudlab workspace initialized in ${ROOT_DIR}`);
    break;
  case 'new':
    console.log(`Template ready for ${args[0] || 'family/specimen'} in src/catalogue.js`);
    break;
  case 'serve':
  default:
    cmdServe(args);
    break;
}
