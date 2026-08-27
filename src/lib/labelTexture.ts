import * as THREE from 'three';

/**
 * Sprite-based labels.
 *
 * Deliberately not drei's `<Html>`: DOM overlays cannot be rendered inside a
 * WebXR session, and troika `<Text>` fetches its default font from a CDN, which
 * would break the offline-first guarantee. A canvas-generated sprite has
 * neither problem and costs one draw call per label.
 */
const cache = new Map<string, THREE.Texture>();

const FONT = '600 44px "Inter", "Segoe UI", system-ui, sans-serif';
const PAD_X = 26;
const PAD_Y = 16;

export function labelTexture(text: string, accent = '#8fd0ff'): THREE.Texture {
  const cacheKey = `${text}|${accent}`;
  const existing = cache.get(cacheKey);
  if (existing) return existing;

  if (typeof document === 'undefined') {
    const fallback = new THREE.Texture();
    cache.set(cacheKey, fallback);
    return fallback;
  }

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = FONT;
  const metrics = measureCtx.measureText(text);

  const width = Math.ceil(metrics.width + PAD_X * 2);
  const height = 64 + PAD_Y * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const radius = height / 2;
  ctx.fillStyle = 'rgba(6, 12, 26, 0.62)';
  roundRect(ctx, 0, 0, width, height, radius);
  ctx.fill();

  ctx.strokeStyle = 'rgba(140, 190, 255, 0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, width - 2, height - 2, radius - 1);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText(text, width / 2, height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(cacheKey, texture);
  return texture;
}

/** Aspect ratio of a generated label, used to size the sprite correctly. */
export function labelAspect(text: string): number {
  if (typeof document === 'undefined') return 4;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = FONT;
  const width = ctx.measureText(text).width + PAD_X * 2;
  return width / (64 + PAD_Y * 2);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
