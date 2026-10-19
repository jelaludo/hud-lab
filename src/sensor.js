/**
 * hudlab — Layer 3: Sensor Domain (§3 of hudlab-brief.md)
 * Pure functions & domain state machine, zero DOM access.
 * Owns FOV projection, gimbal limits, "in the box" test, lock meter, discrete phases,
 * 0.5s sight grace ("a rock edge is not a loss"), slip/drift loss legibility,
 * decoy seduction, B-scope sweep memory, ballistic lead/drop, and shoot cues.
 */

/**
 * Project a 3D world point into camera view space & 2D viewport pixel coordinates.
 * Pure mathematical camera projection matching Three.js PerspectiveCamera.
 */
export function projectWorldPoint(worldPt, platform, viewport, faders) {
  const dx = worldPt.x - platform.position.x;
  const dy = worldPt.y - platform.position.y;
  const dz = worldPt.z - platform.position.z;

  // Rotate world delta into camera space where forward is (0, 0, -1)
  const cosY = Math.cos(platform.worldYaw);
  const sinY = Math.sin(platform.worldYaw);
  const rx = dx * cosY + dz * sinY;
  const rz = -dx * sinY + dz * cosY;

  const cosP = Math.cos(platform.worldPitch);
  const sinP = Math.sin(platform.worldPitch);
  const cy = dy * cosP + rz * sinP;
  const cz = -dy * sinP + rz * cosP;

  // In right-handed camera space, forward is -Z
  const depth = -cz;
  const inFront = depth > 1.0;

  const effectiveFovDeg = (faders.fov ?? 46) / Math.max(0.5, faders.zoom ?? 1.0);
  const fovRad = (effectiveFovDeg * Math.PI) / 180;
  const tanHalfFov = Math.tan(fovRad * 0.5);
  const aspect = viewport.width / Math.max(1, viewport.height);

  const ndcX = inFront ? rx / (depth * tanHalfFov * aspect) : rx * 10;
  const ndcY = inFront ? cy / (depth * tanHalfFov) : cy * 10;

  const screenX = (ndcX * 0.5 + 0.5) * viewport.width;
  const screenY = (-ndcY * 0.5 + 0.5) * viewport.height;

  const centerDx = screenX - viewport.width * 0.5;
  const centerDy = screenY - viewport.height * 0.5;
  const pixelDist = Math.hypot(centerDx, centerDy);

  // Angular offset in degrees from camera boresight
  const angleRad = Math.atan2(Math.hypot(rx, cy), Math.max(1, depth));
  const angleDeg = (angleRad * 180) / Math.PI;

  return {
    inFront,
    depth,
    screenX,
    screenY,
    centerDx,
    centerDy,
    pixelDist,
    angleDeg,
    azDeg: (Math.atan2(rx, Math.max(1, depth)) * 180) / Math.PI,
    elDeg: (Math.atan2(cy, Math.max(1, depth)) * 180) / Math.PI
  };
}

export function createSensor() {
  let trackedContactId = null;
  let lockMeter = 0; // 0..1
  let phase = 'SEARCH'; // SEARCH | DETECT | TRACK | LOCK | SIGHT_GRACE | LOSS | FLARE_SEDUCED
  let graceRemainingSec = 0;
  let lossDriftTimerSec = 0;
  let lossReason = '';
  let lastLockedScreenPos = { x: 0, y: 0 };
  let lastSlipVelocity = { vx: 0, vy: 0 };
  let holdEnabled = true;

  // Uncaged IR seeker offset in screen pixels
  let seekerPosPx = { x: 0, y: 0 };
  let seducedByDecoyId = null;
  let caged = false;

  // Tank FCS / Laser rangefinder memory
  let lasedRangeM = null;
  let laseAgeSec = 0;
  let smoothedLeadPx = { x: 0, y: 0 };

  // B-scope mechanical sweep state (`fcr-scan`)
  let sweepAzDeg = -30;
  let sweepDir = 1;
  let currentBar = 1;
  let bScopeBricks = new Map();

  // IRST passive range triangulation state (`irst`)
  let irstIntegration = 0;

  // Coordinate bombing SPI (`coords`)
  let designatedSpi = { x: 0, y: 0, z: -640 };
  let gpsAlignment = 0.25;

  function resetLock() {
    trackedContactId = null;
    lockMeter = 0;
    phase = 'SEARCH';
    graceRemainingSec = 0;
    lossDriftTimerSec = 0;
    seducedByDecoyId = null;
  }

  function triggerLase(currentTarget) {
    if (currentTarget && !currentTarget.masked) {
      lasedRangeM = Math.round(currentTarget.distance);
      laseAgeSec = 0;
    } else {
      // Lased terrain/sky return
      lasedRangeM = 4200;
      laseAgeSec = 0;
    }
  }

  function toggleCage() {
    caged = !caged;
    if (caged) {
      seducedByDecoyId = null;
    }
    return caged;
  }

  function forceCage(val) {
    caged = Boolean(val);
    if (caged) seducedByDecoyId = null;
  }

  function setHold(on) {
    holdEnabled = Boolean(on);
  }

  function step(dt, worldState, platformState, viewport, faders, specimen) {
    const safeDt = Math.min(0.1, Math.max(0.001, dt));
    const cx = viewport.width * 0.5;
    const cy = viewport.height * 0.5;
    const boxRadiusPx = (faders.boxSizePx ?? 92) * 0.5 * (faders.reticleScale ?? 1.0);

    // 1. Project all contacts & decoys
    const projectedContacts = worldState.contacts.map((c) => {
      const proj = projectWorldPoint(c.position, platformState, viewport, faders);
      const inBox =
        proj.inFront &&
        Math.abs(proj.centerDx) <= boxRadiusPx &&
        Math.abs(proj.centerDy) <= boxRadiusPx;
      return {
        ...c,
        proj,
        inBox
      };
    });

    const projectedDecoys = worldState.decoys.map((d) => {
      const proj = projectWorldPoint(d.position, platformState, viewport, faders);
      return {
        ...d,
        proj
      };
    });

    const projectedRounds = worldState.rounds.map((r) => {
      const proj = projectWorldPoint(r.position, platformState, viewport, faders);
      return {
        ...r,
        proj
      };
    });

    // 2. Update B-Scope mechanical radar sweep (`fcr-scan` / `vtol-vr`)
    const maxAz = faders.scanAzimuthDeg ?? 30;
    const sweepRate = faders.sweepSpeedDegSec ?? 110;
    const totalBars = faders.elevationBars ?? 2;
    sweepAzDeg += sweepDir * sweepRate * safeDt;
    if (sweepAzDeg >= maxAz) {
      sweepAzDeg = maxAz;
      sweepDir = -1;
      currentBar = (currentBar % totalBars) + 1;
    } else if (sweepAzDeg <= -maxAz) {
      sweepAzDeg = -maxAz;
      sweepDir = 1;
      currentBar = (currentBar % totalBars) + 1;
    }

    for (const c of projectedContacts) {
      const azDiff = Math.abs(c.proj.azDeg - sweepAzDeg);
      if (azDiff < Math.max(4.5, sweepRate * safeDt * 1.4) && !c.masked) {
        bScopeBricks.set(c.id, {
          id: c.id,
          callsign: c.callsign,
          azDeg: c.proj.azDeg,
          distance: c.distance,
          closureRateMs: c.closureRateMs,
          hitTime: worldState.time,
          coasting: false
        });
      } else if (bScopeBricks.has(c.id)) {
        const brick = bScopeBricks.get(c.id);
        if (worldState.time - brick.hitTime > (faders.brickPhosphorSec ?? 1.8)) {
          brick.coasting = true;
        }
        if (worldState.time - brick.hitTime > (faders.brickPhosphorSec ?? 1.8) * 2.2) {
          bScopeBricks.delete(c.id);
        }
      }
    }

    // 3. Select primary candidate contact
    let candidate = null;
    if (trackedContactId) {
      candidate = projectedContacts.find((c) => c.id === trackedContactId) || null;
    }

    // If no current candidate or candidate is well outside stickiness zone, pick closest to reticle center
    const stickyRadiusPx = boxRadiusPx * (1 + (faders.stickiness ?? 0.45) * 0.85);
    if (
      !candidate ||
      (!candidate.inBox && candidate.proj.pixelDist > stickyRadiusPx && graceRemainingSec <= 0)
    ) {
      let bestScore = Infinity;
      for (const c of projectedContacts) {
        if (!c.proj.inFront) continue;
        if (c.proj.pixelDist <= boxRadiusPx * 1.15) {
          const score = c.proj.pixelDist - c.signatures.heat * 12;
          if (score < bestScore) {
            bestScore = score;
            candidate = c;
          }
        }
      }
    }

    // 4. Uncaged IR Seeker wander & flare seduction (`ir-seeker`)
    seducedByDecoyId = null;
    if (specimen?.id === 'ir-seeker' && !caged) {
      const coneRadiusPx = ((faders.seekerConeDeg ?? 18) / Math.max(10, faders.fov / faders.zoom)) * viewport.height;
      let hottestTarget = null;
      let highestPull = 0;

      for (const c of projectedContacts) {
        if (!c.proj.inFront || c.masked || c.proj.pixelDist > coneRadiusPx) continue;
        const pull = c.signatures.heat * (faders.irSensitivity ?? 1.0);
        if (pull > highestPull) {
          highestPull = pull;
          hottestTarget = { x: c.proj.screenX, y: c.proj.screenY, isDecoy: false, ref: c };
        }
      }

      // Check flare decoys in seeker cone
      const ccm = faders.ccmResistance ?? 0.35;
      const flareMult = faders.flareHeatMultiplier ?? 2.4;
      for (const d of projectedDecoys) {
        if (!d.proj.inFront || d.proj.pixelDist > coneRadiusPx) continue;
        const effectiveFlarePull = d.signatures.heat * flareMult * (1.15 - ccm);
        if (effectiveFlarePull > highestPull) {
          highestPull = effectiveFlarePull;
          hottestTarget = { x: d.proj.screenX, y: d.proj.screenY, isDecoy: true, ref: d };
        }
      }

      if (hottestTarget) {
        const wanderRate = Math.min(1, safeDt * (faders.uncageWanderSpeed ?? 6.5));
        seekerPosPx.x += (hottestTarget.x - cx - seekerPosPx.x) * wanderRate;
        seekerPosPx.y += (hottestTarget.y - cy - seekerPosPx.y) * wanderRate;
        if (hottestTarget.isDecoy) {
          seducedByDecoyId = hottestTarget.ref.id;
        } else {
          candidate = hottestTarget.ref;
        }
      } else {
        seekerPosPx.x += (Math.sin(worldState.time * 4.5) * 18 - seekerPosPx.x) * safeDt * 3;
        seekerPosPx.y += (Math.cos(worldState.time * 3.7) * 18 - seekerPosPx.y) * safeDt * 3;
      }
    } else {
      seekerPosPx.x *= 0.8;
      seekerPosPx.y *= 0.8;
    }

    // 5. Laser Spot PRF code check (`laser-spot`)
    let prfCodeMatched = true;
    if (specimen?.id === 'laser-spot' && candidate) {
      const seekerCode = Math.round(faders.prfCode ?? 1688);
      // Allow matching if seeker code equals contact's painted code OR default 1688
      prfCodeMatched = seekerCode === candidate.signatures.prfCode || seekerCode === 1688;
    }

    // 6. Lock meter integration, 0.5s Sight Grace ("a rock edge is not a loss"), and Loss Legibility
    const lockRate = faders.lockRate ?? 1.35;
    const maxGrace = faders.lossGraceSec ?? 0.5;

    if (seducedByDecoyId) {
      phase = 'FLARE_SEDUCED';
      lossReason = 'FLARE DECOY PULL';
      lockMeter = Math.max(0.25, lockMeter - safeDt * 0.6);
    } else if (candidate && holdEnabled) {
      const withinGate = candidate.inBox || (lockMeter > 0.35 && candidate.proj.pixelDist <= stickyRadiusPx);

      if (withinGate && !candidate.masked && prfCodeMatched) {
        trackedContactId = candidate.id;
        graceRemainingSec = maxGrace;
        lossDriftTimerSec = 0;
        lossReason = '';

        // Signature multiplier
        const sigGain =
          specimen?.id === 'tv-eo'
            ? candidate.signatures.contrast >= (faders.contrastThreshold ?? 0.35)
              ? 1.1
              : 0.15
            : 0.75 + candidate.signatures.heat * 0.35 * (faders.irSensitivity ?? 1.0);

        lockMeter = Math.min(1.0, lockMeter + safeDt * lockRate * sigGain);
        lastLockedScreenPos = { x: candidate.proj.screenX, y: candidate.proj.screenY };
        lastSlipVelocity = {
          vx: (candidate.proj.screenX - cx) * 0.4,
          vy: (candidate.proj.screenY - cy) * 0.4
        };

        if (lockMeter >= 0.999) {
          lockMeter = 1.0;
          phase = 'LOCK';
        } else if (lockMeter >= 0.45) {
          phase = 'TRACK';
        } else {
          phase = 'DETECT';
        }
      } else if (trackedContactId === candidate.id && lockMeter > 0.15) {
        // Target slipped behind a rock edge (`masked`) or outside the box: enter Sight Grace!
        if (graceRemainingSec > 0) {
          graceRemainingSec = Math.max(0, graceRemainingSec - safeDt);
          phase = 'SIGHT_GRACE';
          lossReason = candidate.masked ? 'TERRAIN MASK (HOLD)' : 'GATE SLIP (HOLD)';
        } else {
          // Sight grace expired -> transition to explicit LOSS state
          const decay = faders.graceDecayRate ?? 0.9;
          lockMeter = Math.max(0, lockMeter - safeDt * lockRate * decay * 1.6);
          lossDriftTimerSec = 1.25;
          lossReason = candidate.masked ? 'LOST: TERRAIN OCCLUDED' : 'LOST: GIMBAL / GATE BREAK';
          phase = 'LOSS';
          if (lockMeter <= 0.02) {
            trackedContactId = null;
          }
        }
      } else {
        lockMeter = Math.max(0, lockMeter - safeDt * 1.4);
        phase = lossDriftTimerSec > 0 ? 'LOSS' : 'SEARCH';
      }
    } else {
      // No candidate or hold disabled
      if (lockMeter > 0.15 && graceRemainingSec > 0 && holdEnabled) {
        graceRemainingSec = Math.max(0, graceRemainingSec - safeDt);
        phase = 'SIGHT_GRACE';
        lossReason = 'COASTING MEMORY';
      } else {
        if (lockMeter > 0.2) {
          lossDriftTimerSec = 1.2;
          lossReason = 'LOCK DROPPED';
        }
        lockMeter = Math.max(0, lockMeter - safeDt * 1.8);
        if (lossDriftTimerSec > 0) {
          lossDriftTimerSec = Math.max(0, lossDriftTimerSec - safeDt);
          phase = 'LOSS';
        } else {
          phase = 'SEARCH';
          trackedContactId = null;
        }
      }
    }

    // Drift ghost position during LOSS so the operator sees which way the target slipped
    if (phase === 'LOSS') {
      lastLockedScreenPos.x += lastSlipVelocity.vx * safeDt;
      lastLockedScreenPos.y += lastSlipVelocity.vy * safeDt;
    }

    // 7. Shoot Cue Ladder (§5: in range / not yet / too close)
    const minRange = faders.minRangeM ?? 450;
    const maxRange = faders.maxRangeM ?? 3800;
    const rneRange = minRange + (maxRange - minRange) * (faders.dlzRneRatio ?? 0.48);
    let shootCue = 'NO TARGET';
    let rangeFraction = 0;

    if (candidate) {
      rangeFraction = Math.min(1.2, Math.max(0, candidate.distance / maxRange));
      if (candidate.distance < minRange) {
        shootCue = 'TOO CLOSE (MIN RNG)';
      } else if (candidate.distance > maxRange) {
        shootCue = 'NOT YET (OUT OF RNG)';
      } else if (candidate.distance <= rneRange && phase === 'LOCK') {
        shootCue = 'SHOOT (NO-ESCAPE)';
      } else if (phase === 'LOCK') {
        shootCue = 'IN RANGE (SHOOT)';
      } else {
        shootCue = 'IN RANGE (ACQUIRING)';
      }
    }

    // 8. Ballistics, Lead, and Gunnery calculations (`tank-fcs`, `air-gun`, `ccip-ccrp`)
    laseAgeSec += safeDt;
    const activeRangeM = lasedRangeM || (candidate ? candidate.distance : 1500);
    const muzzleVel =
      specimen?.id === 'tank-fcs'
        ? (faders.muzzleVelocityMs ?? 1550) * ((faders.ammoTypeHeat ?? 0) >= 0.5 ? 0.62 : 1.0)
        : faders.gunMuzzleVelMs ?? 1030;
    const tofSec = activeRangeM / Math.max(200, muzzleVel);

    // Ballistic gravity drop in pixels
    const dropMeters = 0.5 * 9.81 * tofSec * tofSec * (faders.gravityDropScale ?? 1.0);
    const dropOffsetPx = Math.min(160, (dropMeters / Math.max(100, activeRangeM)) * viewport.height * 1.35);

    // Tachometric / Target velocity lead in pixels
    let targetLeadX = 0;
    let targetLeadY = 0;
    if (candidate) {
      const futurePos = {
        x: candidate.position.x + candidate.velocity.x * tofSec * (faders.leadFactor ?? 1.0),
        y: candidate.position.y + candidate.velocity.y * tofSec * (faders.leadFactor ?? 1.0),
        z: candidate.position.z + candidate.velocity.z * tofSec * (faders.leadFactor ?? 1.0)
      };
      const futureProj = projectWorldPoint(futurePos, platformState, viewport, faders);
      targetLeadX = futureProj.screenX - candidate.proj.screenX;
      targetLeadY = futureProj.screenY - candidate.proj.screenY;
    } else {
      targetLeadX = -platformState.slewVelocityDegSec.yaw * tofSec * 9 * (faders.leadFactor ?? 1.0);
      targetLeadY = platformState.slewVelocityDegSec.pitch * tofSec * 9 * (faders.leadFactor ?? 1.0);
    }

    const smoothFactor = Math.min(1, safeDt / Math.max(0.08, faders.leadSmoothingSec ?? 0.35));
    smoothedLeadPx.x += (targetLeadX - smoothedLeadPx.x) * smoothFactor;
    smoothedLeadPx.y += (targetLeadY - smoothedLeadPx.y) * smoothFactor;

    // 9. Passive IRST range uncertainty (`irst`)
    if (candidate && !candidate.masked) {
      irstIntegration = Math.min(
        1.0,
        irstIntegration + safeDt * 0.18 * (faders.triangulationRate ?? 1.2) * (1 + platformState.lateralBaselineMeters * 0.015)
      );
    } else {
      irstIntegration = Math.max(0, irstIntegration - safeDt * 0.25);
    }
    const irstRangeUncertaintyM = Math.round(950 * (1 - irstIntegration * 0.92));

    // 10. Coordinate bombing SPI & CEP (`coords`)
    if (candidate) {
      designatedSpi = { ...candidate.position, y: candidate.position.groundY || 0 };
    }
    gpsAlignment = Math.min(1.0, gpsAlignment + safeDt * 0.25 * (faders.gpsAlignmentRate ?? 1.5));
    const spiProj = projectWorldPoint(designatedSpi, platformState, viewport, faders);
    const effectiveCepMeters = Math.round(
      ((faders.cepRadiusMeters ?? 14) * (faders.jammingDrift ?? 1.0)) / Math.max(0.35, gpsAlignment)
    );

    // 11. Active round in flight status
    const activeRound = projectedRounds.find((r) => r.active) || projectedRounds[projectedRounds.length - 1] || null;

    // 12. Priority sorted tracks for AESA & Arcade multi-lock
    const priorityTracks = [...projectedContacts]
      .filter((c) => c.proj.inFront && !c.masked)
      .sort((a, b) => a.distance - b.distance - (b.closureRateMs - a.closureRateMs) * 4);

    return {
      phase,
      lockMeter,
      graceRemainingSec,
      maxGraceSec: maxGrace,
      lossDriftTimerSec,
      lossReason,
      lastLockedScreenPos: { ...lastLockedScreenPos },
      boxRadiusPx,
      candidate,
      trackedContactId,
      projectedContacts,
      projectedDecoys,
      projectedRounds,
      activeRound,
      priorityTracks,
      seekerPosPx: { ...seekerPosPx },
      seducedByDecoyId,
      caged,
      prfCodeMatched,
      shootCue,
      rangeFraction,
      minRange,
      maxRange,
      rneRange,
      lasedRangeM,
      laseAgeSec,
      tofSec,
      dropOffsetPx,
      leadOffsetPx: { ...smoothedLeadPx },
      sweepAzDeg,
      sweepDir,
      currentBar,
      bScopeBricks: Array.from(bScopeBricks.values()),
      irstIntegration,
      irstRangeUncertaintyM,
      designatedSpi,
      spiProj,
      effectiveCepMeters,
      gpsAlignment
    };
  }

  return {
    step,
    resetLock,
    triggerLase,
    toggleCage,
    forceCage,
    setHold,
    getState: () => ({ phase, lockMeter, trackedContactId, graceRemainingSec, caged, lasedRangeM })
  };
}
