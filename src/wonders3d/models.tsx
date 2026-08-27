/**
 * Procedural 3D models of the Seven Wonders of the World + Giza.
 * Pure three.js primitives — no GLTF, no textures.
 * 1 scene unit = 1 metre. All models sit on y=0, centred on x/z origin.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';

/* ─────────────────────────────────────────────
   Public interface
───────────────────────────────────────────── */

export interface WonderModelProps {
  /** Level of detail. 'low' roughly halves segment counts. */
  detail?: 'low' | 'high';
}

export interface WonderSceneConfig {
  groundColor: string;
  skyHorizon: string;
  skyZenith: string;
  sunElevation: number;
  sunAzimuth: number;
  roamRadius: number;
  spawn: [number, number, number];
  footprint: number;
  terrain: 'sand' | 'grass' | 'stone' | 'jungle';
}

/* ─────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────── */

/** Deterministic seeded PRNG (mulberry32). */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Slightly vary a hex colour by ±factor (deterministic per seed). */
function varColor(hex: string, factor: number, rng: () => number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - factor + rng() * 2 * factor))));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - factor + rng() * 2 * factor))));
  const b = Math.min(255, Math.max(0, Math.round((n & 0xff) * (1 - factor + rng() * 2 * factor))));
  return `rgb(${r},${g},${b})`;
}

type Mat = { roughness?: number; metalness?: number };

function stoneMat(color: string, extra: Mat = {}) {
  return <meshStandardMaterial color={color} roughness={extra.roughness ?? 0.9} metalness={extra.metalness ?? 0} />;
}

/* ─────────────────────────────────────────────
   TAJ MAHAL
───────────────────────────────────────────── */

export function TajMahalModel({ detail = 'high' }: WonderModelProps): React.ReactElement {
  const segs = detail === 'high' ? 32 : 16;
  const rng = seeded(1);

  const onionProfile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const h = 25;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      let r: number;
      if (t < 0.4) {
        r = 10 * Math.sin((t / 0.4) * Math.PI * 0.5);
      } else if (t < 0.75) {
        const u = (t - 0.4) / 0.35;
        r = 10 * (1 - u * 0.7);
      } else {
        const u = (t - 0.75) / 0.25;
        r = 3 * (1 - u);
      }
      pts.push(new THREE.Vector2(Math.max(0.05, r), t * h));
    }
    return pts;
  }, []);

  const smallOnionProfile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const h = 8;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      let r: number;
      if (t < 0.4) r = 3 * Math.sin((t / 0.4) * Math.PI * 0.5);
      else if (t < 0.75) r = 3 * (1 - ((t - 0.4) / 0.35) * 0.7);
      else r = 0.9 * (1 - (t - 0.75) / 0.25);
      pts.push(new THREE.Vector2(Math.max(0.05, r), t * h));
    }
    return pts;
  }, []);

  const white = '#f4f1ea';
  const darkRecess = '#b0a898';

  const chatriPositions: [number, number][] = [
    [22, 22], [22, -22], [-22, 22], [-22, -22],
  ];

  const minaretPositions: [number, number][] = [
    [47, 47], [47, -47], [-47, 47], [-47, -47],
  ];

  return (
    <group>
      {/* Raised plinth 95×95 m, 6 m high */}
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <boxGeometry args={[95, 6, 95]} />
        {stoneMat(varColor(white, 0.05, rng))}
      </mesh>

      {/* Central octagonal mass 55×55 m, 35 m tall — octagonal cylinder to simulate chamfered square */}
      <mesh castShadow receiveShadow position={[0, 6 + 17.5, 0]}>
        <cylinderGeometry args={[55 / 2 * Math.SQRT2 * 0.72, 55 / 2 * Math.SQRT2 * 0.72, 35, 8]} />
        {stoneMat(white)}
      </mesh>

      {/* Drum below main dome */}
      <mesh castShadow receiveShadow position={[0, 6 + 35 + 3.5, 0]}>
        <cylinderGeometry args={[8, 8, 7, segs]} />
        {stoneMat(varColor(white, 0.04, rng))}
      </mesh>

      {/* Main onion dome via lathe */}
      <mesh castShadow receiveShadow position={[0, 6 + 35 + 7, 0]}>
        <latheGeometry args={[onionProfile, segs]} />
        {stoneMat(white)}
      </mesh>

      {/* Spire finial */}
      <mesh castShadow position={[0, 6 + 35 + 7 + 25, 0]}>
        <cylinderGeometry args={[0.15, 0.5, 3, 8]} />
        {stoneMat('#d4af37', { roughness: 0.3, metalness: 0.6 })}
      </mesh>

      {/* Four corner chattris */}
      {chatriPositions.map(([cx, cz], i) => (
        <group key={i} position={[cx, 6 + 35, cz]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[2.5, 2.5, 5, 8]} />
            {stoneMat(varColor(white, 0.05, rng))}
          </mesh>
          <mesh castShadow receiveShadow position={[0, 2.5 + 2, 0]}>
            <cylinderGeometry args={[2.5, 2.5, 4, 8]} />
            {stoneMat(white)}
          </mesh>
          <mesh castShadow position={[0, 2.5 + 4, 0]}>
            <latheGeometry args={[smallOnionProfile, 16]} />
            {stoneMat(white)}
          </mesh>
        </group>
      ))}

      {/* Four minarets */}
      {minaretPositions.map(([mx, mz], i) => (
        <group key={i} position={[mx, 0, mz]}>
          {/* Base */}
          <mesh castShadow receiveShadow position={[0, 3, 0]}>
            <cylinderGeometry args={[2.2, 2.8, 6, segs]} />
            {stoneMat(varColor(white, 0.04, rng))}
          </mesh>
          {/* Shaft */}
          <mesh castShadow receiveShadow position={[0, 20, 0]}>
            <cylinderGeometry args={[1.8, 2.2, 28, segs]} />
            {stoneMat(white)}
          </mesh>
          {/* Balcony rings */}
          {[13, 24].map((h, j) => (
            <mesh key={j} castShadow receiveShadow position={[0, h, 0]}>
              <torusGeometry args={[2.4, 0.35, 8, segs]} />
              {stoneMat(white)}
            </mesh>
          ))}
          {/* Cap drum */}
          <mesh castShadow receiveShadow position={[0, 37, 0]}>
            <cylinderGeometry args={[2, 2, 4, 16]} />
            {stoneMat(white)}
          </mesh>
          {/* Cap dome */}
          <mesh castShadow position={[0, 41, 0]}>
            <sphereGeometry args={[2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            {stoneMat(white)}
          </mesh>
        </group>
      ))}

      {/* Front iwan arch recess (dark recessed box + curved arch approximation) */}
      <mesh castShadow receiveShadow position={[0, 6 + 10, -27.5 + 0.5]}>
        <boxGeometry args={[12, 20, 1]} />
        {stoneMat(darkRecess)}
      </mesh>
      {/* Arch cap: half-cylinder */}
      <mesh castShadow receiveShadow position={[0, 6 + 20 + 3, -27.5 + 0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[6, 6, 1, segs, 1, false, 0, Math.PI]} />
        {stoneMat(darkRecess)}
      </mesh>

      {/* Rear iwan */}
      <mesh castShadow receiveShadow position={[0, 6 + 10, 27.5 - 0.5]}>
        <boxGeometry args={[12, 20, 1]} />
        {stoneMat(darkRecess)}
      </mesh>
      <mesh castShadow receiveShadow position={[0, 6 + 20 + 3, 27.5 - 0.5]}>
        <cylinderGeometry args={[6, 6, 1, segs, 1, false, 0, Math.PI]} />
        {stoneMat(darkRecess)}
      </mesh>

      {/* Reflecting pool: 8×90 m, slightly reflective */}
      <mesh receiveShadow position={[0, 0.15, -95]}>
        <boxGeometry args={[8, 0.3, 90]} />
        <meshStandardMaterial color="#3f6f8f" roughness={0.05} metalness={0.1} />
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────
   COLOSSEUM
───────────────────────────────────────────── */

export function ColosseumModel({ detail = 'high' }: WonderModelProps): React.ReactElement {
  const rng = seeded(2);
  const travertine = '#c8b394';
  const bayCount = detail === 'high' ? 60 : 30;

  // Outer ellipse semi-axes
  const A = 94, B = 78;

  interface PillarData {
    angle: number;
    x: number;
    z: number;
    maxTiers: number;
  }

  const pillars = useMemo<PillarData[]>(() => {
    const arr: PillarData[] = [];
    for (let i = 0; i < bayCount; i++) {
      const angle = (i / bayCount) * Math.PI * 2;
      const x = A * Math.cos(angle);
      const z = B * Math.sin(angle);
      // Ruin: collapsed section from angle ~PI*0.5 to PI*1.6
      const normalAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      let maxTiers = 4;
      if (normalAngle > Math.PI * 0.5 && normalAngle < Math.PI * 1.6) {
        const u = (normalAngle - Math.PI * 0.5) / (Math.PI * 1.1);
        if (u < 0.3) maxTiers = 3;
        else if (u < 0.6) maxTiers = 2;
        else maxTiers = 1;
      }
      arr.push({ angle, x, z, maxTiers });
    }
    return arr;
  }, [bayCount]);

  const tierH = 10.5;
  const atticH = 13;

  return (
    <group>
      {/* Arena floor at y=8 */}
      <mesh receiveShadow position={[0, 8, 0]}>
        <cylinderGeometry args={[34, 34, 0.4, bayCount, 1, false]} />
        {stoneMat(varColor('#c4a87a', 0.05, rng))}
      </mesh>

      {/* Hypogeum walls below arena */}
      {useMemo(() => {
        const walls: React.ReactElement[] = [];
        const subRng = seeded(20);
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 12; c++) {
            const rx = -15 + r * 10;
            const cz = -50 + c * 9;
            walls.push(
              <mesh key={`hyp-${r}-${c}`} castShadow receiveShadow
                position={[rx, 4, cz]}>
                <boxGeometry args={[0.8, 7, 7]} />
                {stoneMat(varColor(travertine, 0.08, subRng))}
              </mesh>
            );
          }
        }
        return walls;
      }, [])}

      {/* Inner elliptical wall */}
      {useMemo(() => {
        const r2ng = seeded(21);
        const count = bayCount;
        const innerA = 55, innerB = 45;
        const els: React.ReactElement[] = [];
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          const x = innerA * Math.cos(a);
          const z = innerB * Math.sin(a);
          els.push(
            <mesh key={`inner-${i}`} castShadow receiveShadow
              position={[x, 15, z]}>
              <boxGeometry args={[3, 30, 3]} />
              {stoneMat(varColor(travertine, 0.06, r2ng))}
            </mesh>
          );
        }
        return els;
      }, [bayCount])}

      {/* Tiered cavea seating — concentric rings */}
      {[0, 1, 2].map(tier => {
        const innerR = 40 + tier * 8;
        const outerR = innerR + 7;
        const y = 8 + tier * 5;
        return (
          <mesh key={`cavea-${tier}`} receiveShadow position={[0, y, 0]}>
            <torusGeometry args={[(innerR + outerR) / 2, (outerR - innerR) / 2, 4, bayCount]} />
            {stoneMat(varColor('#b09070', 0.05, rng))}
          </mesh>
        );
      })}

      {/* Outer facade — pillar + arch bays per tier */}
      {pillars.map((p, i) => {
        const elements: React.ReactElement[] = [];
        const pillarColor = varColor(travertine, 0.06, rng);
        for (let tier = 0; tier < p.maxTiers; tier++) {
          const isAttic = tier === 3;
          const h = isAttic ? atticH : tierH;
          const yBase = tier * tierH;
          elements.push(
            <mesh key={`bay-${i}-${tier}`} castShadow receiveShadow
              position={[p.x, yBase + h / 2, p.z]}>
              <boxGeometry args={[3, h, 3]} />
              {stoneMat(pillarColor)}
            </mesh>
          );
          // Arch between pillars (not on attic)
          if (!isAttic) {
            const nextAngle = ((i + 1) / bayCount) * Math.PI * 2;
            const nx = A * Math.cos(nextAngle);
            const nz = B * Math.sin(nextAngle);
            const mx = (p.x + nx) * 0.5;
            const mz = (p.z + nz) * 0.5;
            const dist = Math.sqrt((nx - p.x) ** 2 + (nz - p.z) ** 2);
            elements.push(
              <mesh key={`arch-${i}-${tier}`} castShadow receiveShadow
                position={[mx, yBase + h * 0.72, mz]}
                rotation={[0, -p.angle, 0]}>
                <torusGeometry args={[dist * 0.3, 0.6, 6, 12, Math.PI]} />
                {stoneMat(pillarColor)}
              </mesh>
            );
          }
        }
        return <group key={i}>{elements}</group>;
      })}
    </group>
  );
}

/* ─────────────────────────────────────────────
   CHICHÉN ITZÁ
───────────────────────────────────────────── */

export function ChichenItzaModel({ detail = 'high' }: WonderModelProps): React.ReactElement {
  const rng = seeded(3);
  const limestone = '#b9ac93';
  const stepCount = detail === 'high' ? 91 : 46;

  // 9 terraces: base 55.3 m, each steps in by ~3 m, each ~2.6 m tall
  const terraces = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 9; i++) {
      const size = 55.3 - i * 5.6;
      arr.push({ size, y: i * 2.6 });
    }
    return arr;
  }, []);

  // Step positions for one face (south)
  const stepData = useMemo(() => {
    const arr: Array<{ x: number; y: number; z: number; ry: number }> = [];
    const totalH = 9 * 2.6; // 23.4 m
    for (let face = 0; face < 4; face++) {
      const ry = face * Math.PI * 0.5;
      for (let s = 0; s < stepCount; s++) {
        const t = s / stepCount;
        const y = t * totalH + 0.1;
        const dist = 55.3 / 2 - t * (55.3 / 2 - 6);
        const x = face === 0 ? 0 : face === 2 ? 0 : face === 1 ? dist : -dist;
        const z = face === 0 ? -dist : face === 2 ? dist : 0;
        arr.push({ x, y, z, ry });
      }
    }
    return arr;
  }, [stepCount]);

  return (
    <group>
      {/* 9 terraces */}
      {terraces.map((t, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, t.y + 1.3, 0]}>
          <boxGeometry args={[t.size, 2.6, t.size]} />
          {stoneMat(varColor(limestone, 0.05, rng))}
        </mesh>
      ))}

      {/* Temple top */}
      <mesh castShadow receiveShadow position={[0, 9 * 2.6 + 3, 0]}>
        <boxGeometry args={[13.5, 6, 13.5]} />
        {stoneMat(varColor(limestone, 0.04, rng))}
      </mesh>
      {/* Roof comb */}
      <mesh castShadow receiveShadow position={[0, 9 * 2.6 + 8, 0]}>
        <boxGeometry args={[13.5, 4, 2]} />
        {stoneMat(varColor(limestone, 0.04, rng))}
      </mesh>
      {/* Temple doorway */}
      <mesh castShadow receiveShadow position={[0, 9 * 2.6 + 3, -6.75 - 0.1]}>
        <boxGeometry args={[3, 4, 0.5]} />
        {stoneMat('#7a7060')}
      </mesh>

      {/* Steps — instanced */}
      <Instances limit={stepData.length}>
        <boxGeometry args={[3, 0.28, 0.3]} />
        {stoneMat(varColor(limestone, 0.03, rng))}
        {stepData.map((s, i) => (
          <Instance key={i} position={[s.x, s.y, s.z]} rotation={[0, s.ry, 0]} />
        ))}
      </Instances>

      {/* El Caracol observatory ~120 m away */}
      <group position={[120, 0, 20]}>
        <mesh castShadow receiveShadow position={[0, 2, 0]}>
          <boxGeometry args={[20, 4, 20]} />
          {stoneMat(varColor(limestone, 0.05, rng))}
        </mesh>
        <mesh castShadow receiveShadow position={[0, 4 + 7, 0]}>
          <cylinderGeometry args={[5.5, 6, 14, 24]} />
          {stoneMat(varColor(limestone, 0.05, rng))}
        </mesh>
        <mesh castShadow receiveShadow position={[0, 4 + 14 + 3, 0]}>
          <sphereGeometry args={[5, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          {stoneMat(limestone)}
        </mesh>
      </group>

      {/* Great Ball Court ~80 m away in x */}
      <group position={[-80, 0, 0]}>
        {/* Two parallel walls */}
        {[-30, 30].map((zOff, i) => (
          <mesh key={i} castShadow receiveShadow position={[0, 4, zOff]}>
            <boxGeometry args={[70, 8, 8]} />
            {stoneMat(varColor(limestone, 0.05, rng))}
          </mesh>
        ))}
        {/* Stone ring on each wall */}
        {[-30, 30].map((zOff, i) => (
          <mesh key={i} castShadow position={[0, 8, zOff]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.6, 0.25, 8, 24]} />
            {stoneMat(limestone)}
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────
   GIZA PYRAMIDS + SPHINX
───────────────────────────────────────────── */

export function GizaPyramidModel({ detail: _detail = 'high' }: WonderModelProps): React.ReactElement {
  const rng = seeded(4);
  const lime = '#d8c9a3';
  const segs = 4;

  // Great Pyramid: base 230.4 m, height 138.8 m
  // coneGeometry radialSegments=4, radius = halfBase * sqrt(2), rotated 45° about Y
  const gpRadius = (230.4 / 2) * Math.SQRT2;

  // Khafre: 215 m base, 136 m tall
  const khRadius = (215 / 2) * Math.SQRT2;
  // Menkaure: 108 m base, 61 m tall
  const mkRadius = (108 / 2) * Math.SQRT2;

  return (
    <group>
      {/* Great Pyramid */}
      <mesh castShadow receiveShadow position={[0, 138.8 / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[gpRadius, 138.8, segs]} />
        {stoneMat(varColor(lime, 0.05, rng))}
      </mesh>

      {/* Khafre — offset to the SW */}
      <group position={[260, 0, 220]}>
        {/* Body */}
        <mesh castShadow receiveShadow position={[0, 136 / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[khRadius, 136, segs]} />
          {stoneMat(varColor(lime, 0.05, rng))}
        </mesh>
        {/* White limestone cap — top 20% */}
        <mesh castShadow receiveShadow position={[0, 136 * 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[khRadius * 0.2, 136 * 0.2, segs]} />
          {stoneMat('#f0ece0')}
        </mesh>
      </group>

      {/* Menkaure — further SW */}
      <mesh castShadow receiveShadow position={[460, 61 / 2, 390]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[mkRadius, 61, segs]} />
        {stoneMat(varColor(lime, 0.05, rng))}
      </mesh>

      {/* Three queens' pyramids near Great Pyramid */}
      {([
        [80, 0, -130, 20, 20],
        [115, 0, -130, 17, 17],
        [150, 0, -130, 14, 14],
      ] as Array<[number, number, number, number, number]>).map(([x, _y, z, h, _b], i) => (
        <mesh key={i} castShadow receiveShadow
          position={[x, h / 2, z]}
          rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[(_b / 2) * Math.SQRT2, h, segs]} />
          {stoneMat(varColor(lime, 0.07, rng))}
        </mesh>
      ))}

      {/* Sphinx — east of Khafre, facing east */}
      <group position={[150, 0, 140]}>
        {/* Body */}
        <mesh castShadow receiveShadow position={[0, 10, 0]}>
          <boxGeometry args={[20, 20, 73]} />
          {stoneMat(varColor('#c4a87a', 0.06, rng))}
        </mesh>
        {/* Head */}
        <mesh castShadow receiveShadow position={[0, 23, -30]}>
          <boxGeometry args={[8, 10, 10]} />
          {stoneMat(varColor('#c4a87a', 0.04, rng))}
        </mesh>
        {/* Nemes headdress */}
        <mesh castShadow receiveShadow position={[0, 27, -28]}>
          <boxGeometry args={[11, 6, 12]} />
          {stoneMat(varColor('#c8a870', 0.05, rng))}
        </mesh>
        {/* Paws */}
        {[-4, 4].map((xOff, i) => (
          <mesh key={i} castShadow receiveShadow position={[xOff, 2.5, -50]}>
            <boxGeometry args={[4, 5, 14]} />
            {stoneMat(varColor('#c4a87a', 0.05, rng))}
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────
   CHRIST THE REDEEMER
───────────────────────────────────────────── */

export function ChristRedeemerModel({ detail = 'high' }: WonderModelProps): React.ReactElement {
  const rng = seeded(5);
  const soapstone = '#d3d3cd';
  const rock = '#4a4a48';
  const segs = detail === 'high' ? 16 : 8;

  const robeProfile = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const r = 3.5 - t * 2.5;
      pts.push(new THREE.Vector2(Math.max(0.1, r), t * 28));
    }
    return pts;
  }, []);

  return (
    <group>
      {/* Rocky outcrop */}
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <coneGeometry args={[14, 5, 12]} />
        {stoneMat(rock)}
      </mesh>

      {/* Chapel/pedestal base ~9 m */}
      <mesh castShadow receiveShadow position={[0, 5 + 4.5, 0]}>
        <boxGeometry args={[8, 9, 8]} />
        {stoneMat(varColor(rock, 0.05, rng))}
      </mesh>

      {/* Robe / body via lathe — 28 m tall statue base at y=14 */}
      <mesh castShadow receiveShadow position={[0, 14, 0]}>
        <latheGeometry args={[robeProfile, segs]} />
        {stoneMat(soapstone)}
      </mesh>

      {/* Arms — two long boxes extending at shoulder height (y~14+22=36) */}
      {[-1, 1].map((side, i) => (
        <group key={i} position={[side * 7, 14 + 22, 0]}>
          {/* Main arm */}
          <mesh castShadow receiveShadow rotation={[0, 0, side * -0.08]}>
            <boxGeometry args={[14, 1.5, 1.8]} />
            {stoneMat(soapstone)}
          </mesh>
          {/* Draped sleeve hanging below */}
          <mesh castShadow receiveShadow position={[0, -2.5, 0]}>
            <boxGeometry args={[13, 3, 2.2]} />
            {stoneMat(varColor(soapstone, 0.04, rng))}
          </mesh>
        </group>
      ))}

      {/* Head: sphere ~2.4 m */}
      <mesh castShadow receiveShadow position={[0, 14 + 28 + 1.2, 0]}>
        <sphereGeometry args={[2.4, segs, segs]} />
        {stoneMat(soapstone)}
      </mesh>

      {/* Hair mass */}
      <mesh castShadow receiveShadow position={[0, 14 + 28 + 1.8, 0]}>
        <sphereGeometry args={[2.6, segs, 8, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        {stoneMat(varColor('#b8b4ad', 0.04, rng))}
      </mesh>

      {/* Beard taper */}
      <mesh castShadow receiveShadow position={[0, 14 + 28 - 0.5, -1.5]}>
        <coneGeometry args={[0.8, 2.5, 8]} />
        {stoneMat(varColor(soapstone, 0.04, rng))}
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────
   MACHU PICCHU
───────────────────────────────────────────── */

export function MachuPicchuModel({ detail = 'high' }: WonderModelProps): React.ReactElement {
  const rng = seeded(6);
  const granite = '#8f8b80';
  const green = '#5a7a4a';
  const buildingCount = detail === 'high' ? 28 : 14;
  const terraceCount = detail === 'high' ? 14 : 7;

  // Terrace data
  const terraces = useMemo(() => {
    const arr = [];
    for (let i = 0; i < terraceCount; i++) {
      const len = 80 - i * 3;
      const z = -30 + i * 8;
      const y = i * 2.5;
      arr.push({ len, z, y });
    }
    return arr;
  }, [terraceCount]);

  // Building positions arranged in clusters
  const buildings = useMemo(() => {
    const rngB = seeded(60);
    const arr = [];
    for (let i = 0; i < buildingCount; i++) {
      const row = Math.floor(i / 7);
      const col = i % 7;
      const x = -30 + col * 12 + rngB() * 3 - 1.5;
      const z = -20 + row * 15 + rngB() * 3;
      const y = row * 5 + 2;
      const w = 5 + rngB() * 3;
      const d = 4 + rngB() * 2;
      arr.push({ x, y, z, w, d });
    }
    return arr;
  }, [buildingCount]);

  return (
    <group>
      {/* Agricultural terraces */}
      {terraces.map((t, i) => (
        <group key={i}>
          {/* Retaining wall */}
          <mesh castShadow receiveShadow position={[0, t.y + 1.25, t.z]}>
            <boxGeometry args={[t.len, 2.5, 0.6]} />
            {stoneMat(varColor(granite, 0.06, rng))}
          </mesh>
          {/* Terrace floor */}
          <mesh receiveShadow position={[0, t.y + 0.05, t.z + 3]}>
            <boxGeometry args={[t.len, 0.1, 6]} />
            {stoneMat(green, { roughness: 0.95 })}
          </mesh>
        </group>
      ))}

      {/* Buildings (roofless — 4 walls each) */}
      {buildings.map((b, i) => {
        const wallColor = varColor(granite, 0.07, rng);
        const wallH = 2.5;
        return (
          <group key={i}>
            {/* N wall */}
            <mesh castShadow receiveShadow position={[b.x, b.y + wallH / 2, b.z - b.d / 2]}>
              <boxGeometry args={[b.w, wallH, 0.4]} />
              {stoneMat(wallColor)}
            </mesh>
            {/* S wall */}
            <mesh castShadow receiveShadow position={[b.x, b.y + wallH / 2, b.z + b.d / 2]}>
              <boxGeometry args={[b.w, wallH, 0.4]} />
              {stoneMat(wallColor)}
            </mesh>
            {/* W wall */}
            <mesh castShadow receiveShadow position={[b.x - b.w / 2, b.y + wallH / 2, b.z]}>
              <boxGeometry args={[0.4, wallH, b.d]} />
              {stoneMat(wallColor)}
            </mesh>
            {/* E wall */}
            <mesh castShadow receiveShadow position={[b.x + b.w / 2, b.y + wallH / 2, b.z]}>
              <boxGeometry args={[0.4, wallH, b.d]} />
              {stoneMat(wallColor)}
            </mesh>
          </group>
        );
      })}

      {/* Intihuatana stone on highest platform */}
      <mesh castShadow receiveShadow position={[0, terraceCount * 2.5 + 0.5, -28]}>
        <boxGeometry args={[2, 1, 2]} />
        {stoneMat(varColor(granite, 0.04, rng))}
      </mesh>
      <mesh castShadow receiveShadow position={[0, terraceCount * 2.5 + 1.25, -28]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        {stoneMat(granite)}
      </mesh>

      {/* Central plaza */}
      <mesh receiveShadow position={[5, 15, 0]}>
        <boxGeometry args={[30, 0.2, 20]} />
        {stoneMat(green, { roughness: 0.95 })}
      </mesh>

      {/* Huayna Picchu — dramatic backdrop peak */}
      <mesh castShadow receiveShadow position={[0, 125, -200]}>
        <coneGeometry args={[80, 250, 10]} />
        {stoneMat('#5a6050', { roughness: 0.95 })}
      </mesh>
    </group>
  );
}

/* ─────────────────────────────────────────────
   PETRA — AL-KHAZNEH
───────────────────────────────────────────── */

export function PetraModel({ detail = 'high' }: WonderModelProps): React.ReactElement {
  const rng = seeded(7);
  const sandstone = '#b5603f';
  const darkRecess = '#7a3a22';
  const segs = detail === 'high' ? 16 : 8;

  // Column positions on lower storey — 6 columns
  const lowerCols: number[] = [-9, -5.4, -1.8, 1.8, 5.4, 9];
  // Upper storey columns
  const upperCols: number[] = [-7, -3.5, 0, 3.5, 7];

  return (
    <group>
      {/* The Siq — two tall canyon walls */}
      {[-2.5, 2.5].map((xOff, i) => (
        <mesh key={i} castShadow receiveShadow position={[xOff, 30, 60]}>
          <boxGeometry args={[8, 60, 120]} />
          {stoneMat(varColor(sandstone, 0.08, rng))}
        </mesh>
      ))}

      {/* Main cliff face */}
      <mesh receiveShadow position={[0, 40, -10]}>
        <boxGeometry args={[120, 80, 12]} />
        {stoneMat(varColor(sandstone, 0.06, rng))}
      </mesh>

      {/* Facade recess — lower */}
      <mesh castShadow receiveShadow position={[0, 12, -4]}>
        <boxGeometry args={[25, 24, 10]} />
        {stoneMat(varColor('#9a4a2e', 0.05, rng))}
      </mesh>

      {/* Lower columns */}
      {lowerCols.map((x, i) => (
        <mesh key={i} castShadow receiveShadow position={[x, 9, 0.5]}>
          <cylinderGeometry args={[0.5, 0.6, 18, segs]} />
          {stoneMat(varColor(sandstone, 0.07, rng))}
        </mesh>
      ))}

      {/* Lower column capitals */}
      {lowerCols.map((x, i) => (
        <mesh key={i} castShadow receiveShadow position={[x, 18.5, 0.5]}>
          <boxGeometry args={[1.4, 0.8, 1.4]} />
          {stoneMat(varColor(sandstone, 0.05, rng))}
        </mesh>
      ))}

      {/* Lower triangular pediment */}
      <mesh castShadow receiveShadow position={[0, 21, 0.5]}>
        <boxGeometry args={[21, 1, 1.5]} />
        {stoneMat(varColor(sandstone, 0.04, rng))}
      </mesh>
      <mesh castShadow receiveShadow position={[0, 24.5, 0.5]}>
        <coneGeometry args={[10.5, 7, 3]} />
        {stoneMat(varColor(sandstone, 0.04, rng))}
      </mesh>

      {/* Main doorway — dark recess */}
      <mesh castShadow receiveShadow position={[0, 6, 0.7]}>
        <boxGeometry args={[4, 12, 4]} />
        {stoneMat(darkRecess)}
      </mesh>
      {/* Arch over doorway */}
      <mesh castShadow receiveShadow position={[0, 12.5, 0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2, 1.2, segs, 1, false, 0, Math.PI]} />
        {stoneMat(varColor(sandstone, 0.04, rng))}
      </mesh>

      {/* Upper storey facade recess */}
      <mesh castShadow receiveShadow position={[0, 33, -4]}>
        <boxGeometry args={[22, 18, 9]} />
        {stoneMat(varColor('#9a4a2e', 0.05, rng))}
      </mesh>

      {/* Upper columns */}
      {upperCols.map((x, i) => (
        <mesh key={i} castShadow receiveShadow position={[x, 31, 0.5]}>
          <cylinderGeometry args={[0.4, 0.45, 10, segs]} />
          {stoneMat(varColor(sandstone, 0.07, rng))}
        </mesh>
      ))}

      {/* Upper tholos — central round drum with conical cap */}
      <mesh castShadow receiveShadow position={[0, 31, 0.5]}>
        <cylinderGeometry args={[2.5, 2.5, 8, segs]} />
        {stoneMat(varColor(sandstone, 0.05, rng))}
      </mesh>
      <mesh castShadow receiveShadow position={[0, 39, 0.5]}>
        <coneGeometry args={[2.5, 5, segs]} />
        {stoneMat(varColor(sandstone, 0.04, rng))}
      </mesh>

      {/* Upper half-pediments either side of tholos */}
      {[-8, 8].map((xOff, i) => (
        <group key={i} position={[xOff, 36, 0.5]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[5, 1, 1.2]} />
            {stoneMat(varColor(sandstone, 0.04, rng))}
          </mesh>
          <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
            <coneGeometry args={[2.5, 5, 3]} />
            {stoneMat(varColor(sandstone, 0.04, rng))}
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────
   GREAT WALL
───────────────────────────────────────────── */

export function GreatWallModel({ detail = 'high' }: WonderModelProps): React.ReactElement {
  const rng = seeded(8);
  const stone = '#8d8579';
  const segmentCount = detail === 'high' ? 60 : 30;

  // Generate a snaking path with hills
  const path = useMemo(() => {
    const pts: Array<{ x: number; y: number; z: number; angle: number }> = [];
    for (let i = 0; i < segmentCount; i++) {
      const t = i / segmentCount;
      const x = (t - 0.5) * 600;
      const z = Math.sin(t * Math.PI * 3) * 40 + Math.sin(t * Math.PI * 7) * 12;
      const y = Math.sin(t * Math.PI * 2.5) * 8 + Math.sin(t * Math.PI * 5) * 3;
      const nextT = (i + 1) / segmentCount;
      const nx = (nextT - 0.5) * 600;
      const nz = Math.sin(nextT * Math.PI * 3) * 40 + Math.sin(nextT * Math.PI * 7) * 12;
      const angle = Math.atan2(nz - z, nx - x);
      pts.push({ x, y, z, angle });
    }
    return pts;
  }, [segmentCount]);

  // Watchtower positions every ~120 m
  const towers = useMemo(() => {
    return path.filter((_, i) => i % Math.round(segmentCount / 5) === 0);
  }, [path, segmentCount]);

  // Crenellation data for all segments
  const crenData = useMemo(() => {
    const arr: Array<{ x: number; y: number; z: number; ry: number }> = [];
    const subRng = seeded(80);
    for (const p of path) {
      // 5 crenellations per segment
      for (let c = 0; c < 5; c++) {
        const offset = -2.5 + c * 1.2;
        const ox = Math.cos(p.angle + Math.PI / 2) * 2.5 + Math.cos(p.angle) * offset;
        const oz = Math.sin(p.angle + Math.PI / 2) * 2.5 + Math.sin(p.angle) * offset;
        arr.push({ x: p.x + ox, y: p.y + 7.7, z: p.z + oz, ry: subRng() * Math.PI });
      }
    }
    return arr;
  }, [path]);

  return (
    <group>
      {/* Hill terrain below wall */}
      {path.map((p, i) => (
        <mesh key={i} receiveShadow position={[p.x, p.y - 1, p.z]}>
          <boxGeometry args={[12, 2 + Math.abs(p.y), 12]} />
          {stoneMat(varColor('#7a7060', 0.06, rng), { roughness: 0.95 })}
        </mesh>
      ))}

      {/* Wall segments */}
      {path.map((p, i) => (
        <mesh key={i} castShadow receiveShadow
          position={[p.x, p.y + 3.5, p.z]}
          rotation={[0, p.angle, 0]}>
          <boxGeometry args={[11, 7, 6]} />
          {stoneMat(varColor(stone, 0.07, rng))}
        </mesh>
      ))}

      {/* Walkway on top */}
      {path.map((p, i) => (
        <mesh key={i} castShadow receiveShadow
          position={[p.x, p.y + 7.1, p.z]}
          rotation={[0, p.angle, 0]}>
          <boxGeometry args={[11, 0.3, 4]} />
          {stoneMat(varColor(stone, 0.04, rng))}
        </mesh>
      ))}

      {/* Crenellations — instanced */}
      <Instances limit={crenData.length}>
        <boxGeometry args={[0.8, 1.2, 0.6]} />
        {stoneMat(stone)}
        {crenData.map((c, i) => (
          <Instance key={i} position={[c.x, c.y, c.z]} rotation={[0, c.ry, 0]} />
        ))}
      </Instances>

      {/* Watchtowers */}
      {towers.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]}>
          {/* Lower storey */}
          <mesh castShadow receiveShadow position={[0, 6, 0]}>
            <boxGeometry args={[10, 12, 10]} />
            {stoneMat(varColor(stone, 0.06, rng))}
          </mesh>
          {/* Upper storey */}
          <mesh castShadow receiveShadow position={[0, 14, 0]}>
            <boxGeometry args={[9, 4, 9]} />
            {stoneMat(varColor(stone, 0.05, rng))}
          </mesh>
          {/* Tower crenellations */}
          {[-3.5, -1.16, 1.16, 3.5].map((ox, ci) => (
            <mesh key={ci} castShadow receiveShadow position={[ox, 17, 4.5]}>
              <boxGeometry args={[1.2, 1.5, 0.5]} />
              {stoneMat(stone)}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ─────────────────────────────────────────────
   WONDER_MODELS map
───────────────────────────────────────────── */

export const WONDER_MODELS: Record<string, (props: WonderModelProps) => React.ReactElement> = {
  'great-wall': GreatWallModel,
  'petra': PetraModel,
  'christ-redeemer': ChristRedeemerModel,
  'machu-picchu': MachuPicchuModel,
  'chichen-itza': ChichenItzaModel,
  'colosseum': ColosseumModel,
  'taj-mahal': TajMahalModel,
  'great-pyramid': GizaPyramidModel,
};

/* ─────────────────────────────────────────────
   WONDER_SCENES metadata
───────────────────────────────────────────── */

export const WONDER_SCENES: Record<string, WonderSceneConfig> = {
  'great-wall': {
    groundColor: '#7a7060',
    skyHorizon: '#c8b8a0',
    skyZenith: '#6a90c8',
    sunElevation: 35,
    sunAzimuth: 180,
    roamRadius: 500,
    spawn: [0, 1.7, 80],
    footprint: 350,
    terrain: 'stone',
  },
  'petra': {
    groundColor: '#b5603f',
    skyHorizon: '#e8c8a8',
    skyZenith: '#4878b8',
    sunElevation: 50,
    sunAzimuth: 200,
    roamRadius: 200,
    spawn: [0, 1.7, 100],
    footprint: 80,
    terrain: 'sand',
  },
  'christ-redeemer': {
    groundColor: '#4a6040',
    skyHorizon: '#c0d8f0',
    skyZenith: '#2060c0',
    sunElevation: 55,
    sunAzimuth: 140,
    roamRadius: 80,
    spawn: [0, 1.7, 30],
    footprint: 20,
    terrain: 'stone',
  },
  'machu-picchu': {
    groundColor: '#5a7a4a',
    skyHorizon: '#c0d0e8',
    skyZenith: '#3070c0',
    sunElevation: 60,
    sunAzimuth: 120,
    roamRadius: 200,
    spawn: [0, 16, 80],
    footprint: 100,
    terrain: 'jungle',
  },
  'chichen-itza': {
    groundColor: '#8a8060',
    skyHorizon: '#e0d0b0',
    skyZenith: '#5090d0',
    sunElevation: 65,
    sunAzimuth: 160,
    roamRadius: 200,
    spawn: [0, 1.7, 70],
    footprint: 60,
    terrain: 'grass',
  },
  'colosseum': {
    groundColor: '#a09070',
    skyHorizon: '#d8c8b0',
    skyZenith: '#5888c0',
    sunElevation: 40,
    sunAzimuth: 190,
    roamRadius: 200,
    spawn: [120, 1.7, 0],
    footprint: 100,
    terrain: 'stone',
  },
  'taj-mahal': {
    groundColor: '#c8c0a8',
    skyHorizon: '#e8e0d0',
    skyZenith: '#78a8d8',
    sunElevation: 45,
    sunAzimuth: 150,
    roamRadius: 200,
    spawn: [0, 1.7, 100],
    footprint: 100,
    terrain: 'grass',
  },
  'great-pyramid': {
    groundColor: '#d4c090',
    skyHorizon: '#e8d8b0',
    skyZenith: '#88b4e0',
    sunElevation: 50,
    sunAzimuth: 170,
    roamRadius: 600,
    spawn: [0, 1.7, 280],
    footprint: 280,
    terrain: 'sand',
  },
};
