# Features Reference

A structured walkthrough of every feature in Solar System 3D: what it does and how to use it.

---

## Navigation

### Free-Flight Camera

The camera starts with a bird's-eye view of the Solar System. You can:

- **Orbit** — left-drag (mouse) or one-finger drag (touch) to rotate the view around the current focus point
- **Zoom** — scroll wheel, pinch gesture, or `+`/`-` keys
- **Pan** — right-drag (mouse) or two-finger drag (touch) to shift the focal point laterally
- **Focus a body** — double-click (or double-tap) any planet, moon, or object to lock the camera to it; the camera smoothly flies to a good viewing distance
- **Reset** — press `R` to return to the default Solar System overview

### Fuzzy Search

Press `/` to open the search box. Start typing and matching bodies appear instantly — the search is fuzzy so "jup" matches Jupiter and "io" matches Io. Arrow keys navigate the results; `Enter` or click jumps to the body.

---

## Bodies

### Planets

All eight planets are rendered: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune. Each has:

- A textured sphere (photorealistic or procedural fallback)
- Axial tilt applied correctly
- Atmospheric glow shader (where applicable)
- Saturn's rings rendered as an inclined disc with inner/outer radius

### Moons

200+ moons are modelled, including all major moons of every planet. Notable examples:

| Body | Notable moons |
|------|--------------|
| Earth | Moon (with node regression and periapsis precession) |
| Mars | Phobos, Deimos |
| Jupiter | Io, Europa, Ganymede, Callisto (Galilean moons) |
| Saturn | Titan, Enceladus, Mimas, Rhea, Dione, Tethys, Iapetus |
| Uranus | Titania, Oberon, Umbriel, Ariel, Miranda |
| Neptune | Triton (retrograde), Nereid |

### Dwarf Planets

Pluto, Ceres, Eris, Makemake, and Haumea are included with their correct orbital elements and physical data.

### Asteroid Belt

Rendered as a single instanced mesh of ~10,000 randomised asteroids between Mars and Jupiter, drawn in one GPU draw call.

---

## Orbit Paths

Toggle orbit path overlays with `O`. Each body's elliptical orbit is drawn as a line using the same Keplerian elements that drive the body's position — so the body always lies exactly on its displayed orbit path.

---

## Body Labels

Toggle floating name labels with `L`. Labels are always oriented toward the camera and scale with distance to remain readable.

---

## Detail Panel

Click any body to open its detail panel. The panel shows:

| Field | Example (Earth) |
|-------|----------------|
| Diameter | 12,742 km |
| Distance from Sun | 1.00 AU (149.6 million km) |
| Surface temperature | −88 °C to 58 °C |
| Surface gravity | 9.8 m/s² |
| Orbital period | 365.25 days |
| Number of moons | 1 |
| Mass | 5.97 × 10²⁴ kg |
| Bulk density | 5,514 kg/m³ |
| Escape velocity | 11.2 km/s |
| Axial tilt | 23.4° |
| Composition | Iron core, silicate mantle, water oceans |
| Atmosphere | N₂ 78%, O₂ 21%, Ar 1% |
| Interesting facts | 3 rotating facts |
| Gallery | Thumbnail images |

Close the panel with `Esc` or by clicking outside it.

---

## Dual Scale System

### Educational Mode (default)

Compresses both body sizes and orbital distances so the Solar System fits comfortably in the scene. The compression formulas are:

```
r_scene  = r_km ^ 0.4  × 0.02
a_scene  = a_AU ^ 0.6  × 14
```

The orbital ellipse shape, eccentricity, and inclination are preserved exactly because positions are multiplied by a single scalar.

### Realistic Mode

Maps 1 scene unit = 100,000 km. Earth is roughly 1,496 units from the Sun. Use the scroll wheel to zoom out significantly.

Switch between modes in **Settings** (gear icon in the HUD) without losing your current camera target.

---

## Time Controls

The time control bar is always visible at the bottom of the HUD.

| Control | Function |
|---------|----------|
| Play / Pause button | Start or stop the simulation (`Space`) |
| Speed selector | 1×, 10×, 100×, 1000× real-time |
| Reverse toggle | Run time backwards at the selected speed |
| Date scrubber | Drag to any date; all positions update instantly |
| Date display | Shows the current simulation date |

---

## Eclipse Demonstrations

Open the Eclipse panel from the HUD to run a solar or lunar eclipse demonstration.

### Solar Eclipse
The simulation advances to the next eclipse event and positions the camera so you can watch the Moon's umbra sweep across Earth. The Moon's shadow (umbra and penumbra) is rendered as a shader cone intersecting Earth's surface.

### Lunar Eclipse
Earth's shadow cone is rendered; the Moon passes through it and dims to a deep red (Rayleigh-scattered light through Earth's atmosphere).

### Accuracy
Eclipse seasons repeat correctly over decades because Earth's Moon carries secular node regression (−0.05295 °/day) and periapsis precession (+0.16436 °/day) in its orbital model.

---

## Earth: 7 Wonders of the World Layer

Enable the Wonders layer from the **Wonders** panel or HUD button. Eight markers appear on Earth's surface at their true geographic coordinates. Double-click any marker to fly down to it.

| Site | Location | Coordinates |
|------|----------|-------------|
| Great Wall of China | China | 40.4319° N, 116.5704° E |
| Petra | Jordan | 30.3285° N, 35.4444° E |
| Christ the Redeemer | Brazil | 22.9519° S, 43.2105° W |
| Machu Picchu | Peru | 13.1631° S, 72.5450° W |
| Chichen Itza | Mexico | 20.6843° N, 88.5678° W |
| Roman Colosseum | Italy | 41.8902° N, 12.4922° E |
| Taj Mahal | India | 27.1751° N, 78.0421° E |
| Great Pyramid of Giza | Egypt | 29.9792° N, 31.1342° E |

Each marker shows an info card with the site name, country, construction date, and a brief description. The coordinates are converted to a 3D surface point using the `geo.ts` library and the marker stays on the surface as Earth rotates.

---

## Surface Mode

Double-click a body (or use the **Land** button in the detail panel) to enter first-person surface mode. In this mode:

- The camera is placed on the surface at a chosen latitude/longitude
- You can look around in all directions
- The sky shows stars, moons, and the Sun from that body's surface
- Other planets may be visible as bright points depending on the date
- Press `Esc` or use the **Exit surface** button to return to the orbital view

---

## Spacecraft Travel Mode

Select any two bodies and click **Travel** to enter spacecraft mode. The camera follows a virtual spacecraft from the origin body to the destination body. Live telemetry is displayed:

| Telemetry | Description |
|-----------|-------------|
| Elapsed time | Mission time since departure |
| Distance covered | km and AU from origin |
| Distance remaining | km and AU to destination |
| Estimated arrival | Current real date + estimated travel duration |
| Light delay | One-way signal travel time at the current distance |

Press `Esc` to exit spacecraft mode.

---

## Planet Comparison (`C`)

Press `C` or open the **Compare** panel to select two bodies for side-by-side comparison. Both detail cards are shown simultaneously with shared units so you can directly compare diameter, gravity, density, orbital period, and other properties.

---

## Distance Measurement Tool (`M`)

Press `M` to activate the measure tool. Click any two objects in the scene; the current straight-line distance between them is shown in both km and AU. The measurement updates live as both objects orbit. Press `M` again or `Esc` to exit.

---

## Guided Tour (`T`)

Press `T` to start the guided tour. The tour automatically flies the camera through a series of curated waypoints narrated by on-screen text cards. It covers:

1. Solar System overview
2. The Sun
3. Inner planets (Mercury, Venus, Earth, Mars)
4. The asteroid belt
5. Outer planets (Jupiter, Saturn, Uranus, Neptune)
6. Dwarf planets and the Kuiper Belt

Click **Skip** at any time to jump to the next stop; press `Esc` to exit the tour.

---

## Learn Panel

Open the **Learn** panel from the HUD. It shows educational cards covering topics such as:

- How gravity shapes orbits
- Why planets have different temperatures
- What causes seasons
- The difference between sidereal and synodic periods
- How eclipses work
- The scale of the Solar System

Each card links to the relevant body or demo.

---

## Settings

The settings panel (gear icon) exposes:

| Setting | Options | Effect |
|---------|---------|--------|
| Quality | `low` / `medium` / `high` / `ultra` | Controls bloom, geometry detail, adaptive DPR |
| Scale mode | `educational` / `realistic` | Switches the scale system (see above) |
| Show labels | on / off | Same as `L` keyboard shortcut |
| Show orbits | on / off | Same as `O` keyboard shortcut |

---

## HUD Overview

The glassmorphism dark HUD adapts to desktop, tablet, and mobile:

- **Top bar** — title, search button, settings gear
- **Bottom bar** — time controls (play/pause, speed, date scrubber)
- **Right sidebar** — quick-access buttons for Compare, Measure, Tour, Learn, Wonders, Eclipses
- **Left** — detail panel (appears when a body is selected)
