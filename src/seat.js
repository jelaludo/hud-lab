/**
 * hudlab — Layer 4: Seat (§3 & §7 of hudlab-brief.md)
 * `createSeat(root, host)` where host passes functions, not values.
 * Owns operator input, camera pose coordination, `tick(dt)`, and produces one
 * self-contained `frame` object per frame for `presentation`.
 */

import { createWorld } from './world.js';
import { createPlatform } from './platform.js';
import { createSensor } from './sensor.js';
import { computeStatus } from './status.js';
import { computeHudStats } from './faders.js';

export function createSeat(root, host = {}) {
  const getSpecimen = host.getSpecimen || (() => null);
  const getFaders = host.getFaders || (() => ({}));
  const getViewport =
    host.getViewport ||
    (() => ({
      width: root?.clientWidth || 960,
      height: root?.clientHeight || 600,
      dpr: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    }));

  // Allow host to supply a shared world clock/instance for `compare` mode
  const ownWorld = host.getSharedWorld ? null : createWorld();
  const platform = createPlatform(getSpecimen()?.platformType || 'jet');
  const sensor = createSensor();

  let autoPilotContactId = null;
  let pointerDragging = false;
  let lastPointer = { x: 0, y: 0 };
  let lastFrame = null;

  function fireOrdnance() {
    const faders = getFaders();
    const spec = getSpecimen();
    if (!lastFrame) return null;

    const worldInst = host.getSharedWorld ? host.getSharedWorld() : ownWorld;
    const cand = lastFrame.sensor.candidate;
    const dir = lastFrame.platform.aimDirection;
    const speed = 285;

    const round = worldInst.launchRound({
      specimenId: spec?.id || 'stalheart-quiver',
      origin: {
        x: lastFrame.platform.position.x + dir.x * 8,
        y: lastFrame.platform.position.y - 3 + dir.y * 8,
        z: lastFrame.platform.position.z + dir.z * 8
      },
      initialVelocity: {
        x: dir.x * speed,
        y: dir.y * speed,
        z: dir.z * speed
      },
      targetId: cand ? cand.id : lastFrame.sensor.trackedContactId,
      targetCoord: spec?.id === 'coords' ? lastFrame.sensor.designatedSpi : null,
      maxFlightTime: faders.wireTimeSec ?? 9.0,
      pitbullTime: faders.pitbullTimeSec ?? 4.0
    });

    if (host.onAction) host.onAction('fire', round);
    return round;
  }

  function triggerLase() {
    if (!lastFrame) return;
    sensor.triggerLase(lastFrame.sensor.candidate);
    if (host.onAction) host.onAction('lase');
  }

  function triggerFlare() {
    if (!lastFrame) return;
    const worldInst = host.getSharedWorld ? host.getSharedWorld() : ownWorld;
    const target =
      lastFrame.sensor.candidate ||
      lastFrame.world.contacts[0] ||
      null;
    if (target) {
      worldInst.spawnFlare(target);
      if (host.onAction) host.onAction('flare', target);
    }
  }

  function toggleCage() {
    const state = sensor.toggleCage();
    if (host.onAction) host.onAction('cage', state);
    return state;
  }

  function aimAtContact(contactId) {
    if (!contactId) {
      autoPilotContactId = null;
      return false;
    }
    autoPilotContactId = contactId;
    if (lastFrame) {
      const contact = lastFrame.world.contacts.find((c) => c.id === contactId);
      if (contact) {
        platform.aimAtWorldPoint(contact.position);
        return true;
      }
    }
    return true;
  }

  function aimSky() {
    autoPilotContactId = null;
    platform.setRelativeAim(0, 0.58, getFaders());
  }

  function setHold(on) {
    sensor.setHold(on);
  }

  // Bind DOM pointer events if root element exists
  if (root && typeof window !== 'undefined') {
    root.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, input, select, .hud-floating-controls')) return;
      pointerDragging = true;
      lastPointer = { x: e.clientX, y: e.clientY };

      // Check if user clicked directly on a projected contact to snap/track it
      if (lastFrame && !e.shiftKey) {
        const rect = root.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        let clickedContact = null;
        let bestDist = 42;
        for (const c of lastFrame.sensor.projectedContacts) {
          if (!c.proj.inFront) continue;
          const d = Math.hypot(c.proj.screenX - px, c.proj.screenY - py);
          if (d < bestDist) {
            bestDist = d;
            clickedContact = c;
          }
        }
        if (clickedContact) {
          autoPilotContactId = clickedContact.id;
          platform.aimAtWorldPoint(clickedContact.position);
        } else {
          autoPilotContactId = null;
        }
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!pointerDragging) return;
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer = { x: e.clientX, y: e.clientY };
      if (Math.hypot(dx, dy) > 1.5) {
        autoPilotContactId = null;
      }
      const faders = getFaders();
      const sens = 0.0028 / Math.max(0.7, faders.zoom ?? 1.0);
      platform.applyAimDelta(dx * sens, -dy * sens, faders);
    });

    window.addEventListener('pointerup', () => {
      pointerDragging = false;
    });
  }

  function tick(dt = 1 / 60, externalWorldState = null) {
    const specimen = getSpecimen();
    const faders = getFaders();
    const viewport = getViewport();

    platform.setPlatformType(specimen?.platformType || 'jet');

    // Step platform pose first so world has observer position
    const prelimPlatform = platform.tick(0.001, faders, null, specimen);

    const worldInst = host.getSharedWorld ? host.getSharedWorld() : ownWorld;
    const worldState =
      externalWorldState ||
      worldInst.tick(dt, faders, prelimPlatform.position, prelimPlatform.aimDirection);

    // If autoPilotContactId is set (either via click-to-track or `__hudlabTest.aim(id)`), track that contact
    if (autoPilotContactId) {
      const target = worldState.contacts.find((c) => c.id === autoPilotContactId);
      if (target) {
        platform.aimAtWorldPoint(target.position);
      }
    }

    const platformState = platform.tick(dt, faders, null, specimen);
    const sensorState = sensor.step(dt, worldState, platformState, viewport, faders, specimen);
    const statusState = computeStatus({
      sensor: sensorState,
      platform: platformState,
      faders,
      specimen
    });

    const stats = computeHudStats(faders, specimen, {
      sensor: sensorState,
      status: statusState
    });

    lastFrame = {
      specimen,
      faders,
      viewport,
      world: worldState,
      platform: platformState,
      sensor: sensorState,
      status: statusState,
      stats,
      autoPilotContactId
    };

    if (host.onFrame) {
      host.onFrame(lastFrame);
    }

    return lastFrame;
  }

  return {
    tick,
    aim: aimAtContact,
    aimSky,
    hold: setHold,
    fire: fireOrdnance,
    lase: triggerLase,
    flare: triggerFlare,
    cage: toggleCage,
    forceCage: (v) => sensor.forceCage(v),
    resetLock: () => sensor.resetLock(),
    applyAimDelta: (dyaw, dpitch) => platform.applyAimDelta(dyaw, dpitch, getFaders()),
    getAutoPilotContactId: () => autoPilotContactId,
    setAutoPilotContactId: (id) => {
      autoPilotContactId = id;
    },
    phase: () => lastFrame?.sensor?.phase || 'SEARCH',
    state: () => lastFrame
  };
}
