# hudlab — brief

A CLI that scaffolds, runs and tests a **lab of game targeting HUDs**: one self-contained page per targeting idiom, every page drawing the same synthetic scene through its own visual language and lock state machine. The Fable Cabinet's Array-7 (`onkochishin/#hud-targeting`) is one specimen of this kind: a four-phase acquisition machine re-tinting a reticle over generated terrain, with faders. hudlab turns that into a catalogue, and adds the two things Array-7 lacks: a shared moving world behind the glass, and a seat API so a specimen can move into a game unchanged.

Working name: hudlab. 2026-10-19. Scope is **representation**: what the player sees, hears and does. Not a simulation of real equipment.

## 1. Why

- Games keep reinventing lock-on as a box that turns red. The interesting design space is everything around that box: how the lock is earned, how it is shown slipping, what the operator does during flight, and what the HUD honestly admits it cannot see.
- Stalheart has three override seats (Quiver scope, gunship FLIR, SOL-82 inset) and a seat API that a lab can host. The lab is where the next seats are designed before they enter a game.
- A named specimen per idiom gives designers a vocabulary: "laser-spot, lock-after-launch, inset seeker feed" instead of "like the one in that video".

## 2. What the CLI does

```
hudlab init <dir>                 scaffold: shared world, catalogue index, test harness
hudlab new <family>/<name>        scaffold a specimen from a family template (§4)
hudlab list [--family f]          catalogue: phases covered, faders, techniques used
hudlab serve [--open <name>]      dev server, native ES modules, hot reload
hudlab build                      one self-contained HTML per specimen + index, downloadable
hudlab snap <name> [--phase p]    headless screenshots per phase, DPR 1 and DPR 2
hudlab test [name]                drives each specimen through its phases, asserts DOM/canvas
hudlab compare <a> <b>            two specimens side by side, same scenario, same clock
hudlab scenario <name>            scripted contact set: pop-up, crossing, masked, decoy
```

Stack: three.js, native ES modules, no framework, node CLI. Same constraints as Stalheart.

## 3. Architecture (the Stalheart seat pattern, generalised)

| Layer | Owns | Rule |
|---|---|---|
| world | terrain, sky, scripted contacts with a few abstract "signature" numbers (heat, size, contrast, emitting) | truth; never reads a HUD |
| platform | fixed mount, turret on a moving hull, helicopter, jet, the round itself | yaw stored relative to the platform, world aim held each frame (`holdAim`) |
| sensor (domain) | FOV, gimbal limits, what is "in the box", lock meter, phases, loss grace | pure functions, no DOM; tables passed in as config |
| seat | input, camera pose, `tick(dt)`, feeds one frame object a frame | `createSeat(root, host)`, host passes functions not values |
| presentation | SVG overlay, full-screen 2D canvas, scissored inset, in-world meshes, final post pass | pure DOM/canvas over the frame object; owns no state |
| status | `status(inputs) -> { state, text }` in priority order | one rule drives the word and the colour |

Every specimen is built from these six, so `compare` can swap the presentation while keeping the sensor, or vice versa.

## 4. Catalogue: families and specimens

Each specimen has a **spec card**: idiom, what the operator holds, phases, cues, honest limits, reference games, and the Stalheart techniques it reuses (§8.4 of the override-HUD notes).

**A. Steer-it-yourself** (operator keeps aiming after launch)
- `saclos`: crosshair held on target, round tracked by its flare, beam-rider "stay on it" tension; wire-time countdown.
- `tv-eo`: contrast crosshairs, inset seeker view goes to the round's own camera after release, operator can nudge once (the MK-9 pattern).

**B. Lock-then-forget** (the lock is the mechanic)
- `ir-seeker`: uncaged seeker circle wandering to the hottest thing in its cone, growl-to-chirp audio, decoy pulls the circle away, re-cage.
- `iir-clu`: Javelin-style CLU: day/thermal toggle, track gates grown by the operator, top vs direct mode, the in-sight bracket "snaps shut".
- `laser-spot`: a designator somewhere else paints; the HUD shows spot code match, lock-before vs lock-after launch, time-to-impact, and the designator's "keep it on" duty.
- `radar-active`: lock box, a "going active" moment after which the shooter may turn away, shown as a handover on the HUD.
- `radar-semi-active`: same box, but the shooter must keep illuminating; the HUD nags.
- `coords`: no lock at all, a probable-error circle on the ground and a release cue.

**C. Platform sensors** (finding and designating, not guiding)
- `fcr-scan`: mechanical sweep B-scope, bars and azimuth volume, search / track-while-scan / single-target modes, bug and lock symbols.
- `aesa`: no sweep bar, many simultaneous tracks, interleaved modes; HUD shows the difference as instant versus swept refresh.
- `irst`: passive, angle only, no range unless the platform manoeuvres; the HUD shows a bearing line and a growing range estimate.
- `tgp-mts`: slewable ball (Litening/Sniper/TADS/MTS idiom): white-hot / black-hot, zoom steps, point vs area track, offset cursor, laser range readout, designator on/off, the ball's gimbal roll at the limit.
- `rwr`: the defensive side: threat rings, a lock warning, the missile-launch strobe.

**D. Gunnery**
- `tank-fcs`: laser range, lead computed, ballistic reticle and stadia, "lase then lead".
- `ccip-ccrp`: pipper, fall line, release cue, time-to-release count.
- `air-gun`: funnel and lead-computing pipper, in-range cue.

**E. Game idioms** (deliberately unfaithful, for contrast)
- `arcade-lock`: Ace Combat: lock box, warning box, tone; everything in two colours.
- `vtol-vr`: helmet reticle that follows gaze, MFD pages for radar and TGP, the lock diamond on the visor.
- `stalheart-quiver`: the existing four-phase scope, ported as the baseline specimen.

Rule for E: a game idiom must show, in its spec card, which real behaviours it drops and why that is a better game.

## 5. Cross-cutting studies (one toggle set shared by all specimens)

- Lock stickiness and sight grace (Stalheart: "a rock edge is not a loss", 0.5 s).
- Loss of lock made legible: slip, drift, blink, word; never a silent reset.
- Shoot cues: in range / not yet / too close, as a ladder beside the reticle.
- Danger said before release, warning stays with the round after.
- Reduced motion: every spin and blink has a word fallback.
- Phone layout: say less; reticle and inset only.
- Colour grammar: ours vs theirs vs warning, consistent across families.
- Look: raw, FLIR ironbow, CRT inset, glass with bloom, monochrome HMD.

## 6. Faders

Every specimen exposes its knobs as faders in the Cabinet style, grouped: optics (FOV, zoom, gimbal), lock (box size, meter rate, grace), presentation (colour, thickness, glyph set, look), scenario (contact count, speed, decoy, mask). Faders are read from one frozen table so the test harness can drive them.

## 7. Test harness

`hudlab test` opens each specimen headless, exposes `window.__hudlabTest` with `state()`, `aim(contactId)`, `aimSky()`, `hold(on)`, `phase()`, drives it search → track → lock → away → loss, and asserts on DOM and canvas like Stalheart's `browser-test.mjs`. Snapshots at DPR 2 are required: the inset-viewport bug was invisible at DPR 1.

## 8. Deliverables and order

1. `init` + shared world + the ported Quiver scope + harness. One specimen end to end.
2. Families A and B, since they are the seats a game needs next.
3. `compare` and `scenario`.
4. Families C, D, E.
5. Catalogue page with spec cards, built like the Cabinet: one self-contained HTML per specimen, downloadable, upstream never edited.

## 9. Non-goals

- Fidelity to any real equipment's performance; the numbers are game numbers.
- A game. No scoring, no damage, no AI beyond scripted contacts.
- A UI framework. Plain DOM, canvas, SVG, three.js.

## 10. References

- Array-7, Fable Cabinet: the single-file-with-faders format to copy.
- `stalheart-override-huds.md`: seat API, frame object, status rule, six overlay techniques, gotchas.
- The reference collage: targeting-pod and seeker insets, helmet-sight monocles, CLU thermal views, arcade lock boxes, HUD gun funnels, periscope tank sights. Each maps to one specimen above.
