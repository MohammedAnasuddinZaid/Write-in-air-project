import type { Point, Stroke, BrushConfig } from '@/lib/types';
import { generateId, distance, clamp, hexToRgba } from '@/lib/utils';
import {
  STROKE_MIN_POINTS,
  STROKE_DEFAULT_WIDTH,
  STROKE_DEFAULT_COLOR,
  STROKE_DEFAULT_OPACITY,
  STROKE_SIMPLIFICATION_TOLERANCE,
} from '@/lib/constants';
import { logger } from './logger';

class DrawingService {
  private strokes: Stroke[] = [];
  private currentStroke: Stroke | null = null;
  private undoStack: Stroke[] = [];
  private redoStack: Stroke[] = [];
  private canvasWidth = 800;
  private canvasHeight = 600;

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  beginStroke(point: Point, config: BrushConfig): void {
    const isGold = config.style === 'gold' || config.color === '#FFD700';
    const stroke: Stroke = {
      id: generateId(),
      points: [{ ...point, time: Date.now() }],
      color: isGold ? '#FFD700' : config.color,
      width: isGold ? config.size * 2 : config.size * (config.pressureSensitivity && point.pressure ? 0.5 + point.pressure * 0.5 : 1),
      opacity: 0.95,
      smoothing: true,
      startTime: Date.now(),
    };
    this.currentStroke = stroke;
  }

  continueStroke(point: Point, config: BrushConfig): void {
    if (!this.currentStroke) return;
    this.currentStroke.points.push({ ...point, time: Date.now() });
    if (config.pressureSensitivity && point.pressure) {
      this.currentStroke.width = config.size * (0.3 + point.pressure * 0.7);
    }
  }

  endStroke(): Stroke | null {
    if (!this.currentStroke) return null;
    const stroke = this.currentStroke;
    stroke.endTime = Date.now();

    if (stroke.points.length >= STROKE_MIN_POINTS) {
      const simplified = this.simplifyStroke(stroke);
      if (simplified.points.length >= STROKE_MIN_POINTS) {
        this.strokes.push(simplified);
        this.undoStack.push(simplified);
        this.redoStack = [];
        this.currentStroke = null;
        return simplified;
      }
    }
    this.currentStroke = null;
    return null;
  }

  cancelStroke(): void {
    this.currentStroke = null;
  }

  undo(): Stroke | null {
    const stroke = this.undoStack.pop();
    if (stroke) {
      this.redoStack.push(stroke);
      this.strokes = this.strokes.filter((s) => s.id !== stroke.id);
      return stroke;
    }
    return null;
  }

  redo(): Stroke | null {
    const stroke = this.redoStack.pop();
    if (stroke) {
      this.strokes.push(stroke);
      this.undoStack.push(stroke);
      return stroke;
    }
    return null;
  }

  clear(): void {
    this.strokes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.currentStroke = null;
  }

  getAllStrokes(): Stroke[] {
    return [...this.strokes];
  }

  getCurrentStroke(): Stroke | null {
    return this.currentStroke;
  }

  getStrokeCount(): number {
    return this.strokes.length;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private getGoldGradient(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): CanvasGradient {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#BF953F');
    g.addColorStop(0.25, '#FCF6B5');
    g.addColorStop(0.5, '#B38728');
    g.addColorStop(0.75, '#FBF5B7');
    g.addColorStop(1, '#AA771C');
    return g;
  }

  private renderCatmullRomSegment(
    ctx: CanvasRenderingContext2D,
    p0: Point, p1: Point, p2: Point, p3: Point,
    lineWidth: number,
  ): void {
    const steps = 10;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const tt = t * t;
      const ttt = tt * t;
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * ttt
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * ttt
      );
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  renderStroke(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, stroke: Stroke): void {
    const points = stroke.points;
    if (points.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 18;

    const bounds = points.length > 2 ? this.getStrokeBounds(stroke) : { x: points[0]!.x, y: points[0]!.y, width: 100, height: 100 };
    const gradient = this.getGoldGradient(
      ctx as CanvasRenderingContext2D,
      bounds.x, bounds.y, bounds.width || 100, bounds.height || 100,
    );
    ctx.strokeStyle = gradient;

    const baseWidth = stroke.width * 2.5;

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i]!;
      const next = points[i + 1]!;
      const prev = points[Math.max(0, i - 1)]!;
      const next2 = points[Math.min(points.length - 1, i + 2)]!;

      const dt = (next.time ?? curr.time ?? 0) - (curr.time ?? 0);
      const dist = Math.sqrt((next.x - curr.x) ** 2 + (next.y - curr.y) ** 2);
      const speed = dt > 0 ? dist / dt : 0;
      ctx.lineWidth = Math.max(3, Math.min(baseWidth * 1.5, baseWidth * 2 - speed * 0.05));

      this.renderCatmullRomSegment(
        ctx as CanvasRenderingContext2D,
        prev, curr, next, next2,
        ctx.lineWidth,
      );
    }

    ctx.restore();
  }

  renderCurrentStroke(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    if (this.currentStroke && this.currentStroke.points.length >= 2) {
      this.renderStroke(ctx, this.currentStroke);
    }
  }

  renderAllStrokes(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    for (const stroke of this.strokes) {
      this.renderStroke(ctx, stroke);
    }
  }

  renderWithGlow(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    stroke: Stroke,
    glowIntensity: number = 0.5,
  ): void {
    if (glowIntensity > 0) {
      ctx.save();
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = glowIntensity * 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      this.renderStroke(ctx, stroke);
      ctx.restore();
    } else {
      this.renderStroke(ctx, stroke);
    }
  }

  getStrokeBounds(stroke: Stroke): { x: number; y: number; width: number; height: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of stroke.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  getAllBounds(): { x: number; y: number; width: number; height: number } {
    if (this.strokes.length === 0) {
      return { x: 0, y: 0, width: this.canvasWidth, height: this.canvasHeight };
    }
    const bounds = this.strokes.map((s) => this.getStrokeBounds(s));
    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.x + b.width));
    const maxY = Math.max(...bounds.map((b) => b.y + b.height));
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  getStrokesAsImageData(width?: number, height?: number): ImageData | null {
    const canvas = document.createElement('canvas');
    canvas.width = width ?? this.canvasWidth;
    canvas.height = height ?? this.canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    this.renderAllStrokes(ctx);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  toSVG(): string {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.canvasWidth} ${this.canvasHeight}" width="${this.canvasWidth}" height="${this.canvasHeight}">`;
    svg += `<rect width="100%" height="100%" fill="transparent"/>`;
    for (const stroke of this.strokes) {
      const points = stroke.points;
      if (points.length < 2) continue;
      let path = `M ${points[0]!.x} ${points[0]!.y}`;
      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i]!.x + points[i + 1]!.x) / 2;
        const yc = (points[i]!.y + points[i + 1]!.y) / 2;
        path += ` Q ${points[i]!.x} ${points[i]!.y} ${xc} ${yc}`;
      }
      const last = points[points.length - 1]!;
      path += ` L ${last.x} ${last.y}`;
      svg += `<path d="${path}" stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${stroke.opacity}"/>`;
    }
    svg += `</svg>`;
    return svg;
  }

  toJSON(): string {
    return JSON.stringify(this.strokes);
  }

  fromJSON(json: string): void {
    try {
      const strokes = JSON.parse(json) as Stroke[];
      this.strokes = strokes;
      this.undoStack = [...strokes];
      this.redoStack = [];
    } catch {
      logger.error('Failed to parse strokes JSON');
    }
  }

  private simplifyStroke(stroke: Stroke): Stroke {
    const points = stroke.points;
    if (points.length <= 2) return { ...stroke, points: [...points] };
    const simplified = this.douglasPeucker(points, STROKE_SIMPLIFICATION_TOLERANCE);
    return {
      ...stroke,
      points: simplified.length >= 2 ? simplified : [points[0]!, points[points.length - 1]!],
    };
  }

  private douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return [...points];
    let maxDist = 0;
    let maxIndex = 0;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDistance(points[i]!, first, last);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    if (maxDist > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    }
    return [first, last];
  }

  private perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return distance(point, lineStart);
    const num = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
    return num / length;
  }
}

export const drawingService = new DrawingService();
