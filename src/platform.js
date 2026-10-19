/**
 * hudlab — Layer 2: Platform (§3 of hudlab-brief.md)
 * Owns fixed mount, turret on a moving hull, helicopter, jet, or the round itself.
 * RULE: Yaw/pitch stored relative to platform, world aim held each frame (`holdAim`).
 */

export function directionFromYawPitch(yawRad, pitchRad) {
  const cosP = Math.cos(pitchRad);
  return {
    x: Math.sin(yawRad) * cosP,
    y: Math.sin(pitchRad),
    z: -Math.cos(yawRad) * cosP
  };
}

export function yawPitchFromDirection(dir) {
  const len = Math.hypot(dir.x, dir.y, dir.z) || 1;
  const nx = dir.x / len;
  const ny = Math.max(-0.999, Math.min(0.999, dir.y / len));
  const nz = dir.z / len;
  const yaw = Math.atan2(nx, -nz);
  const pitch = Math.asin(ny);
  return { yaw, pitch };
}

export function createPlatform(initialType = 'jet') {
  let platformType = initialType;
  let time = 0;

  // Platform hull / airframe pose in world space
  let position = { x: 0, y: 120, z: 40 };
  let hullYaw = 0;
  let hullPitch = -0.05;
  let hullRoll = 0;

  // Operator relative aim angles (radians)
  let relYaw = 0;
  let relPitch = -0.08;

  // Held world aim direction when `holdAim` stabilization is enabled
  let heldWorldDir = directionFromYawPitch(0, -0.08);

  // Angular slew rate (deg/s) for SACLOS wire tension, Tank FCS lead, and Gun Funnel lag
  let slewVelocityDegSec = { yaw: 0, pitch: 0, magnitude: 0 };
  let prevWorldYaw = 0;
  let prevWorldPitch = -0.08;
  let lateralBaselineMeters = 0;

  function setPlatformType(type) {
    platformType = type || 'jet';
  }

  function aimAtWorldPoint(targetPoint) {
    const dx = targetPoint.x - position.x;
    const dy = targetPoint.y - position.y;
    const dz = targetPoint.z - position.z;
    const { yaw, pitch } = yawPitchFromDirection({ x: dx, y: dy, z: dz });
    heldWorldDir = directionFromYawPitch(yaw, pitch);
    relYaw = yaw - hullYaw;
    relPitch = pitch - hullPitch;
  }

  function setRelativeAim(yawRad, pitchRad, faders = {}) {
    const limitRad = ((faders.gimbalLimitDeg ?? 45) * Math.PI) / 180;
    relYaw = Math.max(-limitRad, Math.min(limitRad, yawRad));
    relPitch = Math.max(-limitRad * 0.75, Math.min(limitRad * 0.75, pitchRad));
    const worldYaw = hullYaw + relYaw;
    const worldPitch = hullPitch + relPitch;
    heldWorldDir = directionFromYawPitch(worldYaw, worldPitch);
  }

  function applyAimDelta(dYawRad, dPitchRad, faders = {}) {
    const slewMult = faders.slewRate ?? 1.0;
    const limitRad = ((faders.gimbalLimitDeg ?? 45) * Math.PI) / 180;

    if (faders.holdAim ?? true) {
      const current = yawPitchFromDirection(heldWorldDir);
      const nextYaw = current.yaw + dYawRad * slewMult;
      const nextPitch = Math.max(-1.1, Math.min(1.1, current.pitch + dPitchRad * slewMult));
      relYaw = Math.max(-limitRad, Math.min(limitRad, nextYaw - hullYaw));
      relPitch = Math.max(-limitRad * 0.8, Math.min(limitRad * 0.8, nextPitch - hullPitch));
      heldWorldDir = directionFromYawPitch(hullYaw + relYaw, hullPitch + relPitch);
    } else {
      relYaw = Math.max(-limitRad, Math.min(limitRad, relYaw + dYawRad * slewMult));
      relPitch = Math.max(-limitRad * 0.8, Math.min(limitRad * 0.8, relPitch + dPitchRad * slewMult));
      heldWorldDir = directionFromYawPitch(hullYaw + relYaw, hullPitch + relPitch);
    }
  }

  function tick(dt, faders = {}, activeRound = null, specimen = null) {
    const safeDt = Math.min(0.1, Math.max(0.001, dt));
    time += safeDt;

    const speedMult = faders.platformSpeed ?? 1.0;
    const turb = faders.platformTurbulence ?? 0.15;
    const limitDeg = faders.gimbalLimitDeg ?? 45;
    const limitRad = (limitDeg * Math.PI) / 180;

    // Update platform hull motion based on platformType
    const prevX = position.x;
    if (platformType === 'fixed') {
      position = { x: 0, y: 95, z: 60 };
      hullYaw = Math.sin(time * 1.7) * 0.004 * turb;
      hullPitch = -0.04 + Math.cos(time * 2.3) * 0.004 * turb;
      hullRoll = 0;
    } else if (platformType === 'turret') {
      position = {
        x: Math.sin(time * 0.22 * speedMult) * 45,
        y: 82 + Math.sin(time * 2.6 * speedMult) * 1.4 * turb,
        z: 50
      };
      hullYaw = Math.cos(time * 0.22 * speedMult) * 0.08 * speedMult;
      hullPitch = -0.03 + Math.sin(time * 3.8) * 0.012 * turb;
      hullRoll = Math.sin(time * 1.9) * 0.018 * turb;
    } else if (platformType === 'helicopter') {
      position = {
        x: Math.sin(time * 0.35 * speedMult) * 90,
        y: 138 + Math.sin(time * 1.2) * 8,
        z: 35
      };
      hullYaw = Math.sin(time * 0.28 * speedMult) * 0.12;
      hullPitch = -0.06 + Math.sin(time * 2.1) * 0.018 * turb;
      hullRoll = Math.cos(time * 0.35 * speedMult) * 0.08 + Math.sin(time * 4.5) * 0.015 * turb;
    } else {
      // 'jet'
      position = {
        x: Math.sin(time * 0.45 * speedMult) * 145,
        y: 175 + Math.cos(time * 0.6 * speedMult) * 18,
        z: 25
      };
      hullYaw = Math.cos(time * 0.45 * speedMult) * 0.14 * speedMult;
      hullPitch = -0.07 + Math.sin(time * 1.8) * 0.015 * turb;
      hullRoll = -Math.sin(time * 0.45 * speedMult) * 0.18 * speedMult;
    }

    // Accumulate lateral baseline for passive IRST triangulation
    lateralBaselineMeters = Math.min(400, lateralBaselineMeters * 0.992 + Math.abs(position.x - prevX) * 2.5);

    // Hold world aim (`holdAim`) or drift with hull
    let worldYaw;
    let worldPitch;

    if (faders.holdAim ?? true) {
      const held = yawPitchFromDirection(heldWorldDir);
      relYaw = held.yaw - hullYaw;
      relPitch = held.pitch - hullPitch;
      // Clamp to gimbal limits
      relYaw = Math.max(-limitRad, Math.min(limitRad, relYaw));
      relPitch = Math.max(-limitRad * 0.85, Math.min(limitRad * 0.85, relPitch));
      worldYaw = hullYaw + relYaw;
      worldPitch = hullPitch + relPitch;
      heldWorldDir = directionFromYawPitch(worldYaw, worldPitch);
    } else {
      worldYaw = hullYaw + relYaw;
      worldPitch = hullPitch + relPitch;
      heldWorldDir = directionFromYawPitch(worldYaw, worldPitch);
    }

    // Compute instantaneous angular slew velocity in deg/s
    const dYawDeg = ((worldYaw - prevWorldYaw) * 180) / Math.PI / safeDt;
    const dPitchDeg = ((worldPitch - prevWorldPitch) * 180) / Math.PI / safeDt;
    prevWorldYaw = worldYaw;
    prevWorldPitch = worldPitch;

    slewVelocityDegSec = {
      yaw: slewVelocityDegSec.yaw * 0.7 + dYawDeg * 0.3,
      pitch: slewVelocityDegSec.pitch * 0.7 + dPitchDeg * 0.3,
      magnitude: Math.hypot(
        slewVelocityDegSec.yaw * 0.7 + dYawDeg * 0.3,
        slewVelocityDegSec.pitch * 0.7 + dPitchDeg * 0.3
      )
    };

    const gimbalFraction = Math.min(
      1.0,
      Math.hypot((relYaw * 180) / Math.PI, (relPitch * 180) / Math.PI) / Math.max(5, limitDeg)
    );
    const atGimbalLimit = gimbalFraction > 0.92;

    // Gimbal roll when TGP ball nears nadir/keyhole or gimbal edge
    const gimbalRollDeg =
      specimen?.id === 'tgp-mts' && gimbalFraction > 0.82
        ? Math.sin(time * 8) * 35 * (gimbalFraction - 0.82) * 5
        : (hullRoll * 180) / Math.PI;

    const aimDirection = directionFromYawPitch(worldYaw, worldPitch);
    const noseDirection = directionFromYawPitch(hullYaw, hullPitch);

    return {
      type: platformType,
      position: { ...position },
      hullYaw,
      hullPitch,
      hullRoll,
      relYawDeg: (relYaw * 180) / Math.PI,
      relPitchDeg: (relPitch * 180) / Math.PI,
      worldYaw,
      worldPitch,
      aimDirection,
      noseDirection,
      slewVelocityDegSec,
      gimbalFraction,
      atGimbalLimit,
      gimbalRollDeg,
      lateralBaselineMeters
    };
  }

  return {
    tick,
    setPlatformType,
    aimAtWorldPoint,
    setRelativeAim,
    applyAimDelta,
    getState: () => ({ position, relYaw, relPitch, heldWorldDir })
  };
}
