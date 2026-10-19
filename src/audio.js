/**
 * hudlab — Procedural WebAudio Targeting Synthesizer
 * Generates authentic IR seeker growl-to-chirp, STT radar lock tone, RWR launch strobe,
 * sight-grace hold ticks, and loss-of-lock warble without external audio assets.
 */

export function createAudioEngine() {
  let ctx = null;
  let carrierOsc = null;
  let modOsc = null;
  let modGain = null;
  let masterGain = null;
  let isRunning = false;
  let lastState = '';

  function ensureContext() {
    if (typeof window === 'undefined') return false;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    if (!ctx) {
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);

      carrierOsc = ctx.createOscillator();
      carrierOsc.type = 'sawtooth';
      carrierOsc.frequency.value = 140;

      modOsc = ctx.createOscillator();
      modOsc.type = 'square';
      modOsc.frequency.value = 34;

      modGain = ctx.createGain();
      modGain.gain.value = 45;

      modOsc.connect(modGain);
      modGain.connect(carrierOsc.frequency);
      carrierOsc.connect(masterGain);

      carrierOsc.start();
      modOsc.start();
      isRunning = true;
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return isRunning;
  }

  function update(frame, faders) {
    if (!faders.audioEnabled || (faders.audioVolume ?? 0) <= 0.01) {
      if (masterGain && ctx) {
        masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      }
      return;
    }

    if (!ensureContext()) return;

    const vol = Math.min(0.4, (faders.audioVolume ?? 0.35) * 0.22);
    const now = ctx.currentTime;
    const specId = frame.specimen?.id || '';
    const phase = frame.sensor?.phase || 'SEARCH';
    const lockMeter = frame.sensor?.lockMeter || 0;

    if (specId === 'ir-seeker') {
      // Classic AIM-9 Sidewinder growl-to-chirp FM synthesis
      const baseHz = faders.growlBaseHz ?? 140;
      const lockHz = faders.chirpLockHz ?? 920;

      if (phase === 'LOCK') {
        carrierOsc.type = 'triangle';
        carrierOsc.frequency.setTargetAtTime(lockHz, now, 0.03);
        modOsc.frequency.setTargetAtTime(14, now, 0.03);
        modGain.gain.setTargetAtTime(22, now, 0.03);
        masterGain.gain.setTargetAtTime(vol, now, 0.04);
      } else if (phase === 'FLARE_SEDUCED') {
        carrierOsc.type = 'sawtooth';
        carrierOsc.frequency.setTargetAtTime(lockHz * 1.25, now, 0.03);
        modOsc.frequency.setTargetAtTime(9, now, 0.03);
        modGain.gain.setTargetAtTime(180, now, 0.03);
        masterGain.gain.setTargetAtTime(vol * 1.1, now, 0.04);
      } else {
        // Ragged growl rising with lockMeter
        carrierOsc.type = 'sawtooth';
        carrierOsc.frequency.setTargetAtTime(baseHz + lockMeter * 340, now, 0.04);
        modOsc.frequency.setTargetAtTime(28 + lockMeter * 35, now, 0.04);
        modGain.gain.setTargetAtTime(55 + lockMeter * 40, now, 0.04);
        masterGain.gain.setTargetAtTime(vol * (0.45 + lockMeter * 0.55), now, 0.05);
      }
    } else {
      // Tactical tone grammar for radar / optical HUDs
      if (phase === 'LOCK') {
        carrierOsc.type = 'sine';
        carrierOsc.frequency.setTargetAtTime(780, now, 0.03);
        modGain.gain.setTargetAtTime(0, now, 0.03);
        masterGain.gain.setTargetAtTime(vol * 0.7, now, 0.04);
      } else if (phase === 'TRACK' || phase === 'DETECT') {
        const pulse = Math.sin(frame.world.time * (8 + lockMeter * 18)) > 0 ? 1 : 0.1;
        carrierOsc.type = 'triangle';
        carrierOsc.frequency.setTargetAtTime(420 + lockMeter * 260, now, 0.02);
        modGain.gain.setTargetAtTime(0, now, 0.02);
        masterGain.gain.setTargetAtTime(vol * 0.55 * pulse, now, 0.02);
      } else if (phase === 'SIGHT_GRACE') {
        carrierOsc.type = 'sine';
        carrierOsc.frequency.setTargetAtTime(520, now, 0.02);
        modOsc.frequency.setTargetAtTime(6, now, 0.02);
        modGain.gain.setTargetAtTime(40, now, 0.02);
        masterGain.gain.setTargetAtTime(vol * 0.5, now, 0.03);
      } else if (phase === 'LOSS') {
        carrierOsc.type = 'sawtooth';
        carrierOsc.frequency.setTargetAtTime(240, now, 0.02);
        modOsc.frequency.setTargetAtTime(11, now, 0.02);
        modGain.gain.setTargetAtTime(90, now, 0.02);
        masterGain.gain.setTargetAtTime(vol * 0.75, now, 0.03);
      } else {
        masterGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }

    lastState = phase;
  }

  function playOneShot(kind = 'fire', faders = {}) {
    if (!faders.audioEnabled || !ensureContext()) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const vol = Math.min(0.4, (faders.audioVolume ?? 0.35) * 0.35);

    osc.connect(g);
    g.connect(ctx.destination);

    if (kind === 'fire') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.32);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (kind === 'lase') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.11);
      g.gain.setValueAtTime(vol * 0.8, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (kind === 'flare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
      g.gain.setValueAtTime(vol * 0.75, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.23);
    }
  }

  return {
    update,
    playOneShot
  };
}
