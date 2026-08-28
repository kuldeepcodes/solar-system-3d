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

#### ⚠️ CI/Datacenter IP Blocking

`solarsystemscope.com` blocks downloads from GitHub Actions runners and other datacenter IP
ranges.  Every SSS-primary texture key in `scripts/fetch-textures.mjs` therefore has a
**Wikimedia Commons fallback** pointing to the identical files that SSS/INOVE themselves
uploaded to Wikimedia Commons under the same CC BY 4.0 licence.  `upload.wikimedia.org` is
a proper CDN that does not block datacenter IPs and is confirmed reachable from GitHub
Actions.

The download chain is:
1. `solarsystemscope.com` — best quality, works from residential/office IPs
2. `upload.wikimedia.org` (Wikimedia Commons mirror of the SSS pack) — works everywhere including CI
3. Graceful skip — app uses procedural texture at runtime

All Wikimedia fallback URLs were verified via the Commons imageinfo API and confirmed to
return HTTP 200 with `Content-Type: image/*` before being recorded in the script.

#### Local CI simulation

Set `SKIP_SSS=1` to force the script to skip the SSS primary and go straight to Wikimedia
fallbacks, replicating the CI environment locally:

```sh
SKIP_SSS=1 node scripts/fetch-textures.mjs --force
```

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
| `moon.jpg` | Earth's Moon |
| `mars.jpg` | Mars |
| `jupiter.jpg` | Jupiter |
| `saturn.jpg` | Saturn |
| `saturn_ring_alpha.png` | Saturn rings |
| `uranus.jpg` | Uranus |
| `neptune.jpg` | Neptune |
| `ceres_fictional.jpg` | Ceres (fictional/artistic) |
| `eris_fictional.jpg` | Eris (fictional/artistic) |
| `haumea_fictional.jpg` | Haumea (fictional/artistic) |
| `makemake_fictional.jpg` | Makemake (fictional/artistic) |

**Normal / specular maps:** Solar System Scope previously offered bump, normal, and specular maps
as separate packs (e.g. `2k_earth_normal_map.jpg`, `2k_earth_specular_map.jpg`). As of 2025 these
files return `text/html` from the free download endpoint, indicating they have been removed from or
moved behind the paid tier. No alternative verified free JPEG normal-map source was found after
exhaustive probing (NASA/USGS publish TIFF height maps, not RGB normal maps). The download
framework is in place (`earth_normal`, `moon_normal`, … keys in `fetch-textures.mjs`); if these
URLs are ever re-verified, add them there and they will be used automatically.

---

### USGS Astrogeology Science Center / NASA

**Source:** [https://astrogeology.usgs.gov/](https://astrogeology.usgs.gov/)  
**Licence:** U.S. Government Work — public domain (17 U.S.C. § 105)  
**Used for:** Galilean moon mosaics; Pluto, Triton, and Enceladus surface maps  
**How obtained:** Downloaded at setup time via `npm run textures`; stored in `public/textures/` (gitignored)

Data products from the NASA Galileo, Voyager, Cassini, and New Horizons missions.

| Texture | Body | Mission source |
|---------|------|----------------|
| `io.jpg` | Io | Galileo SSI + Voyager |
| `europa.jpg` | Europa | Galileo SSI + Voyager |
| `ganymede.jpg` | Ganymede | Galileo SSI + Voyager |
| `callisto.jpg` | Callisto | Galileo SSI + Voyager |
| `pluto.jpg` | Pluto | New Horizons (Jul 2017) |
| `triton.jpg` | Triton | Voyager 2 |
| `enceladus.jpg` | Enceladus | Cassini ISS |

Bodies with no verified equirectangular source (Titan, Phobos, Deimos) fall back to
procedural textures at runtime; see *Procedural Texture Fallback* below.

---

### Wikimedia Commons — Solar System Scope Mirror (CC BY 4.0)

**Source:** [https://commons.wikimedia.org/](https://commons.wikimedia.org/)  
**Licence:** [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)  
**Publisher of original textures:** INOVE / Solar System Scope  
**How obtained:** Downloaded at setup time via `npm run textures` as a fallback when solarsystemscope.com is unreachable (e.g. GitHub Actions CI); stored in `public/textures/` (gitignored)

SSS/INOVE uploaded their full texture pack to Wikimedia Commons. The textures are identical to the primary SSS downloads and carry the same CC BY 4.0 licence. `upload.wikimedia.org` is a CDN that does not block datacenter IP ranges.

| Texture key | Wikimedia Commons file |
|-------------|------------------------|
| `sun` | [Solarsystemscope texture 2k sun](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_sun.jpg) |
| `mercury` | [Solarsystemscope texture 2k mercury](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_mercury.jpg) |
| `venus` | [Solarsystemscope texture 2k venus surface](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_venus_surface.jpg) |
| `venus_atmosphere` | [Solarsystemscope texture 2k venus atmosphere](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_venus_atmosphere.jpg) |
| `earth` | [Solarsystemscope texture 2k earth daymap](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_earth_daymap.jpg) |
| `earth_clouds` | [Solarsystemscope texture 2k earth clouds](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_earth_clouds.jpg) |
| `earth_night` | [Solarsystemscope texture 2k earth nightmap](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_earth_nightmap.jpg) |
| `moon` | [Solarsystemscope texture 2k moon](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_moon.jpg) |
| `mars` | [Solarsystemscope texture 2k mars](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_mars.jpg) |
| `jupiter` | [Solarsystemscope texture 2k jupiter](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_jupiter.jpg) |
| `saturn` | [Solarsystemscope texture 2k saturn](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_saturn.jpg) |
| `saturn_ring` | [Solarsystemscope texture 2k saturn ring alpha](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_saturn_ring_alpha.png) |
| `uranus` | [Solarsystemscope texture 2k uranus](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_uranus.jpg) |
| `neptune` | [Solarsystemscope texture 2k neptune](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_neptune.jpg) |
| `ceres` | [Solarsystemscope texture 2k ceres fictional](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_ceres_fictional.jpg) |
| `eris` | [Solarsystemscope texture 4k eris fictional](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_4k_eris_fictional.jpg) |
| `haumea` | [Solarsystemscope texture 2k haumea fictional](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_haumea_fictional.jpg) |
| `makemake` | [Solarsystemscope texture 4k makemake fictional](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_4k_makemake_fictional.jpg) |
| `stars_milky_way` | [Solarsystemscope texture 2k stars milky way](https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_stars_milky_way.jpg) |

---

### Wikimedia Commons — Public Domain (NASA / Cassini Imaging Team)

**Source:** [https://commons.wikimedia.org/](https://commons.wikimedia.org/)  
**Licence:** Public domain — NASA / Cassini Imaging Team  
**How obtained:** Downloaded at setup time via `npm run textures`; stored in `public/textures/` (gitignored)

| Texture | Body | Dimensions | Commons page |
|---------|------|------------|--------------|
| `titan.jpg` | Titan | 1877×1069 equirectangular | [2009 Map of Titan cylindrical projection](https://commons.wikimedia.org/wiki/File:2009_Map_of_Titan_cylindrical_projection.jpg) |

---

### Wikimedia Commons — USGS / Public Domain

**Source:** [https://commons.wikimedia.org/](https://commons.wikimedia.org/)  
**Licence:** Public domain — United States Geological Survey  
**How obtained:** Downloaded at setup time via `npm run textures`; stored in `public/textures/` (gitignored)

| Texture | Body | Dimensions | Commons page |
|---------|------|------------|--------------|
| `phobos.png` | Phobos | 5499×2999 | [USGS-Phobos-MarsMoon-Map](https://commons.wikimedia.org/wiki/File:USGS-Phobos-MarsMoon-Map.png) |

---

### Wikimedia Commons — CC BY-SA 3.0

**Source:** [https://commons.wikimedia.org/](https://commons.wikimedia.org/)  
**Licence:** [Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)](https://creativecommons.org/licenses/by-sa/3.0/)  
**Authors:** Askaniy Anpilogov & John van Vliet  
**How obtained:** Downloaded at setup time via `npm run textures`; stored in `public/textures/` (gitignored)

Attribution as required by the licence: "Deimos map by Askaniy Anpilogov & John van Vliet via Wikimedia Commons, licensed under CC BY-SA 3.0."

| Texture | Body | Dimensions | Commons page |
|---------|------|------------|--------------|
| `deimos.png` | Deimos | 4096×2048 equirectangular | [Deimos map by Askaniy](https://commons.wikimedia.org/wiki/File:Deimos_map_by_Askaniy.png) |

---

## Derived Normal Maps

`src/lib/deriveNormalMap.ts` synthesises tangent-space normal maps at runtime from each body's colour map, using a Sobel operator on luminance. No external files or licences are required — the derivation runs entirely from the already-licensed colour maps.

**Technique:**

1. Draw `source.image` to a 1024×512 offscreen canvas (downscaling if needed).
2. Compute per-pixel luminance: `L = 0.2126R + 0.7152G + 0.0722B` (BT.709).
3. Apply a 3×3 Sobel kernel to obtain horizontal (dX) and vertical (dY) gradients.
   - Horizontal wrapping at the seam (equirectangular maps are seamless in longitude).
   - Vertical clamping at the poles.
4. Normal vector: `normalise(vec3(-dX·s, -dY·s, 1))`, packed to RGB 0–255.
5. Output a `THREE.CanvasTexture` with `colorSpace = THREE.NoColorSpace` (linear).

**Why this works:** For airless, heavily cratered bodies (Moon, Mercury, Phobos, Deimos, Io, etc.), albedo variation correlates strongly with topography — craters, maria, and ridges are all visible in the colour map. Sobel-filtering the luminance recovers these gradients convincingly.

**Scope:** Applied to all rocky and icy bodies. Gas giants are explicitly excluded — their albedo variation is atmospheric banding, not surface relief; Sobel-ing it produces incorrect ridged normals. Venus's radar-derived surface map is included at moderate strength (1.5).

**Per-body strength:** Moon/Mercury/Phobos/Deimos: 2.5 (deep craters); Mars/icy moons: 2.0; Earth: 1.0 (albedo dominated by land/ocean colour contrast rather than pure relief); Venus: 1.5.

Real downloaded normal maps will always be preferred over the derived version — the framework in `useDerivedNormal` probes `${textureKey}_normal.jpg` first and only falls back to derivation on a 404.

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
| Planet/moon textures (main) | Solar System Scope | CC BY 4.0 | No (downloaded at setup) |
| Planet/moon textures (CI fallback) | Wikimedia Commons (SSS mirror) | CC BY 4.0 | No (downloaded at setup) |
| Moon/dwarf-planet textures | USGS Astrogeology / NASA | Public domain | No (downloaded at setup) |
| Titan texture | Wikimedia Commons / NASA Cassini | Public domain | No (downloaded at setup) |
| Phobos texture | Wikimedia Commons / USGS | Public domain | No (downloaded at setup) |
| Deimos texture | Wikimedia Commons | CC BY-SA 3.0 | No (downloaded at setup) |
| Gallery imagery | Wikimedia Commons | Various free (CC BY-SA 4.0 / PD) | No (loaded at runtime) |
| Eclipse dates | NASA Eclipse Site | Public domain | Yes (as TypeScript data) |
| Procedural textures | Original code | MIT | Yes |
| Derived normal maps | Computed from colour maps | Same as colour map source | No (computed at runtime) |
