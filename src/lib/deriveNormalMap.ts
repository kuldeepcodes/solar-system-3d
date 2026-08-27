/**
 * deriveNormalMap.ts
 *
 * Synthesises a tangent-space normal map by Sobel-filtering the luminance of a
 * colour texture.  For airless, heavily cratered bodies albedo variation
 * correlates strongly with surface topography (craters, maria, ridges), so the
 * derived normals are convincingly accurate at the scale that matters visually.
 *
 * The approach:
 *  1. Draw source.image to an offscreen canvas (capped at 1024×512).
 *  2. Read ImageData and compute per-pixel luminance.
 *  3. Apply a 3×3 Sobel operator to obtain dX / dY gradients.
 *     — Horizontal wrapping ensures the equirectangular seam is seamless.
 *     — Vertical edges are clamped (no wrapping at the poles).
 *  4. Normal = normalise(vec3(-dX·s, -dY·s, 1)), packed to RGB 0-255.
 *  5. Return a THREE.CanvasTexture with NoColorSpace + RepeatWrapping.
 *
 * The function is cached per textureKey so the ~30–80 ms canvas work runs
 * exactly once per body regardless of remounts.
 */

import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Module-level cache (keyed by textureKey string)
// ---------------------------------------------------------------------------
const cache = new Map<string, THREE.CanvasTexture>();

// Maximum canvas dimensions — keeps the Sobel pass fast on mid-range hardware.
const MAX_W = 1024;
const MAX_H = 512;

/** Luminance of an sRGB pixel (BT.709 coefficients). */
function lum(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Derive a tangent-space normal map from a colour texture's luminance.
 *
 * @param source     The colour texture.  `source.image` must already be a
 *                   decoded HTMLImageElement/HTMLCanvasElement/ImageBitmap.
 * @param textureKey Stable cache key — usually the body's textureKey string.
 * @param strength   Gradient multiplier.  ~2.5 for heavily cratered airless
 *                   bodies, ~1.0 for bodies where albedo ≠ topography (Earth).
 *
 * @returns A CanvasTexture ready to assign to `normalMap`, or `null` when the
 *          source image is not yet decoded (caller should retry after the
 *          colour texture settles).
 */
export function deriveNormalMap(
  source: THREE.Texture,
  textureKey: string,
  strength: number = 2.0,
): THREE.CanvasTexture | null {
  // SSR / worker guard
  if (typeof document === 'undefined') return null;

  // Cache hit
  const cached = cache.get(textureKey);
  if (cached) return cached;

  // Guard: image not yet decoded
  const img = source.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap | null | undefined;
  if (!img) return null;

  // For HTMLImageElement, naturalWidth === 0 means not yet loaded
  if (img instanceof HTMLImageElement && img.naturalWidth === 0) return null;

  const srcW = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const srcH = 'naturalHeight' in img ? img.naturalHeight : img.height;
  if (srcW === 0 || srcH === 0) return null;

  // Destination canvas — downscale if the source is larger than our cap
  const w = Math.min(srcW, MAX_W);
  const h = Math.min(srcH, MAX_H);

  const canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);

  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    // Cross-origin canvas taint — cannot read pixels
    console.warn(`[deriveNormalMap] Cannot read pixels for "${textureKey}" (cross-origin taint)`);
    return null;
  }

  const src = imageData.data; // Uint8ClampedArray, RGBA

  // Build luminance buffer (float 0-255)
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    L[i] = lum(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]);
  }

  /** Sample luminance with horizontal wrapping + vertical clamping. */
  function sample(x: number, y: number): number {
    const cx = ((x % w) + w) % w;          // wrap longitude
    const cy = Math.max(0, Math.min(h - 1, y)); // clamp latitude
    return L[cy * w + cx];
  }

  // Sobel pass — write result into a new canvas
  const out = document.createElement('canvas');
  out.width  = w;
  out.height = h;
  const outCtx = out.getContext('2d')!;
  const outData = outCtx.createImageData(w, h);
  const d = outData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // 3×3 Sobel kernel (horizontal edge → dY, vertical edge → dX)
      const tl = sample(x - 1, y - 1); const tc = sample(x, y - 1); const tr = sample(x + 1, y - 1);
      const ml = sample(x - 1, y);                                   const mr = sample(x + 1, y);
      const bl = sample(x - 1, y + 1); const bc = sample(x, y + 1); const br = sample(x + 1, y + 1);

      // Sobel: dX detects left-right gradient (tangent U direction)
      //        dY detects top-bottom gradient (tangent V direction)
      const dX = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
      const dY = (bl + 2 * bc + br) - (tl + 2 * tc + tr);

      // Normal in tangent space: right-hand convention, Z points outward
      // Negate dX / dY because the Sobel gradient points *toward* brighter
      // pixels; for a height field brighter = higher so the normal leans away.
      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 255.0; // unit length contribution from the Z axis (pre-scale)

      // Normalise
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * w + x) * 4;
      d[idx]     = Math.round(nx * 127.5 + 127.5); // R → X
      d[idx + 1] = Math.round(ny * 127.5 + 127.5); // G → Y
      d[idx + 2] = Math.round(nz * 127.5 + 127.5); // B → Z
      d[idx + 3] = 255;
    }
  }

  outCtx.putImageData(outData, 0, 0);

  const tex = new THREE.CanvasTexture(out);
  tex.colorSpace  = THREE.NoColorSpace;  // normal maps are linear vectors, NOT sRGB
  tex.wrapS       = THREE.RepeatWrapping; // seamless horizontal wrapping for equirectangular
  tex.wrapT       = THREE.ClampToEdgeWrapping;
  tex.anisotropy  = 4;
  tex.needsUpdate = true;

  cache.set(textureKey, tex);
  return tex;
}
