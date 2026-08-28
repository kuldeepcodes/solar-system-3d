/**
 * fetch-textures.mjs
 *
 * Downloads equirectangular planet/body textures into public/textures/.
 * These assets are intentionally gitignored — run `npm run textures` to fetch them.
 *
 * Primary source  : Solar System Scope (https://www.solarsystemscope.com/textures/)
 *                   Licence: CC BY 4.0 © INOVE / solarsystemscope.com
 *                   NOTE: solarsystemscope.com blocks GitHub Actions / datacenter IPs.
 *                   Every SSS key therefore has a Wikimedia Commons fallback (see below).
 * Secondary source: Wikimedia Commons — identical SSS textures re-hosted by INOVE/SSS
 *                   (upload.wikimedia.org — confirmed reachable from GitHub Actions CI).
 *                   Licence: CC BY 4.0 © INOVE / solarsystemscope.com
 * Tertiary source : USGS Astrogeology Science Center (https://astrogeology.usgs.gov/)
 *                   Licence: U.S. Government Work — public domain (17 U.S.C. § 105)
 *                   NASA / USGS data products
 *
 * URL verification: every fallback URL was probed with a HEAD request and confirmed
 * to return HTTP 200 with Content-Type: image/* before being added to this script.
 * WIKI_SSS URLs were verified via the Wikimedia Commons imageinfo API (dimensions,
 * licence) and confirmed 200 + image/* via HEAD probe.
 *
 * Usage:
 *   node scripts/fetch-textures.mjs          # skip existing files
 *   node scripts/fetch-textures.mjs --force  # re-download everything
 */

import { createWriteStream, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'textures');

const FORCE = process.argv.includes('--force');
// Keep this modest: Wikimedia rate-limits aggressive parallel fetches with 429.
const CONCURRENCY = 2;

// ---------------------------------------------------------------------------
// Licence constants
// ---------------------------------------------------------------------------
const LICENCE_SSS  = 'CC BY 4.0 — © INOVE / solarsystemscope.com';
const LICENCE_USGS = 'U.S. Government Work (public domain) — NASA / USGS Astrogeology';
const LICENCE_WIKI_PD = 'Public domain — Wikimedia Commons (NASA / Cassini Imaging Team)';
const LICENCE_CCBYSA  = 'CC BY-SA 3.0 — Askaniy Anpilogov & John van Vliet via Wikimedia Commons';

// ---------------------------------------------------------------------------
// Texture catalogue
// Each entry: { ext, primary, fallbacks }
//   primary : Solar System Scope stem (null if not available there)
//   fallbacks: [{url, licence, label}] tried in order when primary is absent/fails
//   label   : shown in console output, e.g. 'WIKI' or 'USGS'
//   (Keys with primary:null AND empty fallbacks use procedural generation at runtime)
// ---------------------------------------------------------------------------
const SSS = process.env.SKIP_SSS
  ? 'https://sss-blocked.invalid/textures/download'  // .invalid TLD guaranteed unreachable
  : 'https://www.solarsystemscope.com/textures/download';

// USGS Astrogeology CKAN sample images — all confirmed 200 + image/jpeg + ffd8ff magic bytes
const USGS = {
  io:        'https://astrogeology.usgs.gov/ckan/dataset/f6924861-ce9c-490d-8a4b-7812a20f2de5/resource/a9fab679-8081-4144-9f58-45848836c8f5/download/full.jpg',
  europa:    'https://astrogeology.usgs.gov/ckan/dataset/4080036f-afc5-422e-abe9-1c0c8e4f98ea/resource/3647e7b3-425e-4dcf-951b-cc4a22fb0129/download/europa_voyager_galileossi_global_mosaic_500m_1024.jpg',
  ganymede:  'https://astrogeology.usgs.gov/ckan/dataset/57cad6e2-ed52-4b99-9d44-afbb9def6450/resource/1d52d4a5-bc78-4ac1-a7d0-8d5254ebf1a8/download/ganymede_voyager_galileossi_global_mosaic_1024.jpg',
  callisto:  'https://astrogeology.usgs.gov/ckan/dataset/5eca4dd7-b37b-4415-92fd-921be962e7e5/resource/d2b92ad6-0594-4311-94d1-ea87980dfdac/download/full.jpg',
  pluto:     'https://astrogeology.usgs.gov/ckan/dataset/a5f1b7f4-9822-4697-a201-e23ef4bd3e16/resource/96be2aa1-f384-4a9f-9458-a8431a0e7956/download/pluto_newhorizons_global_mosaic_300m_jul2017_1024.jpg',
  triton:    'https://astrogeology.usgs.gov/ckan/dataset/acf2bb70-6dce-4207-9e10-fee59e28ad7c/resource/f20d9fea-a0af-416a-b282-2ac386c3bb36/download/full.jpg',
  enceladus: 'https://astrogeology.usgs.gov/ckan/dataset/f5c79e2e-2790-4087-8922-ab0ffb753332/resource/1a18653d-ad46-465b-942d-4479683c3126/download/enceladus_full.jpg',
};

// Wikimedia Commons — Cassini / USGS / CC BY-SA sources
// All URLs confirmed GET 200 + correct image Content-Type before addition.
const WIKI = {
  // NASA Cassini Imaging Team — Public domain
  // https://commons.wikimedia.org/wiki/File:2009_Map_of_Titan_cylindrical_projection.jpg
  titan:   'https://upload.wikimedia.org/wikipedia/commons/7/7b/2009_Map_of_Titan_cylindrical_projection.jpg',
  // USGS equirectangular mosaic, 5499×2999 — Public domain
  // https://commons.wikimedia.org/wiki/File:USGS-Phobos-MarsMoon-Map.png
  phobos:  'https://upload.wikimedia.org/wikipedia/commons/2/2d/USGS-Phobos-MarsMoon-Map.png',
  // Askaniy Anpilogov & John van Vliet, 4096×2048 equirectangular — CC BY-SA 3.0
  // https://commons.wikimedia.org/wiki/File:Deimos_map_by_Askaniy.png
  deimos:  'https://upload.wikimedia.org/wikipedia/commons/7/72/Deimos_map_by_Askaniy.png',
};

// ---------------------------------------------------------------------------
// Wikimedia Commons mirrors of Solar System Scope textures
//
// SSS/INOVE uploaded their full texture pack to Wikimedia Commons under the same
// CC BY 4.0 licence.  upload.wikimedia.org is a proper CDN that does NOT block
// GitHub Actions / datacenter IP ranges, unlike solarsystemscope.com.
//
// Each URL was verified via the Commons imageinfo API (confirmed dimensions, 2:1
// equirectangular aspect ratio, and CC BY 4.0 licence) then probed HEAD 200 +
// image/* before being recorded here.  See scripts/_verify-fallbacks.mjs (deleted
// after use) for the verification session.
//
// Commons pages:
//   https://commons.wikimedia.org/wiki/File:Solarsystemscope_texture_2k_<name>.jpg
// ---------------------------------------------------------------------------
const WIKI_SSS = {
  sun:             'https://upload.wikimedia.org/wikipedia/commons/c/cb/Solarsystemscope_texture_2k_sun.jpg',
  mercury:         'https://upload.wikimedia.org/wikipedia/commons/9/92/Solarsystemscope_texture_2k_mercury.jpg',
  venus:           'https://upload.wikimedia.org/wikipedia/commons/4/40/Solarsystemscope_texture_2k_venus_surface.jpg',
  venus_atmosphere:'https://upload.wikimedia.org/wikipedia/commons/6/63/Solarsystemscope_texture_2k_venus_atmosphere.jpg',
  earth:           'https://upload.wikimedia.org/wikipedia/commons/c/c3/Solarsystemscope_texture_2k_earth_daymap.jpg',
  earth_clouds:    'https://upload.wikimedia.org/wikipedia/commons/e/ed/Solarsystemscope_texture_2k_earth_clouds.jpg',
  earth_night:     'https://upload.wikimedia.org/wikipedia/commons/2/2f/Solarsystemscope_texture_2k_earth_nightmap.jpg',
  moon:            'https://upload.wikimedia.org/wikipedia/commons/2/26/Solarsystemscope_texture_2k_moon.jpg',
  mars:            'https://upload.wikimedia.org/wikipedia/commons/4/46/Solarsystemscope_texture_2k_mars.jpg',
  jupiter:         'https://upload.wikimedia.org/wikipedia/commons/b/be/Solarsystemscope_texture_2k_jupiter.jpg',
  saturn:          'https://upload.wikimedia.org/wikipedia/commons/e/ea/Solarsystemscope_texture_2k_saturn.jpg',
  // 2048×125 radial strip — correct for a ring texture (wide-short is expected)
  saturn_ring:     'https://upload.wikimedia.org/wikipedia/commons/7/7d/Solarsystemscope_texture_2k_saturn_ring_alpha.png',
  uranus:          'https://upload.wikimedia.org/wikipedia/commons/9/95/Solarsystemscope_texture_2k_uranus.jpg',
  neptune:         'https://upload.wikimedia.org/wikipedia/commons/1/1e/Solarsystemscope_texture_2k_neptune.jpg',
  ceres:           'https://upload.wikimedia.org/wikipedia/commons/f/f0/Solarsystemscope_texture_2k_ceres_fictional.jpg',
  // 4k versions uploaded to Commons (4096×2048, CC BY 4.0)
  eris:            'https://upload.wikimedia.org/wikipedia/commons/e/ed/Solarsystemscope_texture_4k_eris_fictional.jpg',
  haumea:          'https://upload.wikimedia.org/wikipedia/commons/4/4b/Solarsystemscope_texture_2k_haumea_fictional.jpg',
  makemake:        'https://upload.wikimedia.org/wikipedia/commons/b/b1/Solarsystemscope_texture_4k_makemake_fictional.jpg',
  stars_milky_way: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Solarsystemscope_texture_2k_stars_milky_way.jpg',
};

const TEXTURES = {
  // ── Solar System planets (SSS primary, Wikimedia Commons mirror fallback) ─
  sun:              { ext: 'jpg', primary: '2k_sun',              fallbacks: [{ url: WIKI_SSS.sun,             licence: LICENCE_SSS, label: 'WIKI' }] },
  mercury:          { ext: 'jpg', primary: '2k_mercury',           fallbacks: [{ url: WIKI_SSS.mercury,         licence: LICENCE_SSS, label: 'WIKI' }] },
  venus:            { ext: 'jpg', primary: '2k_venus_surface',     fallbacks: [{ url: WIKI_SSS.venus,           licence: LICENCE_SSS, label: 'WIKI' }] },
  venus_atmosphere: { ext: 'jpg', primary: '2k_venus_atmosphere',  fallbacks: [{ url: WIKI_SSS.venus_atmosphere,licence: LICENCE_SSS, label: 'WIKI' }] },
  earth:            { ext: 'jpg', primary: '2k_earth_daymap',      fallbacks: [{ url: WIKI_SSS.earth,           licence: LICENCE_SSS, label: 'WIKI' }] },
  earth_clouds:     { ext: 'jpg', primary: '2k_earth_clouds',      fallbacks: [{ url: WIKI_SSS.earth_clouds,    licence: LICENCE_SSS, label: 'WIKI' }] },
  earth_night:      { ext: 'jpg', primary: '2k_earth_nightmap',    fallbacks: [{ url: WIKI_SSS.earth_night,     licence: LICENCE_SSS, label: 'WIKI' }] },
  moon:             { ext: 'jpg', primary: '2k_moon',              fallbacks: [{ url: WIKI_SSS.moon,            licence: LICENCE_SSS, label: 'WIKI' }] },
  mars:             { ext: 'jpg', primary: '2k_mars',              fallbacks: [{ url: WIKI_SSS.mars,            licence: LICENCE_SSS, label: 'WIKI' }] },
  jupiter:          { ext: 'jpg', primary: '2k_jupiter',           fallbacks: [{ url: WIKI_SSS.jupiter,         licence: LICENCE_SSS, label: 'WIKI' }] },
  saturn:           { ext: 'jpg', primary: '2k_saturn',            fallbacks: [{ url: WIKI_SSS.saturn,          licence: LICENCE_SSS, label: 'WIKI' }] },
  saturn_ring:      { ext: 'png', primary: '2k_saturn_ring_alpha', fallbacks: [{ url: WIKI_SSS.saturn_ring,     licence: LICENCE_SSS, label: 'WIKI' }] },
  uranus:           { ext: 'jpg', primary: '2k_uranus',            fallbacks: [{ url: WIKI_SSS.uranus,          licence: LICENCE_SSS, label: 'WIKI' }] },
  neptune:          { ext: 'jpg', primary: '2k_neptune',           fallbacks: [{ url: WIKI_SSS.neptune,         licence: LICENCE_SSS, label: 'WIKI' }] },
  stars_milky_way:  { ext: 'jpg', primary: '2k_stars_milky_way',   fallbacks: [{ url: WIKI_SSS.stars_milky_way, licence: LICENCE_SSS, label: 'WIKI' }] },

  // ── SSS fictional / SSS-only ───────────────────────────────────────────────
  ceres:            { ext: 'jpg', primary: '2k_ceres_fictional',   fallbacks: [{ url: WIKI_SSS.ceres,    licence: LICENCE_SSS, label: 'WIKI' }] },

  // ── Galilean moons — no SSS; USGS secondary (Galileo+Voyager mosaics) ─────
  io:       { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.io,       licence: LICENCE_USGS, label: 'USGS' }] },
  europa:   { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.europa,   licence: LICENCE_USGS, label: 'USGS' }] },
  ganymede: { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.ganymede, licence: LICENCE_USGS, label: 'USGS' }] },
  callisto: { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.callisto, licence: LICENCE_USGS, label: 'USGS' }] },

  // ── Dwarf planets / other moons — USGS secondary ──────────────────────────
  pluto:    { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.pluto,    licence: LICENCE_USGS, label: 'USGS' }] },
  triton:   { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.triton,   licence: LICENCE_USGS, label: 'USGS' }] },
  enceladus:{ ext: 'jpg', primary: null, fallbacks: [{ url: USGS.enceladus,licence: LICENCE_USGS, label: 'USGS' }] },

  // ── SSS fictional dwarfs (Wikimedia Commons mirrors, CC BY 4.0) ──────────
  eris:     { ext: 'jpg', primary: '2k_eris_fictional',     fallbacks: [{ url: WIKI_SSS.eris,     licence: LICENCE_SSS, label: 'WIKI' }] },
  haumea:   { ext: 'jpg', primary: '2k_haumea_fictional',   fallbacks: [{ url: WIKI_SSS.haumea,   licence: LICENCE_SSS, label: 'WIKI' }] },
  makemake: { ext: 'jpg', primary: '2k_makemake_fictional', fallbacks: [{ url: WIKI_SSS.makemake, licence: LICENCE_SSS, label: 'WIKI' }] },

  // ── No verified upstream image — procedural fallback at runtime ────────────
  titan:    { ext: 'jpg', primary: null, fallbacks: [{ url: WIKI.titan,   licence: LICENCE_WIKI_PD, label: 'WIKI' }] },
  phobos:   { ext: 'png', primary: null, fallbacks: [{ url: WIKI.phobos,  licence: LICENCE_USGS,    label: 'WIKI' }] },
  deimos:   { ext: 'png', primary: null, fallbacks: [{ url: WIKI.deimos,  licence: LICENCE_CCBYSA,  label: 'WIKI' }] },

  // ── Normal / specular maps ────────────────────────────────────────────────
  // NOTE: Solar System Scope removed their normal/specular/bump maps from the
  // free CC BY 4.0 download tier (all named variants return 200 text/html).
  // NASA/USGS publish only TIFF height maps, not RGB normal maps as JPEG.
  // No verified free JPEG normal-map source was found after exhaustive probing;
  // these keys intentionally carry no sources so useOptionalTexture returns null.
  // The framework is in place — if a verified URL is found, add it here.
  earth_normal:   { ext: 'jpg', primary: null, fallbacks: [] },
  moon_normal:    { ext: 'jpg', primary: null, fallbacks: [] },
  mars_normal:    { ext: 'jpg', primary: null, fallbacks: [] },
  mercury_normal: { ext: 'jpg', primary: null, fallbacks: [] },
  venus_normal:   { ext: 'jpg', primary: null, fallbacks: [] },
  earth_specular: { ext: 'jpg', primary: null, fallbacks: [] },
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });

/**
 * Wikimedia asks that bulk consumers request *thumbnails* rather than full
 * originals, and returns HTTP 429 when you do not. Rewriting
 *   /commons/a/ab/File.jpg
 * to
 *   /commons/thumb/a/ab/File.jpg/2048px-File.jpg
 * is the documented, supported way to do this. It is also a smaller download,
 * and 2048px is plenty for a texture map.
 */
function toWikimediaThumb(url, width = 2048) {
  const m = url.match(
    /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f])\/([0-9a-f]{2})\/(.+)$/,
  );
  if (!m) return null;
  const [, a, ab, file] = m;
  if (file.startsWith('thumb/')) return null;

  // Thumbnails of a PNG stay PNG; everything else is served as JPEG.
  const thumbName = /\.png$/i.test(file) ? `${width}px-${file}` : `${width}px-${file}`;
  return `https://upload.wikimedia.org/wikipedia/commons/thumb/${a}/${ab}/${file}/${thumbName}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function downloadFile(url, dest) {
  const res = await fetch(url, {
    // Wikimedia's policy requires a descriptive UA with contact info.
    headers: {
      'User-Agent':
        'solar-system-3d-texture-fetcher/1.0 (https://github.com/kuldeepcodes/solar-system-3d)',
    },
    redirect: 'follow',
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  await pipeline(res.body, createWriteStream(dest));
}

/**
 * Download with retries. Rate limiting (429) and transient network failures are
 * both worth retrying with a growing delay; a 404 is not, so it fails fast and
 * lets the caller move to the next source.
 */
async function downloadWithRetry(url, dest, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await downloadFile(url, dest);
      return;
    } catch (err) {
      lastErr = err;
      if (err.status && err.status !== 429 && err.status < 500) throw err;
      if (i < attempts - 1) await sleep(1200 * 2 ** i + Math.random() * 400);
    }
  }
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Per-key download logic: try primary, then each fallback in order
// ---------------------------------------------------------------------------
async function processKey(key, entry) {
  const { ext, primary, fallbacks } = entry;
  const dest = path.join(OUT_DIR, `${key}.${ext}`);

  // Nothing at all to try?
  if (primary === null && fallbacks.length === 0) {
    console.log(`  PROC  ${key} (no upstream — procedural fallback)`);
    return { status: 'procedural' };
  }

  if (!FORCE && existsSync(dest)) {
    const src = primary !== null
      ? `${SSS}/${primary}.${ext}`
      : fallbacks[0].url;
    console.log(`  SKIP  ${key} (already exists)`);
    return { status: 'skipped_exists', url: src, licence: primary !== null ? LICENCE_SSS : fallbacks[0].licence };
  }

  // Build ordered list of sources to try: primary first, then fallbacks
  const sources = [];
  if (primary !== null) {
    sources.push({ url: `${SSS}/${primary}.${ext}`, licence: LICENCE_SSS, label: 'SSS' });
  }
  for (const fb of fallbacks) {
    // Prefer the thumbnail form for Wikimedia originals; keep the original as a
    // last resort in case a particular file has no thumbnail rendition.
    const thumb = toWikimediaThumb(fb.url);
    if (thumb) {
      sources.push({ url: thumb, licence: fb.licence, label: fb.label ?? 'WIKI' });
    }
    sources.push({ url: fb.url, licence: fb.licence, label: fb.label ?? 'WIKI' });
  }

  for (const src of sources) {
    try {
      process.stdout.write(`  DL    ${key} [${src.label}] … `);
      await downloadWithRetry(src.url, dest);
      console.log('✓');
      return { status: 'downloaded', url: src.url, licence: src.licence };
    } catch (err) {
      console.log(`✗ (${err.message})`);
      // Clean up any partial file
      if (existsSync(dest)) { try { unlinkSync(dest); } catch (_) {} }
      // Try next source
    }
  }

  return { status: 'failed' };
}

async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const keys = Object.keys(TEXTURES);
const tasks = keys.map(key => () => processKey(key, TEXTURES[key]));

console.log(`\nFetching textures into ${OUT_DIR}\n`);

const results = await runWithConcurrency(tasks, CONCURRENCY);

// Tally
let downloaded = 0, skipped = 0, failed = 0, procedural = 0;
const sssFiles = [], usgsFiles = [], wikiPdFiles = [], wikiCcFiles = [], skippedFiles = [];

for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  const r = results[i];
  const { ext } = TEXTURES[key];

  if (r.status === 'procedural') {
    procedural++;
  } else if (r.status === 'downloaded' || r.status === 'skipped_exists') {
    if (r.status === 'downloaded') downloaded++;
    else { skipped++; skippedFiles.push(key); }
    if      (r.licence === LICENCE_SSS)     sssFiles.push({ key, ext, url: r.url });
    else if (r.licence === LICENCE_USGS)    usgsFiles.push({ key, ext, url: r.url });
    else if (r.licence === LICENCE_WIKI_PD) wikiPdFiles.push({ key, ext, url: r.url });
    else if (r.licence === LICENCE_CCBYSA)  wikiCcFiles.push({ key, ext, url: r.url });
    else                                    usgsFiles.push({ key, ext, url: r.url }); // fallback bucket
  } else if (r.status === 'failed') {
    failed++;
  }
}

console.log(`\nDone — ${downloaded} downloaded, ${skipped} skipped, ${failed} failed, ${procedural} procedural-only.\n`);

// ---------------------------------------------------------------------------
// ATTRIBUTION.md (per-file source + licence, grouped by licence)
// ---------------------------------------------------------------------------
const md = [
  '# Texture Attribution',
  '',
  'Textures in this directory are sourced from the providers listed below.',
  'Each file lists its exact source URL and licence.',
  '',
];

if (sssFiles.length > 0) {
  md.push(
    '## Solar System Scope',
    '',
    'Source: <https://www.solarsystemscope.com/textures/>  ',
    'Licence: **Creative Commons Attribution 4.0 International (CC BY 4.0)**  ',
    '© INOVE / solarsystemscope.com',
    '',
    'Note: files whose source URL begins with `upload.wikimedia.org` were downloaded from',
    'the Wikimedia Commons mirror of the SSS pack (same content, same licence, CDN-accessible',
    'from GitHub Actions runners where solarsystemscope.com is blocked).',
    '',
    '| File | Source URL |',
    '|------|-----------|',
    ...sssFiles.map(f => `| ${f.key}.${f.ext} | ${f.url} |`),
    '',
  );
}

if (usgsFiles.length > 0) {
  md.push(
    '## USGS Astrogeology Science Center / NASA',
    '',
    'Source: <https://astrogeology.usgs.gov/>  ',
    'Licence: **U.S. Government Work — public domain (17 U.S.C. § 105)**  ',
    'Data products from NASA Galileo, Voyager, Cassini, and New Horizons missions.',
    '',
    '| File | Source URL |',
    '|------|-----------|',
    ...usgsFiles.map(f => `| ${f.key}.${f.ext} | ${f.url} |`),
    '',
  );
}

if (wikiPdFiles.length > 0) {
  md.push(
    '## Wikimedia Commons — Public Domain (NASA / Cassini Imaging Team)',
    '',
    'Source: <https://commons.wikimedia.org/>  ',
    'Licence: **Public domain** — NASA / Cassini Imaging Team',
    '',
    '| File | Source URL |',
    '|------|-----------|',
    ...wikiPdFiles.map(f => `| ${f.key}.${f.ext} | ${f.url} |`),
    '',
  );
}

if (wikiCcFiles.length > 0) {
  md.push(
    '## Wikimedia Commons — CC BY-SA 3.0',
    '',
    'Source: <https://commons.wikimedia.org/>  ',
    'Licence: **Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)**  ',
    'Authors: Askaniy Anpilogov & John van Vliet',
    '',
    '| File | Source URL |',
    '|------|-----------|',
    ...wikiCcFiles.map(f => `| ${f.key}.${f.ext} | ${f.url} |`),
    '',
  );
}

md.push('_Generated by `npm run textures`_');

writeFileSync(path.join(OUT_DIR, 'ATTRIBUTION.md'), md.join('\n'));
console.log('ATTRIBUTION.md written.\n');

// Exit 1 only if every attempted download failed (CI misconfiguration guard)
const attempted = downloaded + failed;
if (attempted > 0 && downloaded === 0 && failed === attempted) {
  process.exit(1);
}

