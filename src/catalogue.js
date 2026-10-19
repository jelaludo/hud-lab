/**
 * hudlab — Catalogue of Targeting Families & Specimens (§4 of hudlab-brief.md)
 * Every specimen defines its Spec Card, default variable overrides, and specimen-specific fader definitions.
 */

export const FAMILIES = [
  {
    id: 'A',
    slug: 'steer-it-yourself',
    name: 'A. Steer-It-Yourself',
    subtitle: 'Operator keeps aiming after launch; missile or round is slaved to line-of-sight or seeker camera.',
    color: '#38bdf8'
  },
  {
    id: 'B',
    slug: 'lock-then-forget',
    name: 'B. Lock-Then-Forget',
    subtitle: 'The lock acquisition before or after launch is the core mechanic; seeker state drives tension.',
    color: '#4ade80'
  },
  {
    id: 'C',
    slug: 'platform-sensors',
    name: 'C. Platform Sensors',
    subtitle: 'Finding, sorting, and designating contacts across radar volumes, passive bearings, and gimbal pods.',
    color: '#fbbf24'
  },
  {
    id: 'D',
    slug: 'gunnery',
    name: 'D. Gunnery & Ballistics',
    subtitle: 'Lead computation, laser rangefinding, time-of-flight curves, and continuous impact prediction.',
    color: '#f472b6'
  },
  {
    id: 'E',
    slug: 'game-idioms',
    name: 'E. Game Idioms',
    subtitle: 'Deliberately unfaithful abstractions for contrast—explicitly showing what realism is dropped and why.',
    color: '#a78bfa'
  }
];

export const SPECIMENS = [
  // ============================================================================
  // FAMILY A: STEER-IT-YOURSELF
  // ============================================================================
  {
    id: 'saclos',
    family: 'A',
    familySlug: 'steer-it-yourself',
    name: 'SACLOS Wire-Guided Beam-Rider',
    shortName: 'SACLOS Wire',
    code: 'A-01',
    platformType: 'turret',
    hasInset: true,
    insetMode: 'flare-zoom',
    summary: 'Crosshair held on target after launch; missile flare dances around line-of-sight with wire-time countdown.',
    specCard: {
      idiom: 'Semi-Automatic Command to Line of Sight (SACLOS) / Wire-Guided Beam-Rider',
      operatorHolds: 'Continuous fine aim on the target throughout entire missile time-of-flight until impact or wire spool exhaustion.',
      phases: ['SEARCH', 'TRACK', 'IN-FLIGHT (WIRE)', 'WIRE LIMIT / LOSS', 'IMPACT'],
      cues: [
        'Bright magnesium xenon tail-flare bobbing inside the inner guidance corridor tube',
        'Spooling wire-length / time-remaining countdown bar shrinking beneath the stadia',
        'Slew-rate tension ring warning when operator pans faster than missile control fins can follow'
      ],
      honestLimits: 'No fire-and-forget; sudden jerky slewing snaps the command wire or throws the round outside the capture beam; smoke/terrain occlusion hides the tail flare.',
      referenceGames: ['Battlefield 4 (TOW / SRAW)', 'War Thunder (IT-1 / Swingfire)', 'Squad (BMG-71 TOW)', 'ArmA 3 (Titan Compact)'],
      stalheartTechniques: ['World-aim stabilization (holdAim)', 'Dynamic in-flight round entity with flare signature', 'Scissored optical zoom inset']
    },
    defaults: {
      fov: 28,
      zoom: 2.5,
      insetZoom: 6.0,
      boxSizePx: 76,
      lockRate: 1.8,
      lossGraceSec: 0.6,
      wireTimeSec: 11.0,
      look: 'flir-ironbow',
      primaryColor: '#ffdd66',
      lockedColor: '#44ff88',
      warningColor: '#ff4444'
    },
    specimenFaders: [
      { key: 'beamCorridorDeg', label: 'Beam Capture Corridor', min: 1.5, max: 12, step: 0.5, unit: '°', default: 4.5 },
      { key: 'flareWobbleAmp', label: 'Missile Flare Wobble', min: 0, max: 25, step: 1, unit: 'px', default: 9 },
      { key: 'maxSlewDegSec', label: 'Wire Snap Slew Limit', min: 5, max: 60, step: 1, unit: '°/s', default: 24 },
      { key: 'wireSpoolMeters', label: 'Max Wire Spool Range', min: 1000, max: 4500, step: 100, unit: 'm', default: 3750 }
    ]
  },
  {
    id: 'tv-eo',
    family: 'A',
    familySlug: 'steer-it-yourself',
    name: 'TV/EO Contrast & Nose-Cam Handover',
    shortName: 'TV-EO Seeker',
    code: 'A-02',
    platformType: 'jet',
    hasInset: true,
    insetMode: 'missile-cam',
    summary: 'Contrast crosshairs lock on silhouette edges; inset switches to the round’s own nose camera after launch with mid-course nudge.',
    specCard: {
      idiom: 'Electro-Optical Contrast Lock + Post-Release Nose Camera Feed (MK-9 / Walleye / Maverick)',
      operatorHolds: 'Pre-launch contrast gate placement, then post-launch observation via weapon video data-link with a single terminal nudge correction.',
      phases: ['SEARCH', 'CONTRAST GATE', 'LOCKED', 'WEAPON VIDEO (POST-RELEASE)', 'TERMINAL NUDGE'],
      cues: [
        'Split white/black polarity crosshairs that snap together when optical contrast exceeds threshold',
        'Picture-in-picture inset switches to the falling weapon’s own camera after release',
        'Static snow increase as the round drops lower toward terrain horizon'
      ],
      honestLimits: 'Loses lock in low-contrast fog/dusk; weapon nose camera cannot look backward once target leaves its narrow gimbal cone.',
      referenceGames: ['Stalheart (SOL-82 / MK-9 pattern)', 'DCS World (AGM-65B / AGM-62 Walleye)', 'Call of Duty 4 (AC-130 / Predator feed)'],
      stalheartTechniques: ['SOL-82 scissored inset feed', 'Camera pose attachment to round entity on release', 'Contrast threshold gate calculation']
    },
    defaults: {
      fov: 42,
      zoom: 1.5,
      insetZoom: 5.5,
      boxSizePx: 88,
      lockRate: 1.25,
      lossGraceSec: 0.5,
      look: 'crt-inset',
      primaryColor: '#e2e8f0',
      lockedColor: '#38bdf8',
      warningColor: '#fb7185'
    },
    specimenFaders: [
      { key: 'contrastThreshold', label: 'Min Optical Contrast', min: 0.1, max: 0.9, step: 0.05, unit: '', default: 0.35 },
      { key: 'nudgeAuthorityDeg', label: 'Terminal Nudge Authority', min: 1, max: 15, step: 0.5, unit: '°', default: 6.0 },
      { key: 'datalinkNoise', label: 'Video Datalink Snow', min: 0, max: 1, step: 0.05, unit: '', default: 0.25 },
      { key: 'gateCollapseSpeed', label: 'Crosshair Snap Speed', min: 1, max: 10, step: 0.5, unit: 'x', default: 4.5 }
    ]
  },

  // ============================================================================
  // FAMILY B: LOCK-THEN-FORGET
  // ============================================================================
  {
    id: 'ir-seeker',
    family: 'B',
    familySlug: 'lock-then-forget',
    name: 'Uncaged IR Seeker (Growl & Flare Pull)',
    shortName: 'IR Seeker',
    code: 'B-01',
    platformType: 'jet',
    hasInset: false,
    insetMode: 'none',
    summary: 'Uncaged seeker ring wanders toward the hottest signature inside the gimbal limit, growls to high chirp, and gets seduced by flares.',
    specCard: {
      idiom: 'Uncaged Infrared Heat-Seeking Reticle with Audio Growl/Chirp & Countermeasure Seduction',
      operatorHolds: 'Boresight placement to capture target heat plume, uncage timing, and manual re-cage button when flares pull the seeker off target.',
      phases: ['CAGED SEARCH', 'UNCAGED TRACK', 'HIGH-TONE LOCK', 'FLARE SEDUCED', 'LOSS'],
      cues: [
        'Small seeker circle physically pulls away from boresight cross toward the highest thermal source in the FOV cone',
        'Audio growl (low ragged FM buzz) transitioning to clear high-pitched 900Hz lock chirp',
        'Visible drift onto ejected flare decoys unless IRCCM slider is tuned or seeker is re-caged'
      ],
      honestLimits: 'Seeker has no IFF and no range readout—it chases the hottest thermal point in its cone, including flares or the sun.',
      referenceGames: ['Falcon BMS / DCS (AIM-9M Sidewinder)', 'Nuclear Option', 'Project Wingman', 'War Thunder Air RB'],
      stalheartTechniques: ['Weighted thermal signature centroid solver', 'Procedural WebAudio growl-to-chirp FM synth', 'Explicit slip/seduction visual trail']
    },
    defaults: {
      fov: 55,
      zoom: 1.0,
      boxSizePx: 120,
      lockRate: 1.5,
      lossGraceSec: 0.45,
      seekerConeDeg: 18,
      irSensitivity: 0.85,
      ccmResistance: 0.35,
      look: 'glass-bloom',
      primaryColor: '#4ade80',
      lockedColor: '#ff3355',
      warningColor: '#fbbf24'
    },
    specimenFaders: [
      { key: 'uncageWanderSpeed', label: 'Seeker Slew Magnet Speed', min: 1, max: 15, step: 0.5, unit: 'x', default: 6.5 },
      { key: 'growlBaseHz', label: 'Seeker Growl Base Freq', min: 80, max: 320, step: 10, unit: 'Hz', default: 140 },
      { key: 'chirpLockHz', label: 'Lock Chirp Frequency', min: 500, max: 1600, step: 25, unit: 'Hz', default: 920 },
      { key: 'flareHeatMultiplier', label: 'Flare Seduction Pull', min: 0.5, max: 5.0, step: 0.25, unit: 'x', default: 2.4 }
    ]
  },
  {
    id: 'iir-clu',
    family: 'B',
    familySlug: 'lock-then-forget',
    name: 'Javelin IIR CLU (Track Gates & Top Attack)',
    shortName: 'IIR CLU',
    code: 'B-02',
    platformType: 'fixed',
    hasInset: true,
    insetMode: 'seeker-wfov',
    summary: 'Day/Thermal sight with operator-sized track gates, TOP vs DIR flight profile icons, and inner brackets that physically snap shut on lock.',
    specCard: {
      idiom: 'Imaging Infrared Command Launch Unit (CLU) with Adjustable Track Gates (FGM-148 Javelin)',
      operatorHolds: 'Seeker cooldown management, sizing track gates around target silhouette, and selecting TOP vs DIRECT attack mode.',
      phases: ['WFOV SEARCH', 'NFOV GATE SIZE', 'SEEKER HANDOFF', 'GATES SNAPPED (LOCK)', 'LOFT LAUNCH'],
      cues: [
        'Surrounding border of illuminated CLU status icons (DAY, WFOV, SEEK, TOP, DIR, BCUL)',
        'Four corner brackets that tighten inward around the target bounding box and turn solid with crosshairs when locked',
        'High-arc loft trajectory preview line when TOP attack mode is selected'
      ],
      honestLimits: 'Requires thermal contrast and brief seeker handoff stabilization; masking behind foliage or cold terrain breaks gate correlation.',
      referenceGames: ['Call of Duty: Modern Warfare (Javelin)', 'Squad / ArmA 3 ACE (FGM-148)', 'Battlefield 3/4'],
      stalheartTechniques: ['Perimeter lamp bezel indicator strip', 'Bounding-box adaptive track gates', 'Loft vs Direct trajectory spline']
    },
    defaults: {
      fov: 32,
      zoom: 2.2,
      insetZoom: 4.5,
      boxSizePx: 92,
      lockRate: 1.1,
      lossGraceSec: 0.55,
      look: 'flir-ironbow',
      primaryColor: '#d9f99d',
      lockedColor: '#22c55e',
      warningColor: '#f97316'
    },
    specimenFaders: [
      { key: 'attackProfile', label: 'Flight Mode (1=TOP, 0=DIR)', min: 0, max: 1, step: 1, unit: '', default: 1 },
      { key: 'gateWidthRatio', label: 'Track Gate Aspect Width', min: 0.5, max: 2.0, step: 0.1, unit: 'x', default: 1.2 },
      { key: 'gateSnapTension', label: 'Bracket Snap Stiffness', min: 1, max: 12, step: 0.5, unit: '', default: 6.0 },
      { key: 'bcuBatterySec', label: 'BCU Coolant Timer', min: 15, max: 120, step: 5, unit: 's', default: 45 }
    ]
  },
  {
    id: 'laser-spot',
    family: 'B',
    familySlug: 'lock-then-forget',
    name: 'Laser Spot Tracker & Buddy Designator',
    shortName: 'Laser Spot',
    code: 'B-03',
    platformType: 'helicopter',
    hasInset: true,
    insetMode: 'tgp-laser',
    summary: 'Tracks a pulsed laser PRF code (1688) painted by self or buddy; supports Lock-Before-Launch (LBL) and Lock-After-Launch (LAL) with TTI.',
    specCard: {
      idiom: 'Semi-Active Laser Homing (SALH) with PRF Code Match & Designator Duty (Hellfire / Paveway)',
      operatorHolds: 'Matching the 4-digit laser PRF code, choosing LBL vs LAL envelope, and keeping the laser spot unmasked during terminal flight.',
      phases: ['SCANNING FOR CODE', 'SPOT DETECTED', 'CODE MATCH LOCK', 'IN-FLIGHT (LASE ON)', 'BACKSCATTER / LOST'],
      cues: [
        'Blinking X-cross diamond that locks onto the reflected laser spot and displays matching 4-digit PRF code (e.g., 1688)',
        'Constraint box showing Lock-After-Launch (LOAL) vs Lock-Before-Launch (LOBL) capture basket',
        'Time-to-Impact (TTI) countdown with explicit "LASE NOW" cue during last 6 seconds of flight'
      ],
      honestLimits: 'Cloud/smoke backscatter blinds the laser spot; mismatching PRF code ignores the spot completely; losing line-of-sight in terminal phase drops guidance.',
      referenceGames: ['DCS AH-64D / A-10C (AGM-114K / GBU-12)', 'Battlefield 3/4 (SOFLAM + Javelin/Guided Shell)', 'ArmA 3 (Dagr / Hellfire)'],
      stalheartTechniques: ['PRF frequency code matching filter', 'Buddy-lase external emitter support', 'Terminal TTI window cue']
    },
    defaults: {
      fov: 38,
      zoom: 1.8,
      insetZoom: 5.0,
      boxSizePx: 84,
      lockRate: 1.4,
      lossGraceSec: 0.5,
      look: 'monochrome-hmd',
      primaryColor: '#34d399',
      lockedColor: '#a3e635',
      warningColor: '#fb7185'
    },
    specimenFaders: [
      { key: 'prfCode', label: 'Seeker PRF Code', min: 1111, max: 1788, step: 1, unit: '', default: 1688 },
      { key: 'loalMode', label: 'Lock-After-Launch (LOAL)', min: 0, max: 1, step: 1, unit: '', default: 1 },
      { key: 'laseDutyWindowSec', label: 'Mandatory Terminal Lase', min: 2, max: 12, step: 0.5, unit: 's', default: 5.0 },
      { key: 'basketSizeDeg', label: 'LOAL Capture Basket', min: 4, max: 20, step: 1, unit: '°', default: 10 }
    ]
  },
  {
    id: 'radar-active',
    family: 'B',
    familySlug: 'lock-then-forget',
    name: 'Active Radar Homing (Fox-3 Pitbull Handover)',
    shortName: 'Active Radar',
    code: 'B-04',
    platformType: 'jet',
    hasInset: false,
    insetMode: 'none',
    summary: 'TD lock box with mid-course datalink umbilical and a dramatic "ACTIVE / PITBULL" handover moment after which the shooter can turn cold.',
    specCard: {
      idiom: 'Active Radar Homing with Mid-Course Datalink & Terminal "Pitbull" Handover (AIM-120 AMRAAM)',
      operatorHolds: 'Keeping target inside radar gimbal limits during mid-course flight until the TTA (Time-to-Active) countdown hits zero, then cranking away.',
      phases: ['SEARCH', 'TWS BUGGED', 'STT LOCK', 'MID-COURSE (ACT COUNTDOWN)', 'PITBULL ACTIVE (TURN COLD)'],
      cues: [
        'Target Designator (TD) box with closure velocity vector, aspect angle caret, and Dynamic Launch Zone (DLZ) staple on the right',
        'Dashed datalink umbilical line connecting launch aircraft symbol to in-flight missile until Pitbull handover',
        'Countdown `ACT 08 -> TTI 04` switching box border from dashed mid-course to solid autonomous diamond ("TURN COLD SAFE")'
      ],
      honestLimits: 'Turning away before `ACT 00` leaves the missile flying to a stale extrapolated point; notching (90° beam aspect) degrades closure gate.',
      referenceGames: ['Falcon 4.0 / BMS', 'DCS F-16C / F/A-18C', 'Nuclear Option', 'VTOL VR'],
      stalheartTechniques: ['DLZ Rmax1/Rne/Rmin range ladder', 'Mid-course datalink state handover', 'Explicit safe-to-turn-away cue']
    },
    defaults: {
      fov: 50,
      zoom: 1.0,
      boxSizePx: 90,
      lockRate: 1.3,
      lossGraceSec: 0.65,
      pitbullTimeSec: 4.5,
      look: 'glass-bloom',
      primaryColor: '#4ade80',
      lockedColor: '#22d3ee',
      warningColor: '#f43f5e'
    },
    specimenFaders: [
      { key: 'pitbullRangeM', label: 'Autonomous Pitbull Range', min: 600, max: 3000, step: 100, unit: 'm', default: 1600 },
      { key: 'dlzRneRatio', label: 'No-Escape Zone Ratio', min: 0.25, max: 0.75, step: 0.05, unit: '', default: 0.48 },
      { key: 'notchGateKnots', label: 'Doppler Notch Blind Gate', min: 10, max: 90, step: 5, unit: 'kt', default: 35 },
      { key: 'loftAngleDeg', label: 'Mid-Course Loft Arc', min: 0, max: 30, step: 2, unit: '°', default: 14 }
    ]
  },
  {
    id: 'radar-semi-active',
    family: 'B',
    familySlug: 'lock-then-forget',
    name: 'Semi-Active Radar CW Illumination (Fox-1 Nag)',
    shortName: 'Semi-Active CW',
    code: 'B-05',
    platformType: 'jet',
    hasInset: false,
    insetMode: 'none',
    summary: 'Continuous-Wave radar flood cone requires the shooter to maintain STT illumination all the way to impact; HUD nags loudly if aim drifts.',
    specCard: {
      idiom: 'Semi-Active Radar Homing (SARH) with Continuous-Wave Flood Cone & Illumination Nag (AIM-7 Sparrow)',
      operatorHolds: 'Unbroken Single-Target-Track (STT) illumination from launch to splash; operator cannot turn cold or switch targets.',
      phases: ['SEARCH', 'STT ILLUMINATING', 'FOX-1 IN FLIGHT', 'ILLUMINATION DRIFT NAG', 'LOST FLOOD'],
      cues: [
        'Concentric Continuous-Wave (CW) flood rings around the reticle showing the radar reflection cone energy',
        'Signal-to-Noise (SNR) reflection bar beside the diamond that drops if the target approaches the gimbal edge',
        'Urgent flashing "HOLD ILLUM / RE-CENTER" nag arrow if shooter slews near the flood cone boundary while a missile is in flight'
      ],
      honestLimits: 'Zero autonomy—if the shooter breaks lock for even a second beyond grace time, the missile goes ballistic and misses.',
      referenceGames: ['DCS F-14B / F-4E (AIM-7M)', 'War Thunder Top Tier (R-27ER / AIM-7F)', 'Ace Combat (SAAM ring)'],
      stalheartTechniques: ['CW illumination cone attenuation curve', 'In-flight obligation nag state', 'Signal reflection bar']
    },
    defaults: {
      fov: 48,
      zoom: 1.0,
      boxSizePx: 105,
      lockRate: 1.15,
      lossGraceSec: 0.4,
      look: 'glass-bloom',
      primaryColor: '#38bdf8',
      lockedColor: '#facc15',
      warningColor: '#ef4444'
    },
    specimenFaders: [
      { key: 'floodConeDeg', label: 'CW Flood Cone Radius', min: 4, max: 25, step: 1, unit: '°', default: 11 },
      { key: 'snrDropoffExp', label: 'Edge SNR Falloff', min: 1, max: 4, step: 0.25, unit: '', default: 2.0 },
      { key: 'nagThreshold', label: 'Illumination Nag Trigger', min: 0.3, max: 0.9, step: 0.05, unit: '', default: 0.65 },
      { key: 'cwPulseRings', label: 'Flood Ring Density', min: 2, max: 8, step: 1, unit: '', default: 4 }
    ]
  },
  {
    id: 'coords',
    family: 'B',
    familySlug: 'lock-then-forget',
    name: 'GNSS/INS Coordinate Bombing (CEP & LAR)',
    shortName: 'GNSS Coords',
    code: 'B-06',
    platformType: 'jet',
    hasInset: true,
    insetMode: 'top-down-lar',
    summary: 'No optical or radar lock on target at all—projects a ground Circular Error Probable (CEP) ellipse and Launch Acceptability Region (LAR).',
    specCard: {
      idiom: 'Inertial / GPS Coordinate Guidance with Probable-Error Ellipse & LAR (JDAM / SDB)',
      operatorHolds: 'Designating a ground coordinate (SPI), waiting for INS/GPS transfer alignment quality, and releasing inside the LAR footprint.',
      phases: ['NO SPI', 'COORD TRANSFER', 'IN LAR (RELEASE READY)', 'OUT OF LAR', 'WEAPON TOF'],
      cues: [
        'Perspective-projected ground ellipse showing Circular Error Probable (CEP) shrinking as GPS handoff completes',
        'Launch Acceptability Region (LAR) keyhole polygon in the top-down inset showing maximum glide & turn footprint',
        'Steering ASL line with release staple—works identically through 100% cloud/terrain masking because it targets coordinates, not signatures'
      ],
      honestLimits: 'Cannot hit moving targets unless continuously updated; moving vehicles drive right out of the static ground coordinate diamond.',
      referenceGames: ['DCS F-16C / F/A-18C (GBU-38/31 JDAM)', 'Falcon BMS', 'Tiny Combat Arena'],
      stalheartTechniques: ['3D-to-2D ground plane ellipse projection', 'Signature-independent coordinate SPI', 'Top-down LAR footprint inset']
    },
    defaults: {
      fov: 52,
      zoom: 1.0,
      insetZoom: 2.5,
      boxSizePx: 100,
      lockRate: 0.9,
      lossGraceSec: 2.0,
      look: 'monochrome-hmd',
      primaryColor: '#4ade80',
      lockedColor: '#38bdf8',
      warningColor: '#fb923c'
    },
    specimenFaders: [
      { key: 'cepRadiusMeters', label: 'Base CEP Error Radius', min: 2, max: 60, step: 2, unit: 'm', default: 14 },
      { key: 'gpsAlignmentRate', label: 'INS/GPS Alignment Speed', min: 0.5, max: 4.0, step: 0.25, unit: 'x', default: 1.5 },
      { key: 'larMaxRangeM', label: 'Glide LAR Max Footprint', min: 1200, max: 5000, step: 100, unit: 'm', default: 3200 },
      { key: 'jammingDrift', label: 'GPS Jamming CEP Inflation', min: 1.0, max: 5.0, step: 0.25, unit: 'x', default: 1.0 }
    ]
  },

  // ============================================================================
  // FAMILY C: PLATFORM SENSORS
  // ============================================================================
  {
    id: 'fcr-scan',
    family: 'C',
    familySlug: 'platform-sensors',
    name: 'Mechanical Sweep B-Scope FCR (RWS / TWS / STT)',
    shortName: 'FCR B-Scope',
    code: 'C-01',
    platformType: 'jet',
    hasInset: true,
    insetMode: 'b-scope',
    summary: 'Mechanical raster sweep bar across azimuth & elevation bars; contacts only update when the sweep beam passes over them.',
    specCard: {
      idiom: 'Mechanically Scanned Fire Control Radar B-Scope (Range vs Azimuth Raster)',
      operatorHolds: 'Managing scan azimuth width (±60° vs ±20°) and elevation bar count to balance scan revisit speed against volume coverage.',
      phases: ['RWS SWEEP', 'TWS BUGGED', 'STT BEAM LOCK', 'MEMORY COAST', 'LOST TRACK'],
      cues: [
        'Moving vertical sweep line with elevation bar indicator (1B–4B); bricks fade slowly via phosphor decay until struck again by the beam',
        'Bugged target gets a circle and velocity leader vector; narrowing azimuth to ±15° triples the update rate',
        'Ghost brick ("COAST") blinks when a contact is terrain-masked during a sweep pass'
      ],
      honestLimits: 'Wide ±60° 4-bar scan takes seconds per frame—fast crossing targets jump in discrete steps between sweeps unless narrowed or locked in STT.',
      referenceGames: ['Falcon BMS (AN/APG-68)', 'DCS F-16C / F-15C', 'Jane’s F/A-18'],
      stalheartTechniques: ['Discrete sweep-hit sample buffer', 'Azimuth vs frame-time trade-off', 'Dual B-scope MFD + HUD TD overlay']
    },
    defaults: {
      fov: 55,
      zoom: 1.0,
      boxSizePx: 88,
      lockRate: 1.2,
      lossGraceSec: 1.2,
      look: 'crt-inset',
      primaryColor: '#22c55e',
      lockedColor: '#eab308',
      warningColor: '#ef4444'
    },
    specimenFaders: [
      { key: 'scanAzimuthDeg', label: 'Scan Azimuth Volume', min: 15, max: 60, step: 15, unit: '°', default: 30 },
      { key: 'elevationBars', label: 'Elevation Raster Bars', min: 1, max: 4, step: 1, unit: 'B', default: 2 },
      { key: 'sweepSpeedDegSec', label: 'Antenna Gimbal Sweep Rate', min: 40, max: 200, step: 10, unit: '°/s', default: 110 },
      { key: 'brickPhosphorSec', label: 'Hit Brick Decay Time', min: 0.5, max: 4.0, step: 0.25, unit: 's', default: 1.8 }
    ]
  },
  {
    id: 'aesa',
    family: 'C',
    familySlug: 'platform-sensors',
    name: 'AESA Agile Multi-Track Radar (Instant Refresh)',
    shortName: 'AESA Multi-Track',
    code: 'C-02',
    platformType: 'jet',
    hasInset: true,
    insetMode: 'aesa-hsd',
    summary: 'No mechanical sweep bar—electronic agile beams paint and update all tracks simultaneously with threat-priority numbering.',
    specCard: {
      idiom: 'Active Electronically Scanned Array (AESA) Simultaneous Multi-Target Track (AN/APG-81)',
      operatorHolds: 'Sorting priority targets (1, 2, 3...) and managing multi-target engagement queues without losing situational awareness.',
      phases: ['AGILE SEARCH', 'MULTI-TRACK (TWS)', 'PRIORITY QUEUE LOCK', 'SIMULTANEOUS ENGAGE', 'MASKED'],
      cues: [
        'Instant high-rate track updates across all contacts in the cone with flicker of micro-beams connecting array to prioritized targets',
        'Numbered priority diamonds (1, 2, 3, 4) automatically sorted by closure threat and range',
        'Contrast against `fcr-scan`: zero sweep delay, immediate velocity vector change detection'
      ],
      honestLimits: 'Still bound by physical radar cone ±60° and line-of-sight terrain masking; high-power active emissions light up enemy RWRs.',
      referenceGames: ['DCS F/A-18C / F-15E (APG-79/82)', 'Ace Combat 7 (4AAM/8AAM)', 'Nuclear Option'],
      stalheartTechniques: ['Simultaneous multi-contact state evaluation', 'Threat-priority scoring & numbering', 'Agile beam flash visualization']
    },
    defaults: {
      fov: 55,
      zoom: 1.0,
      boxSizePx: 95,
      lockRate: 2.2,
      lossGraceSec: 0.8,
      look: 'glass-bloom',
      primaryColor: '#38bdf8',
      lockedColor: '#4ade80',
      warningColor: '#f43f5e'
    },
    specimenFaders: [
      { key: 'maxSimultaneousTracks', label: 'Max Priority Tracks', min: 1, max: 8, step: 1, unit: '', default: 4 },
      { key: 'beamUpdateHz', label: 'Electronic Dwell Rate', min: 5, max: 60, step: 5, unit: 'Hz', default: 30 },
      { key: 'showAgileBeams', label: 'Show Dwell Micro-Beams', min: 0, max: 1, step: 1, unit: '', default: 1 },
      { key: 'lpiMode', label: 'Low-Probability-Intercept', min: 0, max: 1, step: 1, unit: '', default: 0 }
    ]
  },
  {
    id: 'irst',
    family: 'C',
    familySlug: 'platform-sensors',
    name: 'Passive IRST (Angle-Only & Kinematic Range)',
    shortName: 'Passive IRST',
    code: 'C-03',
    platformType: 'jet',
    hasInset: false,
    insetMode: 'none',
    summary: '100% passive thermal search: gives razor-sharp azimuth/elevation angle immediately, but range is unknown until ownship maneuvers to triangulate.',
    specCard: {
      idiom: 'Infrared Search & Track (IRST) — Passive Bearing Line & Kinematic Range Triangulation (OLS-35 / PIRATE)',
      operatorHolds: 'Silent tracking without alerting enemy RWR; weaving or banking ownship laterally to shrink the range uncertainty bracket.',
      phases: ['PASSIVE SCAN', 'ANGLE TRACK (NO RANGE)', 'TRIANGULATING RANGE', 'KINEMATIC LOCK', 'LOST PLUME'],
      cues: [
        'Crisp angular bearing cross with an elongated range-uncertainty bar (`RNG ??? -> ±400m -> 1.8km`) instead of a hard range readout',
        'Triangulation baseline meter that fills as the platform moves perpendicular to the line of sight',
        '"EMCON SILENT" badge proving zero RF emissions'
      ],
      honestLimits: 'Cannot measure direct range instantly like radar unless the laser rangefinder is fired (at short range) or the platform flies a lateral baseline.',
      referenceGames: ['DCS Su-27 / MiG-29 / Eurofighter', 'War Thunder (OLS-27 / PIRATE)', 'Command: Modern Operations'],
      stalheartTechniques: ['Bearing-only uncertainty bar collapsing to range', 'Lateral parallax accumulator', 'Passive EMCON state indicator']
    },
    defaults: {
      fov: 50,
      zoom: 1.2,
      boxSizePx: 86,
      lockRate: 1.1,
      lossGraceSec: 0.7,
      look: 'monochrome-hmd',
      primaryColor: '#fbbf24',
      lockedColor: '#4ade80',
      warningColor: '#f87171'
    },
    specimenFaders: [
      { key: 'triangulationRate', label: 'Parallax Range Solve Speed', min: 0.2, max: 3.0, step: 0.1, unit: 'x', default: 1.2 },
      { key: 'laserRangeThresholdM', label: 'Auto-Laser Range Max', min: 500, max: 3000, step: 100, unit: 'm', default: 1500 },
      { key: 'plumeSensitivity', label: 'Thermal Plume Gain', min: 0.5, max: 2.5, step: 0.1, unit: 'x', default: 1.3 },
      { key: 'showBaselineArc', label: 'Show Parallax Baseline Arc', min: 0, max: 1, step: 1, unit: '', default: 1 }
    ]
  },
  {
    id: 'tgp-mts',
    family: 'C',
    familySlug: 'platform-sensors',
    name: 'Slewable Targeting Pod Ball (Litening / Sniper / TADS)',
    shortName: 'TGP / MTS Ball',
    code: 'C-04',
    platformType: 'helicopter',
    hasInset: true,
    insetMode: 'tgp-full',
    summary: 'WHOT/BHOT thermal ball with POINT vs AREA track, offset cursor, laser range readout, and gimbal limit roll / keyhole warning.',
    specCard: {
      idiom: 'Electro-Optical / FLIR Slewable Targeting Pod Ball (AN/AAQ-28 Litening / AN/AAQ-33 Sniper / TADS)',
      operatorHolds: 'Toggling WHOT/BHOT polarity, switching AREA vs POINT track, managing offset cursor, and avoiding gimbal nadir lock.',
      phases: ['INR (INERTIAL)', 'AREA TRACK', 'POINT TRACK (BOX)', 'LASE DESIGNATING', 'GIMBAL LIMIT ROLL'],
      cues: [
        'Top-down gimbal look-angle diamond ("yardstick") and azimuth/elevation tape showing where the ball is looking relative to the airframe nose',
        'AREA track (stabilized ground patch) vs POINT track (solid box snapped onto moving vehicle edges)',
        'Gimbal limit warning (`GIMBAL ROLL`) when slewing past nadir or airframe masking boundary'
      ],
      honestLimits: 'Looking straight down or behind the wing masks the pod behind the fuselage or causes a rapid 180° gimbal roll that momentarily blurs track.',
      referenceGames: ['Stalheart (Gunship FLIR seat)', 'DCS A-10C / F-16C / AH-64D', 'Battlefield 3/4 Viper Gunner', 'ArmA 3 Targeting Camera'],
      stalheartTechniques: ['Gunship FLIR seat adapter', 'WHOT/BHOT/Ironbow look filter', 'Gimbal keyhole & roll dynamics']
    },
    defaults: {
      fov: 26,
      zoom: 2.8,
      insetZoom: 7.0,
      gimbalLimitDeg: 55,
      boxSizePx: 72,
      lockRate: 1.5,
      lossGraceSec: 0.6,
      look: 'flir-ironbow',
      primaryColor: '#f8fafc',
      lockedColor: '#38bdf8',
      warningColor: '#f59e0b'
    },
    specimenFaders: [
      { key: 'polarityMode', label: 'Polarity (0=WHOT, 1=BHOT)', min: 0, max: 1, step: 1, unit: '', default: 0 },
      { key: 'pointAreaMode', label: 'Track Mode (1=POINT, 0=AREA)', min: 0, max: 1, step: 1, unit: '', default: 1 },
      { key: 'offsetCursorPx', label: 'Offset Aimpoint Cursor', min: -60, max: 60, step: 5, unit: 'px', default: 0 },
      { key: 'nadirRollZoneDeg', label: 'Gimbal Roll Keyhole', min: 2, max: 20, step: 1, unit: '°', default: 8 }
    ]
  },
  {
    id: 'rwr',
    family: 'C',
    familySlug: 'platform-sensors',
    name: 'Radar Warning Receiver & Launch Strobe (Defensive)',
    shortName: 'RWR Threat Scope',
    code: 'C-05',
    platformType: 'jet',
    hasInset: true,
    insetMode: 'rwr-azimuth',
    summary: 'The defensive flip-side of lock-on: concentric lethality rings, emitter symbols, STT lock diamond, and flashing missile-launch strobe.',
    specCard: {
      idiom: 'Radar Warning Receiver (RWR) Azimuth Threat Scope & HUD Threat Vector (AN/ALR-56 / SPO-15)',
      operatorHolds: 'Reading emitter bearings and lethality rings, notched/beaming incoming locks, and dispensing chaff/flares on launch strobe.',
      phases: ['SEARCH NAILS', 'SPIKE (STT LOCK ON US)', 'MISSILE LAUNCH STROBE', 'NOTCHING / CHAFF', 'CLEAN'],
      cues: [
        'Polar azimuth scope with inner lethal ring and outer detection ring; emitter alphanumeric codes (`29`, `SA6`, `15`, `M`)',
        'Solid diamond + high-rate warble when an emitter shifts from search scan ("nail") to continuous STT lock ("spike")',
        'Flashing dashed strobe line from center to threat bearing when an active missile launch is detected'
      ],
      honestLimits: 'RWR measures signal strength, not true geometric distance—a high-power distant search radar can look closer than a low-power missile seeker.',
      referenceGames: ['Falcon BMS / DCS (ALR-56M / SPO-15 Beryoza)', 'Nuclear Option', 'VTOL VR (ARAD / RWR)'],
      stalheartTechniques: ['Polar azimuth threat projection', 'Search-vs-STT spike state machine', 'Countermeasure chaff/flare dispenser hook']
    },
    defaults: {
      fov: 55,
      zoom: 1.0,
      boxSizePx: 95,
      lockRate: 1.6,
      lossGraceSec: 0.5,
      look: 'crt-inset',
      primaryColor: '#4ade80',
      lockedColor: '#facc15',
      warningColor: '#ef4444'
    },
    specimenFaders: [
      { key: 'hostileSpikeRate', label: 'Enemy Lock Aggression', min: 0.2, max: 2.5, step: 0.1, unit: 'x', default: 1.2 },
      { key: 'strobeBlinkHz', label: 'Launch Strobe Flash Rate', min: 2, max: 14, step: 1, unit: 'Hz', default: 7 },
      { key: 'chaffEffectiveness', label: 'Chaff Break-Lock Chance', min: 0.1, max: 1.0, step: 0.05, unit: '', default: 0.65 },
      { key: 'showHudThreatRing', label: 'Project RWR Ring on HUD', min: 0, max: 1, step: 1, unit: '', default: 1 }
    ]
  },

  // ============================================================================
  // FAMILY D: GUNNERY
  // ============================================================================
  {
    id: 'tank-fcs',
    family: 'D',
    familySlug: 'gunnery',
    name: 'Tank Fire Control ("Lase Then Lead" & Ballistic Stadia)',
    shortName: 'Tank FCS',
    code: 'D-01',
    platformType: 'turret',
    hasInset: true,
    insetMode: 'commander-citv',
    summary: 'Laser rangefinder measures exact distance; tracking target angular velocity for 0.8s automatically offsets the reticle for lead and drop.',
    specCard: {
      idiom: 'Modern Tank Fire Control System — Laser Range, Tachometric Lead & Ballistic Drop (M1A2 GPS / EMES-15)',
      operatorHolds: 'Tracking target smoothly while firing the laser rangefinder ("Lase Then Lead"), keeping the displaced ballistic cross on target center of mass.',
      phases: ['UNLASED STADIA', 'LASING RANGE', 'LEAD COMPUTING', 'SOLUTION READY (FIRE)', 'SLEW RESET'],
      cues: [
        '4-digit glowing ruby/emerald LED range display (`1840 M`) at the bottom of the sight with ammunition type (`APFSDS` vs `HEAT`)',
        'Reticle physically shifts downward (superelevation drop) and sideways (kinematic lead) based on measured range and angular pan rate',
        'Stadia funnel lines at the bottom for manual backup range estimation'
      ],
      honestLimits: 'Lasing the sky or ground behind a crest gives a wildly wrong ballistic drop; changing pan speed suddenly requires ~0.5s for the lead filter to settle.',
      referenceGames: ['Steel Beasts Pro', 'GHPC (Gunner, HEAT, PC!)', 'War Thunder Ground RB', 'Squad Armor'],
      stalheartTechniques: ['Angular rate tachometric lead integrator', 'Ballistic superelevation table (APFSDS vs HEAT)', 'Laser return validation']
    },
    defaults: {
      fov: 24,
      zoom: 3.0,
      insetZoom: 6.0,
      boxSizePx: 70,
      lockRate: 1.7,
      lossGraceSec: 0.5,
      leadFactor: 1.0,
      look: 'raw',
      primaryColor: '#fb7185',
      lockedColor: '#4ade80',
      warningColor: '#fbbf24'
    },
    specimenFaders: [
      { key: 'muzzleVelocityMs', label: 'Shell Muzzle Velocity', min: 600, max: 1800, step: 50, unit: 'm/s', default: 1550 },
      { key: 'gravityDropScale', label: 'Ballistic Drop Multiplier', min: 0.2, max: 3.0, step: 0.1, unit: 'x', default: 1.0 },
      { key: 'leadSmoothingSec', label: 'Tachometric Lead Damping', min: 0.1, max: 1.5, step: 0.1, unit: 's', default: 0.45 },
      { key: 'ammoTypeHeat', label: 'Ammo (0=APFSDS, 1=HEAT)', min: 0, max: 1, step: 1, unit: '', default: 0 }
    ]
  },
  {
    id: 'ccip-ccrp',
    family: 'D',
    familySlug: 'gunnery',
    name: 'CCIP / CCRP Bombing Pipper & Fall Line',
    shortName: 'CCIP / CCRP',
    code: 'D-02',
    platformType: 'jet',
    hasInset: false,
    insetMode: 'none',
    summary: 'Bomb Fall Line hanging from the velocity vector to the Continuously Computed Impact Point pipper, with delayed release cue and pull-up break X.',
    specCard: {
      idiom: 'Continuously Computed Impact Point (CCIP) & Release Point (CCRP) Bombing HUD',
      operatorHolds: 'Placing the live impact pipper over the ground target (CCIP) or flying the Azimuth Steering Line until the release cue drops through the FPM (CCRP).',
      phases: ['CCIP LIVE PIPPER', 'DELAYED PIPPER (UNDER HUD)', 'CCRP STEERING', 'RELEASE CUE DROP', 'BREAK-X PULL UP'],
      cues: [
        'Bomb Fall Line (BFL) connecting the Flight Path Marker (FPM) to the circular CCIP impact pipper on the terrain',
        'Horizontal release cue bar sliding down the steering line as Time-to-Release (TTR) approaches zero',
        'Giant flashing Break-X across the center of the HUD if slant range drops below safe fragmentation altitude'
      ],
      honestLimits: 'Steep dives risk flying into fragmentation envelope (Break-X); shallow level delivery pushes the real impact point below the bottom glass edge.',
      referenceGames: ['Falcon BMS / DCS F-16C', 'War Thunder Sim', 'Tiny Combat Arena'],
      stalheartTechniques: ['Ballistic ground-intersection solver', 'CCIP-to-Delayed-CCRP transition', 'Fragmentation minimum-altitude Break-X']
    },
    defaults: {
      fov: 52,
      zoom: 1.0,
      boxSizePx: 85,
      lockRate: 1.4,
      lossGraceSec: 0.6,
      look: 'glass-bloom',
      primaryColor: '#4ade80',
      lockedColor: '#22d3ee',
      warningColor: '#ef4444'
    },
    specimenFaders: [
      { key: 'deliveryModeCcrp', label: 'Mode (0=CCIP, 1=CCRP)', min: 0, max: 1, step: 1, unit: '', default: 0 },
      { key: 'diveAngleDeg', label: 'Simulated Dive Angle', min: 5, max: 45, step: 1, unit: '°', default: 20 },
      { key: 'fragSafeAltM', label: 'Frag Safe Break-X Range', min: 200, max: 1200, step: 50, unit: 'm', default: 550 },
      { key: 'windDriftKnots', label: 'Crosswind BFL Cant', min: -30, max: 30, step: 2, unit: 'kt', default: 6 }
    ]
  },
  {
    id: 'air-gun',
    family: 'D',
    familySlug: 'gunnery',
    name: 'EEGS Gun Funnel & Lead-Computing Pipper',
    shortName: 'Air Gun Funnel',
    code: 'D-03',
    platformType: 'jet',
    hasInset: false,
    insetMode: 'none',
    summary: 'Ribbon gun funnel sized to target wingspan plus a radar-ranged Lead-Computing Optical Sight (LCOS) pipper with 1-second & 0.5-second bullet TOF arcs.',
    specCard: {
      idiom: 'Enhanced Envelope Gun Sight (EEGS) Funnel & Lead-Computing Optical Sight (LCOS)',
      operatorHolds: 'Matching target wingspan between the curved funnel walls (no radar lock required) or holding the radar-slaved BATR pipper over the bandit.',
      phases: ['FUNNEL ONLY (NO LOCK)', 'RADAR RANGED LCOS', 'IN-RANGE SHOOT CUE', 'BATR (BULLETS AT TARGET)', 'OUT OF RANGE'],
      cues: [
        'Curving ribbon funnel whose width at 0.5s, 1.0s, and 1.5s bullet time-of-flight matches the set target wingspan',
        'With radar lock: T-bar range clock and predicted impact dot (BATR) showing where rounds fired 1 second ago are arriving right now',
        'Flashing `SHOOT` cue when target wingspan fills the funnel at valid radar slant range'
      ],
      honestLimits: 'Gun funnel whips violently during high-G snap rolls due to bullet path lag; incorrect wingspan setting misplaces the manual range gate.',
      referenceGames: ['Falcon BMS / DCS F-16C / F-15C', 'Ace Combat (Gun reticle)', 'Project Wingman'],
      stalheartTechniques: ['Multi-node bullet time-of-flight ribbon spline', 'Wingspan stadia geometry', 'BATR historical bullet marker']
    },
    defaults: {
      fov: 50,
      zoom: 1.0,
      boxSizePx: 90,
      lockRate: 1.8,
      lossGraceSec: 0.4,
      leadFactor: 1.15,
      look: 'glass-bloom',
      primaryColor: '#4ade80',
      lockedColor: '#38bdf8',
      warningColor: '#fb7185'
    },
    specimenFaders: [
      { key: 'targetWingspanM', label: 'Set Target Wingspan', min: 6, max: 35, step: 1, unit: 'm', default: 14 },
      { key: 'gunMuzzleVelMs', label: 'Cannon Muzzle Velocity', min: 700, max: 1300, step: 25, unit: 'm/s', default: 1030 },
      { key: 'funnelLagStiffness', label: 'Funnel Whip Damping', min: 1, max: 15, step: 0.5, unit: '', default: 6.0 },
      { key: 'showBatrDot', label: 'Show BATR Bullet Dot', min: 0, max: 1, step: 1, unit: '', default: 1 }
    ]
  },

  // ============================================================================
  // FAMILY E: GAME IDIOMS (DELIBERATELY UNFAITHFUL, FOR CONTRAST)
  // ============================================================================
  {
    id: 'arcade-lock',
    family: 'E',
    familySlug: 'game-idioms',
    name: 'Ace Combat Two-Colour Arcade Lock',
    shortName: 'Arcade Lock',
    code: 'E-01',
    platformType: 'jet',
    hasInset: false,
    insetMode: 'none',
    summary: 'Everything distilled to two crisp colors (Emerald -> Crimson), sliding diamond lock box, SHOOT flash, and incoming MISSILE warning.',
    specCard: {
      idiom: 'Two-Colour Arcade Flight-Action Lock Box (Ace Combat / Project Wingman)',
      operatorHolds: 'Keeping target anywhere inside the generous front hemisphere while the diamond slides onto the target and flips emerald -> crimson.',
      phases: ['TGT AVAILABLE (GREEN)', 'ACQUIRING SLIDE', 'LOCKED (RED + SHOOT)', 'MISSILE ALERT', 'BREAK'],
      cues: [
        'Strict two-colour grammar: Emerald (`#34d399`) for neutral/tracking, Crimson (`#ff2e4c`) for locked & shoot ready',
        'Outer diamond rotates 45° and snaps onto the inner target box with bold `SHOOT` typography above the reticle',
        'Clean peripheral arrow and `[ MISSILE ALERT ]` banner when threatened'
      ],
      honestLimits: 'Zero sensor physics—ignores radar notch, gimbal roll, PRF codes, and thermal crossover.',
      referenceGames: ['Ace Combat 04 / 5 / Zero / 7', 'Project Wingman', 'After Burner Climax'],
      stalheartTechniques: ['Strict two-colour palette enforcement', 'Interpolated diamond rotation & snap', 'High-readability arcade typography'],
      gameIdiomTradeoff: 'DROPPED: Radar scan bars, Doppler notch, seeker cooldown, gimbal limits, and ballistic drop. WHY IT MAKES A BETTER GAME: At 800 knots in a 30-aircraft furball, players process target selection in <180ms via pure color flip (green -> red) and diamond convergence, keeping cognitive load on flight choreography rather than switchology.'
    },
    defaults: {
      fov: 58,
      zoom: 1.0,
      boxSizePx: 135,
      lockRate: 2.4,
      lossGraceSec: 0.85,
      look: 'glass-bloom',
      primaryColor: '#34d399',
      lockedColor: '#ff2e4c',
      warningColor: '#ff2e4c'
    },
    specimenFaders: [
      { key: 'diamondSpinDeg', label: 'Lock Diamond Rotation', min: 0, max: 180, step: 15, unit: '°', default: 90 },
      { key: 'multiLockSlots', label: 'Multi-Target Lock Slots', min: 1, max: 6, step: 1, unit: '', default: 4 },
      { key: 'shootFlashHz', label: 'SHOOT Prompt Blink Rate', min: 1, max: 12, step: 1, unit: 'Hz', default: 5 },
      { key: 'leadRingAssist', label: 'Show Gun Lead Assist Ring', min: 0, max: 1, step: 1, unit: '', default: 1 }
    ]
  },
  {
    id: 'vtol-vr',
    family: 'E',
    familySlug: 'game-idioms',
    name: 'Helmet-Mounted Visor Monocle & Dual MFD Suite',
    shortName: 'HMCS + MFDs',
    code: 'E-02',
    platformType: 'jet',
    hasInset: true,
    insetMode: 'dual-mfd',
    summary: 'Gaze-following helmet monocle reticle that locks off-boresight when looking away from the nose, paired with interactive Radar & TGP MFD tiles.',
    specCard: {
      idiom: 'Helmet-Mounted Cueing System (HMCS) Visor Monocle + Cockpit MFD Pages (VTOL VR / JHMCS)',
      operatorHolds: 'Looking off-boresight with the helmet reticle to slave seekers past the aircraft nose while cross-checking compact Radar & TGP MFD screens.',
      phases: ['ON-NOSE HUD', 'OFF-BORESIGHT HMCS', 'VISOR DIAMOND LOCK', 'MFD HANDOFF', 'GIMBAL EXCEEDED'],
      cues: [
        'Circular HMCS monocle ring that appears automatically when gaze slews away from the forward HUD glass frame',
        'Dashed look-back line showing where the aircraft nose is pointing relative to the pilot’s helmet gaze',
        'Dual docked MFD panels at the bottom corners (Left: B-Scope Radar, Right: TGP Optical Zoom)'
      ],
      honestLimits: 'High off-boresight shots bleed missile energy rapidly in the initial turn; clutter increases if HUD and HMCS overlap near boresight.',
      referenceGames: ['VTOL VR', 'DCS F/A-18C / F-16C (JHMCS)', 'Apache: Air Assault (IHADSS)'],
      stalheartTechniques: ['Boresight HUD vs Off-Boresight HMCS auto-blanking', 'Dual MFD lower bezel layout', 'High-Off-Boresight (HOBS) seeker cue'],
      gameIdiomTradeoff: 'DROPPED: Multi-layered HOTAS DMS/TMS sub-menus and 40-button MFD bezel trees. WHY IT MAKES A BETTER GAME: Compresses full sensor fusion (Radar + TGP + Helmet Sight) onto a single readable viewport where head gaze directly drives target acquisition.'
    },
    defaults: {
      fov: 56,
      zoom: 1.0,
      insetZoom: 4.5,
      boxSizePx: 100,
      lockRate: 1.6,
      lossGraceSec: 0.6,
      look: 'glass-bloom',
      primaryColor: '#22d3ee',
      lockedColor: '#4ade80',
      warningColor: '#fbbf24'
    },
    specimenFaders: [
      { key: 'hobsMaxDeg', label: 'High-Off-Boresight Cone', min: 15, max: 90, step: 5, unit: '°', default: 60 },
      { key: 'hudBlankRadiusPx', label: 'HUD Frame Blank Zone', min: 40, max: 180, step: 10, unit: 'px', default: 95 },
      { key: 'mfdScale', label: 'Docked MFD Tile Scale', min: 0.6, max: 1.4, step: 0.1, unit: 'x', default: 1.0 },
      { key: 'monocleRingRadius', label: 'HMCS Monocle Radius', min: 50, max: 140, step: 5, unit: 'px', default: 85 }
    ]
  },
  {
    id: 'stalheart-quiver',
    family: 'E',
    familySlug: 'game-idioms',
    name: 'Stalheart Quiver 4-Phase Acquisition Scope (Baseline)',
    shortName: 'Stalheart Quiver',
    code: 'E-03',
    platformType: 'fixed',
    hasInset: true,
    insetMode: 'quiver-scope',
    summary: 'The baseline specimen from Array-7 & Stalheart: four-phase acquisition state machine re-tinting a precision geometric reticle with rock-edge sight grace.',
    specCard: {
      idiom: 'Four-Phase Acquisition Reticle with Sight-Grace Hold & Scissored Scope Inset (Stalheart Quiver / Array-7)',
      operatorHolds: 'Bringing a contact inside the acquisition ring, holding steady through the 4-phase harmonic progression, and riding out brief terrain-masking grace windows.',
      phases: ['PHASE 0: SEARCH', 'PHASE 1: DETECT', 'PHASE 2: CORRELATE', 'PHASE 3: LOCKED', 'SIGHT GRACE (HOLD)'],
      cues: [
        'Four concentric geometric quadrants that step inward and re-tint at 25%, 50%, 75%, and 100% lock progress',
        '"A rock edge is not a loss": 0.5s sight grace holds the lock meter and displays a ghost vector when a contact ducks behind a ridge',
        'Shoot cue ladder on the right rail (`IN RANGE` / `NOT YET` / `TOO CLOSE`) plus explicit slip/drift ghost box on lock break'
      ],
      honestLimits: 'Deliberately exposes its state machine steps rather than mimicking a specific military MIL-STD-1787 symbol set.',
      referenceGames: ['Stalheart (Quiver Override Seat)', 'Fable Cabinet (Array-7 #hud-targeting)', 'Metroid Prime (Scan / Lock Visor)', 'Armored Core VI (FCS Lock)'],
      stalheartTechniques: ['Four-phase discrete harmonic reticle', '0.5s rock-edge sight grace timer', 'Priority-ordered status(inputs) word+colour rule'],
      gameIdiomTradeoff: 'DROPPED: Cryptic NATO MIL-STD-2525 symbology and hidden analog acquisition thresholds. WHY IT MAKES A BETTER GAME: Every fraction of a second spent aiming produces a visible, rhythmic geometric step (Search -> Detect -> Correlate -> Lock), turning a hidden timer into tactile mechanical feedback.'
    },
    defaults: {
      fov: 40,
      zoom: 1.6,
      insetZoom: 5.0,
      boxSizePx: 96,
      lockRate: 1.35,
      lossGraceSec: 0.5,
      stickiness: 0.65,
      look: 'raw',
      primaryColor: '#38bdf8',
      lockedColor: '#4ade80',
      warningColor: '#fb923c'
    },
    specimenFaders: [
      { key: 'harmonicSteps', label: 'Discrete Reticle Phases', min: 2, max: 6, step: 1, unit: '', default: 4 },
      { key: 'quadrantGapPx', label: 'Quadrant Rest Gap', min: 4, max: 36, step: 2, unit: 'px', default: 18 },
      { key: 'graceDecayRate', label: 'Post-Grace Bleed Speed', min: 0.2, max: 3.0, step: 0.1, unit: 'x', default: 0.9 },
      { key: 'ringTickCount', label: 'Azimuth Vernier Ticks', min: 8, max: 48, step: 4, unit: '', default: 24 }
    ]
  }
];

export const SCENARIOS = [
  {
    id: 'crossing',
    name: 'Crossing Convoy & Escort',
    description: 'Mixed ground armor and low-altitude escort moving laterally across ridge lines with intermittent terrain masking.',
    contactCount: 5,
    speedMultiplier: 1.0,
    terrainMasking: 0.5,
    decoyRate: 0.3
  },
  {
    id: 'pop-up',
    name: 'Pop-Up Ridge Ambush',
    description: 'Attack helicopters and pop-up contacts unmasking briefly above mountain crests before dipping back into cover.',
    contactCount: 4,
    speedMultiplier: 0.85,
    terrainMasking: 0.85,
    decoyRate: 0.4
  },
  {
    id: 'masked',
    name: 'Rock-Edge Occlusion Stress Test',
    description: 'Contacts weaving behind sharp terrain pillars to test the 0.5s sight grace ("a rock edge is not a loss") and slip cues.',
    contactCount: 4,
    speedMultiplier: 1.15,
    terrainMasking: 0.95,
    decoyRate: 0.2
  },
  {
    id: 'decoy',
    name: 'Flare & Chaff Countermeasure Furball',
    description: 'High-heat fast movers dispensing flares and chaff bundles at short intervals to test seeker IRCCM and re-cage mechanics.',
    contactCount: 6,
    speedMultiplier: 1.45,
    terrainMasking: 0.25,
    decoyRate: 0.95
  },
  {
    id: 'intercept',
    name: 'High-Altitude BVR Intercept',
    description: 'Fast closing formations at varying altitudes and radar cross-sections for DLZ, Pitbull, and AESA/FCR sorting.',
    contactCount: 7,
    speedMultiplier: 1.6,
    terrainMasking: 0.1,
    decoyRate: 0.5
  }
];

export function getSpecimen(id) {
  return SPECIMENS.find((s) => s.id === id) || SPECIMENS.find((s) => s.id === 'stalheart-quiver');
}

export function getSpecimensByFamily(familyIdOrSlug) {
  if (!familyIdOrSlug) return SPECIMENS;
  const q = familyIdOrSlug.trim().toLowerCase();
  if (q.length === 1) {
    return SPECIMENS.filter((s) => s.family.toLowerCase() === q);
  }
  return SPECIMENS.filter(
    (s) => s.family.toLowerCase() === q || s.familySlug.toLowerCase().includes(q)
  );
}
