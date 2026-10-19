/**
 * hudlab — Layer 6: Status Rule (§3 of hudlab-brief.md)
 * `computeStatus(inputs) -> { state, text, subtext, colorRole, colorHex, blink, priority }`
 * RULE: Evaluated in strict priority order. One rule drives the word and the colour.
 */

export function computeStatus({ sensor, platform, faders, specimen }) {
  const primaryHex = faders.primaryColor || '#38bdf8';
  const lockedHex = faders.lockedColor || '#4ade80';
  const warningHex = faders.warningColor || '#fb7185';
  const amberHex = '#fbbf24';

  const activeRound = sensor.activeRound;
  const candidate = sensor.candidate;

  // 1. CRITICAL DANGER / GIMBAL LIMIT / BREAK-X
  if (platform.atGimbalLimit) {
    return {
      priority: 1,
      state: 'GIMBAL_LIMIT',
      text: specimen?.id === 'tgp-mts' ? 'GIMBAL ROLL / LIMIT' : 'GIMBAL LIMIT EXCEEDED',
      subtext: `SLEW CONE ±${faders.gimbalLimitDeg}° REACHED`,
      colorRole: 'warning',
      colorHex: warningHex,
      blink: true,
      tone: 'warning'
    };
  }

  if (
    specimen?.id === 'ccip-ccrp' &&
    candidate &&
    candidate.distance < (faders.fragSafeAltM ?? 550)
  ) {
    return {
      priority: 1,
      state: 'BREAK_X',
      text: 'PULL UP // BREAK X',
      subtext: `FRAG ENVELOPE < ${faders.fragSafeAltM ?? 550}M`,
      colorRole: 'warning',
      colorHex: warningHex,
      blink: true,
      tone: 'warning'
    };
  }

  if (
    specimen?.id === 'saclos' &&
    activeRound?.active &&
    platform.slewVelocityDegSec.magnitude > (faders.maxSlewDegSec ?? 24)
  ) {
    return {
      priority: 1,
      state: 'WIRE_TENSION',
      text: 'SLEW TOO FAST // WIRE TENSION',
      subtext: `${platform.slewVelocityDegSec.magnitude.toFixed(0)}°/S EXCEEDS ${faders.maxSlewDegSec ?? 24}°/S`,
      colorRole: 'warning',
      colorHex: warningHex,
      blink: true,
      tone: 'warning'
    };
  }

  // 2. DECOY SEDUCTION / PRF CODE MISMATCH / ILLUMINATION NAG
  if (sensor.phase === 'FLARE_SEDUCED') {
    return {
      priority: 2,
      state: 'FLARE_SEDUCED',
      text: 'SEDUCED BY FLARE // RE-CAGE',
      subtext: 'PRESS [C] TO CAGE OR TUNE IRCCM',
      colorRole: 'warning',
      colorHex: warningHex,
      blink: true,
      tone: 'seduced'
    };
  }

  if (specimen?.id === 'laser-spot' && candidate && !sensor.prfCodeMatched) {
    return {
      priority: 2,
      state: 'CODE_MISMATCH',
      text: `PRF ${faders.prfCode} MISMATCH`,
      subtext: `SPOT PAINTED ON ${candidate.signatures.prfCode}`,
      colorRole: 'warning',
      colorHex: amberHex,
      blink: true,
      tone: 'warning'
    };
  }

  if (
    specimen?.id === 'radar-semi-active' &&
    activeRound?.active &&
    candidate &&
    candidate.proj.angleDeg > (faders.floodConeDeg ?? 11) * (faders.nagThreshold ?? 0.65)
  ) {
    return {
      priority: 2,
      state: 'ILLUM_NAG',
      text: 'HOLD CW ILLUM // RE-CENTER',
      subtext: 'FOX-1 REQUIRES CONTINUOUS STT FLOOD',
      colorRole: 'warning',
      colorHex: warningHex,
      blink: true,
      tone: 'warning'
    };
  }

  // 3. ACTIVE ROUND IN FLIGHT / IMPACT
  if (activeRound) {
    if (!activeRound.active && activeRound.status === 'IMPACT') {
      return {
        priority: 3,
        state: 'IMPACT',
        text: 'SPLASH // TARGET IMPACT',
        subtext: `TOF ${activeRound.age.toFixed(1)}S`,
        colorRole: 'locked',
        colorHex: lockedHex,
        blink: false,
        tone: 'impact'
      };
    }

    if (activeRound.active) {
      const rem = Math.max(0, activeRound.maxFlightTime - activeRound.age);
      if (specimen?.id === 'radar-active') {
        const tta = Math.max(0, activeRound.pitbullTime - activeRound.age);
        if (activeRound.isPitbull) {
          return {
            priority: 3,
            state: 'PITBULL',
            text: 'PITBULL // ACTIVE HANDOVER',
            subtext: `SAFE TO TURN COLD — TTI ${rem.toFixed(1)}S`,
            colorRole: 'locked',
            colorHex: lockedHex,
            blink: false,
            tone: 'pitbull'
          };
        }
        return {
          priority: 3,
          state: 'MIDCOURSE',
          text: `DATALINK // ACT ${tta.toFixed(1)}S`,
          subtext: 'KEEP BANDIT IN GIMBAL CONE',
          colorRole: 'primary',
          colorHex: primaryHex,
          blink: false,
          tone: 'track'
        };
      }

      if (specimen?.id === 'saclos') {
        return {
          priority: 3,
          state: 'WIRE_FLIGHT',
          text: `WIRE GUIDING // ${rem.toFixed(1)}S`,
          subtext: 'HOLD CROSSHAIR ON TARGET',
          colorRole: 'locked',
          colorHex: lockedHex,
          blink: false,
          tone: 'track'
        };
      }

      if (specimen?.id === 'tv-eo') {
        return {
          priority: 3,
          state: 'WEAPON_VIDEO',
          text: `SEEKER CAM // TTI ${rem.toFixed(1)}S`,
          subtext: 'INSET SHOWING LIVE NOSE VIDEO',
          colorRole: 'locked',
          colorHex: lockedHex,
          blink: false,
          tone: 'lock'
        };
      }

      return {
        priority: 3,
        state: 'IN_FLIGHT',
        text: `ROUND IN FLIGHT // TTI ${rem.toFixed(1)}S`,
        subtext: faders.dangerBeforeRelease ? 'WARNING: ORDNANCE LIVE' : 'TRACKING TOF',
        colorRole: 'locked',
        colorHex: lockedHex,
        blink: false,
        tone: 'track'
      };
    }
  }

  // 4. SIGHT GRACE ("A ROCK EDGE IS NOT A LOSS")
  if (sensor.phase === 'SIGHT_GRACE') {
    return {
      priority: 4,
      state: 'SIGHT_GRACE',
      text: `SIGHT GRACE // HOLD ${sensor.graceRemainingSec.toFixed(2)}S`,
      subtext: sensor.lossReason || 'MEMORY COASTING',
      colorRole: 'warning',
      colorHex: amberHex,
      blink: false,
      tone: 'grace'
    };
  }

  // 5. EXPLICIT LOSS OF LOCK (NEVER A SILENT RESET)
  if (sensor.phase === 'LOSS') {
    return {
      priority: 5,
      state: 'LOSS',
      text: sensor.lossReason || 'LOCK LOST // SLIP',
      subtext: 'RE-ACQUIRE TARGET IN GATE',
      colorRole: 'warning',
      colorHex: warningHex,
      blink: true,
      tone: 'loss'
    };
  }

  // 6. FULL CORRELATED LOCK
  if (sensor.phase === 'LOCK' && candidate) {
    if (candidate.distance < sensor.minRange) {
      return {
        priority: 6,
        state: 'LOCK_TOO_CLOSE',
        text: 'LOCKED // TOO CLOSE (MIN RNG)',
        subtext: `RNG ${Math.round(candidate.distance)}M < MIN ${sensor.minRange}M`,
        colorRole: 'warning',
        colorHex: warningHex,
        blink: true,
        tone: 'warning'
      };
    }
    if (candidate.distance > sensor.maxRange) {
      return {
        priority: 6,
        state: 'LOCK_OUT_OF_RANGE',
        text: 'LOCKED // NOT YET (MAX RNG)',
        subtext: `RNG ${Math.round(candidate.distance)}M > MAX ${sensor.maxRange}M`,
        colorRole: 'primary',
        colorHex: amberHex,
        blink: false,
        tone: 'lock'
      };
    }

    const modeWord =
      specimen?.id === 'arcade-lock'
        ? 'LOCK // SHOOT'
        : specimen?.id === 'tank-fcs'
        ? `SOLUTION READY // ${sensor.lasedRangeM || Math.round(candidate.distance)}M`
        : specimen?.id === 'iir-clu'
        ? (faders.attackProfile ?? 1) >= 0.5
          ? 'CLU LOCK // TOP ATTACK'
          : 'CLU LOCK // DIRECT'
        : 'LOCKED // IN RANGE — SHOOT';

    return {
      priority: 6,
      state: 'LOCK',
      text: modeWord,
      subtext: `${candidate.callsign} • ${Math.round(candidate.distance)}M • CLOSURE ${Math.round(candidate.closureRateMs)}M/S`,
      colorRole: 'locked',
      colorHex: lockedHex,
      blink: false,
      tone: 'lock'
    };
  }

  // 7. TRACKING / CORRELATING / DETECTING
  if ((sensor.phase === 'TRACK' || sensor.phase === 'DETECT') && candidate) {
    const pct = Math.round(sensor.lockMeter * 100);
    return {
      priority: 7,
      state: sensor.phase,
      text: `${sensor.phase === 'TRACK' ? 'CORRELATING' : 'DETECTING'} // ${pct}%`,
      subtext: `${candidate.callsign} (${candidate.label})`,
      colorRole: 'primary',
      colorHex: primaryHex,
      blink: false,
      tone: 'track'
    };
  }

  // 8. DEFAULT SEARCH / STANDBY
  const searchLabel =
    specimen?.id === 'ir-seeker'
      ? sensor.caged
        ? 'CAGED BORESIGHT'
        : 'UNCAGED IR SCAN'
      : specimen?.id === 'irst'
      ? 'PASSIVE IRST // EMCON SILENT'
      : specimen?.id === 'fcr-scan'
      ? `RWS SWEEP ±${faders.scanAzimuthDeg ?? 30}° ${faders.elevationBars ?? 2}B`
      : specimen?.id === 'rwr'
      ? 'RWR THREAT MONITOR'
      : 'SEARCH // STANDBY';

  return {
    priority: 8,
    state: 'SEARCH',
    text: searchLabel,
    subtext: 'SLEW RETICLE OVER CONTACT OR CLICK TARGET',
    colorRole: 'primary',
    colorHex: primaryHex,
    blink: false,
    tone: 'search'
  };
}
