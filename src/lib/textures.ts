/**
 * textures.ts
 *
 * Runtime texture loader with procedural fallback.
 * Uses THREE.TextureLoader with useState/useEffect so failed loads
 * gracefully fall back to a procedural texture without suspending.
 */

import * as THREE from 'three';
import { useState, useEffect } from 'react';
import { generateBodyTexture, generateRingTexture } from './proceduralTexture.ts';
import { deriveNormalMap } from './deriveNormalMap.ts';

export type TextureKind = 'rocky' | 'gas' | 'icy' | 'star' | 'cloud' | 'ring';

// Keys whose downloaded file uses .png instead of .jpg
const PNG_KEYS = new Set(['saturn_ring', 'phobos', 'deimos']);

// Module-level cache: shared across remounts, never disposed.
const bodyCache = new Map<string, THREE.Texture>();
const ringCache = new Map<string, THREE.Texture>();
const optionalCache = new Map<string, THREE.Texture | null>();

const warned = new Set<string>();

/** Resolve a texture path respecting Vite BASE_URL (GitHub Pages subpath). */
export function textureUrl(key: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const ext = PNG_KEYS.has(key) ? 'png' : 'jpg';
  return `${base}/textures/${key}.${ext}`;
}

function applyColorSpace(tex: THREE.Texture): void {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
}

// ---------------------------------------------------------------------------
// useBodyTexture
// ---------------------------------------------------------------------------

export function useBodyTexture(
  key: string,
  color: string,
  kind: TextureKind,
): THREE.Texture {
  // Seed state with procedural texture so first frame always has a valid texture.
  const [texture, setTexture] = useState<THREE.Texture>(() => {
    const cached = bodyCache.get(key);
    if (cached) return cached;
    const proc = generateBodyTexture(key, color, kind);
    bodyCache.set(key, proc);
    return proc;
  });

  useEffect(() => {
    // An empty key means "this body has no such map" - skip the request rather
    // than fetching a sentinel filename that is guaranteed to 404.
    if (!key) return;

    // Already loaded a real texture for this key.
    if (bodyCache.has(key) && !(bodyCache.get(key) instanceof THREE.CanvasTexture)) {
      setTexture(bodyCache.get(key)!);
      return;
    }

    const url = textureUrl(key);
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (loaded) => {
        applyColorSpace(loaded);
        bodyCache.set(key, loaded);
        setTexture(loaded);
      },
      undefined,
      () => {
        // Load failed — keep procedural texture, warn once.
        if (!warned.has(key)) {
          warned.add(key);
          console.warn(`[textures] ${key}.jpg not found — using procedural fallback.`);
        }
      },
    );
    // No cleanup: textures are cached at module level, not per-component.
  }, [key, color, kind]);

  return texture;
}

// ---------------------------------------------------------------------------
// useRingTexture
// ---------------------------------------------------------------------------

export function useRingTexture(
  key: string | undefined,
  color: string,
  _inner: number,
  _outer: number,
): THREE.Texture {
  const cacheKey = key ?? `ring_${color}`;

  const [texture, setTexture] = useState<THREE.Texture>(() => {
    const cached = ringCache.get(cacheKey);
    if (cached) return cached;
    const proc = generateRingTexture(color);
    ringCache.set(cacheKey, proc);
    return proc;
  });

  useEffect(() => {
    if (!key) return;

    if (ringCache.has(key) && !(ringCache.get(key) instanceof THREE.CanvasTexture)) {
      setTexture(ringCache.get(key)!);
      return;
    }

    const url = textureUrl(key);
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (loaded) => {
        applyColorSpace(loaded);
        ringCache.set(key, loaded);
        setTexture(loaded);
      },
      undefined,
      () => {
        if (!warned.has(key)) {
          warned.add(key);
          console.warn(`[textures] ${key}.jpg not found — using procedural ring fallback.`);
        }
      },
    );
  }, [key, color]);

  return texture;
}

// ---------------------------------------------------------------------------
// useDerivedNormal
// Returns a real downloaded normal map when one exists on disk, otherwise
// synthesises one by Sobel-filtering the colour map's luminance.  Never
// returns a procedural texture — only a genuine derived or downloaded map.
// Must not block the first frame: derive runs inside useEffect.
// ---------------------------------------------------------------------------

/** Cache for derived normal maps (separate from optionalCache). */
const derivedNormalCache = new Map<string, THREE.Texture | null>();

export function useDerivedNormal(
  textureKey: string,
  colorMap: THREE.Texture,
  strength: number = 2.0,
): THREE.Texture | null {
  const normalKey = `${textureKey}_normal`;

  const [normalMap, setNormalMap] = useState<THREE.Texture | null>(() => {
    // Empty key sentinel: derivation not requested for this body.
    if (!textureKey) return null;
    // Immediately return any already-computed result (cache hit on remount)
    if (derivedNormalCache.has(normalKey)) {
      return derivedNormalCache.get(normalKey) ?? null;
    }
    if (optionalCache.has(normalKey)) {
      return optionalCache.get(normalKey) ?? null;
    }
    return null;
  });

  useEffect(() => {
    // Empty key: derivation not requested for this body type (e.g., gas giants).
    if (!textureKey) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const attemptDerive = () => {
      const derived = deriveNormalMap(colorMap, textureKey, strength);
      if (derived) {
        derivedNormalCache.set(normalKey, derived);
        setNormalMap(derived);
      } else {
        // Source image not decoded yet — retry once after a short delay.
        derivedNormalCache.set(normalKey, null);
        timeoutId = setTimeout(() => {
          const retry = deriveNormalMap(colorMap, textureKey, strength);
          if (retry) {
            derivedNormalCache.set(normalKey, retry);
            setNormalMap(retry);
          }
        }, 500);
      }
    };

    // --- Priority 1: real downloaded file already in cache ---
    if (optionalCache.has(normalKey)) {
      const cached = optionalCache.get(normalKey) ?? null;
      if (cached !== null) { setNormalMap(cached); return; }
      // null = file missing; fall through to derivation
    }

    // --- Priority 2: already-derived map ---
    if (derivedNormalCache.has(normalKey)) {
      setNormalMap(derivedNormalCache.get(normalKey) ?? null);
      return;
    }

    // --- Priority 3: derive from the colour map ---
    //
    // No `<key>_normal` files are published by any of our upstream sources, so
    // probing for one just produces a guaranteed 404 per body on every page
    // load. If a real normal map is ever shipped, `fetch-textures.mjs` will
    // populate `optionalCache` via `useOptionalTexture` and priority 1 above
    // will pick it up.
    attemptDerive();

    return () => { if (timeoutId !== undefined) clearTimeout(timeoutId); };
  }, [textureKey, colorMap, strength, normalKey]);

  return normalMap;
}
// Loads an optional secondary map (normal, specular, night-lights, etc.).
// Returns null when the file is absent — never substitutes a procedural texture
// because a wrong normal map corrupts lighting more than having none.
// colorSpace defaults to THREE.NoColorSpace (linear) which is correct for
// normal maps and specular/roughness maps. Pass 'srgb' only for colour-like
// secondary maps (e.g. night-lights / emissive maps).
// ---------------------------------------------------------------------------
export function useOptionalTexture(
  key: string | undefined,
  colorSpace: 'srgb' | 'linear' = 'linear',
): THREE.Texture | null {
  const cacheKey = key ?? '';

  const [texture, setTexture] = useState<THREE.Texture | null>(() => {
    if (!key) return null;
    return optionalCache.get(cacheKey) ?? null;
  });

  useEffect(() => {
    if (!key) return;

    // Already resolved (success or permanent miss recorded as null in cache).
    if (optionalCache.has(cacheKey)) {
      setTexture(optionalCache.get(cacheKey) ?? null);
      return;
    }

    const url = textureUrl(key);
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (loaded) => {
        loaded.colorSpace =
          colorSpace === 'srgb' ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        loaded.anisotropy = 4;
        optionalCache.set(cacheKey, loaded);
        setTexture(loaded);
      },
      undefined,
      () => {
        // File absent or failed — record permanent null so we don't retry.
        optionalCache.set(cacheKey, null);
        if (!warned.has(cacheKey)) {
          warned.add(cacheKey);
          console.info(`[textures] optional map "${key}" not found — skipped.`);
        }
      },
    );
  }, [key, colorSpace, cacheKey]);

  return texture;
}
