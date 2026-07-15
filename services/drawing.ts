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
    const stroke: Stroke = {
      id: generateId(),
      points: [{ ...point, time: Date.now() }],
      color: config.style === 'rainbow' ? '#ffffff' : config.color,
      width: config.size * (config.pressureSensitivity && point.pressure ? 0.5 + point.pressure * 0.5 : 1),
      opacity: config.opacity,
      smoothing: true,
      startTime: Date.now(),
    };
    this.currentStroke = stroke;
  }

  continueStroke(point: Point, config: BrushConfig): void {
    if (!this.currentStroke) return;
    const last = this.currentStroke.points[this.currentStroke.points.length - 1];
    if (!last) return;

    const dist = distance(last, point);
    if (dist < 0.5) return;

    this.currentStroke.points.push({ ...point, time: Date.now() });

    if (config.pressureSensitivity && point.pressure) {
      this.currentStroke.width =
        config.size * (0.3 + point.pressure * 0.7);
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

  renderStroke(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, stroke: Stroke): void {
    const points = stroke.points;
    if (points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity;

    if (points.length === 2) {
      ctx.beginPath();
      ctx.moveTo(points[0]!.x, points[0]!.y);
      ctx.lineTo(points[1]!.x, points[1]!.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0]!.x, points[0]!.y);

      for (let i = 1; i < points.length - 1; i++) {
        const xc = (points[i]!.x + points[i + 1]!.x) / 2;
        const yc = (points[i]!.y + points[i + 1]!.y) / 2;
        ctx.quadraticCurveTo(points[i]!.x, points[i]!.y, xc, yc);
      }

      const last = points[points.length - 1]!;
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
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

    const simplified = this.douglasPeucker(
      points,
      STROKE_SIMPLIFICATION_TOLERANCE,
    );

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

    const num = Math.abs(
      dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x,
    );
    return num / length;
  }
}

export const drawingService = new DrawingService();
