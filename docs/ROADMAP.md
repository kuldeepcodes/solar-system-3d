# Roadmap

This document describes what has shipped, what is planned, and the design decisions that make future features tractable.

---

## Phase 1 — Shipped ✅

The current release includes:

- **Full Solar System** — all 8 planets, 200+ moons, 5 dwarf planets, asteroid belt
- **Real Keplerian orbits** — J2000.0 elements from JPL, Newton-Raphson Kepler solver, true anomaly via numerically stable half-angle atan2
- **Earth's Moon** with secular node regression and periapsis precession (eclipse seasons correct over decades)
- **Dual scale system** — educational (compressed) and realistic (1 unit = 100,000 km) modes
- **Logarithmic depth buffer** — prevents z-fighting across 10 orders of magnitude
- **Free-flight navigation** — orbit, pan, zoom, double-click to focus
- **Fuzzy search** — jump to any body instantly
- **Detail panels** — diameter, distance, temperature, gravity, orbital period, moon count, mass, density, escape velocity, axial tilt, composition, atmosphere, facts, gallery
- **Time controls** — play/pause, 1×/10×/100×/1000×, reverse, date scrubber
- **Solar & lunar eclipse demonstrations** with accurate shadow cone shaders
- **Planet comparison panel** — side-by-side physical property comparison
- **Distance measurement tool** — live km/AU readout between any two bodies
- **Guided tour** — narrated fly-through of the Solar System
- **Learn panel** — educational cards linked to bodies and demos
- **Surface landing mode** — first-person perspective on any body
- **Spacecraft travel mode** — point-to-point journey with live telemetry (distance, ETA, light-delay)
- **Earth: 7 Wonders of the World layer** — markers at true lat/lon, fly-to, info cards
- **Texture fallback** — deterministic procedural textures (seeded fBm) when downloaded textures are absent
- **Performance tiers** — `low`/`medium`/`high`/`ultra`, adaptive DPR, instanced asteroid belt, 1M-star single draw call
- **Glassmorphism HUD** — responsive desktop / tablet / mobile
- **CI/CD** — GitHub Actions CI (lint, typecheck, test, build) + GitHub Pages deploy

---

## Phase 2 — VR / AR via WebXR 🥽

### Why this is next

VR and AR are the most natural evolution for a 3D Solar System explorer. Standing inside the Solar System at scale is a fundamentally different (and more powerful) experience than viewing it on a flat screen.

### XR-Readiness of the Current Codebase

The codebase is intentionally XR-ready:

- **Controls are abstracted.** All camera interactions go through `CameraRig` in `src/scene/CameraRig.tsx`, not directly into DOM event listeners. Replacing pointer-event-based picking with controller-based ray casting is additive.
- **No DOM overlays in the scene graph.** The HUD lives entirely outside `<Canvas>`, so it does not interfere with the WebXR compositor. In XR, the HUD will be projected into the world rather than composited as a flat overlay.
- **No fixed viewport assumptions.** `PerformanceMonitor` already handles non-standard DPR; XR headsets report their own DPR and render target sizes.
- **Zustand stores are framework-agnostic.** XR controller input can write to the same stores that pointer events currently write to.

### What Would Need to Change

| Area | Change required |
|------|----------------|
| Entry point | Wrap `<Canvas>` with `@react-three/xr`'s `<XR>` component; add an "Enter VR" button |
| Picking | Replace pointer-event raycaster with XR controller ray picking (`useController`, `useHitTest`) |
| HUD | Move HUD components from DOM into the scene using `<Html transform>` or native Three.js meshes; they must be positioned in world space relative to the user |
| Locomotion | Add comfort options: vignetting during movement, snap-turn in fixed angular increments, teleportation for large-scale navigation |
| Scale | Add a "shrink Solar System to room scale" mode for AR so the system fits on a desk |
| Hand tracking | Optional: `@react-three/xr` exposes hand joint data; pinch gestures can replace controller buttons |

### Dependencies to add

```
@react-three/xr   # WebXR bindings for R3F (additive — does not change existing code)
```

No existing files in `src/` need to be rewritten. The XR wrapper and new input handlers are new files that compose with the existing architecture.

---

## Phase 3 — Real Ephemeris (JPL Horizons Integration) 🔭

**Goal:** Replace propagated J2000 mean elements with on-demand positional data from the JPL Horizons API for higher accuracy, especially for comets and near-Earth objects.

- Add an optional `src/lib/horizons.ts` client that fetches ephemeris data for a body over a date range
- Cache responses in `IndexedDB` for offline use
- Fall back to the existing Keplerian solver when the API is unavailable

---

## Phase 4 — Comet & NEO Catalogue ☄️

**Goal:** Load the MPC (Minor Planet Center) orbital element catalogue for comets and near-Earth objects. Render up to ~10,000 objects as an instanced point cloud; clicking a point focuses and fetches its details.

- Comets rendered with a procedural ion/dust tail shader pointing away from the Sun
- NEO close-approach alerts surfaced in the Learn panel

---

## Phase 5 — Exoplanet Systems 🌌

**Goal:** Let users browse confirmed exoplanet systems from the NASA Exoplanet Archive.

- System selector — search by star name or catalogue ID
- Replace the Solar System scene with the selected exoplanet system
- Scale adjusts automatically; known parameters are shown; unknown parameters are visually marked as estimates

---

## Phase 6 — Multiplayer Guided Tours 👥

**Goal:** A host shares a session code; guests join and see the host's camera position in real time. The host can narrate, focus bodies, and advance the tour while all guests follow along.

- WebSocket / WebRTC signalling for low-latency camera sync
- Guests can temporarily unlock their camera and then re-sync with the host
- Compatible with the VR phase: the host could be in VR while guests watch on desktop

---

## Phase 7 — Offline PWA 📱

**Goal:** Full offline functionality via a Service Worker.

- Cache the app shell, all JS/CSS bundles, and `public/textures/` after first load
- Serve the cached app when the network is unavailable
- Show a banner when a new version is available with a one-click update

---

## Non-Goals

- **Telescope planning / observational astronomy tools** — out of scope; dedicated apps (Stellarium, SkySafari) do this better
- **N-body gravitational simulation** — Keplerian two-body mechanics are accurate enough for educational purposes; full N-body would require a WebAssembly integrator and is a different project
