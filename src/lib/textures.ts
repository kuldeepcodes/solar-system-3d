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

export type TextureKind = 'rocky' | 'gas' | 'icy' | 'star' | 'cloud' | 'ring';

// Keys whose downloaded file uses .png instead of .jpg
const PNG_KEYS = new Set(['saturn_ring']);

// Module-level cache: shared across remounts, never disposed.
const bodyCache = new Map<string, THREE.Texture>();
const ringCache = new Map<string, THREE.Texture>();

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
