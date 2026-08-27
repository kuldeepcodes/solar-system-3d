/**
 * fetch-textures.mjs
 *
 * Downloads equirectangular planet/body textures into public/textures/.
 * These assets are intentionally gitignored — run `npm run textures` to fetch them.
 *
 * Primary source  : Solar System Scope (https://www.solarsystemscope.com/textures/)
 *                   Licence: CC BY 4.0 © INOVE / solarsystemscope.com
 * Secondary source: USGS Astrogeology Science Center (https://astrogeology.usgs.gov/)
 *                   Licence: U.S. Government Work — public domain (17 U.S.C. § 105)
 *                   NASA / USGS data products
 *
 * URL verification: every fallback URL was probed with a GET request and confirmed
 * to return HTTP 200 with Content-Type: image/jpeg (JPEG magic bytes ffd8ff) before
 * being added to this script.
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
const CONCURRENCY = 4;

// ---------------------------------------------------------------------------
// Licence constants
// ---------------------------------------------------------------------------
const LICENCE_SSS  = 'CC BY 4.0 — © INOVE / solarsystemscope.com';
const LICENCE_USGS = 'U.S. Government Work (public domain) — NASA / USGS Astrogeology';

// ---------------------------------------------------------------------------
// Texture catalogue
// Each entry: { ext, primary, fallbacks }
//   primary : Solar System Scope stem (null if not available there)
//   fallbacks: [{url, licence}] tried in order when primary is absent/fails
//   (Keys with primary:null AND empty fallbacks use procedural generation at runtime)
// ---------------------------------------------------------------------------
const SSS = 'https://www.solarsystemscope.com/textures/download';

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

const TEXTURES = {
  // ── Solar System planets (SSS primary) ────────────────────────────────────
  sun:              { ext: 'jpg', primary: '2k_sun',              fallbacks: [] },
  mercury:          { ext: 'jpg', primary: '2k_mercury',           fallbacks: [] },
  venus:            { ext: 'jpg', primary: '2k_venus_surface',     fallbacks: [] },
  venus_atmosphere: { ext: 'jpg', primary: '2k_venus_atmosphere',  fallbacks: [] },
  earth:            { ext: 'jpg', primary: '2k_earth_daymap',      fallbacks: [] },
  earth_clouds:     { ext: 'jpg', primary: '2k_earth_clouds',      fallbacks: [] },
  earth_night:      { ext: 'jpg', primary: '2k_earth_nightmap',    fallbacks: [] },
  moon:             { ext: 'jpg', primary: '2k_moon',              fallbacks: [] },
  mars:             { ext: 'jpg', primary: '2k_mars',              fallbacks: [] },
  jupiter:          { ext: 'jpg', primary: '2k_jupiter',           fallbacks: [] },
  saturn:           { ext: 'jpg', primary: '2k_saturn',            fallbacks: [] },
  saturn_ring:      { ext: 'png', primary: '2k_saturn_ring_alpha', fallbacks: [] }, // SSS upstream is PNG
  uranus:           { ext: 'jpg', primary: '2k_uranus',            fallbacks: [] },
  neptune:          { ext: 'jpg', primary: '2k_neptune',           fallbacks: [] },
  stars_milky_way:  { ext: 'jpg', primary: '2k_stars_milky_way',   fallbacks: [] },

  // ── SSS fictional / SSS-only ───────────────────────────────────────────────
  ceres:            { ext: 'jpg', primary: '2k_ceres_fictional',   fallbacks: [] },

  // ── Galilean moons — no SSS; USGS secondary (Galileo+Voyager mosaics) ─────
  io:       { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.io,       licence: LICENCE_USGS }] },
  europa:   { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.europa,   licence: LICENCE_USGS }] },
  ganymede: { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.ganymede, licence: LICENCE_USGS }] },
  callisto: { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.callisto, licence: LICENCE_USGS }] },

  // ── Dwarf planets / other moons — USGS secondary ──────────────────────────
  pluto:    { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.pluto,    licence: LICENCE_USGS }] },
  triton:   { ext: 'jpg', primary: null, fallbacks: [{ url: USGS.triton,   licence: LICENCE_USGS }] },
  enceladus:{ ext: 'jpg', primary: null, fallbacks: [{ url: USGS.enceladus,licence: LICENCE_USGS }] },

  // ── No verified upstream image — procedural fallback at runtime ────────────
  titan:    { ext: 'jpg', primary: null, fallbacks: [] }, // Titan's thick haze obscures surface; no usable equirect found
  phobos:   { ext: 'jpg', primary: null, fallbacks: [] }, // no verified equirectangular JPEG found
  deimos:   { ext: 'jpg', primary: null, fallbacks: [] }, // no verified equirectangular JPEG found
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
mkdirSync(OUT_DIR, { recursive: true });

async function downloadFile(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'solar-system-3d-texture-fetcher/1.0' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  await pipeline(res.body, createWriteStream(dest));
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
    sources.push({ url: fb.url, licence: fb.licence, label: 'USGS' });
  }

  for (const src of sources) {
    try {
      process.stdout.write(`  DL    ${key} [${src.label}] … `);
      await downloadFile(src.url, dest);
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
const sssFiles = [], usgsFiles = [], skippedFiles = [];

for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  const r = results[i];
  const { ext } = TEXTURES[key];

  if (r.status === 'procedural') {
    procedural++;
  } else if (r.status === 'downloaded') {
    downloaded++;
    if (r.licence === LICENCE_SSS)  sssFiles.push({ key, ext, url: r.url });
    else                             usgsFiles.push({ key, ext, url: r.url });
  } else if (r.status === 'skipped_exists') {
    skipped++;
    if (r.licence === LICENCE_SSS)  sssFiles.push({ key, ext, url: r.url });
    else                             usgsFiles.push({ key, ext, url: r.url });
    skippedFiles.push(key);
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
  'Textures in this directory are sourced from two providers.',
  'Each file lists its exact source URL and licence below.',
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

md.push('_Generated by `npm run textures`_');

writeFileSync(path.join(OUT_DIR, 'ATTRIBUTION.md'), md.join('\n'));
console.log('ATTRIBUTION.md written.\n');

// Exit 1 only if every attempted download failed (CI misconfiguration guard)
const attempted = downloaded + failed;
if (attempted > 0 && downloaded === 0 && failed === attempted) {
  process.exit(1);
}

