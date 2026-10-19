/**
 * hudlab — Layer 1: World (§3 of hudlab-brief.md)
 * Owns terrain heightfield, sky parameters, scripted contacts with signature numbers
 * (heat, size, contrast, emitting, prfCode), flare/chaff decoys, and launched rounds.
 * RULE: Truth; never reads a HUD.
 */

export const CONTACT_TEMPLATES = [
  {
    id: 'c1',
    callsign: 'BANDIT-1',
    type: 'jet',
    label: 'SU-33 FLANKER',
    rwrCode: '29',
    wingspanM: 14.7,
    baseAlt: 185,
    orbitRadius: 950,
    orbitSpeed: 0.36,
    phaseOffset: 0.0,
    signatures: { heat: 0.92, size: 0.78, contrast: 0.85, emitting: 1.0, prfCode: 1688 }
  },
  {
    id: 'c2',
    callsign: 'VIPER-2',
    type: 'helicopter',
    label: 'KA-52 HOKUM',
    rwrCode: 'H5',
    wingspanM: 14.4,
    baseAlt: 68,
    orbitRadius: 680,
    orbitSpeed: 0.24,
    phaseOffset: 1.1,
    signatures: { heat: 0.74, size: 0.65, contrast: 0.72, emitting: 0.6, prfCode: 1688 }
  },
  {
    id: 'c3',
    callsign: 'ARMOR-3',
    type: 'armor',
    label: 'T-90M MBT',
    rwrCode: 'G1',
    wingspanM: 6.8,
    baseAlt: 0,
    orbitRadius: 560,
    orbitSpeed: 0.14,
    phaseOffset: 2.2,
    signatures: { heat: 0.62, size: 0.55, contrast: 0.68, emitting: 0.0, prfCode: 1688 }
  },
  {
    id: 'c4',
    callsign: 'SAM-4',
    type: 'sam',
    label: 'SA-15 GAUNTLET',
    rwrCode: 'S6',
    wingspanM: 7.5,
    baseAlt: 0,
    orbitRadius: 790,
    orbitSpeed: 0.1,
    phaseOffset: 3.4,
    signatures: { heat: 0.58, size: 0.6, contrast: 0.78, emitting: 0.95, prfCode: 1511 }
  },
  {
    id: 'c5',
    callsign: 'STRIKE-5',
    type: 'jet',
    label: 'MIG-31 FOXHOUND',
    rwrCode: '31',
    wingspanM: 13.4,
    baseAlt: 290,
    orbitRadius: 1350,
    orbitSpeed: 0.48,
    phaseOffset: 4.5,
    signatures: { heat: 0.98, size: 0.85, contrast: 0.9, emitting: 0.9, prfCode: 1688 }
  },
  {
    id: 'c6',
    callsign: 'RECON-6',
    type: 'helicopter',
    label: 'ORLAN UAV',
    rwrCode: 'U2',
    wingspanM: 5.2,
    baseAlt: 115,
    orbitRadius: 520,
    orbitSpeed: 0.3,
    phaseOffset: 5.2,
    signatures: { heat: 0.38, size: 0.35, contrast: 0.48, emitting: 0.2, prfCode: 1688 }
  },
  {
    id: 'c7',
    callsign: 'CONVOY-7',
    type: 'armor',
    label: 'BTR-82A IFV',
    rwrCode: 'G2',
    wingspanM: 6.0,
    baseAlt: 0,
    orbitRadius: 640,
    orbitSpeed: 0.18,
    phaseOffset: 0.6,
    signatures: { heat: 0.54, size: 0.5, contrast: 0.6, emitting: 0.0, prfCode: 1688 }
  },
  {
    id: 'c8',
    callsign: 'INTERCEPT-8',
    type: 'jet',
    label: 'SU-57 FELON',
    rwrCode: '57',
    wingspanM: 14.1,
    baseAlt: 240,
    orbitRadius: 1180,
    orbitSpeed: 0.44,
    phaseOffset: 2.8,
    signatures: { heat: 0.76, size: 0.42, contrast: 0.64, emitting: 0.85, prfCode: 1788 }
  }
];

/**
 * Deterministic synthetic terrain height function.
 * Creates ridges, valleys, and rock pillars in front of the observer (negative Z is forward).
 */
export function sampleTerrainHeight(x, z, ridgeScale = 0.65) {
  const s = Math.max(0, ridgeScale);
  // Central valley with flanking mountain ridges and mid-range rock pillars for occlusion tests
  const wave1 = Math.sin(x * 0.0045) * Math.cos(z * 0.0038) * 95;
  const wave2 = Math.sin(x * 0.012 + z * 0.009) * 38;
  const wave3 = Math.cos(x * 0.025 - z * 0.021) * 14;

  // Distinct rock pillars placed along typical crossing corridors (z around -450 to -900)
  const p1 = Math.exp(-((x + 140) ** 2 + (z + 520) ** 2) / 3800) * 125;
  const p2 = Math.exp(-((x - 165) ** 2 + (z + 610) ** 2) / 4200) * 135;
  const p3 = Math.exp(-((x - 15) ** 2 + (z + 740) ** 2) / 3200) * 115;

  const base = (wave1 + wave2 + wave3 + p1 + p2 + p3) * s;
  return Math.max(-18, base);
}

/**
 * Raymarch line-of-sight between observer `from` and target `to` against the terrain heightfield.
 */
export function checkTerrainMasking(from, to, ridgeScale = 0.65, steps = 22) {
  if (ridgeScale <= 0.02) return false;
  for (let i = 2; i < steps - 1; i++) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const z = from.z + (to.z - from.z) * t;
    const groundY = sampleTerrainHeight(x, z, ridgeScale);
    if (groundY > y + 2.5) {
      return true;
    }
  }
  return false;
}

export function createWorld() {
  let time = 0;
  let decoys = [];
  let rounds = [];
  let nextDecoyId = 1;
  let nextRoundId = 1;
  let lastAutoDecoyTime = 0;

  function computeContactPosition(tpl, t, faders) {
    const scenario = faders.scenarioId || 'crossing';
    const speedMult = faders.contactSpeed ?? 1.0;
    const ridgeScale = faders.terrainMasking ?? 0.65;
    const phase = t * tpl.orbitSpeed * speedMult + tpl.phaseOffset;

    let x = 0;
    let z = -700;
    let y = tpl.baseAlt;

    if (scenario === 'crossing') {
      x = Math.sin(phase) * (tpl.orbitRadius * 0.68);
      z = -480 - Math.cos(phase * 0.5) * 280 - (tpl.phaseOffset * 55);
    } else if (scenario === 'pop-up') {
      x = Math.sin(phase * 0.45) * 420 + (tpl.phaseOffset - 2.5) * 90;
      z = -580 - (tpl.phaseOffset * 60);
      const popWave = Math.max(-0.4, Math.sin(t * 1.15 * speedMult + tpl.phaseOffset * 2));
      y = tpl.baseAlt * 0.35 + popWave * 95;
    } else if (scenario === 'masked') {
      // Weave directly behind rock pillars p1, p2, p3
      x = Math.sin(phase * 0.85) * 310;
      z = -560 - Math.cos(phase * 0.42) * 210;
      y = tpl.type === 'armor' || tpl.type === 'sam' ? 0 : 58 + Math.sin(phase * 1.3) * 18;
    } else if (scenario === 'decoy') {
      x = Math.sin(phase * 1.1) * 520;
      z = -460 - Math.sin(phase * 0.55) * 240;
      y = Math.max(60, tpl.baseAlt * 0.8 + Math.cos(phase * 1.4) * 55);
    } else {
      // intercept
      x = Math.sin(phase * 0.6) * 760;
      z = -850 - Math.cos(phase * 0.4) * 480;
      y = Math.max(120, tpl.baseAlt * 1.25 + Math.sin(phase) * 65);
    }

    const groundY = sampleTerrainHeight(x, z, ridgeScale);
    if (tpl.type === 'armor' || tpl.type === 'sam') {
      y = groundY + 4.5;
    } else {
      y = Math.max(groundY + 24, y);
    }

    return { x, y, z, groundY };
  }

  function spawnFlare(contact, count = 2) {
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      decoys.push({
        id: `flare-${nextDecoyId++}`,
        parentId: contact.id,
        type: 'flare',
        position: {
          x: contact.position.x + side * 6,
          y: contact.position.y - 2,
          z: contact.position.z + 4
        },
        velocity: {
          x: contact.velocity.x * 0.35 + side * (28 + Math.random() * 14),
          y: 12 + Math.random() * 10,
          z: contact.velocity.z * 0.35 + (Math.random() - 0.5) * 18
        },
        age: 0,
        maxAge: 3.6,
        signatures: {
          heat: 2.2,
          size: 0.3,
          contrast: 0.95,
          emitting: 0.4
        }
      });
    }
  }

  function launchRound(params) {
    const round = {
      id: `round-${nextRoundId++}`,
      specimenId: params.specimenId || 'stalheart-quiver',
      position: { ...params.origin },
      velocity: { ...params.initialVelocity },
      targetId: params.targetId || null,
      targetCoord: params.targetCoord ? { ...params.targetCoord } : null,
      age: 0,
      maxFlightTime: params.maxFlightTime || 9.0,
      pitbullTime: params.pitbullTime || 4.0,
      isPitbull: false,
      active: true,
      status: 'IN-FLIGHT',
      nudgeOffset: { yaw: 0, pitch: 0 },
      trail: [{ ...params.origin }]
    };
    rounds.push(round);
    return round;
  }

  function nudgeActiveRound(dYaw, dPitch) {
    const active = rounds.find((r) => r.active);
    if (active) {
      active.nudgeOffset.yaw += dYaw;
      active.nudgeOffset.pitch += dPitch;
    }
  }

  function tick(dt, faders, observerPos = { x: 0, y: 120, z: 0 }, aimDir = { x: 0, y: 0, z: -1 }) {
    const safeDt = Math.min(0.1, Math.max(0.001, dt));
    time += safeDt;

    const count = Math.min(CONTACT_TEMPLATES.length, Math.max(1, Math.round(faders.contactCount ?? 5)));
    const ridgeScale = faders.terrainMasking ?? 0.65;

    const contacts = [];
    for (let i = 0; i < count; i++) {
      const tpl = CONTACT_TEMPLATES[i];
      const posNow = computeContactPosition(tpl, time, faders);
      const posPrev = computeContactPosition(tpl, time - 0.05, faders);
      const velocity = {
        x: (posNow.x - posPrev.x) / 0.05,
        y: (posNow.y - posPrev.y) / 0.05,
        z: (posNow.z - posPrev.z) / 0.05
      };

      const dx = posNow.x - observerPos.x;
      const dy = posNow.y - observerPos.y;
      const dz = posNow.z - observerPos.z;
      const distance = Math.hypot(dx, dy, dz);

      // Closure velocity (positive = closing toward observer)
      const losUnit = {
        x: dx / Math.max(1, distance),
        y: dy / Math.max(1, distance),
        z: dz / Math.max(1, distance)
      };
      const closureRateMs = -(
        velocity.x * losUnit.x +
        velocity.y * losUnit.y +
        velocity.z * losUnit.z
      );

      const masked = checkTerrainMasking(observerPos, posNow, ridgeScale);

      contacts.push({
        id: tpl.id,
        callsign: tpl.callsign,
        type: tpl.type,
        label: tpl.label,
        rwrCode: tpl.rwrCode,
        wingspanM: tpl.wingspanM,
        position: posNow,
        velocity,
        distance,
        closureRateMs,
        masked,
        signatures: {
          ...tpl.signatures,
          prfCode: tpl.signatures.prfCode
        }
      });
    }

    // Periodic automatic flare/chaff dispensing based on decoyRate fader
    const decoyRate = faders.decoyRate ?? 0.45;
    if (decoyRate > 0.05 && contacts.length > 0) {
      const interval = Math.max(1.4, 6.2 - decoyRate * 3.4);
      if (time - lastAutoDecoyTime > interval) {
        lastAutoDecoyTime = time;
        const emitter = contacts[Math.floor((time * 3) % contacts.length)];
        if (emitter && !emitter.masked) {
          spawnFlare(emitter, 2);
        }
      }
    }

    // Update decoys
    decoys = decoys.filter((d) => {
      d.age += safeDt;
      d.position.x += d.velocity.x * safeDt;
      d.position.y += d.velocity.y * safeDt;
      d.position.z += d.velocity.z * safeDt;
      d.velocity.y -= 18 * safeDt; // gravity on flare
      d.velocity.x *= 0.97;
      d.velocity.z *= 0.97;
      const fade = Math.max(0, 1 - d.age / d.maxAge);
      d.signatures.heat = 2.4 * fade;
      return d.age < d.maxAge;
    });

    // Update in-flight rounds/missiles
    for (const r of rounds) {
      if (!r.active) continue;
      r.age += safeDt;
      if (r.age >= r.pitbullTime) {
        r.isPitbull = true;
      }

      const speed = 290;
      let targetPoint = null;

      if (r.specimenId === 'saclos') {
        // SACLOS rides the operator's live aim ray + flare wobble
        const distAlongBeam = Math.min(4500, r.age * speed + 90);
        targetPoint = {
          x: observerPos.x + aimDir.x * distAlongBeam,
          y: observerPos.y + aimDir.y * distAlongBeam,
          z: observerPos.z + aimDir.z * distAlongBeam
        };
      } else if (r.targetCoord) {
        targetPoint = r.targetCoord;
      } else if (r.targetId) {
        const tgt = contacts.find((c) => c.id === r.targetId);
        if (tgt) {
          targetPoint = { ...tgt.position };
          // Top-attack loft arc for Javelin IIR CLU
          if (r.specimenId === 'iir-clu' && (faders.attackProfile ?? 1) >= 0.5 && r.age < 2.2) {
            targetPoint.y += 160;
          }
        }
      }

      if (targetPoint) {
        const dx = targetPoint.x - r.position.x;
        const dy = targetPoint.y - r.position.y;
        const dz = targetPoint.z - r.position.z;
        const dist = Math.hypot(dx, dy, dz);

        if (dist < 26) {
          r.active = false;
          r.status = 'IMPACT';
        } else {
          const desired = { x: (dx / dist) * speed, y: (dy / dist) * speed, z: (dz / dist) * speed };
          const turnBlend = Math.min(1, safeDt * 6.5);
          r.velocity.x += (desired.x - r.velocity.x) * turnBlend;
          r.velocity.y += (desired.y - r.velocity.y) * turnBlend;
          r.velocity.z += (desired.z - r.velocity.z) * turnBlend;
        }
      }

      r.position.x += r.velocity.x * safeDt;
      r.position.y += r.velocity.y * safeDt;
      r.position.z += r.velocity.z * safeDt;

      if (r.trail.length === 0 || Math.hypot(
        r.position.x - r.trail[r.trail.length - 1].x,
        r.position.z - r.trail[r.trail.length - 1].z
      ) > 14) {
        r.trail.push({ ...r.position });
        if (r.trail.length > 28) r.trail.shift();
      }

      if (r.age >= r.maxFlightTime && r.active) {
        r.active = false;
        r.status = r.specimenId === 'saclos' ? 'WIRE EXHAUSTED' : 'TIMED OUT';
      }
    }

    // Keep recent finished rounds briefly for impact cue, then prune
    rounds = rounds.filter((r) => r.active || r.age < r.maxFlightTime + 1.8);

    return {
      time,
      contacts,
      decoys,
      rounds,
      ridgeScale
    };
  }

  return {
    tick,
    spawnFlare: (contact) => spawnFlare(contact, 2),
    launchRound,
    nudgeActiveRound,
    sampleTerrainHeight,
    checkTerrainMasking,
    getState: () => ({ time, decoys, rounds })
  };
}
