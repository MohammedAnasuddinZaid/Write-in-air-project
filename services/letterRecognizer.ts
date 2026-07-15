import type { Point } from '@/lib/types';

interface LetterDef {
  strokes: [number, number][][];
}

const LETTER_DEFS: Record<string, LetterDef> = {
  A: { strokes: [
    [[0.5, 0.0], [0.1, 1.0]],
    [[0.5, 0.0], [0.9, 1.0]],
    [[0.25, 0.6], [0.75, 0.6]],
  ]},
  B: { strokes: [
    [[0.3, 0.0], [0.3, 1.0]],
    [[0.3, 0.0], [0.7, 0.0], [0.8, 0.15], [0.8, 0.35], [0.7, 0.45], [0.3, 0.45]],
    [[0.3, 0.45], [0.7, 0.45], [0.8, 0.55], [0.8, 0.8], [0.7, 1.0], [0.3, 1.0]],
  ]},
  C: { strokes: [
    [[0.75, 0.05], [0.2, 0.1], [0.15, 0.5], [0.2, 0.9], [0.75, 0.95]],
  ]},
  D: { strokes: [
    [[0.3, 0.0], [0.3, 1.0]],
    [[0.3, 0.0], [0.7, 0.0], [0.85, 0.25], [0.85, 0.75], [0.7, 1.0], [0.3, 1.0]],
  ]},
  E: { strokes: [
    [[0.75, 0.0], [0.2, 0.0], [0.2, 0.5], [0.2, 1.0], [0.75, 1.0]],
    [[0.2, 0.5], [0.65, 0.5]],
  ]},
  F: { strokes: [
    [[0.75, 0.0], [0.2, 0.0], [0.2, 0.5], [0.2, 1.0]],
    [[0.2, 0.5], [0.65, 0.5]],
  ]},
  G: { strokes: [
    [[0.75, 0.05], [0.2, 0.1], [0.15, 0.5], [0.2, 0.9], [0.65, 0.95], [0.75, 0.7], [0.5, 0.7]],
  ]},
  H: { strokes: [
    [[0.2, 0.0], [0.2, 1.0]],
    [[0.8, 0.0], [0.8, 1.0]],
    [[0.2, 0.5], [0.8, 0.5]],
  ]},
  I: { strokes: [
    [[0.5, 0.0], [0.5, 1.0]],
  ]},
  J: { strokes: [
    [[0.7, 0.0], [0.7, 0.75], [0.65, 0.9], [0.5, 0.95], [0.35, 0.85]],
  ]},
  K: { strokes: [
    [[0.25, 0.0], [0.25, 1.0]],
    [[0.35, 0.5], [0.8, 0.0]],
    [[0.35, 0.5], [0.8, 1.0]],
  ]},
  L: { strokes: [
    [[0.2, 0.0], [0.2, 1.0], [0.8, 1.0]],
  ]},
  M: { strokes: [
    [[0.1, 1.0], [0.1, 0.0], [0.5, 0.5], [0.9, 0.0], [0.9, 1.0]],
  ]},
  N: { strokes: [
    [[0.15, 1.0], [0.15, 0.0], [0.85, 1.0], [0.85, 0.0]],
  ]},
  O: { strokes: [
    [[0.5, 0.02], [0.9, 0.15], [0.95, 0.5], [0.9, 0.85], [0.5, 0.98], [0.1, 0.85], [0.05, 0.5], [0.1, 0.15], [0.5, 0.02]],
  ]},
  P: { strokes: [
    [[0.3, 0.0], [0.3, 1.0]],
    [[0.3, 0.0], [0.7, 0.0], [0.8, 0.15], [0.8, 0.35], [0.7, 0.45], [0.3, 0.45]],
  ]},
  Q: { strokes: [
    [[0.5, 0.02], [0.9, 0.15], [0.95, 0.5], [0.9, 0.85], [0.5, 0.98], [0.1, 0.85], [0.05, 0.5], [0.1, 0.15], [0.5, 0.02]],
    [[0.5, 0.5], [0.85, 0.95]],
  ]},
  R: { strokes: [
    [[0.3, 0.0], [0.3, 1.0]],
    [[0.3, 0.0], [0.7, 0.0], [0.8, 0.15], [0.8, 0.35], [0.7, 0.45], [0.3, 0.45]],
    [[0.35, 0.45], [0.8, 1.0]],
  ]},
  S: { strokes: [
    [[0.75, 0.05], [0.2, 0.05], [0.2, 0.45], [0.75, 0.55], [0.75, 0.95], [0.2, 0.95]],
  ]},
  T: { strokes: [
    [[0.1, 0.0], [0.9, 0.0]],
    [[0.5, 0.0], [0.5, 1.0]],
  ]},
  U: { strokes: [
    [[0.15, 0.0], [0.15, 0.75], [0.3, 0.9], [0.5, 0.95], [0.7, 0.9], [0.85, 0.75], [0.85, 0.0]],
  ]},
  V: { strokes: [
    [[0.05, 0.0], [0.5, 1.0], [0.95, 0.0]],
  ]},
  W: { strokes: [
    [[0.05, 0.0], [0.15, 1.0], [0.35, 0.3], [0.5, 1.0], [0.65, 0.3], [0.85, 1.0], [0.95, 0.0]],
  ]},
  X: { strokes: [
    [[0.1, 0.0], [0.9, 1.0]],
    [[0.9, 0.0], [0.1, 1.0]],
  ]},
  Y: { strokes: [
    [[0.1, 0.0], [0.5, 0.5]],
    [[0.9, 0.0], [0.5, 0.5]],
    [[0.5, 0.5], [0.5, 1.0]],
  ]},
  Z: { strokes: [
    [[0.15, 0.0], [0.85, 0.0], [0.15, 1.0], [0.85, 1.0]],
  ]},
};

function interpolateStroke(waypoints: [number, number][], numPoints: number): Point[] {
  if (waypoints.length < 2) return [];
  const result: Point[] = [];
  const segments = waypoints.length - 1;
  const perSegment = Math.max(1, Math.floor(numPoints / segments));
  for (let i = 0; i < segments; i++) {
    const wp1 = waypoints[i];
    const wp2 = waypoints[i + 1];
    if (!wp1 || !wp2) continue;
    const [x1, y1] = wp1;
    const [x2, y2] = wp2;
    for (let j = 0; j < perSegment; j++) {
      const t = j / perSegment;
      result.push({ x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) });
    }
  }
  const last = waypoints[waypoints.length - 1];
  if (last) result.push({ x: last[0], y: last[1] });
  return result;
}

const REFERENCE_POINTS: Map<string, Point[]> = new Map();
function getReference(name: string): Point[] {
  const existing = REFERENCE_POINTS.get(name);
  if (existing) return existing;

  const def = LETTER_DEFS[name];
  if (!def) return [];

  const allPoints: Point[] = [];
  for (const stroke of def.strokes) {
    const pts = interpolateStroke(stroke, 25);
    if (pts.length > 0) {
      if (allPoints.length > 0) {
        allPoints.push({ x: -10, y: -10 });
      }
      allPoints.push(...pts);
    }
  }

  const normalized = normalizePoints(allPoints);
  REFERENCE_POINTS.set(name, normalized);
  return normalized;
}

function normalizePoints(points: Point[]): Point[] {
  if (points.length === 0) return [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const p of points) {
    if (p.x === -10 && p.y === -10) {
      continue;
    }
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.max(rangeX, rangeY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const result: Point[] = [];
  for (const p of points) {
    if (p.x === -10 && p.y === -10) {
      result.push({ x: -10, y: -10 });
      continue;
    }
    result.push({
      x: (p.x - cx) / scale + 0.5,
      y: (p.y - cy) / scale + 0.5,
    });
  }

  return result;
}

function resampleStroke(points: Point[], numPoints: number): Point[] {
  if (points.length < 2) return [...points];

  const totalLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    if (!prev || (p.x === -10 && p.y === -10)) return sum;
    if (prev.x === -10 && prev.y === -10) return sum;
    return sum + Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
  }, 0);

  if (totalLength === 0) return points[0] ? [points[0]] : [];

  const segmentLength = totalLength / (numPoints - 1);
  const result: Point[] = points[0] ? [points[0]] : [];
  let accumulated = 0;
  let j = 0;

  for (let i = 1; i < points.length && result.length < numPoints; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) continue;
    if (prev.x === -10 || curr.x === -10) continue;

    const dist = Math.sqrt((curr.x - prev.x) ** 2 + (curr.y - prev.y) ** 2);
    accumulated += dist;

    while (accumulated >= segmentLength && result.length < numPoints) {
      const overshoot = accumulated - segmentLength;
      const t = 1 - overshoot / dist;
      result.push({
        x: prev.x + t * (curr.x - prev.x),
        y: prev.y + t * (curr.y - prev.y),
      });
      accumulated = overshoot;
    }
  }

  while (result.length < numPoints) {
    const last = result[result.length - 1];
    const first = points[0];
    result.push(last || first || { x: 0, y: 0 });
  }

  return result;
}

function pointDistance(a: Point, b: Point, aPrev?: Point, bPrev?: Point): number {
  if ((a.x === -10 && a.y === -10) || (b.x === -10 && b.y === -10)) return 0;

  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const spatial = Math.sqrt(dx * dx + dy * dy);

  if (aPrev && bPrev && aPrev.x !== -10 && bPrev.x !== -10) {
    const angleA = Math.atan2(a.y - aPrev.y, a.x - aPrev.x);
    const angleB = Math.atan2(b.y - bPrev.y, b.x - bPrev.x);
    let angleDiff = Math.abs(angleA - angleB);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    return spatial + 0.4 * angleDiff;
  }

  return spatial;
}

function dtwDistance(input: Point[], template: Point[]): number {
  const m = input.length;
  const n = template.length;
  if (m === 0 || n === 0) return Infinity;

  const cost: number[][] = [];
  for (let i = 0; i < m; i++) {
    cost[i] = new Array(n).fill(0);
  }

  const sd = (i: number, j: number): number => {
    const a = input[i];
    const b = template[j];
    if (!a || !b) return Infinity;
    const aPrev = i > 0 ? input[i - 1] : undefined;
    const bPrev = j > 0 ? template[j - 1] : undefined;
    return pointDistance(a, b, aPrev, bPrev);
  };

  cost[0]![0] = sd(0, 0);
  for (let i = 1; i < m; i++) {
    const prev = cost[i - 1]![0]!;
    cost[i]![0] = prev + sd(i, 0);
  }
  for (let j = 1; j < n; j++) {
    const prev = cost[0]![j - 1]!;
    cost[0]![j] = prev + sd(0, j);
  }

  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      const d = sd(i, j);
      const up = cost[i - 1]![j]!;
      const left = cost[i]![j - 1]!;
      const diag = cost[i - 1]![j - 1]!;
      cost[i]![j] = d + Math.min(up, left, diag);
    }
  }

  return cost[m - 1]![n - 1]! / Math.max(m, n);
}

class LetterRecognizer {
  recognizeFromStroke(inputPoints: Point[]): string {
    if (inputPoints.length < 3) return '';

    const filtered = inputPoints.filter((p) => p.x !== -10 && p.y !== -10);
    if (filtered.length < 3) return '';

    const normalized = normalizePoints(filtered);
    const resampled = resampleStroke(normalized, 40);

    let bestLetter = '';
    let bestScore = Infinity;

    const letters = Object.keys(LETTER_DEFS);
    for (const letter of letters) {
      const ref = getReference(letter);
      if (ref.length === 0) continue;

      const inputRef = resampleStroke(resampled, ref.length);
      const dist = dtwDistance(inputRef, ref);

      if (dist < bestScore) {
        bestScore = dist;
        bestLetter = letter;
      }
    }

    if (bestScore > 16) return '';
    return bestLetter;
  }
}

const letterRecognizer = new LetterRecognizer();
export { letterRecognizer, LetterRecognizer };
