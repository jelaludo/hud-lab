/**
 * hudlab — Main Interactive Laboratory Application (`src/app.js`)
 * Coordinates the 6-layer seat architecture, collapsible fader groups,
 * side-by-side compare mode, real-time stats & spec cards, and export/clipboard tools.
 */

import { FAMILIES, SPECIMENS, SCENARIOS, getSpecimen } from './catalogue.js';
import {
  FADER_GROUPS,
  ERA_MODES,
  LOOK_PRESETS,
  buildDefaultFaders,
  applyEraModeToFaders,
  getModifiedFaders,
  computeHudStats
} from './faders.js';
import { createWorld } from './world.js';
import { createSeat } from './seat.js';
import { createPresentation } from './presentation.js';
import { createAudioEngine } from './audio.js';
import {
  formatVariablesOnly,
  parseVariablesFromText,
  buildFullLookAndFeelBundle,
  buildMarkdownReport,
  copyTextToClipboard,
  downloadTextFile,
  exportCompositePng
} from './export.js';

export function initHudLabApp() {
  // Parse URL params (`?specimen=saclos&era=futuristic&compare=arcade-lock&scenario=masked`)
  const params = new URLSearchParams(window.location.search);
  const initialSpecimenId = params.get('specimen') || 'stalheart-quiver';
  const initialCompareId = params.get('compare') || '';
  const initialScenario = params.get('scenario') || '';
  const initialEra = params.get('era') || 'default';

  let activeSpecimen = getSpecimen(initialSpecimenId);
  let compareEnabled = Boolean(initialCompareId);
  let compareSpecimen = getSpecimen(initialCompareId || 'arcade-lock');

  // Live fader state
  let faders = buildDefaultFaders(activeSpecimen.id, initialEra);
  if (initialScenario && SCENARIOS.some((s) => s.id === initialScenario)) {
    faders.scenarioId = initialScenario;
  }

  // Track which fader accordion groups are open
  const openGroups = new Set(
    FADER_GROUPS.filter((g) => g.defaultOpen).map((g) => g.id)
  );

  // Copy format selection ('json-all' | 'json-diff' | 'esm' | 'css')
  let copyFormat = 'json-all';
  let activeBottomTab = 'stats'; // 'stats' | 'speccard'

  // Shared world clock so primary & compare seats observe the exact same contacts & time
  const sharedWorld = createWorld();
  const audioEngine = createAudioEngine();

  // DOM References
  const familyFilterEl = document.getElementById('family-filter-bar');
  const specimenSearchEl = document.getElementById('specimen-search');
  const specimenListEl = document.getElementById('specimen-list');
  const faderAccordionEl = document.getElementById('fader-accordion');
  const primaryViewportEl = document.getElementById('primary-viewport');
  const compareViewportEl = document.getElementById('compare-viewport');
  const viewportSplitContainer = document.getElementById('viewport-split-container');
  const compareToggleBtn = document.getElementById('btn-toggle-compare');
  const compareSelectEl = document.getElementById('compare-specimen-select');
  const targetQuickBarEl = document.getElementById('target-quick-bar');
  const bottomDrawerContentEl = document.getElementById('bottom-drawer-content');
  const toastEl = document.getElementById('hud-toast');
  const exportModalEl = document.getElementById('export-modal');
  const exportPreviewEl = document.getElementById('export-preview-code');
  const pasteModalEl = document.getElementById('paste-modal');
  const pasteTextareaEl = document.getElementById('paste-textarea');

  // Create Presentations & Seats
  const primaryPresentation = createPresentation(primaryViewportEl);
  let comparePresentation = null;

  const primarySeat = createSeat(primaryViewportEl, {
    getSpecimen: () => activeSpecimen,
    getFaders: () => faders,
    getSharedWorld: () => sharedWorld,
    getViewport: () => ({
      width: primaryViewportEl.clientWidth || 800,
      height: primaryViewportEl.clientHeight || 520,
      dpr: window.devicePixelRatio || 1
    }),
    onAction: (kind) => audioEngine.playOneShot(kind, faders)
  });

  const compareSeat = createSeat(compareViewportEl, {
    getSpecimen: () => compareSpecimen,
    getFaders: () => ({
      ...buildDefaultFaders(compareSpecimen.id, faders.eraMode || 'default'),
      scenarioId: faders.scenarioId,
      contactCount: faders.contactCount,
      contactSpeed: faders.contactSpeed,
      terrainMasking: faders.terrainMasking,
      decoyRate: faders.decoyRate,
      fov: faders.fov,
      zoom: faders.zoom
    }),
    getSharedWorld: () => sharedWorld,
    getViewport: () => ({
      width: compareViewportEl.clientWidth || 500,
      height: compareViewportEl.clientHeight || 520,
      dpr: window.devicePixelRatio || 1
    })
  });

  // Start by auto-aiming at BANDIT-1 (`c1`) so the user immediately sees the HUD acquiring & locking
  primarySeat.aim('c1');
  compareSeat.aim('c1');

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      toastEl.classList.remove('visible');
    }, 2400);
  }

  // ============================================================================
  // 1. SPECIMEN CATALOGUE SIDEBAR
  // ============================================================================
  let selectedFamily = 'ALL';
  let searchQuery = '';

  function renderFamilyFilter() {
    const items = [{ id: 'ALL', label: 'All (19)' }, ...FAMILIES.map((f) => ({ id: f.id, label: f.id }))];
    familyFilterEl.innerHTML = items
      .map(
        (item) => `
        <button class="family-pill ${selectedFamily === item.id ? 'active' : ''}" data-family="${item.id}">
          ${item.label}
        </button>
      `
      )
      .join('');

    familyFilterEl.querySelectorAll('.family-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedFamily = btn.dataset.family;
        renderFamilyFilter();
        renderSpecimenList();
      });
    });
  }

  function renderSpecimenList() {
    const q = searchQuery.trim().toLowerCase();
    const filtered = SPECIMENS.filter((s) => {
      if (selectedFamily !== 'ALL' && s.family !== selectedFamily) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q)
      );
    });

    // Group by family
    const groupedHtml = FAMILIES.map((fam) => {
      const specs = filtered.filter((s) => s.family === fam.id);
      if (specs.length === 0) return '';
      return `
        <div class="catalogue-family-group">
          <div class="catalogue-family-header" style="border-left-color: ${fam.color}">
            <span class="catalogue-family-title">${fam.name}</span>
          </div>
          <div class="catalogue-specimen-items">
            ${specs
              .map(
                (s) => `
              <button class="specimen-card-btn ${s.id === activeSpecimen.id ? 'active' : ''}" data-specimen-id="${s.id}">
                <div class="specimen-card-top">
                  <span class="specimen-code">${s.code}</span>
                  <span class="specimen-name">${s.shortName}</span>
                  ${s.hasInset ? '<span class="specimen-badge">INSET</span>' : ''}
                </div>
                <div class="specimen-card-desc">${s.summary}</div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }).join('');

    specimenListEl.innerHTML =
      groupedHtml || `<div class="empty-catalogue">No matching HUD specimens.</div>`;

    specimenListEl.querySelectorAll('.specimen-card-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectSpecimen(btn.dataset.specimenId);
      });
    });
  }

  function syncEraButtonsUI() {
    const activeEra = faders.eraMode || 'default';
    document.querySelectorAll('[data-set-era]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.setEra === activeEra);
    });
  }

  function selectSpecimen(id, preserveCrossCutting = true) {
    const next = getSpecimen(id);
    if (!next) return;
    const prevEra = faders.eraMode || 'default';
    const prevScenario = {
      scenarioId: faders.scenarioId,
      contactCount: faders.contactCount,
      contactSpeed: faders.contactSpeed,
      terrainMasking: faders.terrainMasking,
      decoyRate: faders.decoyRate,
      audioEnabled: faders.audioEnabled,
      audioVolume: faders.audioVolume
    };
    activeSpecimen = next;
    faders = buildDefaultFaders(activeSpecimen.id, preserveCrossCutting ? prevEra : 'default');
    if (preserveCrossCutting) {
      Object.assign(faders, prevScenario);
    }
    primarySeat.resetLock();
    const currentAuto = primarySeat.getAutoPilotContactId() || 'c1';
    primarySeat.aim(currentAuto);

    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('specimen', activeSpecimen.id);
    if (faders.eraMode && faders.eraMode !== 'default') {
      url.searchParams.set('era', faders.eraMode);
    } else {
      url.searchParams.delete('era');
    }
    window.history.replaceState({}, '', url);

    syncEraButtonsUI();
    renderSpecimenList();
    renderFaderGroups();
    renderBottomDrawer(primarySeat.state());
    showToast(`Loaded ${activeSpecimen.code}: ${activeSpecimen.name}`);
  }

  if (specimenSearchEl) {
    specimenSearchEl.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderSpecimenList();
    });
  }

  // ============================================================================
  // 2. COLLAPSIBLE TUNABLE SLIDER GROUPS (FADERS)
  // ============================================================================
  function getControlsForGroup(group) {
    if (group.dynamicSpecimen) {
      return (activeSpecimen.specimenFaders || []).map((sf) => ({
        ...sf,
        type: 'range'
      }));
    }
    return group.controls;
  }

  function renderFaderGroups() {
    const defaults = buildDefaultFaders(activeSpecimen.id);

    faderAccordionEl.innerHTML = FADER_GROUPS.map((group) => {
      const controls = getControlsForGroup(group);
      const isOpen = openGroups.has(group.id);
      const modCount = controls.filter(
        (c) => defaults[c.key] !== undefined && faders[c.key] !== defaults[c.key]
      ).length;

      return `
        <section class="fader-group ${isOpen ? 'open' : 'collapsed'}" data-group-id="${group.id}">
          <header class="fader-group-header" data-toggle-group="${group.id}">
            <div class="fader-group-title-wrap">
              <span class="fader-group-chevron">${isOpen ? '▾' : '▸'}</span>
              <span class="fader-group-icon">${group.icon}</span>
              <span class="fader-group-title">${
                group.dynamicSpecimen
                  ? `4. ${activeSpecimen.shortName} Tunables`
                  : group.title
              }</span>
            </div>
            <div class="fader-group-actions">
              ${
                modCount > 0
                  ? `<span class="fader-mod-badge" title="${modCount} tweaked">${modCount} mod</span>`
                  : ''
              }
              <button class="fader-group-reset-btn" data-reset-group="${group.id}" title="Reset this group to default">↺</button>
            </div>
          </header>
          <div class="fader-group-body">
            <p class="fader-group-desc">${group.description}</p>
            <div class="fader-controls-list">
              ${controls.map((ctrl) => renderSingleControl(ctrl, faders[ctrl.key], defaults[ctrl.key])).join('')}
            </div>
          </div>
        </section>
      `;
    }).join('');

    // Bind accordion expand/collapse headers
    faderAccordionEl.querySelectorAll('[data-toggle-group]').forEach((hdr) => {
      hdr.addEventListener('click', (e) => {
        if (e.target.closest('[data-reset-group]')) return;
        const gid = hdr.dataset.toggleGroup;
        if (openGroups.has(gid)) {
          openGroups.delete(gid);
        } else {
          openGroups.add(gid);
        }
        renderFaderGroups();
      });
    });

    // Bind per-group reset buttons
    faderAccordionEl.querySelectorAll('[data-reset-group]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gid = btn.dataset.resetGroup;
        const group = FADER_GROUPS.find((g) => g.id === gid);
        if (!group) return;
        const freshDefaults = buildDefaultFaders(activeSpecimen.id);
        for (const ctrl of getControlsForGroup(group)) {
          faders[ctrl.key] = freshDefaults[ctrl.key];
        }
        renderFaderGroups();
        showToast(`Reset ${group.title}`);
      });
    });

    // Bind real-time slider / select / toggle / color inputs
    faderAccordionEl.querySelectorAll('[data-fader-key]').forEach((input) => {
      const key = input.dataset.faderKey;
      const type = input.dataset.faderType;

      const handler = () => {
        let val;
        if (type === 'range') {
          val = parseFloat(input.value);
        } else if (type === 'toggle') {
          val = input.checked;
        } else {
          val = input.value;
        }
        applyFaderChange(key, val, false);

        // Update inline readout without full DOM rebuild so dragging is silky smooth
        const row = input.closest('.fader-row');
        if (row) {
          const valSpan = row.querySelector('.fader-val-text');
          const unit = input.dataset.faderUnit || '';
          if (valSpan && type === 'range') {
            valSpan.textContent = `${formatNumber(val, parseFloat(input.step || '1'))}${unit}`;
          }
          const defVal = defaults[key];
          row.classList.toggle('is-modified', defVal !== undefined && val !== defVal);
        }
      };

      input.addEventListener('input', handler);
      input.addEventListener('change', () => {
        handler();
        // Refresh group modified count badge on change release
        if (key === 'eraMode' || key === 'look' || key === 'scenarioId') {
          renderFaderGroups();
          syncEraButtonsUI();
        }
      });

      // Double-click any slider to reset that single variable to default
      if (type === 'range') {
        input.addEventListener('dblclick', () => {
          const defVal = defaults[key];
          if (defVal !== undefined) {
            input.value = defVal;
            handler();
            renderFaderGroups();
            showToast(`Reset ${key} to ${defVal}`);
          }
        });
      }
    });
  }

  function renderSingleControl(ctrl, currentVal, defaultVal) {
    const isModified = defaultVal !== undefined && currentVal !== defaultVal;
    const unit = ctrl.unit || '';

    if (ctrl.type === 'toggle') {
      return `
        <label class="fader-row fader-row-toggle ${isModified ? 'is-modified' : ''}">
          <span class="fader-label">${ctrl.label}</span>
          <input type="checkbox" class="fader-checkbox" data-fader-key="${ctrl.key}" data-fader-type="toggle" ${currentVal ? 'checked' : ''} />
        </label>
      `;
    }

    if (ctrl.type === 'select') {
      return `
        <div class="fader-row fader-row-select ${isModified ? 'is-modified' : ''}">
          <label class="fader-label">${ctrl.label}</label>
          <select class="fader-select" data-fader-key="${ctrl.key}" data-fader-type="select">
            ${ctrl.options
              .map(
                (opt) =>
                  `<option value="${opt.value}" ${currentVal === opt.value ? 'selected' : ''}>${opt.label}</option>`
              )
              .join('')}
          </select>
        </div>
      `;
    }

    if (ctrl.type === 'color') {
      return `
        <div class="fader-row fader-row-color ${isModified ? 'is-modified' : ''}">
          <label class="fader-label">${ctrl.label}</label>
          <div class="fader-color-wrap">
            <span class="fader-val-text">${currentVal}</span>
            <input type="color" class="fader-color-input" data-fader-key="${ctrl.key}" data-fader-type="color" value="${currentVal}" />
          </div>
        </div>
      `;
    }

    // Default: range slider
    const formatted = formatNumber(currentVal ?? ctrl.default, ctrl.step);
    return `
      <div class="fader-row fader-row-range ${isModified ? 'is-modified' : ''}" title="Double-click slider to reset to default (${ctrl.default}${unit})">
        <div class="fader-row-top">
          <label class="fader-label">${ctrl.label}</label>
          <span class="fader-val-text">${formatted}${unit}</span>
        </div>
        <input
          type="range"
          class="fader-slider"
          data-fader-key="${ctrl.key}"
          data-fader-type="range"
          data-fader-unit="${unit}"
          min="${ctrl.min}"
          max="${ctrl.max}"
          step="${ctrl.step}"
          value="${currentVal ?? ctrl.default}"
        />
      </div>
    `;
  }

  function formatNumber(val, step = 1) {
    if (typeof val !== 'number' || Number.isNaN(val)) return '0';
    if (step < 0.1) return val.toFixed(2);
    if (step < 1) return val.toFixed(1);
    return String(Math.round(val));
  }

  function setEraMode(eraMode) {
    if (!ERA_MODES[eraMode]) return;
    applyEraModeToFaders(faders, activeSpecimen.id, eraMode);
    syncEraButtonsUI();
    renderFaderGroups();
    renderBottomDrawer(primarySeat.state());

    const url = new URL(window.location.href);
    if (eraMode !== 'default') {
      url.searchParams.set('era', eraMode);
    } else {
      url.searchParams.delete('era');
    }
    window.history.replaceState({}, '', url);
    showToast(`Applied Look: ${ERA_MODES[eraMode].name}`);
  }

  // Bind Top-Bar 3-Way Era Switcher Buttons
  document.querySelectorAll('[data-set-era]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setEraMode(btn.dataset.setEra);
    });
  });

  function applyFaderChange(key, value, rebuildUi = true) {
    faders[key] = value;

    // If user changed `eraMode` dropdown, apply the full Era Mode overrides
    if (key === 'eraMode' && ERA_MODES[value]) {
      applyEraModeToFaders(faders, activeSpecimen.id, value);
      syncEraButtonsUI();
    }

    // If user changed `look` preset, automatically apply the preset's aesthetic parameters
    if (key === 'look' && LOOK_PRESETS[value]) {
      const preset = LOOK_PRESETS[value];
      faders.primaryColor = preset.primaryColor;
      faders.lockedColor = preset.lockedColor;
      faders.warningColor = preset.warningColor;
      faders.bloomStrength = preset.bloomStrength;
      faders.scanlineIntensity = preset.scanlineIntensity;
      faders.noiseGrain = preset.noiseGrain;
      faders.vignette = preset.vignette;
    }

    // If user changed `scenarioId` preset, apply scenario's recommended contact parameters
    if (key === 'scenarioId') {
      const sc = SCENARIOS.find((s) => s.id === value);
      if (sc) {
        faders.contactCount = sc.contactCount;
        faders.contactSpeed = sc.speedMultiplier;
        faders.terrainMasking = sc.terrainMasking;
        faders.decoyRate = sc.decoyRate;
      }
    }

    if (rebuildUi) {
      renderFaderGroups();
      syncEraButtonsUI();
    }
  }

  // Expand All / Collapse All / Reset All buttons
  document.getElementById('btn-expand-all')?.addEventListener('click', () => {
    if (openGroups.size === FADER_GROUPS.length) {
      openGroups.clear();
    } else {
      FADER_GROUPS.forEach((g) => openGroups.add(g.id));
    }
    renderFaderGroups();
  });

  document.getElementById('btn-reset-all')?.addEventListener('click', () => {
    faders = buildDefaultFaders(activeSpecimen.id, 'default');
    syncEraButtonsUI();
    renderFaderGroups();
    showToast(`Reset all faders for ${activeSpecimen.shortName}`);
  });

  // ============================================================================
  // 3. SIDE-BY-SIDE COMPARE MODE (`hudlab compare <a> <b>`)
  // ============================================================================
  function setupCompareControls() {
    if (!compareSelectEl) return;
    compareSelectEl.innerHTML = SPECIMENS.map(
      (s) =>
        `<option value="${s.id}" ${s.id === compareSpecimen.id ? 'selected' : ''}>${s.code} · ${s.shortName}</option>`
    ).join('');

    compareSelectEl.addEventListener('change', (e) => {
      compareSpecimen = getSpecimen(e.target.value);
      compareSeat.resetLock();
      compareSeat.aim(primarySeat.getAutoPilotContactId() || 'c1');
      showToast(`Compare B set to ${compareSpecimen.name}`);
    });

    compareToggleBtn?.addEventListener('click', () => {
      setCompareMode(!compareEnabled);
    });

    setCompareMode(compareEnabled);
  }

  function setCompareMode(enabled) {
    compareEnabled = Boolean(enabled);
    viewportSplitContainer.classList.toggle('compare-active', compareEnabled);
    compareViewportEl.classList.toggle('hidden', !compareEnabled);
    compareToggleBtn?.classList.toggle('active', compareEnabled);
    if (compareSelectEl) {
      compareSelectEl.disabled = !compareEnabled;
    }
    if (compareEnabled && !comparePresentation) {
      comparePresentation = createPresentation(compareViewportEl);
    }
  }

  // ============================================================================
  // 4. OPERATOR ACTION DECK & TARGET QUICK-SELECT BAR
  // ============================================================================
  function renderTargetQuickBar(frame) {
    if (!targetQuickBarEl || !frame) return;
    const currentAuto = primarySeat.getAutoPilotContactId();
    const buttonsHtml = frame.world.contacts
      .map((c) => {
        const isSelected = currentAuto === c.id;
        return `
          <button class="target-pill ${isSelected ? 'active' : ''} ${c.masked ? 'masked' : ''}" data-aim-id="${c.id}">
            <span>${c.callsign}</span>
            <small>${Math.round(c.distance)}m${c.masked ? ' [MASK]' : ''}</small>
          </button>
        `;
      })
      .join('');

    const keySig = `${frame.world.contacts.map((c) => `${c.id}:${c.masked ? 1 : 0}`).join('|')}|auto:${currentAuto}`;
    if (targetQuickBarEl.dataset.sig !== keySig) {
      targetQuickBarEl.dataset.sig = keySig;
      targetQuickBarEl.innerHTML =
        `<span class="deck-label">CONTACTS:</span>` +
        buttonsHtml +
        `<button class="target-pill sky-pill ${!currentAuto ? 'active' : ''}" data-aim-sky="1">SKY / BREAK</button>`;

      targetQuickBarEl.querySelectorAll('[data-aim-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          primarySeat.aim(btn.dataset.aimId);
          compareSeat.aim(btn.dataset.aimId);
        });
      });
      targetQuickBarEl.querySelector('[data-aim-sky]')?.addEventListener('click', () => {
        primarySeat.aimSky();
        compareSeat.aimSky();
      });
    }
  }

  document.getElementById('btn-action-fire')?.addEventListener('click', () => {
    primarySeat.fire();
    showToast('Launched Ordnance / Missile');
  });

  document.getElementById('btn-action-lase')?.addEventListener('click', () => {
    primarySeat.lase();
    showToast('Laser Rangefinder Pulsed');
  });

  document.getElementById('btn-action-flare')?.addEventListener('click', () => {
    primarySeat.flare();
    showToast('Target Dispensed Countermeasure Flares');
  });

  document.getElementById('btn-action-cage')?.addEventListener('click', () => {
    const caged = primarySeat.cage();
    showToast(caged ? 'Seeker CAGED to Boresight' : 'Seeker UNCAGED');
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      primarySeat.fire();
      showToast('Launched Ordnance');
    } else if (e.key === 'f' || e.key === 'F') {
      primarySeat.flare();
      showToast('Target Dispensed Flares');
    } else if (e.key === 'l' || e.key === 'L') {
      primarySeat.lase();
      showToast('Laser Rangefinder Pulsed');
    } else if (e.key === 'c' || e.key === 'C') {
      const caged = primarySeat.cage();
      showToast(caged ? 'Seeker CAGED' : 'Seeker UNCAGED');
    } else if (e.key === '1') {
      setEraMode('default');
    } else if (e.key === '2') {
      setEraMode('retro-80s');
    } else if (e.key === '3') {
      setEraMode('futuristic');
    } else if (e.key === '4') {
      setEraMode('default-thin');
    } else if (e.key === '5') {
      setEraMode('futuristic-low');
    }
  });

  // ============================================================================
  // 5. BOTTOM STATS & SPEC CARD DRAWER
  // ============================================================================
  document.querySelectorAll('[data-bottom-tab]').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      activeBottomTab = tabBtn.dataset.bottomTab;
      document.querySelectorAll('[data-bottom-tab]').forEach((b) =>
        b.classList.toggle('active', b.dataset.bottomTab === activeBottomTab)
      );
      renderBottomDrawer(primarySeat.state());
    });
  });

  function renderBottomDrawer(frame) {
    if (!bottomDrawerContentEl || !frame) return;
    const { stats, specimen } = frame;

    if (activeBottomTab === 'stats') {
      bottomDrawerContentEl.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">TIME TO LOCK (TTL)</span>
            <span class="stat-value">${stats.acquisition.nominalLockTimeSec}s <small>(${stats.acquisition.nominalLockTimeMs}ms)</small></span>
            <span class="stat-sub">Gate: ${stats.acquisition.angularGateDeg}° · Sticky: ${stats.acquisition.stickinessIndex}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">SIGHT GRACE ("ROCK EDGE")</span>
            <span class="stat-value">${stats.acquisition.sightGraceMs} ms</span>
            <span class="stat-sub">Max Slew: ${stats.acquisition.maxTrackingRateDegSec}°/s</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">OPTICAL ENVELOPE</span>
            <span class="stat-value">${stats.opticsAndEnvelope.effectiveFovDeg}° FOV <small>(${stats.opticsAndEnvelope.opticalMagnification})</small></span>
            <span class="stat-sub">Inset: ${stats.opticsAndEnvelope.insetMagnification} · Gimbal: ${stats.opticsAndEnvelope.gimbalEnvelopeDeg}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">ENGAGEMENT SLANT RANGE</span>
            <span class="stat-value">${stats.opticsAndEnvelope.minRangeM}m – ${stats.opticsAndEnvelope.maxRangeM}m</span>
            <span class="stat-sub">No-Escape Rne: ${stats.opticsAndEnvelope.noEscapeRangeM}m</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">CCM / FLARE REJECTION</span>
            <span class="stat-value">${stats.countermeasuresAndSensors.decoyRejectionScore}</span>
            <span class="stat-sub">Thermal Gain: ${stats.countermeasuresAndSensors.thermalGain}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">ERA LOOK & INK DENSITY</span>
            <span class="stat-value">${stats.ergonomicsAndPresentation.eraMode} <small>(${stats.ergonomicsAndPresentation.inkDensityPercent})</small></span>
            <span class="stat-sub">Line: ${stats.ergonomicsAndPresentation.strokeWidthPx} · Halo: ${stats.ergonomicsAndPresentation.haloIntensity} · Particles: ${stats.ergonomicsAndPresentation.particleDensity}</span>
          </div>
        </div>
      `;
    } else {
      const sc = specimen.specCard;
      bottomDrawerContentEl.innerHTML = `
        <div class="speccard-grid">
          <div class="speccard-col">
            <div class="speccard-field">
              <strong>IDIOM:</strong> <span>${sc.idiom}</span>
            </div>
            <div class="speccard-field">
              <strong>WHAT OPERATOR HOLDS:</strong> <span>${sc.operatorHolds}</span>
            </div>
            <div class="speccard-field">
              <strong>HONEST LIMITS:</strong> <span>${sc.honestLimits}</span>
            </div>
            ${
              sc.gameIdiomTradeoff
                ? `<div class="speccard-tradeoff"><strong>GAME IDIOM REALISM TRADE-OFF (§4 Rule E):</strong> ${sc.gameIdiomTradeoff}</div>`
                : ''
            }
          </div>
          <div class="speccard-col">
            <div class="speccard-field">
              <strong>PHASES:</strong>
              <div class="speccard-phases">
                ${sc.phases.map((p) => `<span class="phase-chip">${p}</span>`).join(' → ')}
              </div>
            </div>
            <div class="speccard-field">
              <strong>VISUAL & AUDIO CUES:</strong>
              <ul class="speccard-list">
                ${sc.cues.map((c) => `<li>${c}</li>`).join('')}
              </ul>
            </div>
            <div class="speccard-field">
              <strong>REFERENCE GAMES:</strong> <span>${sc.referenceGames.join(' · ')}</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  // ============================================================================
  // 6. COPY VARIABLES ONLY & FULL LOOK+STATS EXPORT SYSTEM
  // ============================================================================
  const copyFormatSelectEl = document.getElementById('copy-format-select');
  if (copyFormatSelectEl) {
    copyFormatSelectEl.addEventListener('change', (e) => {
      copyFormat = e.target.value;
    });
  }

  // One-click "Copy Variables Only" button
  document.getElementById('btn-copy-vars')?.addEventListener('click', async () => {
    const text = formatVariablesOnly(faders, activeSpecimen, copyFormat);
    await copyTextToClipboard(text);
    const modCount = Object.keys(getModifiedFaders(faders, activeSpecimen.id)).length;
    showToast(
      `Copied ${copyFormat.toUpperCase()} variables to clipboard (${modCount} modified)`
    );
  });

  // Open Paste / Import Variables Modal
  document.getElementById('btn-open-paste')?.addEventListener('click', async () => {
    pasteModalEl?.classList.remove('hidden');
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        const clip = await navigator.clipboard.readText();
        if (clip && clip.trim().includes('{')) {
          pasteTextareaEl.value = clip;
        }
      } catch {
        // User can paste manually into textarea
      }
    }
    pasteTextareaEl?.focus();
  });

  document.getElementById('btn-close-paste')?.addEventListener('click', () => {
    pasteModalEl?.classList.add('hidden');
  });

  document.getElementById('btn-apply-paste')?.addEventListener('click', () => {
    try {
      const { specimenId, variables } = parseVariablesFromText(pasteTextareaEl.value);
      if (specimenId && specimenId !== activeSpecimen.id) {
        activeSpecimen = getSpecimen(specimenId);
      }
      Object.assign(faders, variables);
      syncEraButtonsUI();
      renderSpecimenList();
      renderFaderGroups();
      renderBottomDrawer(primarySeat.state());
      pasteModalEl?.classList.add('hidden');
      showToast(`Applied ${Object.keys(variables).length} variables from memory!`);
    } catch (err) {
      showToast(`Parse error: ${err.message}`);
    }
  });

  // Open Full Look & Feel + Stats Export Modal
  let currentExportFormat = 'bundle-json'; // 'bundle-json' | 'markdown' | 'vars-only' | 'esm'

  function refreshExportPreview() {
    if (!exportPreviewEl) return;
    const frame = primarySeat.state();
    if (currentExportFormat === 'bundle-json') {
      const bundle = buildFullLookAndFeelBundle(faders, activeSpecimen, frame);
      exportPreviewEl.value = JSON.stringify(bundle, null, 2);
    } else if (currentExportFormat === 'markdown') {
      exportPreviewEl.value = buildMarkdownReport(faders, activeSpecimen, frame);
    } else if (currentExportFormat === 'esm') {
      exportPreviewEl.value = formatVariablesOnly(faders, activeSpecimen, 'esm');
    } else {
      exportPreviewEl.value = formatVariablesOnly(faders, activeSpecimen, 'json-all');
    }
  }

  document.getElementById('btn-open-export')?.addEventListener('click', () => {
    exportModalEl?.classList.remove('hidden');
    refreshExportPreview();
  });

  document.getElementById('btn-close-export')?.addEventListener('click', () => {
    exportModalEl?.classList.add('hidden');
  });

  document.querySelectorAll('[data-export-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentExportFormat = btn.dataset.exportTab;
      document.querySelectorAll('[data-export-tab]').forEach((b) =>
        b.classList.toggle('active', b.dataset.exportTab === currentExportFormat)
      );
      refreshExportPreview();
    });
  });

  document.getElementById('btn-export-copy-preview')?.addEventListener('click', async () => {
    await copyTextToClipboard(exportPreviewEl.value);
    showToast('Copied export payload to clipboard!');
  });

  document.getElementById('btn-download-bundle')?.addEventListener('click', () => {
    const bundle = buildFullLookAndFeelBundle(faders, activeSpecimen, primarySeat.state());
    downloadTextFile(
      `hudlab-${activeSpecimen.id}-${faders.eraMode || 'default'}-look-and-stats.hudlab.json`,
      JSON.stringify(bundle, null, 2),
      'application/json'
    );
    showToast(`Downloaded ${activeSpecimen.id} Look & Stats Bundle (.hudlab.json)`);
  });

  document.getElementById('btn-download-markdown')?.addEventListener('click', () => {
    const md = buildMarkdownReport(faders, activeSpecimen, primarySeat.state());
    downloadTextFile(
      `hudlab-${activeSpecimen.id}-${faders.eraMode || 'default'}-spec-report.md`,
      md,
      'text/markdown'
    );
    showToast(`Downloaded ${activeSpecimen.id} Markdown Spec & Stats Report`);
  });

  document.getElementById('btn-download-png')?.addEventListener('click', () => {
    exportCompositePng(
      primaryPresentation.getCanvasElements(),
      faders,
      activeSpecimen,
      primarySeat.state()
    );
    showToast('Exported High-DPI HUD Snapshot PNG with Stats Footer');
  });

  document.getElementById('btn-download-standalone-html')?.addEventListener('click', async () => {
    const query = new URLSearchParams({
      specimen: activeSpecimen.id,
      faders: JSON.stringify(faders)
    });
    try {
      const res = await fetch(`/api/standalone?${query.toString()}`);
      if (res.ok) {
        const html = await res.text();
        downloadTextFile(`hudlab-${activeSpecimen.id}-${faders.eraMode || 'default'}-standalone.html`, html, 'text/html');
        showToast(`Downloaded Self-Contained HTML for ${activeSpecimen.shortName}`);
        return;
      }
    } catch {
      // Try static prebuilt dist specimen HTML (GitHub Pages fallback)
    }
    try {
      const distRes = await fetch(`./dist/${activeSpecimen.id}.html`);
      if (distRes.ok) {
        let html = await distRes.text();
        html = html.replace(
          /const baked = \{[\s\S]*?\};/,
          `const baked = ${JSON.stringify(faders)};`
        );
        downloadTextFile(`hudlab-${activeSpecimen.id}-${faders.eraMode || 'default'}-standalone.html`, html, 'text/html');
        showToast(`Downloaded Self-Contained HTML for ${activeSpecimen.shortName}`);
        return;
      }
    } catch {
      // Fallback to JSON bundle
    }
    const bundle = buildFullLookAndFeelBundle(faders, activeSpecimen, primarySeat.state());
    downloadTextFile(
      `hudlab-${activeSpecimen.id}-bundle.json`,
      JSON.stringify(bundle, null, 2),
      'application/json'
    );
    showToast('Downloaded JSON bundle');
  });

  // ============================================================================
  // 7. TEST HARNESS (`window.__hudlabTest` — §7 of hudlab-brief.md)
  // ============================================================================
  window.__hudlabTest = {
    state: () => primarySeat.state(),
    phase: () => primarySeat.phase(),
    aim: (contactId) => primarySeat.aim(contactId),
    aimSky: () => primarySeat.aimSky(),
    hold: (on) => primarySeat.hold(on),
    fire: () => primarySeat.fire(),
    lase: () => primarySeat.lase(),
    flare: () => primarySeat.flare(),
    cage: (val) => (val !== undefined ? primarySeat.forceCage(val) : primarySeat.cage()),
    setSpecimen: (id) => selectSpecimen(id, false),
    setEra: (era) => setEraMode(era),
    setFader: (key, val) => applyFaderChange(key, val, true),
    getFaders: () => ({ ...faders }),
    getStats: () => computeHudStats(faders, activeSpecimen, primarySeat.state()),
    exportBundle: () => buildFullLookAndFeelBundle(faders, activeSpecimen, primarySeat.state()),
    copyVariables: (fmt = 'json-all') => formatVariablesOnly(faders, activeSpecimen, fmt),
    step: (dt = 0.05, count = 1) => {
      let f = null;
      for (let i = 0; i < count; i++) {
        f = stepSimulation(dt);
      }
      return f;
    }
  };

  // ============================================================================
  // 8. MAIN SIMULATION & RENDERING LOOP
  // ============================================================================
  renderFamilyFilter();
  renderSpecimenList();
  renderFaderGroups();
  setupCompareControls();
  syncEraButtonsUI();

  let lastTime = performance.now();
  let lastBottomRefresh = 0;

  function stepSimulation(dt) {
    const primaryFrame = primarySeat.tick(dt);
    primaryPresentation.render(primaryFrame);
    audioEngine.update(primaryFrame, faders);

    if (compareEnabled && comparePresentation) {
      const compareFrame = compareSeat.tick(dt, primaryFrame.world);
      comparePresentation.render(compareFrame);
    }

    renderTargetQuickBar(primaryFrame);
    return primaryFrame;
  }

  function animate(now) {
    const dt = Math.min(0.08, Math.max(0.004, (now - lastTime) / 1000));
    lastTime = now;

    const frame = stepSimulation(dt);

    // Refresh bottom stats drawer ~5 times per second so live numbers update smoothly
    if (now - lastBottomRefresh > 200) {
      lastBottomRefresh = now;
      renderBottomDrawer(frame);
    }

    requestAnimationFrame(animate);
  }

  // Run one initial synchronous tick so DOM and canvas are immediately populated on load
  const initialFrame = stepSimulation(1 / 60);
  renderBottomDrawer(initialFrame);
  requestAnimationFrame(animate);
}
