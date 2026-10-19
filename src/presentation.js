/**
 * hudlab — Layer 5: Presentation (§3 of hudlab-brief.md)
 * Owns Three.js 3D synthetic viewport, scissored DPR-aware inset camera,
 * full-screen 2D canvas symbology, SVG status/bezel overlay, and post-look CSS filters.
 * Supports all 3 Master Era Looks across all 19 specimens:
 *   1) `default`: Default Tactical (Now)
 *   2) `retro-80s`: Old 1980s CRT Raster / Vector Oscilloscope (phosphor persistence, scanline roll, CRT curvature, wireframe arcade world)
 *   3) `futuristic`: Futuristic Extreme Hi-Tech (ultra-thin hairlines, soft radial halos, 3D+2D particle streams, neural filaments)
 */

import * as THREE from 'three';
import { sampleTerrainHeight } from './world.js';

export function createPresentation(container) {
  container.innerHTML = '';
  container.classList.add('hud-viewport-root');

  // 1. WebGL Canvas for Three.js 3D World + Scissored Inset
  const glCanvas = document.createElement('canvas');
  glCanvas.className = 'hud-gl-canvas';
  container.appendChild(glCanvas);

  // 2. 2D Canvas for Crisp Vector Reticles, Halos, Particles, Funnels & B-Scopes
  const hudCanvas = document.createElement('canvas');
  hudCanvas.className = 'hud-2d-canvas';
  container.appendChild(hudCanvas);

  // Offscreen buffer for 80s CRT Phosphor Persistence / Afterglow trails
  const trailCanvas = document.createElement('canvas');
  const trailCtx = trailCanvas.getContext('2d');

  // 3. Post-Process Look Overlay (Scanlines, Vignette, Grain, CRT Bezel Curvature)
  const fxOverlay = document.createElement('div');
  fxOverlay.className = 'hud-fx-overlay';
  container.appendChild(fxOverlay);

  // 4. DOM Status Banner & Cross-Cutting Readout Layer (accessible to DOM test assertions)
  const domOverlay = document.createElement('div');
  domOverlay.className = 'hud-dom-overlay';
  domOverlay.innerHTML = `
    <div class="hud-top-bar">
      <div class="hud-specimen-tag">
        <span class="hud-code" data-hud="code">E-03</span>
        <span class="hud-title" data-hud="name">Stalheart Quiver</span>
        <span class="hud-era-chip" data-hud="era-chip">DEFAULT</span>
      </div>
      <div class="hud-status-pill" data-hud="status-pill" data-state="SEARCH">
        <span class="hud-status-dot"></span>
        <span class="hud-status-word" data-hud="status-word">SEARCH // STANDBY</span>
      </div>
      <div class="hud-telemetry-mini" data-hud="telemetry-mini">
        <span data-hud="fov-readout">FOV 40°</span>
        <span data-hud="phase-readout">PHASE: SEARCH</span>
      </div>
    </div>
    <div class="hud-subtext-banner" data-hud="status-subtext">SLEW RETICLE OVER CONTACT</div>
  `;
  container.appendChild(domOverlay);

  const hudEls = {
    code: domOverlay.querySelector('[data-hud="code"]'),
    name: domOverlay.querySelector('[data-hud="name"]'),
    eraChip: domOverlay.querySelector('[data-hud="era-chip"]'),
    statusPill: domOverlay.querySelector('[data-hud="status-pill"]'),
    statusWord: domOverlay.querySelector('[data-hud="status-word"]'),
    statusSubtext: domOverlay.querySelector('[data-hud="status-subtext"]'),
    fovReadout: domOverlay.querySelector('[data-hud="fov-readout"]'),
    phaseReadout: domOverlay.querySelector('[data-hud="phase-readout"]')
  };

  // Initialize Three.js renderer, scene, and cameras
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: glCanvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setScissorTest(true);
  } catch {
    renderer = null;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060b14);
  scene.fog = new THREE.FogExp2(0x060b14, 0.00045);

  const mainCamera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 8000);
  const insetCamera = new THREE.PerspectiveCamera(12, 1, 1, 8000);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x64748b, 1.4);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xe2e8f0, 1.8);
  dirLight.position.set(300, 600, 250);
  scene.add(dirLight);

  // Terrain Mesh + Wireframe Grid
  const terrainGeo = new THREE.PlaneGeometry(3200, 2600, 72, 64);
  terrainGeo.rotateX(-Math.PI / 2);

  const terrainMat = new THREE.MeshStandardMaterial({
    color: 0x0f1b29,
    roughness: 0.88,
    metalness: 0.12,
    flatShading: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.set(0, 0, -900);
  scene.add(terrainMesh);

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x1e3a5f,
    wireframe: true,
    transparent: true,
    opacity: 0.32
  });
  const terrainWire = new THREE.Mesh(terrainGeo, wireMat);
  terrainWire.position.copy(terrainMesh.position);
  scene.add(terrainWire);

  // 3D Futuristic Spatial Particle Field (volumetric air-data motes in 3D space)
  const spatialParticleCount = 320;
  const spatialPositions = new Float32Array(spatialParticleCount * 3);
  for (let i = 0; i < spatialParticleCount; i++) {
    spatialPositions[i * 3 + 0] = (Math.random() - 0.5) * 1800;
    spatialPositions[i * 3 + 1] = 20 + Math.random() * 420;
    spatialPositions[i * 3 + 2] = -150 - Math.random() * 1600;
  }
  const spatialGeo = new THREE.BufferGeometry();
  spatialGeo.setAttribute('position', new THREE.BufferAttribute(spatialPositions, 3));
  const spatialMat = new THREE.PointsMaterial({
    color: 0x67e8f9,
    size: 4.5,
    transparent: true,
    opacity: 0.0
  });
  const spatialParticles = new THREE.Points(spatialGeo, spatialMat);
  scene.add(spatialParticles);

  let lastBuiltRidgeScale = -1;
  function updateTerrainGeometry(ridgeScale) {
    if (Math.abs(ridgeScale - lastBuiltRidgeScale) < 0.01) return;
    lastBuiltRidgeScale = ridgeScale;
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i) - 900;
      const vy = sampleTerrainHeight(vx, vz, ridgeScale);
      pos.setY(i, vy);
    }
    pos.needsUpdate = true;
    terrainGeo.computeVertexNormals();
  }
  updateTerrainGeometry(0.65);

  // Contact Meshes Pool
  const contactMeshes = new Map();
  function createContactGroup(type) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      emissive: 0x1e293b,
      roughness: 0.4,
      wireframe: false
    });
    const plumeMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });

    if (type === 'jet') {
      const fuselage = new THREE.Mesh(new THREE.ConeGeometry(4.2, 22, 6), bodyMat);
      fuselage.rotation.x = Math.PI / 2;
      const wings = new THREE.Mesh(new THREE.BoxGeometry(20, 0.7, 9), bodyMat);
      const plume = new THREE.Mesh(new THREE.SphereGeometry(2.4, 8, 8), plumeMat);
      plume.position.set(0, 0, 10);
      group.add(fuselage, wings, plume);
    } else if (type === 'helicopter') {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5, 16), bodyMat);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 1.4), plumeMat);
      rotor.position.y = 3.2;
      rotor.name = 'rotor';
      group.add(hull, rotor);
    } else {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(9, 4.5, 13), bodyMat);
      const turret = new THREE.Mesh(new THREE.SphereGeometry(3.8, 8, 6), plumeMat);
      turret.position.y = 3.2;
      group.add(hull, turret);
    }
    group.userData = { bodyMat, plumeMat, type };
    return group;
  }

  const decoyGroup = new THREE.Group();
  scene.add(decoyGroup);
  const roundGroup = new THREE.Group();
  scene.add(roundGroup);

  // 2D HUD Particle Pool for Futuristic Hi-Tech Mode (`particleDensity > 0`)
  const hudParticles = Array.from({ length: 90 }, (_, idx) => ({
    angle: (idx / 90) * Math.PI * 2,
    radiusOffset: (Math.random() - 0.5) * 45,
    speed: 0.4 + Math.random() * 1.4,
    progress: Math.random(),
    size: 1.0 + Math.random() * 1.8,
    alpha: 0.35 + Math.random() * 0.65,
    orbitLayer: idx % 3
  }));

  function sync3DWorld(frame) {
    const { world, faders, platform } = frame;
    updateTerrainGeometry(world.ridgeScale);

    const era = faders.eraMode || 'default';
    const isFuturistic = era === 'futuristic' || era === 'futuristic-low';
    const look = faders.look || 'raw';
    const pDensity = faders.particleDensity ?? 0;

    // 3D Spatial Particles visibility & drift
    if (pDensity > 0.05) {
      spatialParticles.visible = true;
      spatialMat.opacity = Math.min(0.85, pDensity * (era === 'futuristic-low' ? 0.28 : 0.45));
      spatialMat.color.set(faders.primaryColor || '#67e8f9');
      spatialParticles.rotation.y = world.time * 0.03;
    } else {
      spatialParticles.visible = false;
    }

    // Era + Look palette styling for 3D scene
    if (era === 'retro-80s') {
      scene.background.setHex(0x020904);
      scene.fog.color.setHex(0x020904);
      terrainMat.color.setHex(0x021206);
      wireMat.color.set(faders.primaryColor || '#33ff66');
      wireMat.opacity = 0.72;
    } else if (isFuturistic) {
      scene.background.setHex(0x030712);
      scene.fog.color.setHex(0x030712);
      terrainMat.color.setHex(0x071024);
      wireMat.color.set(faders.primaryColor || '#67e8f9');
      wireMat.opacity = era === 'futuristic-low' ? 0.18 : 0.24;
    } else if (look === 'flir-ironbow') {
      scene.background.setHex(0x12091c);
      scene.fog.color.setHex(0x12091c);
      terrainMat.color.setHex(0x2a133d);
      wireMat.color.setHex(0x9333ea);
      wireMat.opacity = era === 'default-thin' ? 0.22 : 0.32;
    } else if (look === 'crt-inset') {
      scene.background.setHex(0x031208);
      scene.fog.color.setHex(0x031208);
      terrainMat.color.setHex(0x072612);
      wireMat.color.setHex(0x22c55e);
      wireMat.opacity = era === 'default-thin' ? 0.28 : 0.42;
    } else if (look === 'amber-soviet') {
      scene.background.setHex(0x140d02);
      scene.fog.color.setHex(0x140d02);
      terrainMat.color.setHex(0x291a05);
      wireMat.color.setHex(0xd97706);
      wireMat.opacity = era === 'default-thin' ? 0.25 : 0.38;
    } else {
      scene.background.setHex(0x060c16);
      scene.fog.color.setHex(0x060c16);
      terrainMat.color.setHex(0x0f1e32);
      wireMat.color.setHex(0x1d4ed8);
      wireMat.opacity = era === 'default-thin' ? 0.22 : 0.32;
    }

    scene.fog.density = 0.00015 + (faders.fogDensity ?? 0.25) * 0.00095;
    terrainWire.visible = Boolean(faders.terrainWireframe ?? true);

    // Sync contacts
    const activeIds = new Set();
    for (const c of world.contacts) {
      activeIds.add(c.id);
      let mesh = contactMeshes.get(c.id);
      if (!mesh) {
        mesh = createContactGroup(c.type);
        contactMeshes.set(c.id, mesh);
        scene.add(mesh);
      }
      mesh.visible = true;
      mesh.position.set(c.position.x, c.position.y, c.position.z);

      if (Math.hypot(c.velocity.x, c.velocity.z) > 0.1) {
        mesh.lookAt(
          c.position.x + c.velocity.x,
          c.position.y + c.velocity.y,
          c.position.z + c.velocity.z
        );
      }
      const rotor = mesh.getObjectByName('rotor');
      if (rotor) rotor.rotation.y = world.time * 18;

      // Era-aware 3D target shading (80s vector wireframe vs Futuristic glowing silhouette vs Default)
      mesh.userData.bodyMat.wireframe = era === 'retro-80s';
      if (era === 'retro-80s') {
        mesh.userData.bodyMat.color.set(faders.primaryColor || '#33ff66');
        mesh.userData.bodyMat.emissive.setHex(0x14532d);
        mesh.userData.plumeMat.color.set(faders.lockedColor || '#ffcc00');
      } else if (isFuturistic) {
        mesh.userData.bodyMat.color.setHex(0xe0f2fe);
        mesh.userData.bodyMat.emissive.setHex(era === 'futuristic-low' ? 0x075985 : 0x0284c7);
        mesh.userData.plumeMat.color.setHex(0xc084fc);
      } else if (look === 'flir-ironbow') {
        mesh.userData.bodyMat.color.setHex(0xfbbf24);
        mesh.userData.bodyMat.emissive.setHex(0xd97706);
        mesh.userData.plumeMat.color.setHex(0xffffff);
      } else if (look === 'crt-inset' || look === 'monochrome-hmd') {
        mesh.userData.bodyMat.color.setHex(0x4ade80);
        mesh.userData.bodyMat.emissive.setHex(0x166534);
      } else {
        mesh.userData.bodyMat.color.setHex(0xcbd5e1);
        mesh.userData.bodyMat.emissive.setHex(0x1e293b);
        mesh.userData.plumeMat.color.setHex(0xff8800);
      }
    }

    for (const [id, mesh] of contactMeshes.entries()) {
      if (!activeIds.has(id)) mesh.visible = false;
    }

    // Sync decoys
    while (decoyGroup.children.length > world.decoys.length) {
      decoyGroup.remove(decoyGroup.children[decoyGroup.children.length - 1]);
    }
    while (decoyGroup.children.length < world.decoys.length) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(3.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfffbeb })
      );
      decoyGroup.add(m);
    }
    world.decoys.forEach((d, idx) => {
      decoyGroup.children[idx].position.set(d.position.x, d.position.y, d.position.z);
    });

    // Sync rounds
    while (roundGroup.children.length > world.rounds.length) {
      roundGroup.remove(roundGroup.children[roundGroup.children.length - 1]);
    }
    while (roundGroup.children.length < world.rounds.length) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(2.8, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffdd44 })
      );
      roundGroup.add(m);
    }
    world.rounds.forEach((r, idx) => {
      roundGroup.children[idx].position.set(r.position.x, r.position.y, r.position.z);
      roundGroup.children[idx].visible = r.active;
    });

    // Update Main Camera Pose to match platform.aimDirection exactly
    mainCamera.fov = (faders.fov ?? 46) / Math.max(0.5, faders.zoom ?? 1.0);
    mainCamera.position.set(platform.position.x, platform.position.y, platform.position.z);
    mainCamera.up.set(0, 1, 0);
    mainCamera.lookAt(
      platform.position.x + platform.aimDirection.x * 500,
      platform.position.y + platform.aimDirection.y * 500,
      platform.position.z + platform.aimDirection.z * 500
    );
    mainCamera.rotateZ(-(platform.gimbalRollDeg * Math.PI) / 180 * 0.25);
  }

  function getInsetRect(viewport, faders, specimen) {
    const size = Math.min(
      Math.min(viewport.width, viewport.height) * 0.42,
      faders.insetSizePx ?? 220
    );
    const margin = 18;
    if (specimen?.id === 'vtol-vr') {
      const scaled = size * (faders.mfdScale ?? 1.0);
      return {
        x: viewport.width - scaled - margin,
        y: viewport.height - scaled - margin,
        w: scaled,
        h: scaled
      };
    }
    return {
      x: viewport.width - size - margin,
      y: 58,
      w: size,
      h: size
    };
  }

  function renderWebGL(frame) {
    if (!renderer) return;
    const { viewport, faders, specimen, sensor } = frame;
    const w = Math.max(1, viewport.width);
    const h = Math.max(1, viewport.height);
    const dpr = viewport.dpr || 1;

    if (glCanvas.width !== Math.round(w * dpr) || glCanvas.height !== Math.round(h * dpr)) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
    }

    sync3DWorld(frame);

    mainCamera.aspect = w / h;
    mainCamera.updateProjectionMatrix();
    renderer.setViewport(0, 0, w, h);
    renderer.setScissor(0, 0, w, h);
    renderer.render(scene, mainCamera);

    const uses3DInset =
      specimen?.hasInset &&
      (faders.showInset ?? true) &&
      specimen.insetMode !== 'b-scope' &&
      specimen.insetMode !== 'aesa-hsd' &&
      specimen.insetMode !== 'rwr-azimuth';

    if (uses3DInset) {
      const rect = getInsetRect(viewport, faders, specimen);
      const glX = rect.x;
      const glY = h - rect.y - rect.h;

      insetCamera.aspect = rect.w / rect.h;
      insetCamera.fov = Math.max(3.5, (faders.fov ?? 45) / Math.max(1.5, faders.insetZoom ?? 5.0));

      const activeRound = sensor.activeRound;
      if (specimen.insetMode === 'missile-cam' && activeRound?.active) {
        insetCamera.position.set(
          activeRound.position.x,
          activeRound.position.y,
          activeRound.position.z
        );
        insetCamera.lookAt(
          activeRound.position.x + activeRound.velocity.x,
          activeRound.position.y + activeRound.velocity.y,
          activeRound.position.z + activeRound.velocity.z
        );
      } else if (specimen.insetMode === 'top-down-lar') {
        const spi = sensor.designatedSpi;
        insetCamera.fov = 38;
        insetCamera.position.set(spi.x, 950, spi.z);
        insetCamera.lookAt(spi.x, 0, spi.z);
      } else if (sensor.candidate) {
        insetCamera.position.copy(mainCamera.position);
        insetCamera.lookAt(
          sensor.candidate.position.x,
          sensor.candidate.position.y,
          sensor.candidate.position.z
        );
      } else {
        insetCamera.position.copy(mainCamera.position);
        insetCamera.rotation.copy(mainCamera.rotation);
      }

      insetCamera.updateProjectionMatrix();
      renderer.setViewport(glX, glY, rect.w, rect.h);
      renderer.setScissor(glX, glY, rect.w, rect.h);
      renderer.render(scene, insetCamera);
    }
  }

  /**
   * Draw 2D Vector HUD Overlay for all 19 specimens + Era-Specific Layer Effects:
   * - `retro-80s`: Phosphor Persistence Buffer, CRT Raster Sweep, Stepped Graticule, Chromatic Fringe
   * - `futuristic`: Soft Radial Halos, Convergence Particle Streams, Ultra-Thin Neural Filaments, Micro-Verniers
   */
  function render2DOverlay(frame) {
    const { viewport, faders, specimen, sensor, platform, status, world } = frame;
    const w = Math.max(1, viewport.width);
    const h = Math.max(1, viewport.height);
    const dpr = viewport.dpr || 1;
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);

    if (hudCanvas.width !== targetW || hudCanvas.height !== targetH) {
      hudCanvas.width = targetW;
      hudCanvas.height = targetH;
      trailCanvas.width = targetW;
      trailCanvas.height = targetH;
    }

    const ctx = hudCanvas.getContext('2d');
    const persistence = faders.phosphorPersistence ?? 0;

    // If phosphor persistence > 0 (e.g. 80s CRT or Futuristic subtle motion trail),
    // composite faded trailCanvas onto hudCanvas before drawing current frame
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, targetW, targetH);
    if (persistence > 0.02) {
      ctx.globalAlpha = Math.min(0.92, persistence);
      // Slight 1px vertical drift in 80s mode simulates analog phosphor decay
      const driftY = faders.eraMode === 'retro-80s' ? 0.6 : 0;
      ctx.drawImage(trailCanvas, 0, driftY);
    }
    ctx.restore();

    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const era = faders.eraMode || 'default';
    const isFuturistic = era === 'futuristic' || era === 'futuristic-low';
    const isThin = era === 'default-thin' || isFuturistic;
    const scale = faders.reticleScale ?? 1.0;
    const strokeW = faders.strokeWidth ?? 1.75;
    const primary = faders.primaryColor || '#38bdf8';
    const locked = faders.lockedColor || '#4ade80';
    const warning = faders.warningColor || '#fb7185';
    const activeColor = status.colorHex || primary;
    const reducedMotion = Boolean(faders.reducedMotion);
    const phoneLayout = Boolean(faders.phoneLayout);
    const glyphDensity = faders.glyphDensity ?? 2;
    const boxR = sensor.boxRadiusPx;

    ctx.globalAlpha = faders.reticleOpacity ?? 0.92;
    ctx.lineWidth = strokeW;
    ctx.font =
      era === 'retro-80s'
        ? '700 12px "Courier New", "JetBrains Mono", monospace'
        : isThin
        ? '400 10px "JetBrains Mono", "SF Mono", monospace'
        : '600 11px "JetBrains Mono", "SF Mono", monospace';
    ctx.textBaseline = 'middle';

    // -------------------------------------------------------------------------
    // ERA LAYER 0: SOFT OPTICAL HALOS (`haloIntensity` / Futuristic Hi-Tech)
    // -------------------------------------------------------------------------
    const haloIntensity = faders.haloIntensity ?? 0.15;
    if (haloIntensity > 0.05) {
      drawOpticalHalos(ctx, cx, cy, boxR, frame, activeColor, primary, locked, haloIntensity);
    }

    // -------------------------------------------------------------------------
    // ERA LAYER 1: 80s CRT OSCILLOSCOPE GRATICULE & RASTER BEAM (`retro-80s`)
    // -------------------------------------------------------------------------
    if (era === 'retro-80s' || (faders.crtCurvature ?? 0) > 0.25) {
      drawRetro80sCrtLayer(ctx, w, h, cx, cy, boxR, frame, primary, locked, warning);
    }

    // -------------------------------------------------------------------------
    // ERA LAYER 2: FUTURISTIC HI-TECH PARTICLES, MICRO-RINGS & NEURAL FILAMENTS
    // -------------------------------------------------------------------------
    const particleDensity = faders.particleDensity ?? 0;
    if (isFuturistic || particleDensity > 0.05) {
      drawFuturisticHiTechLayer(
        ctx,
        w,
        h,
        cx,
        cy,
        boxR,
        frame,
        hudParticles,
        primary,
        locked,
        warning,
        particleDensity
      );
    }

    // Standard Bloom shadow glow
    if ((faders.bloomStrength ?? 0.25) > 0.05) {
      ctx.shadowColor = activeColor;
      ctx.shadowBlur =
        (faders.bloomStrength ?? 0.25) *
        (era === 'futuristic' ? 22 : era === 'futuristic-low' ? 6 : 16);
    }

    // -------------------------------------------------------------------------
    // A. DRAW WORLD CONTACT MARKERS & SIGNATURES
    // -------------------------------------------------------------------------
    for (const c of sensor.projectedContacts) {
      if (!c.proj.inFront) continue;
      const isCandidate = sensor.candidate?.id === c.id;
      const x = c.proj.screenX;
      const y = c.proj.screenY;

      ctx.save();
      if (c.masked) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.38)';
        ctx.setLineDash([3, 3]);
      } else if (isCandidate && sensor.phase === 'LOCK') {
        ctx.strokeStyle = locked;
      } else if (isCandidate) {
        ctx.strokeStyle = primary;
      } else {
        ctx.strokeStyle =
          era === 'retro-80s'
            ? 'rgba(51, 255, 102, 0.55)'
            : isFuturistic
            ? 'rgba(103, 232, 249, 0.55)'
            : 'rgba(148, 163, 184, 0.65)';
      }

      const r = isCandidate ? 16 * scale : 10 * scale;

      if (isFuturistic) {
        // Ultra-thin circular micro-target node + outer halo ring
        ctx.lineWidth = Math.max(0.55, strokeW * 0.85);
        ctx.beginPath();
        ctx.arc(x, y, r * 1.15, 0, Math.PI * 2);
        ctx.stroke();
        drawDiamond(ctx, x, y, r * 0.65);
        // Sub-pixel crosshair ticks
        ctx.beginPath();
        ctx.moveTo(x - r * 1.6, y);
        ctx.lineTo(x - r * 1.15, y);
        ctx.moveTo(x + r * 1.15, y);
        ctx.lineTo(x + r * 1.6, y);
        ctx.stroke();
      } else if (era === 'retro-80s') {
        // Chunky 1980s vector arcade octabox / stepped reticle
        ctx.lineWidth = Math.max(2.0, strokeW);
        ctx.strokeRect(Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2));
        ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
      } else if (specimen?.id === 'arcade-lock') {
        ctx.strokeStyle = isCandidate && sensor.phase === 'LOCK' ? locked : primary;
        ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      } else {
        drawCornerBrackets(ctx, x, y, r, r, 5);
      }

      if (!phoneLayout && glyphDensity >= 1) {
        ctx.fillStyle = ctx.strokeStyle;
        const distStr =
          specimen?.id === 'irst' && sensor.irstIntegration < 0.85
            ? `±${sensor.irstRangeUncertaintyM}M`
            : `${(c.distance / 1000).toFixed(1)}KM`;

        if (isFuturistic) {
          // Delicate angled leader line + hex telemetry micro-label
          ctx.beginPath();
          ctx.moveTo(x + r * 0.8, y - r * 0.8);
          ctx.lineTo(x + r + 10, y - r - 6);
          ctx.lineTo(x + r + 52, y - r - 6);
          ctx.stroke();
          ctx.font = '400 9.5px "JetBrains Mono", monospace';
          ctx.fillText(`0x${c.id.toUpperCase()} // ${c.callsign}`, x + r + 12, y - r - 14);
          ctx.fillText(`RNG ${distStr} · Vc ${Math.round(c.closureRateMs)}`, x + r + 12, y - r + 4);
        } else if (era === 'retro-80s') {
          ctx.font = '700 11px "Courier New", monospace';
          ctx.fillText(`[${c.callsign}:${distStr}]`, x + r + 6, y - 4);
        } else {
          ctx.font = isThin
            ? '400 10px "JetBrains Mono", monospace'
            : '500 10px "JetBrains Mono", monospace';
          ctx.fillText(`${c.callsign} ${distStr}`, x + r + 6, y - 4);
        }

        if (c.masked) {
          ctx.fillStyle = warning;
          ctx.fillText(era === 'retro-80s' ? '** OCCLUDED **' : 'MASKED', x + r + 6, y + 10);
        }
      }
      ctx.restore();
    }

    // Draw flare decoys on HUD
    for (const d of sensor.projectedDecoys) {
      if (!d.proj.inFront) continue;
      ctx.save();
      ctx.strokeStyle = '#fde047';
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(d.proj.screenX, d.proj.screenY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (sensor.seducedByDecoyId === d.id) {
        ctx.strokeStyle = warning;
        ctx.lineWidth = strokeW + 1;
        ctx.strokeRect(d.proj.screenX - 14, d.proj.screenY - 14, 28, 28);
        ctx.fillStyle = warning;
        ctx.fillText('DECOY PULL', d.proj.screenX + 18, d.proj.screenY);
      }
      ctx.restore();
    }

    // Draw in-flight rounds & "Danger stays with the round after release" (§5)
    for (const r of sensor.projectedRounds) {
      if (!r.proj.inFront || !r.active) continue;
      ctx.save();
      ctx.strokeStyle = locked;
      ctx.fillStyle = locked;
      ctx.beginPath();
      ctx.arc(r.proj.screenX, r.proj.screenY, 5, 0, Math.PI * 2);
      ctx.stroke();

      if (faders.dangerBeforeRelease) {
        ctx.fillStyle = warning;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        const rem = Math.max(0, r.maxFlightTime - r.age).toFixed(1);
        ctx.fillText(`▲ LIVE ORDNANCE T-${rem}S`, r.proj.screenX + 10, r.proj.screenY - 8);
      }
      ctx.restore();
    }

    // -------------------------------------------------------------------------
    // B. SPECIMEN-SPECIFIC TARGETING SYMBOLOGY (ALL 19 SPECIMENS)
    // -------------------------------------------------------------------------
    ctx.strokeStyle = activeColor;
    ctx.fillStyle = activeColor;

    switch (specimen?.id) {
      case 'saclos':
        drawSaclosHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'tv-eo':
        drawTvEoHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'ir-seeker':
        drawIrSeekerHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'iir-clu':
        drawIirCluHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning);
        break;
      case 'laser-spot':
        drawLaserSpotHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'radar-active':
        drawRadarActiveHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'radar-semi-active':
        drawRadarSemiActiveHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'coords':
        drawCoordsHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'fcr-scan':
        drawFcrScanHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'aesa':
        drawAesaHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'irst':
        drawIrstHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'tgp-mts':
        drawTgpMtsHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning);
        break;
      case 'rwr':
        drawRwrHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'tank-fcs':
        drawTankFcsHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning);
        break;
      case 'ccip-ccrp':
        drawCcipCcrpHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning);
        break;
      case 'air-gun':
        drawAirGunHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'arcade-lock':
        drawArcadeLockHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
      case 'vtol-vr':
        drawVtolVrHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning);
        break;
      case 'stalheart-quiver':
      default:
        drawStalheartQuiverHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning);
        break;
    }

    // -------------------------------------------------------------------------
    // C. CROSS-CUTTING STUDIES (§5): LOSS LEGIBILITY, SHOOT LADDER, INSET FRAME
    // -------------------------------------------------------------------------
    if (faders.lossLegibility ?? true) {
      drawLossAndGraceStudy(ctx, cx, cy, boxR, frame, warning, reducedMotion);
    }

    if ((faders.showShootLadder ?? true) && !phoneLayout) {
      drawShootCueLadder(ctx, cx, cy, boxR, frame, primary, locked, warning);
    }

    if (specimen?.hasInset && (faders.showInset ?? true)) {
      const rect = getInsetRect(viewport, faders, specimen);
      drawInsetBezelAndContent(ctx, rect, frame, primary, locked, warning);
    }

    if (!phoneLayout && glyphDensity >= 2) {
      drawGimbalTape(ctx, cx, 42, platform, faders, primary, warning);
    }

    ctx.restore();

    // Save current frame into trailCanvas for next frame's phosphor persistence
    if (persistence > 0.02) {
      trailCtx.setTransform(1, 0, 0, 1, 0, 0);
      trailCtx.clearRect(0, 0, targetW, targetH);
      trailCtx.drawImage(hudCanvas, 0, 0);
    }

    // Update DOM Overlay elements
    hudEls.code.textContent = specimen?.code || 'E-03';
    hudEls.name.textContent = specimen?.shortName || specimen?.name || 'HUD';
    if (hudEls.eraChip) {
      hudEls.eraChip.textContent =
        era === 'retro-80s'
          ? "80'S CRT"
          : era === 'futuristic'
          ? 'HI-TECH'
          : era === 'default-thin'
          ? 'DEF THIN'
          : era === 'futuristic-low'
          ? 'FUT LOW'
          : 'DEFAULT';
      hudEls.eraChip.dataset.era = era;
    }
    hudEls.statusPill.dataset.state = status.state;
    hudEls.statusPill.style.borderColor = status.colorHex;
    hudEls.statusPill.style.color = status.colorHex;
    hudEls.statusWord.textContent = reducedMotion && status.blink ? `[!] ${status.text}` : status.text;
    hudEls.statusSubtext.textContent = status.subtext;
    hudEls.statusSubtext.style.color = status.colorHex;
    hudEls.fovReadout.textContent = `FOV ${(faders.fov / faders.zoom).toFixed(1)}° (${faders.zoom.toFixed(1)}x)`;
    hudEls.phaseReadout.textContent = `PHASE: ${sensor.phase}`;

    // Apply Post-Process Look CSS Variables & Era class on container
    container.dataset.eraMode = era;
    fxOverlay.style.setProperty('--scanline-opacity', String((faders.scanlineIntensity ?? 0.1) * 0.65));
    fxOverlay.style.setProperty('--vignette-opacity', String(faders.vignette ?? 0.25));
    fxOverlay.style.setProperty('--crt-curvature', String(faders.crtCurvature ?? 0.0));
  }

  function render(frame) {
    renderWebGL(frame);
    render2DOverlay(frame);
  }

  return {
    render,
    getCanvasElements: () => ({ glCanvas, hudCanvas })
  };
}

// ============================================================================
// ERA LOOK OVERLAYS: SOFT HALOS, 80s CRT RASTER, FUTURISTIC HI-TECH PARTICLES
// ============================================================================

function hexToRgba(hex, alpha = 1) {
  const clean = (hex || '#38bdf8').replace('#', '');
  const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Soft multi-layered optical halos around the central reticle and locked contact.
 */
function drawOpticalHalos(ctx, cx, cy, boxR, frame, activeColor, primary, locked, haloIntensity) {
  const { sensor } = frame;
  ctx.save();
  ctx.shadowBlur = 0;

  // 1. Main Reticle radial light-field halo
  const outerHaloR = boxR * 1.85;
  const grad = ctx.createRadialGradient(cx, cy, boxR * 0.25, cx, cy, outerHaloR);
  grad.addColorStop(0, hexToRgba(activeColor, 0.08 * haloIntensity));
  grad.addColorStop(0.55, hexToRgba(primary, 0.14 * haloIntensity));
  grad.addColorStop(0.78, hexToRgba(locked, 0.06 * haloIntensity));
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerHaloR, 0, Math.PI * 2);
  ctx.fill();

  // 2. Target Lock Halo when tracking or locked
  if (sensor.candidate && sensor.candidate.proj.inFront && sensor.lockMeter > 0.1) {
    const tx = sensor.candidate.proj.screenX;
    const ty = sensor.candidate.proj.screenY;
    const tr = (34 + sensor.lockMeter * 28) * (0.7 + haloIntensity * 0.5);
    const tColor = sensor.phase === 'LOCK' ? locked : primary;
    const tGrad = ctx.createRadialGradient(tx, ty, 2, tx, ty, tr);
    tGrad.addColorStop(0, hexToRgba(tColor, 0.28 * haloIntensity * sensor.lockMeter));
    tGrad.addColorStop(0.5, hexToRgba(tColor, 0.12 * haloIntensity));
    tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.arc(tx, ty, tr, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 2) Old 1980s CRT Oscilloscope / Vector Arcade Layer (`retro-80s`).
 */
function drawRetro80sCrtLayer(ctx, w, h, cx, cy, boxR, frame, primary, locked, warning) {
  const { world, sensor, faders } = frame;
  const curvature = faders.crtCurvature ?? 0.8;

  ctx.save();
  ctx.strokeStyle = hexToRgba(primary, 0.42);
  ctx.fillStyle = primary;
  ctx.lineWidth = 1.5;

  // 1. Rolling 60Hz CRT Raster Refresh Bar
  const rollY = ((world.time * 125) % (h + 80)) - 40;
  const barGrad = ctx.createLinearGradient(0, rollY - 25, 0, rollY + 25);
  barGrad.addColorStop(0, 'rgba(51, 255, 102, 0)');
  barGrad.addColorStop(0.5, hexToRgba(primary, 0.11));
  barGrad.addColorStop(1, 'rgba(51, 255, 102, 0)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, rollY - 25, w, 50);

  // 2. Oscilloscope Graticule Axis Ticks across screen center
  ctx.beginPath();
  for (let x = cx - 280; x <= cx + 280; x += 28) {
    if (Math.abs(x - cx) < boxR * 0.9) continue;
    ctx.moveTo(x, cy - 4);
    ctx.lineTo(x, cy + 4);
  }
  for (let y = cy - 220; y <= cy + 220; y += 28) {
    if (Math.abs(y - cy) < boxR * 0.9) continue;
    ctx.moveTo(cx - 4, y);
    ctx.lineTo(cx + 4, y);
  }
  ctx.stroke();

  // 3. 1980s Block-Vector Telemetry Header & Phosphor Status Block
  ctx.fillStyle = primary;
  ctx.font = '700 12px "Courier New", monospace';
  const hexClock = Math.floor(world.time * 10)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  ctx.fillText(`CRT-84 // VEC-ROM REV 2.4 // CLK:${hexClock}`, 24, h - 42);
  ctx.fillText(
    `LOCK-GATE: [${
      '#'.repeat(Math.round(sensor.lockMeter * 10)) +
      '.'.repeat(10 - Math.round(sensor.lockMeter * 10))
    }]`,
    24,
    h - 24
  );

  // 4. Curved 80s CRT Tube Bezel Mask around corners
  if (curvature > 0.1) {
    ctx.strokeStyle = hexToRgba(primary, 0.55);
    ctx.lineWidth = 3;
    const pad = 10;
    const cornerR = 32 * curvature;
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, cornerR);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 3) & 5) Futuristic Hi-Tech Layer (`futuristic` & `futuristic-low`):
 * Razor-thin micro-geometry, orbiting particle field, convergence energy particles streaming into lock,
 * and delicate neural-link spline filaments.
 */
function drawFuturisticHiTechLayer(
  ctx,
  w,
  h,
  cx,
  cy,
  boxR,
  frame,
  hudParticles,
  primary,
  locked,
  warning,
  particleDensity
) {
  const { world, sensor, faders } = frame;
  const t = world.time;
  const isLocked = sensor.phase === 'LOCK';
  const accent = isLocked ? locked : primary;
  const haloScale = Math.min(1, (faders.haloIntensity ?? 0.85) / 0.85);

  ctx.save();

  // 1. Ultra-thin concentric micro-rings & counter-rotating vernier arcs (0.55px hairlines)
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = hexToRgba(primary, 0.45);
  const r1 = boxR * 1.38;
  const r2 = boxR * 1.56;

  // Segmented rotating outer micro-ring
  for (let i = 0; i < 6; i++) {
    const startA = t * 0.35 + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r1, startA, startA + 0.32);
    ctx.stroke();
  }

  // Counter-rotating fine degree hair-ring
  ctx.strokeStyle = hexToRgba(locked, 0.38);
  for (let i = 0; i < 72; i++) {
    const a = -t * 0.18 + (i / 72) * Math.PI * 2;
    const inner = i % 6 === 0 ? r2 - 6 : r2 - 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  // 2. Neural-Link Curved Spline Filaments connecting reticle to visible contacts
  for (const c of sensor.projectedContacts) {
    if (!c.proj.inFront || c.masked) continue;
    const isCand = sensor.candidate?.id === c.id;
    ctx.strokeStyle = isCand
      ? hexToRgba(accent, 0.42 + sensor.lockMeter * 0.35)
      : hexToRgba(primary, 0.15);
    ctx.lineWidth = isCand ? 0.85 : 0.45;

    const midX = (cx + c.proj.screenX) * 0.5;
    const midY = (cy + c.proj.screenY) * 0.5 - 28;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(midX, midY, c.proj.screenX, c.proj.screenY);
    ctx.stroke();
  }

  // 3. Live HUD Particle System (Orbiting Halo Motes + Target Convergence Particle Stream)
  const activeCount = Math.min(
    hudParticles.length,
    Math.round(hudParticles.length * Math.min(1, particleDensity * 0.75))
  );

  const hasCand = sensor.candidate && sensor.candidate.proj.inFront;
  const tx = hasCand ? sensor.candidate.proj.screenX : cx;
  const ty = hasCand ? sensor.candidate.proj.screenY : cy;

  for (let i = 0; i < activeCount; i++) {
    const p = hudParticles[i];
    p.angle += 0.012 * p.speed;
    p.progress = (p.progress + 0.014 * p.speed) % 1;

    let px;
    let py;
    let pColor = primary;

    if (hasCand && sensor.lockMeter > 0.15 && i % 2 === 0) {
      // Stream particles from outer acquisition ring directly into target lock point!
      const startX = cx + Math.cos(p.angle) * (boxR * 1.3);
      const startY = cy + Math.sin(p.angle) * (boxR * 1.3);
      const ease = p.progress * p.progress * (3 - 2 * p.progress);
      px = startX + (tx - startX) * ease + Math.sin(t * 6 + i) * 6 * (1 - ease);
      py = startY + (ty - startY) * ease + Math.cos(t * 6 + i) * 6 * (1 - ease);
      pColor = isLocked ? locked : primary;
    } else {
      // Orbiting holographic field motes around reticle rings
      const orbitR = boxR * (0.95 + p.orbitLayer * 0.32) + Math.sin(t * 2 + i) * 8;
      px = cx + Math.cos(p.angle) * orbitR;
      py = cy + Math.sin(p.angle) * orbitR;
    }

    const alpha = p.alpha * (0.5 + 0.5 * Math.sin(t * 5 + i));
    ctx.fillStyle = hexToRgba(pColor, alpha);
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Soft mini-halo around larger hi-tech motes (scaled down in futuristic-low)
    if (p.size > 2.1 && haloScale > 0.2) {
      ctx.fillStyle = hexToRgba(pColor, alpha * 0.22 * haloScale);
      ctx.beginPath();
      ctx.arc(px, py, p.size * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Futuristic Micro-Telemetry Callouts
  ctx.fillStyle = hexToRgba(primary, 0.75);
  ctx.font = '400 9px "JetBrains Mono", monospace';
  ctx.fillText(
    `SYNAPTIC.OPTICS // λ=${(440 + sensor.lockMeter * 180).toFixed(1)}nm // P-FIELD:${activeCount}`,
    cx - boxR * 1.35,
    cy - boxR * 1.62
  );

  ctx.restore();
}

// ============================================================================
// HELPER VECTOR DRAWING ROUTINES FOR ALL 19 SPECIMENS
// ============================================================================

function drawCornerBrackets(ctx, cx, cy, rx, ry, len) {
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy - ry + len);
  ctx.lineTo(cx - rx, cy - ry);
  ctx.lineTo(cx - rx + len, cy - ry);
  ctx.moveTo(cx + rx - len, cy - ry);
  ctx.lineTo(cx + rx, cy - ry);
  ctx.lineTo(cx + rx, cy - ry + len);
  ctx.moveTo(cx + rx, cy + ry - len);
  ctx.lineTo(cx + rx, cy + ry);
  ctx.lineTo(cx + rx - len, cy + ry);
  ctx.moveTo(cx - rx + len, cy + ry);
  ctx.lineTo(cx - rx, cy + ry);
  ctx.lineTo(cx - rx, cy + ry - len);
  ctx.stroke();
}

function drawDiamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.stroke();
}

// 1. E-03: Stalheart Quiver (4-Phase Acquisition Baseline)
function drawStalheartQuiverHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const steps = Math.round(faders.harmonicSteps ?? 4);
  const gapBase = faders.quadrantGapPx ?? 18;
  const meter = sensor.lockMeter;
  const activeStep = Math.min(steps, Math.floor(meter * steps));
  const stepGap = gapBase * (1 - meter * 0.78);

  const ticks = Math.round(faders.ringTickCount ?? 24);
  const outerR = boxR * 1.28;
  ctx.save();
  ctx.strokeStyle = meter >= 1 ? locked : primary;
  for (let i = 0; i < ticks; i++) {
    const a = (i / ticks) * Math.PI * 2;
    const inner = i % 3 === 0 ? outerR - 7 : outerR - 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outerR, cy + Math.sin(a) * outerR);
    ctx.stroke();
  }

  const qSize = boxR * 0.72;
  drawCornerBrackets(ctx, cx, cy, qSize + stepGap, qSize + stepGap, 16 * scale);

  for (let s = 1; s <= steps; s++) {
    const r = (qSize / steps) * s;
    ctx.strokeStyle = s <= activeStep ? (meter >= 1 ? locked : primary) : 'rgba(148,163,184,0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = meter >= 1 ? locked : primary;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();

  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`QUIVER P-${activeStep}/${steps}`, cx - boxR, cy + boxR + 20);
  ctx.restore();
}

// 2. A-01: SACLOS Wire-Guided Beam-Rider
function drawSaclosHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, platform, faders, world } = frame;
  const corridorR = ((faders.beamCorridorDeg ?? 4.5) / 10) * boxR;

  ctx.beginPath();
  ctx.moveTo(cx - boxR * 1.6, cy);
  ctx.lineTo(cx - 8, cy);
  ctx.moveTo(cx + 8, cy);
  ctx.lineTo(cx + boxR * 1.6, cy);
  ctx.moveTo(cx, cy - boxR * 1.6);
  ctx.lineTo(cx, cy - 8);
  ctx.moveTo(cx, cy + 8);
  ctx.lineTo(cx, cy + boxR * 1.6);
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, corridorR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const maxSlew = faders.maxSlewDegSec ?? 24;
  const slewRatio = Math.min(1.2, platform.slewVelocityDegSec.magnitude / maxSlew);
  ctx.strokeStyle = slewRatio > 0.85 ? warning : locked;
  ctx.beginPath();
  ctx.arc(cx, cy, corridorR + 8, -Math.PI / 2, -Math.PI / 2 + slewRatio * Math.PI * 2);
  ctx.stroke();

  const wobble = faders.flareWobbleAmp ?? 9;
  const fx = cx + Math.sin(world.time * 17) * wobble + platform.slewVelocityDegSec.yaw * 0.4;
  const fy = cy + Math.cos(world.time * 23) * wobble - platform.slewVelocityDegSec.pitch * 0.4;
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
  ctx.fill();

  const activeRound = sensor.activeRound;
  const wireRemFraction = activeRound?.active
    ? Math.max(0, 1 - activeRound.age / activeRound.maxFlightTime)
    : 1.0;
  const barW = boxR * 1.6;
  ctx.strokeStyle = primary;
  ctx.strokeRect(cx - barW / 2, cy + boxR + 16, barW, 7);
  ctx.fillStyle = wireRemFraction < 0.25 ? warning : locked;
  ctx.fillRect(cx - barW / 2, cy + boxR + 16, barW * wireRemFraction, 7);
  const wireMeters = Math.round((faders.wireSpoolMeters ?? 3750) * wireRemFraction);
  ctx.fillText(`WIRE SPOOL: ${wireMeters}M`, cx - barW / 2, cy + boxR + 34);
}

// 3. A-02: TV/EO Contrast Seeker & Nose-Cam Handover
function drawTvEoHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const snap = sensor.lockMeter;
  const gap = (1 - snap) * 34;

  const targetX = sensor.candidate ? cx + sensor.candidate.proj.centerDx * snap : cx;
  const targetY = sensor.candidate ? cy + sensor.candidate.proj.centerDy * snap : cy;

  ctx.save();
  ctx.lineWidth = (faders.strokeWidth ?? 1.75) + 1.5;
  ctx.strokeStyle = '#0f172a';
  drawCornerBrackets(ctx, targetX, targetY, boxR * 0.65 + gap, boxR * 0.65 + gap, 18);
  ctx.lineWidth = faders.strokeWidth ?? 1.75;
  ctx.strokeStyle = snap >= 1 ? locked : '#f8fafc';
  drawCornerBrackets(ctx, targetX, targetY, boxR * 0.65 + gap, boxR * 0.65 + gap, 18);

  ctx.beginPath();
  ctx.moveTo(targetX - boxR - gap, targetY);
  ctx.lineTo(targetX - 10, targetY);
  ctx.moveTo(targetX + 10, targetY);
  ctx.lineTo(targetX + boxR + gap, targetY);
  ctx.moveTo(targetX, targetY - boxR - gap);
  ctx.lineTo(targetX, targetY - 10);
  ctx.moveTo(targetX, targetY + 10);
  ctx.lineTo(targetX, targetY + boxR + gap);
  ctx.stroke();

  const contrastVal = sensor.candidate ? sensor.candidate.signatures.contrast.toFixed(2) : '0.12';
  ctx.fillStyle = snap >= 1 ? locked : primary;
  ctx.fillText(`EO CONTRAST: ${contrastVal} / MIN ${(faders.contrastThreshold ?? 0.35).toFixed(2)}`, cx - boxR, cy + boxR + 22);
  ctx.restore();
}

// 4. B-01: Uncaged IR Seeker (Growl & Flare Pull)
function drawIrSeekerHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;

  ctx.beginPath();
  ctx.moveTo(cx - 12, cy);
  ctx.lineTo(cx + 12, cy);
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx, cy + 12);
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(148,163,184,0.45)';
  ctx.beginPath();
  ctx.arc(cx, cy, boxR * 1.45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const sx = cx + sensor.seekerPosPx.x;
  const sy = cy + sensor.seekerPosPx.y;
  const seekerR = 28 * scale;
  ctx.save();
  ctx.strokeStyle =
    sensor.phase === 'FLARE_SEDUCED'
      ? warning
      : sensor.phase === 'LOCK'
      ? locked
      : primary;
  ctx.lineWidth = (faders.strokeWidth ?? 1.75) * 1.25;
  ctx.beginPath();
  ctx.arc(sx, sy, seekerR, 0, Math.PI * 2);
  ctx.stroke();

  if (sensor.phase === 'LOCK') {
    drawDiamond(ctx, sx, sy, seekerR * 1.25);
  }

  const freqHz =
    sensor.phase === 'LOCK'
      ? faders.chirpLockHz ?? 920
      : (faders.growlBaseHz ?? 140) + Math.round(sensor.lockMeter * 340);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(
    `${sensor.caged ? 'CAGED' : 'UNCAGED'} // ${freqHz}HZ`,
    sx - 46,
    sy + seekerR + 16
  );
  ctx.restore();
}

// 5. B-02: Javelin IIR CLU (Track Gates & Top Attack)
function drawIirCluHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const topAttack = (faders.attackProfile ?? 1) >= 0.5;
  const aspectW = faders.gateWidthRatio ?? 1.2;

  const lamps = [
    { label: 'DAY', active: faders.look === 'raw' },
    { label: 'WFOV', active: faders.zoom < 2.0 },
    { label: 'NFOV', active: faders.zoom >= 2.0 },
    { label: 'SEEK', active: sensor.lockMeter > 0.2 },
    { label: 'TOP', active: topAttack },
    { label: 'DIR', active: !topAttack },
    { label: 'BCU', active: true }
  ];

  ctx.save();
  const startX = cx - (lamps.length * 54) / 2;
  lamps.forEach((lamp, i) => {
    const lx = startX + i * 54;
    const ly = h - 38;
    ctx.strokeStyle = lamp.active ? locked : 'rgba(148,163,184,0.3)';
    ctx.fillStyle = lamp.active ? locked : 'rgba(148,163,184,0.35)';
    ctx.strokeRect(lx, ly, 46, 20);
    ctx.fillText(lamp.label, lx + 8, ly + 10);
  });

  const snap = sensor.lockMeter;
  const gx = sensor.candidate ? cx + sensor.candidate.proj.centerDx * snap : cx;
  const gy = sensor.candidate ? cy + sensor.candidate.proj.centerDy * snap : cy;
  const gw = boxR * aspectW * (1 - snap * 0.45);
  const gh = boxR * (1 - snap * 0.45);

  ctx.strokeStyle = snap >= 1 ? locked : primary;
  drawCornerBrackets(ctx, gx, gy, gw, gh, 18);

  if (snap >= 1) {
    ctx.beginPath();
    ctx.moveTo(gx - gw * 1.4, gy);
    ctx.lineTo(gx + gw * 1.4, gy);
    ctx.moveTo(gx, gy - gh * 1.4);
    ctx.lineTo(gx, gy + gh * 1.4);
    ctx.stroke();
  }

  if (topAttack) {
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy + boxR * 1.4);
    ctx.quadraticCurveTo(cx, gy - 110, gx, gy);
    ctx.stroke();
  }
  ctx.restore();
}

// 6. B-03: Laser Spot Tracker & Designator
function drawLaserSpotHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const loal = (faders.loalMode ?? 1) >= 0.5;
  const basketR = boxR * ((faders.basketSizeDeg ?? 10) / 10);

  ctx.save();
  if (loal) {
    ctx.setLineDash([8, 4]);
  }
  ctx.strokeRect(cx - basketR, cy - basketR, basketR * 2, basketR * 2);
  ctx.setLineDash([]);

  if (sensor.candidate && !sensor.candidate.masked) {
    const tx = sensor.candidate.proj.screenX;
    const ty = sensor.candidate.proj.screenY;
    const matched = sensor.prfCodeMatched;
    ctx.strokeStyle = matched ? locked : warning;
    drawDiamond(ctx, tx, ty, 18 * scale);
    ctx.beginPath();
    ctx.moveTo(tx - 12, ty - 12);
    ctx.lineTo(tx + 12, ty + 12);
    ctx.moveTo(tx + 12, ty - 12);
    ctx.lineTo(tx - 12, ty + 12);
    ctx.stroke();

    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(
      `SPOT ${sensor.candidate.signatures.prfCode} ${matched ? '[MATCH]' : '[MISMATCH]'}`,
      tx + 22,
      ty + 14
    );
  }

  ctx.fillStyle = primary;
  ctx.fillText(
    `PRF CODE: ${faders.prfCode ?? 1688} // MODE: ${loal ? 'LOAL (LOCK AFTER LAUNCH)' : 'LOBL'}`,
    cx - basketR,
    cy + basketR + 20
  );
  ctx.restore();
}

// 7. B-04: Active Radar Homing (Fox-3 Pitbull Handover)
function drawRadarActiveHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const activeRound = sensor.activeRound;
  const isPitbull = activeRound?.active && activeRound.isPitbull;

  ctx.beginPath();
  ctx.arc(cx, cy, boxR * 1.15, 0, Math.PI * 2);
  ctx.stroke();

  if (sensor.candidate && sensor.candidate.proj.inFront) {
    const tx = sensor.candidate.proj.screenX;
    const ty = sensor.candidate.proj.screenY;
    ctx.save();
    ctx.strokeStyle = isPitbull ? locked : sensor.phase === 'LOCK' ? locked : primary;
    if (sensor.phase === 'LOCK') {
      drawDiamond(ctx, tx, ty, 22 * scale);
    } else {
      ctx.strokeRect(tx - 18, ty - 18, 36, 36);
    }

    if (activeRound?.active) {
      ctx.setLineDash(isPitbull ? [] : [6, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const tta = activeRound?.active
      ? Math.max(0, activeRound.pitbullTime - activeRound.age).toFixed(1)
      : (faders.pitbullTimeSec ?? 4.0).toFixed(1);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(
      isPitbull ? 'PITBULL ACTIVE [TURN COLD SAFE]' : `ACT T-${tta}S`,
      tx - 40,
      ty + 32
    );
    ctx.restore();
  }
}

// 8. B-05: Semi-Active Radar CW Illumination (Fox-1 Nag)
function drawRadarSemiActiveHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const rings = Math.round(faders.cwPulseRings ?? 4);
  const floodR = boxR * ((faders.floodConeDeg ?? 11) / 10);

  ctx.save();
  for (let i = 1; i <= rings; i++) {
    const r = (floodR / rings) * i;
    ctx.strokeStyle = i === rings ? primary : hexToRgba(primary, 0.35);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (sensor.candidate && sensor.candidate.proj.inFront) {
    const distRatio = sensor.candidate.proj.pixelDist / Math.max(1, floodR);
    const snr = Math.max(0, 1 - Math.pow(distRatio, faders.snrDropoffExp ?? 2.0));
    const nag = distRatio > (faders.nagThreshold ?? 0.65);

    ctx.fillStyle = nag ? warning : locked;
    ctx.fillText(`CW SNR ${(snr * 100).toFixed(0)}%`, cx - floodR, cy + floodR + 20);

    if (nag) {
      ctx.strokeStyle = warning;
      ctx.lineWidth = (faders.strokeWidth ?? 1.75) * 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sensor.candidate.proj.screenX, sensor.candidate.proj.screenY);
      ctx.stroke();
      ctx.fillText('! HOLD CW FLOOD ON TARGET !', cx - 82, cy - floodR - 16);
    }
  }
  ctx.restore();
}

// 9. B-06: GNSS/INS Coordinate Bombing (CEP & LAR)
function drawCoordsHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor } = frame;
  const spi = sensor.spiProj;
  const cepPx = Math.max(12, sensor.effectiveCepMeters * 1.4);

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.beginPath();
  ctx.moveTo(spi.screenX, 60);
  ctx.lineTo(spi.screenX, cy + boxR * 1.6);
  ctx.stroke();

  ctx.strokeStyle = sensor.gpsAlignment > 0.8 ? locked : warning;
  ctx.beginPath();
  ctx.ellipse(spi.screenX, spi.screenY, cepPx * 1.5, cepPx * 0.65, 0, 0, Math.PI * 2);
  ctx.stroke();

  drawDiamond(ctx, spi.screenX, spi.screenY, 10);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(
    `SPI CEP ±${sensor.effectiveCepMeters}M // GPS ${(sensor.gpsAlignment * 100).toFixed(0)}%`,
    spi.screenX - 65,
    spi.screenY + cepPx * 0.65 + 16
  );
  ctx.restore();
}

// 10. C-01: Mechanical Sweep B-Scope FCR
function drawFcrScanHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const maxAz = faders.scanAzimuthDeg ?? 30;
  const sweepX = cx + (sensor.sweepAzDeg / maxAz) * boxR * 1.4;

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.beginPath();
  ctx.moveTo(cx - boxR * 1.4, cy - boxR - 14);
  ctx.lineTo(cx + boxR * 1.4, cy - boxR - 14);
  ctx.stroke();

  ctx.fillStyle = locked;
  ctx.fillRect(sweepX - 4, cy - boxR - 19, 8, 10);
  ctx.fillText(`BAR ${sensor.currentBar}/${faders.elevationBars ?? 2}B`, cx - boxR * 1.4, cy - boxR - 26);

  drawCornerBrackets(ctx, cx, cy, boxR, boxR, 14);
  ctx.restore();
}

// 11. C-02: AESA Agile Multi-Track Radar
function drawAesaHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const maxTracks = Math.round(faders.maxSimultaneousTracks ?? 4);
  const showBeams = (faders.showAgileBeams ?? 1) >= 0.5;

  ctx.save();
  drawCornerBrackets(ctx, cx, cy, boxR * 1.2, boxR * 1.0, 16);

  sensor.priorityTracks.slice(0, maxTracks).forEach((t, idx) => {
    const tx = t.proj.screenX;
    const ty = t.proj.screenY;
    const isPrimary = idx === 0;

    if (showBeams) {
      ctx.strokeStyle = isPrimary ? hexToRgba(locked, 0.35) : hexToRgba(primary, 0.2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }

    ctx.strokeStyle = isPrimary ? locked : primary;
    ctx.fillStyle = ctx.strokeStyle;
    drawDiamond(ctx, tx, ty, isPrimary ? 18 : 13);
    ctx.fillText(`#${idx + 1} ${Math.round(t.closureRateMs)}M/S`, tx - 24, ty - 20);
  });
  ctx.restore();
}

// 12. C-03: Passive IRST (Angle-Only & Kinematic Range)
function drawIrstHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, boxR * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  if (sensor.candidate && sensor.candidate.proj.inFront) {
    const tx = sensor.candidate.proj.screenX;
    const ty = sensor.candidate.proj.screenY;
    const uncHeight = Math.max(8, (1 - sensor.irstIntegration) * 95);

    ctx.strokeStyle = sensor.irstIntegration > 0.8 ? locked : primary;
    ctx.beginPath();
    ctx.moveTo(tx - 18, ty);
    ctx.lineTo(tx + 18, ty);
    ctx.moveTo(tx, ty - uncHeight);
    ctx.lineTo(tx, ty + uncHeight);
    ctx.moveTo(tx - 8, ty - uncHeight);
    ctx.lineTo(tx + 8, ty - uncHeight);
    ctx.moveTo(tx - 8, ty + uncHeight);
    ctx.lineTo(tx + 8, ty + uncHeight);
    ctx.stroke();
  }

  if ((faders.showBaselineArc ?? 1) >= 0.5) {
    ctx.fillStyle = primary;
    ctx.fillText(
      `EMCON SILENT // PARALLAX SOLVE ${(sensor.irstIntegration * 100).toFixed(0)}% (±${sensor.irstRangeUncertaintyM}M)`,
      cx - boxR * 1.1,
      cy + boxR + 22
    );
  }
  ctx.restore();
}

// 13. C-04: Slewable Targeting Pod Ball (Litening / Sniper / TADS)
function drawTgpMtsHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning) {
  const { sensor, platform, faders } = frame;
  const isPoint = (faders.pointAreaMode ?? 1) >= 0.5;
  const offsetPx = faders.offsetCursorPx ?? 0;

  ctx.save();
  const gx = cx + offsetPx;
  const gy = cy;

  const yx = 68;
  const yy = 92;
  ctx.strokeStyle = primary;
  ctx.beginPath();
  ctx.arc(yx, yy, 26, 0, Math.PI * 2);
  ctx.stroke();
  const lookX = yx + (platform.relYawDeg / (faders.gimbalLimitDeg ?? 55)) * 24;
  const lookY = yy - (platform.relPitchDeg / (faders.gimbalLimitDeg ?? 55)) * 24;
  drawDiamond(ctx, lookX, lookY, 5);
  ctx.fillText('GIMBAL', yx - 20, yy + 38);

  const gateR = boxR * 0.55;
  ctx.strokeStyle = sensor.phase === 'LOCK' ? locked : primary;
  if (isPoint && sensor.phase === 'LOCK') {
    ctx.strokeRect(gx - gateR, gy - gateR, gateR * 2, gateR * 2);
  } else {
    drawCornerBrackets(ctx, gx, gy, gateR, gateR, 14);
  }

  ctx.beginPath();
  ctx.moveTo(gx - boxR * 1.5, gy);
  ctx.lineTo(gx - gateR - 6, gy);
  ctx.moveTo(gx + gateR + 6, gy);
  ctx.lineTo(gx + boxR * 1.5, gy);
  ctx.moveTo(gx, gy - boxR * 1.5);
  ctx.lineTo(gx, gy - gateR - 6);
  ctx.moveTo(gx, gy + gateR + 6);
  ctx.lineTo(gx, gy + boxR * 1.5);
  ctx.stroke();

  const pol = (faders.polarityMode ?? 0) >= 0.5 ? 'BHOT' : 'WHOT';
  const trk = isPoint ? 'POINT' : 'AREA';
  const rng = sensor.candidate ? Math.round(sensor.candidate.distance) : 2450;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fillText(`${pol} // ${trk} TRK // LSR 1688 // ${rng}M`, cx - boxR, cy + boxR + 22);
  ctx.restore();
}

// 14. C-05: Radar Warning Receiver & Launch Strobe
function drawRwrHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, faders, world } = frame;
  const showRing = (faders.showHudThreatRing ?? 1) >= 0.5;
  if (!showRing) return;

  const r = boxR * 1.35;
  ctx.save();
  ctx.strokeStyle = primary;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  for (const c of sensor.projectedContacts) {
    if (c.signatures.emitting <= 0.1) continue;
    const bearingRad = Math.atan2(c.proj.centerDx, -c.proj.centerDy);
    const ex = cx + Math.sin(bearingRad) * r;
    const ey = cy - Math.cos(bearingRad) * r;
    const isSpiking = c.distance < 1900 && !c.masked;

    ctx.strokeStyle = isSpiking ? warning : locked;
    ctx.fillStyle = ctx.strokeStyle;
    if (isSpiking) {
      drawDiamond(ctx, ex, ey, 14);
      if (Math.sin(world.time * (faders.strobeBlinkHz ?? 7) * Math.PI * 2) > 0) {
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.fillText(c.rwrCode || 'U', ex - 7, ey);
  }
  ctx.restore();
}

// 15. D-01: Tank Fire Control System ("Lase Then Lead" & Ballistic Stadia)
function drawTankFcsHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const ammoLabel = (faders.ammoTypeHeat ?? 0) >= 0.5 ? 'HEAT-MP' : 'APFSDS-T';
  const lased = sensor.lasedRangeM || (sensor.candidate ? Math.round(sensor.candidate.distance) : 1500);

  ctx.save();
  ctx.strokeStyle = hexToRgba(warning, 0.45);
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();

  const bx = cx - sensor.leadOffsetPx.x * 0.45;
  const by = cy - sensor.dropOffsetPx;

  ctx.strokeStyle = sensor.phase === 'LOCK' ? locked : primary;
  ctx.beginPath();
  ctx.moveTo(bx - 16, by + 12);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + 16, by + 12);
  ctx.moveTo(bx - boxR, by);
  ctx.lineTo(bx - 22, by);
  ctx.moveTo(bx + 22, by);
  ctx.lineTo(bx + boxR, by);
  ctx.stroke();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = warning;
  ctx.fillRect(cx - 82, cy + boxR + 18, 164, 26);
  ctx.strokeRect(cx - 82, cy + boxR + 18, 164, 26);
  ctx.fillStyle = warning;
  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.fillText(`${String(lased).padStart(4, '0')} M  ${ammoLabel}`, cx - 68, cy + boxR + 31);
  ctx.restore();
}

// 16. D-02: CCIP / CCRP Bombing Pipper & Fall Line
function drawCcipCcrpHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  const isCcrp = (faders.deliveryModeCcrp ?? 0) >= 0.5;
  const windCant = (faders.windDriftKnots ?? 6) * 1.4;
  const strokeW = faders.strokeWidth ?? 1.75;

  ctx.save();
  const fpmX = cx;
  const fpmY = cy - 42;
  ctx.beginPath();
  ctx.arc(fpmX, fpmY, 9, 0, Math.PI * 2);
  ctx.moveTo(fpmX - 20, fpmY);
  ctx.lineTo(fpmX - 9, fpmY);
  ctx.moveTo(fpmX + 9, fpmY);
  ctx.lineTo(fpmX + 20, fpmY);
  ctx.moveTo(fpmX, fpmY - 9);
  ctx.lineTo(fpmX, fpmY - 17);
  ctx.stroke();

  const pipperX = cx + windCant;
  const pipperY = cy + ((faders.diveAngleDeg ?? 20) / 45) * 130;
  ctx.beginPath();
  ctx.moveTo(fpmX, fpmY + 9);
  ctx.lineTo(pipperX, pipperY);
  ctx.stroke();

  ctx.strokeStyle = sensor.phase === 'LOCK' ? locked : primary;
  ctx.beginPath();
  ctx.arc(pipperX, pipperY, 16 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pipperX, pipperY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  if (isCcrp) {
    const cueY = fpmY + (1 - sensor.lockMeter) * 90;
    ctx.strokeStyle = locked;
    ctx.lineWidth = strokeW * 1.4;
    ctx.beginPath();
    ctx.moveTo(fpmX - 24, cueY);
    ctx.lineTo(fpmX + 24, cueY);
    ctx.stroke();
  }

  if (sensor.candidate && sensor.candidate.distance < (faders.fragSafeAltM ?? 550)) {
    ctx.strokeStyle = warning;
    ctx.lineWidth = strokeW * 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 65, cy - 65);
    ctx.lineTo(cx + 65, cy + 65);
    ctx.moveTo(cx + 65, cy - 65);
    ctx.lineTo(cx - 65, cy + 65);
    ctx.stroke();
  }
  ctx.restore();
}

// 17. D-03: EEGS Gun Funnel & Lead-Computing Pipper
function drawAirGunHud(ctx, cx, cy, boxR, scale, frame, primary, locked, warning) {
  const { sensor, platform, faders } = frame;
  const span = faders.targetWingspanM ?? 14;
  const stiffness = faders.funnelLagStiffness ?? 6.0;
  const whipX = (-platform.slewVelocityDegSec.yaw * 14) / stiffness;
  const whipY = (platform.slewVelocityDegSec.pitch * 14) / stiffness;

  ctx.save();
  const nodes = [0.25, 0.5, 0.85, 1.25];
  const leftPts = [];
  const rightPts = [];

  nodes.forEach((t, idx) => {
    const ny = cy - 30 + idx * 42 + whipY * t;
    const nx = cx + whipX * t * t + sensor.leadOffsetPx.x * t * 0.5;
    const halfW = Math.max(8, (span * 3.2) / (t * 2.2));
    leftPts.push({ x: nx - halfW, y: ny });
    rightPts.push({ x: nx + halfW, y: ny });
  });

  ctx.strokeStyle = primary;
  ctx.beginPath();
  leftPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  ctx.beginPath();
  rightPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  const px = cx + sensor.leadOffsetPx.x * 0.55;
  const py = cy + sensor.leadOffsetPx.y * 0.55 + sensor.dropOffsetPx * 0.5;
  ctx.strokeStyle = sensor.phase === 'LOCK' ? locked : primary;
  ctx.beginPath();
  ctx.arc(px, py, 20 * scale, 0, Math.PI * 2);
  ctx.stroke();

  if ((faders.showBatrDot ?? 1) >= 0.5) {
    ctx.strokeStyle = warning;
    ctx.beginPath();
    ctx.arc(px - whipX * 0.4, py + 12, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 18. E-01: Ace Combat Two-Colour Arcade Lock
function drawArcadeLockHud(ctx, cx, cy, boxR, scale, frame, primary, locked) {
  const { sensor, faders } = frame;
  const isLocked = sensor.phase === 'LOCK';
  const color = isLocked ? locked : primary;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  drawCornerBrackets(ctx, cx, cy, boxR, boxR, 20);

  if (sensor.candidate && sensor.candidate.proj.inFront) {
    const tx = sensor.candidate.proj.screenX;
    const ty = sensor.candidate.proj.screenY;
    const rotRad = (((faders.diamondSpinDeg ?? 90) * sensor.lockMeter) * Math.PI) / 180;
    const r = (36 - sensor.lockMeter * 16) * scale;

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(rotRad);
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();

    if (isLocked) {
      ctx.font = '800 14px "JetBrains Mono", monospace';
      ctx.fillText('[ SHOOT ]', tx - 38, ty - 28);
    }

    if ((faders.leadRingAssist ?? 1) >= 0.5) {
      ctx.beginPath();
      ctx.arc(tx + sensor.leadOffsetPx.x * 0.5, ty + sensor.leadOffsetPx.y * 0.5, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// 19. E-02: VTOL VR Helmet-Mounted Sight & Dual MFDs
function drawVtolVrHud(ctx, cx, cy, boxR, scale, w, h, frame, primary, locked, warning) {
  const { sensor, platform, faders } = frame;
  const offBoresight = Math.hypot(platform.relYawDeg, platform.relPitchDeg);
  const monocleR = (faders.monocleRingRadius ?? 85) * scale;

  ctx.save();
  ctx.strokeStyle = sensor.phase === 'LOCK' ? locked : primary;
  ctx.beginPath();
  ctx.arc(cx, cy, monocleR, 0, Math.PI * 2);
  ctx.stroke();

  if (offBoresight > 4) {
    const noseX = cx - platform.relYawDeg * 7;
    const noseY = cy + platform.relPitchDeg * 7;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(noseX, noseY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(`HOBS ${offBoresight.toFixed(0)}°`, cx - 28, cy + monocleR + 16);
  }

  const mfdSize = 180 * (faders.mfdScale ?? 1.0);
  drawBScopePanel(ctx, { x: 18, y: h - mfdSize - 18, w: mfdSize, h: mfdSize }, frame, primary, locked, warning);
  ctx.restore();
}

// ============================================================================
// CROSS-CUTTING STUDIES (§5): LOSS LEGIBILITY, SHOOT LADDER, INSET BEZEL
// ============================================================================

function drawLossAndGraceStudy(ctx, cx, cy, boxR, frame, warning, reducedMotion) {
  const { sensor, faders } = frame;
  const strokeW = faders.strokeWidth ?? 1.75;
  if (sensor.phase === 'SIGHT_GRACE') {
    const pct = sensor.graceRemainingSec / Math.max(0.1, sensor.maxGraceSec);
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = strokeW * 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, boxR + 10, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`SIGHT GRACE HOLD ${(sensor.graceRemainingSec * 1000).toFixed(0)}MS`, cx - 72, cy - boxR - 18);
    ctx.restore();
  } else if (sensor.phase === 'LOSS') {
    const gx = sensor.lastLockedScreenPos.x || cx;
    const gy = sensor.lastLockedScreenPos.y || cy;
    ctx.save();
    ctx.strokeStyle = warning;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(gx - 22, gy - 22, 44, 44);
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(gx, gy);
    ctx.stroke();

    ctx.fillStyle = warning;
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(
      reducedMotion ? `[WORD FALLBACK] ${sensor.lossReason}` : `▲ ${sensor.lossReason}`,
      gx - 55,
      gy - 28
    );
    ctx.restore();
  }
}

function drawShootCueLadder(ctx, cx, cy, boxR, frame, primary, locked, warning) {
  const { sensor } = frame;
  const lx = cx + boxR + 34;
  const topY = cy - 75;
  const botY = cy + 75;
  const h = botY - topY;

  ctx.save();
  ctx.strokeStyle = primary;
  ctx.beginPath();
  ctx.moveTo(lx, topY);
  ctx.lineTo(lx, botY);
  ctx.moveTo(lx - 8, topY);
  ctx.lineTo(lx + 8, topY);
  const rneY = botY - ((sensor.rneRange - sensor.minRange) / Math.max(100, sensor.maxRange - sensor.minRange)) * h;
  ctx.moveTo(lx - 10, rneY);
  ctx.lineTo(lx + 6, rneY);
  ctx.moveTo(lx - 8, botY);
  ctx.lineTo(lx + 8, botY);
  ctx.stroke();

  ctx.fillStyle = 'rgba(148,163,184,0.8)';
  ctx.font = '500 9px "JetBrains Mono", monospace';
  ctx.fillText(`MAX ${(sensor.maxRange / 1000).toFixed(1)}K`, lx + 12, topY);
  ctx.fillText('RNE', lx + 12, rneY);
  ctx.fillText(`MIN ${sensor.minRange}M`, lx + 12, botY);

  if (sensor.candidate) {
    const clampedFrac = Math.min(1.1, Math.max(0, sensor.rangeFraction));
    const caretY = botY - clampedFrac * h;
    const cueColor =
      sensor.shootCue.includes('TOO CLOSE') || sensor.shootCue.includes('NOT YET')
        ? warning
        : sensor.phase === 'LOCK'
        ? locked
        : primary;
    ctx.fillStyle = cueColor;
    ctx.strokeStyle = cueColor;
    ctx.beginPath();
    ctx.moveTo(lx - 2, caretY);
    ctx.lineTo(lx - 10, caretY - 5);
    ctx.lineTo(lx - 10, caretY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.fillText(sensor.shootCue, lx + 12, caretY);
  }
  ctx.restore();
}

function drawInsetBezelAndContent(ctx, rect, frame, primary, locked, warning) {
  const { specimen, sensor, faders } = frame;
  const strokeW = faders.strokeWidth ?? 1.75;

  if (specimen.insetMode === 'b-scope') {
    drawBScopePanel(ctx, rect, frame, primary, locked, warning);
    return;
  }
  if (specimen.insetMode === 'aesa-hsd') {
    drawAesaHsdPanel(ctx, rect, frame, primary, locked, warning);
    return;
  }
  if (specimen.insetMode === 'rwr-azimuth') {
    drawRwrScopePanel(ctx, rect, frame, primary, locked, warning);
    return;
  }

  ctx.save();
  ctx.strokeStyle = sensor.phase === 'LOCK' ? locked : primary;
  ctx.lineWidth = Math.max(0.65, strokeW * 1.1);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  const icx = rect.x + rect.w * 0.5;
  const icy = rect.y + rect.h * 0.5;
  ctx.lineWidth = Math.max(0.55, strokeW * 0.75);
  ctx.beginPath();
  ctx.moveTo(icx - 24, icy);
  ctx.lineTo(icx + 24, icy);
  ctx.moveTo(icx, icy - 24);
  ctx.lineTo(icx, icy + 24);
  ctx.stroke();

  if (specimen.insetMode === 'missile-cam' && (faders.datalinkNoise ?? 0.25) > 0.05) {
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let i = 0; i < 28; i++) {
      const nx = rect.x + Math.random() * rect.w;
      const ny = rect.y + Math.random() * rect.h;
      ctx.fillRect(nx, ny, 8, 1.5);
    }
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, 18);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.font = '600 10px "JetBrains Mono", monospace';
  const modeTitle =
    specimen.insetMode === 'missile-cam' && sensor.activeRound?.active
      ? 'WPN NOSE VIDEO (LIVE)'
      : specimen.insetMode === 'top-down-lar'
      ? 'SAT / LAR FOOTPRINT'
      : `OPTICAL INSET ${(faders.insetZoom ?? 5.0).toFixed(1)}X`;
  ctx.fillText(modeTitle, rect.x + 8, rect.y + 11);
  ctx.restore();
}

function drawBScopePanel(ctx, rect, frame, primary, locked, warning) {
  const { sensor, faders } = frame;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 14, 10, 0.92)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = primary;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
  for (let i = 1; i <= 3; i++) {
    const gy = rect.y + (rect.h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(rect.x, gy);
    ctx.lineTo(rect.x + rect.w, gy);
    ctx.stroke();
  }

  const maxAz = faders.scanAzimuthDeg ?? 30;
  const sweepX = rect.x + ((sensor.sweepAzDeg + maxAz) / (maxAz * 2)) * rect.w;
  ctx.strokeStyle = locked;
  ctx.beginPath();
  ctx.moveTo(sweepX, rect.y + 18);
  ctx.lineTo(sweepX, rect.y + rect.h);
  ctx.stroke();

  for (const b of sensor.bScopeBricks) {
    const bx = rect.x + ((b.azDeg + 60) / 120) * rect.w;
    const by = rect.y + rect.h - Math.min(1, b.distance / 3000) * (rect.h - 24);
    ctx.fillStyle = b.coasting ? warning : locked;
    ctx.fillRect(bx - 5, by - 3, 10, 6);
    if (sensor.candidate?.id === b.id) {
      ctx.strokeStyle = locked;
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = primary;
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.fillText(`FCR B-SCOPE ±${maxAz}° ${sensor.currentBar}B`, rect.x + 8, rect.y + 12);
  ctx.restore();
}

function drawAesaHsdPanel(ctx, rect, frame, primary, locked) {
  const { sensor, faders } = frame;
  ctx.save();
  ctx.fillStyle = 'rgba(6, 14, 24, 0.92)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = primary;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  const ox = rect.x + rect.w * 0.5;
  const oy = rect.y + rect.h - 18;
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(rect.x + 14, rect.y + 24);
  ctx.lineTo(rect.x + rect.w - 14, rect.y + 24);
  ctx.closePath();
  ctx.stroke();

  sensor.priorityTracks.slice(0, faders.maxSimultaneousTracks ?? 4).forEach((t, idx) => {
    const tx = ox + (t.proj.azDeg / 60) * (rect.w * 0.45);
    const ty = oy - Math.min(1, t.distance / 2800) * (rect.h - 42);
    ctx.strokeStyle = idx === 0 ? locked : primary;
    drawDiamond(ctx, tx, ty, 6);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(`${idx + 1}`, tx + 8, ty);
  });

  ctx.fillStyle = primary;
  ctx.fillText(`AESA SITUATION (${faders.beamUpdateHz ?? 30}HZ)`, rect.x + 8, rect.y + 12);
  ctx.restore();
}

function drawRwrScopePanel(ctx, rect, frame, primary, locked, warning) {
  const { sensor } = frame;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 14, 10, 0.94)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = primary;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  const rx = rect.x + rect.w * 0.5;
  const ry = rect.y + rect.h * 0.5 + 6;
  const outerR = rect.w * 0.4;
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
  ctx.beginPath();
  ctx.arc(rx, ry, outerR, 0, Math.PI * 2);
  ctx.arc(rx, ry, outerR * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  for (const c of sensor.projectedContacts) {
    if (c.signatures.emitting <= 0.1) continue;
    const azRad = (c.proj.azDeg * Math.PI) / 180;
    const dFrac = Math.min(0.95, Math.max(0.25, c.distance / 2400));
    const ex = rx + Math.sin(azRad) * outerR * dFrac;
    const ey = ry - Math.cos(azRad) * outerR * dFrac;
    const isLethal = c.distance < 1800 && !c.masked;
    ctx.strokeStyle = isLethal ? warning : locked;
    ctx.fillStyle = ctx.strokeStyle;
    if (isLethal) drawDiamond(ctx, ex, ey, 11);
    ctx.fillText(c.rwrCode || 'U', ex - 6, ey);
  }

  ctx.fillStyle = primary;
  ctx.fillText('ALR-56 RWR SCOPE', rect.x + 8, rect.y + 12);
  ctx.restore();
}

function drawGimbalTape(ctx, cx, y, platform, faders, primary, warning) {
  const w = 240;
  const limit = faders.gimbalLimitDeg ?? 45;
  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.4)';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, y);
  ctx.lineTo(cx + w / 2, y);
  ctx.stroke();

  const caretX = cx + (platform.relYawDeg / Math.max(10, limit)) * (w / 2);
  ctx.fillStyle = platform.atGimbalLimit ? warning : primary;
  ctx.fillRect(caretX - 3, y - 5, 6, 10);
  ctx.restore();
}
