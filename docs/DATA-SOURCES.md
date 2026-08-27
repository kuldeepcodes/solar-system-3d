# Data Sources & Attribution

This document lists every external data source used in Solar System 3D, its licence, and how it is used.

---

## Policy: No Third-Party Assets Committed to This Repository

No textures, images, or binary assets from third parties are committed to the Git repository. Assets are either:

- **Downloaded at setup time** (`npm run textures`) and stored in `public/textures/` which is `.gitignore`d, or
- **Generated at runtime** from deterministic procedural code when the downloaded file is absent.

Only original TypeScript/TSX source code and data typed from public-domain sources are committed.

---

## Orbital & Physical Data

### JPL Solar System Dynamics

**Source:** [https://ssd.jpl.nasa.gov/](https://ssd.jpl.nasa.gov/)  
**Licence:** Public domain (U.S. government work)  
**Used for:** J2000.0 mean orbital elements for all planets, dwarf planets, and major moons

The table below lists the specific element sets used.

| Body class | Source page | Elements used |
|------------|-------------|---------------|
| Planets (8) | JPL Planetary Fact Sheets | a, e, i, Ω, ω, M₀, n |
| Major moons | JPL Natural Satellites Fact Sheets | a, e, i, Ω, ω, M₀, n, frame |
| Dwarf planets | JPL Small Body Database | a, e, i, Ω, ω, M₀ |
| Earth's Moon | JPL DE430 lunar ephemeris summary | a, e, i, Ω, ω, M₀, Ω̇ (node rate), ω̇ (periapsis rate) |

The Moon's secular node regression rate (−0.05295 °/day) and periapsis precession rate (+0.16436 °/day) are taken from the IAU 2006 precession model as summarised in the JPL DE430 ephemeris documentation.

The epoch for all elements is **J2000.0 = JD 2451545.0 = 2000 January 1.5 TT**.

### NASA Planetary Fact Sheets

**Source:** [https://nssdc.gsfc.nasa.gov/planetary/factsheet/](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)  
**Licence:** Public domain (NASA open data)  
**Used for:** Physical constants shown in detail panels — diameter, mass, bulk density, surface gravity, escape velocity, surface temperature, atmospheric composition, axial tilt, orbital period, number of moons

---

## Textures

### Solar System Scope Textures

**Source:** [https://www.solarsystemscope.com/textures/](https://www.solarsystemscope.com/textures/)  
**Publisher:** INOVE  
**Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)  
**Used for:** Photorealistic surface textures for planets, moons, and the Sun  
**How obtained:** Downloaded at setup time via `npm run textures`; stored in `public/textures/` (gitignored); not bundled with or redistributed in the application

Attribution as required by the licence: "Textures from Solar System Scope (https://www.solarsystemscope.com/textures/) by INOVE, licensed under CC BY 4.0."

Files downloaded include (names may vary by version):

| Texture | Body |
|---------|------|
| `sun.jpg` | Sun surface |
| `mercury.jpg` | Mercury |
| `venus_surface.jpg` | Venus surface |
| `venus_atmosphere.jpg` | Venus atmosphere |
| `earth_daymap.jpg` | Earth (day) |
| `earth_nightmap.jpg` | Earth (night lights) |
| `earth_clouds.jpg` | Earth cloud layer |
| `earth_normal.jpg` | Earth normal map |
| `moon.jpg` | Earth's Moon |
| `mars.jpg` | Mars |
| `jupiter.jpg` | Jupiter |
| `saturn.jpg` | Saturn |
| `saturn_ring_alpha.png` | Saturn rings |
| `uranus.jpg` | Uranus |
| `neptune.jpg` | Neptune |

---

## Gallery Images

Gallery images shown in body detail panels are sourced from **Wikimedia Commons** under various free licences. Individual image credits are stored inline in `src/data/planets.ts` and `src/data/moons.ts` as `{ url, credit, licence }` fields. Common licences include CC BY-SA 4.0 and public domain (NASA/JPL).

No gallery images are committed to this repository; they are loaded at runtime from their original Wikimedia URLs.

---

## Eclipse Data

**Source:** NASA Eclipse Web Site — [https://eclipse.gsfc.nasa.gov/](https://eclipse.gsfc.nasa.gov/)  
**Licence:** Public domain (NASA open data)  
**Used for:** Notable past and future eclipse dates listed in `src/data/eclipses.ts`, used for the eclipse demonstration feature

---

## Procedural Texture Fallback

When a texture file is absent, `src/lib/proceduralTexture.ts` generates a placeholder using:

- **PRNG:** mulberry32 algorithm — public domain
- **Noise:** fractal Brownian motion (fBm) value noise — standard algorithm, no third-party licence

The procedural textures are entirely original code and are not derived from any third-party asset.

---

## Summary

| Asset type | Source | Licence | Committed to repo |
|------------|--------|---------|-------------------|
| Orbital elements | JPL SSD | Public domain | Yes (as TypeScript data) |
| Physical constants | NASA fact sheets | Public domain | Yes (as TypeScript data) |
| Planet/moon textures | Solar System Scope | CC BY 4.0 | No (downloaded at setup) |
| Gallery imagery | Wikimedia Commons | Various free (CC BY-SA 4.0 / PD) | No (loaded at runtime) |
| Eclipse dates | NASA Eclipse Site | Public domain | Yes (as TypeScript data) |
| Procedural textures | Original code | MIT | Yes |
