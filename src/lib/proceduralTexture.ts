/**
 * proceduralTexture.ts
 *
 * Canvas-2D equirectangular texture synthesis.
 * All generators are deterministic — same seed → same pixels every run.
 * Falls back to a 1×1 DataTexture in non-DOM environments (SSR/tests).
 */

import * as THREE from 'three';
import type { TextureKind } from './textures.ts';

// ---------------------------------------------------------------------------
// PRNG: xmur3 seed → mulberry32 float stream
// ---------------------------------------------------------------------------

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let z = Math.imul(s ^ (s >>> 15), s | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

function makeRng(seed: string): () => number {
  const state = xmur3(seed)();
  return mulberry32(state);
}

// ---------------------------------------------------------------------------
// Value noise
// ---------------------------------------------------------------------------

function buildNoiseTable(rng: () => number, size = 256): Float32Array {
  const t = new Float32Array(size);
  for (let i = 0; i < size; i++) t[i] = rng();
  return t;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(t: Float32Array, x: number, y: number): number {
  const N = t.length;
  const ix = Math.floor(x) & (N - 1);
  const iy = Math.floor(y) & (N - 1);
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const ux = smoothstep(fx);
  const uy = smoothstep(fy);
  const a = t[(ix + iy * 57) & (N - 1)];
  const b = t[((ix + 1) + iy * 57) & (N - 1)];
  const c = t[(ix + (iy + 1) * 57) & (N - 1)];
  const d = t[((ix + 1) + (iy + 1) * 57) & (N - 1)];
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function fbm(t: Float32Array, x: number, y: number, octaves = 6): number {
  let v = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    v += amp * valueNoise(t, x * freq, y * freq);
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return v / max;
}

// ---------------------------------------------------------------------------
// DOM guard
// ---------------------------------------------------------------------------

function noDOM(): THREE.Texture {
  const data = new Uint8Array([128, 128, 128, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16),
  ];
}

function clamp(v: number, lo = 0, hi = 255): number {
  return Math.max(lo, Math.min(hi, v));
}

function toCanvasTex(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------------------
// generateBodyTexture
// ---------------------------------------------------------------------------

export function generateBodyTexture(
  seed: string,
  baseColor: string,
  kind: TextureKind,
  size = 1024,
): THREE.Texture {
  if (typeof document === 'undefined') return noDOM();

  const W = size;
  const H = size >> 1; // 2:1 equirectangular

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const img = ctx.createImageData(W, H);
  const px = img.data;

  const rng = makeRng(seed);
  const nt = buildNoiseTable(rng);
  const [br, bg, bb] = hexToRgb(baseColor);

  if (kind === 'rocky') {
    // fBm mottling + craters + polar lightening
    const numCraters = 40;
    interface Crater { cx: number; cy: number; r: number }
    const craters: Crater[] = [];
    for (let i = 0; i < numCraters; i++) {
      craters.push({ cx: rng(), cy: rng(), r: 0.005 + rng() * 0.04 });
    }

    for (let y = 0; y < H; y++) {
      const lat = (y / H - 0.5) * Math.PI; // -π/2 … π/2
      const polarFactor = 1 + 0.3 * Math.pow(Math.abs(lat) / (Math.PI / 2), 2);

      for (let x = 0; x < W; x++) {
        const u = x / W;
        const v = y / H;

        const noise = fbm(nt, u * 6, v * 6);
        let light = 0.7 + 0.6 * (noise - 0.5);
        light *= polarFactor;

        // Crater darkening / rim highlight
        for (const cr of craters) {
          const du = Math.min(Math.abs(u - cr.cx), 1 - Math.abs(u - cr.cx));
          const dv = v - cr.cy;
          const dist = Math.sqrt(du * du + dv * dv) / cr.r;
          if (dist < 1.0) light -= 0.18 * (1 - dist);
          else if (dist < 1.15) light += 0.12 * (1 - (dist - 1) / 0.15);
        }

        const idx = (y * W + x) * 4;
        px[idx + 0] = clamp(br * light);
        px[idx + 1] = clamp(bg * light);
        px[idx + 2] = clamp(bb * light);
        px[idx + 3] = 255;
      }
    }
  } else if (kind === 'gas') {
    // Latitudinal bands with fBm turbulence + storm spot
    const stormU = rng();
    const stormV = 0.3 + rng() * 0.4;
    const stormRx = 0.05 + rng() * 0.06;
    const stormRy = 0.02 + rng() * 0.03;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const v = y / H;

        // Band value: warped latitude
        const warp = 0.08 * (fbm(nt, u * 3, v * 3) - 0.5);
        const band = Math.sin((v + warp) * Math.PI * 10);
        const bv = 0.5 + 0.5 * band;

        const light = 0.6 + 0.7 * bv;

        // Storm oval
        const du2 = Math.min(Math.abs(u - stormU), 1 - Math.abs(u - stormU)) / stormRx;
        const dv2 = (v - stormV) / stormRy;
        const stormDist = Math.sqrt(du2 * du2 + dv2 * dv2);
        const stormBoost = stormDist < 1 ? 0.25 * (1 - stormDist) : 0;

        const idx = (y * W + x) * 4;
        px[idx + 0] = clamp(br * (light + stormBoost));
        px[idx + 1] = clamp(bg * (light + stormBoost));
        px[idx + 2] = clamp(bb * (light + stormBoost));
        px[idx + 3] = 255;
      }
    }
  } else if (kind === 'icy') {
    // High-albedo with bluish fracture lines
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const v = y / H;

        const n1 = fbm(nt, u * 8, v * 8);
        // Fracture lines: high gradient of fbm
        const n2 = fbm(nt, u * 8 + 100, v * 8 + 100);
        const fracture = Math.abs(n1 - n2) < 0.04 ? 1 : 0;

        const base = 0.8 + 0.2 * n1;
        const idx = (y * W + x) * 4;
        px[idx + 0] = clamp(br * base - fracture * 60);
        px[idx + 1] = clamp(bg * base - fracture * 30);
        px[idx + 2] = clamp(bb * base + fracture * 40);
        px[idx + 3] = 255;
      }
    }
  } else if (kind === 'star') {
    // Granulated convection cells
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const v = y / H;
        const n = fbm(nt, u * 12, v * 12, 4);
        const light = 0.75 + 0.5 * (n - 0.5);
        const idx = (y * W + x) * 4;
        px[idx + 0] = clamp(br * light);
        px[idx + 1] = clamp(bg * light);
        px[idx + 2] = clamp(bb * light);
        px[idx + 3] = 255;
      }
    }
  } else if (kind === 'cloud') {
    // White wisps on transparent background
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const v = y / H;
        const n = fbm(nt, u * 5, v * 5);
        const alpha = Math.pow(Math.max(0, n - 0.45) / 0.55, 1.5);
        const idx = (y * W + x) * 4;
        px[idx + 0] = 255;
        px[idx + 1] = 255;
        px[idx + 2] = 255;
        px[idx + 3] = clamp(alpha * 255);
      }
    }
  }

  ctx.putImageData(img, 0, 0);
  return toCanvasTex(canvas);
}

// ---------------------------------------------------------------------------
// generateRingTexture
// ---------------------------------------------------------------------------

export function generateRingTexture(baseColor: string, size = 1024): THREE.Texture {
  if (typeof document === 'undefined') return noDOM();

  const W = size;
  const H = 64;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const px = img.data;
  const [br, bg, bb] = hexToRgb(baseColor);

  // Simple deterministic banding along U axis
  const rng = makeRng(baseColor + '_ring');
  const nt = buildNoiseTable(rng);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const n = valueNoise(nt, u * 20, 0);
      const band = 0.5 + 0.5 * Math.sin(u * Math.PI * 30);
      const alpha = Math.pow(band * n, 0.7);
      const idx = (y * W + x) * 4;
      px[idx + 0] = clamp(br * (0.8 + 0.4 * n));
      px[idx + 1] = clamp(bg * (0.8 + 0.4 * n));
      px[idx + 2] = clamp(bb * (0.8 + 0.4 * n));
      px[idx + 3] = clamp(alpha * 220);
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// generateStarfieldTexture
// ---------------------------------------------------------------------------

export function generateStarfieldTexture(size = 1024): THREE.Texture {
  if (typeof document === 'undefined') return noDOM();

  const W = size;
  const H = size >> 1;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const px = img.data;

  // Black background
  for (let i = 0; i < px.length; i += 4) {
    px[i + 3] = 255;
  }

  const rng = makeRng('starfield');
  const numStars = 4000;
  for (let i = 0; i < numStars; i++) {
    const sx = Math.floor(rng() * W);
    const sy = Math.floor(rng() * H);
    const brightness = Math.floor(180 + rng() * 75);
    const idx = (sy * W + sx) * 4;
    px[idx + 0] = brightness;
    px[idx + 1] = brightness;
    px[idx + 2] = brightness;
    px[idx + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
