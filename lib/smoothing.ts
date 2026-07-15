import type { Point } from './types';
import { lerp } from './utils';

export class MovingAverageFilter {
  private window: Point[] = [];
  private maxSize: number;

  constructor(windowSize: number = 5) {
    this.maxSize = windowSize;
  }

  update(point: Point): Point {
    this.window.push(point);
    if (this.window.length > this.maxSize) {
      this.window.shift();
    }
    return this.average();
  }

  private average(): Point {
    const len = this.window.length;
    if (len === 0) return { x: 0, y: 0 };
    const sum = this.window.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 },
    );
    return { x: sum.x / len, y: sum.y / len };
  }

  reset(): void {
    this.window = [];
  }
}

export class ExponentialMovingAverage {
  private current: Point | null = null;
  private alpha: number;

  constructor(alpha: number = 0.3) {
    this.alpha = alpha;
  }

  update(point: Point): Point {
    if (!this.current) {
      this.current = { ...point };
      return { ...point };
    }
    this.current.x = lerp(point.x, this.current.x, this.alpha);
    this.current.y = lerp(point.y, this.current.y, this.alpha);
    return { ...this.current };
  }

  reset(): void {
    this.current = null;
  }
}

export class OneEuroFilter {
  private previous: Point | null = null;
  private prevVelocity: Point = { x: 0, y: 0 };
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  constructor(minCutoff: number = 1.0, beta: number = 0.04, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  update(point: Point, timestamp?: number): Point {
    if (!this.previous) {
      this.previous = { ...point };
      this.prevVelocity = { x: 0, y: 0 };
      return { ...point };
    }

    const dt = timestamp ? Math.max(timestamp - (this.previous.time ?? timestamp), 0.001) : 0.016;

    const velocity = {
      x: (point.x - this.previous.x) / dt,
      y: (point.y - this.previous.y) / dt,
    };

    const ed = {
      x: this.alpha(this.dCutoff, dt),
      y: this.alpha(this.dCutoff, dt),
    };

    this.prevVelocity.x = this.prevVelocity.x + ed.x * (velocity.x - this.prevVelocity.x);
    this.prevVelocity.y = this.prevVelocity.y + ed.y * (velocity.y - this.prevVelocity.y);

    const cutoff = {
      x: this.minCutoff + this.beta * Math.abs(this.prevVelocity.x),
      y: this.minCutoff + this.beta * Math.abs(this.prevVelocity.y),
    };

    const alpha = {
      x: this.alpha(cutoff.x, dt),
      y: this.alpha(cutoff.y, dt),
    };

    const filtered = {
      x: this.previous.x + alpha.x * (point.x - this.previous.x),
      y: this.previous.y + alpha.y * (point.y - this.previous.y),
    };

    this.previous = { ...filtered, time: point.time ?? timestamp };
    return filtered;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  reset(): void {
    this.previous = null;
    this.prevVelocity = { x: 0, y: 0 };
  }
}

export class KalmanFilter {
  private estimate: Point = { x: 0, y: 0 };
  private errorCovariance: number = 1;
  private processNoise: number;
  private measurementNoise: number;

  constructor(processNoise: number = 0.01, measurementNoise: number = 0.1) {
    this.processNoise = processNoise;
    this.measurementNoise = measurementNoise;
  }

  update(measurement: Point): Point {
    const prediction = this.estimate;
    const predictionCovariance = this.errorCovariance + this.processNoise;

    const kalmanGain = predictionCovariance / (predictionCovariance + this.measurementNoise);

    this.estimate = {
      x: prediction.x + kalmanGain * (measurement.x - prediction.x),
      y: prediction.y + kalmanGain * (measurement.y - prediction.y),
    };

    this.errorCovariance = (1 - kalmanGain) * predictionCovariance;

    return { ...this.estimate };
  }

  reset(point?: Point): void {
    this.estimate = point ?? { x: 0, y: 0 };
    this.errorCovariance = 1;
  }
}

export class AdaptiveSmoother {
  private filters: {
    movingAvg: MovingAverageFilter;
    ema: ExponentialMovingAverage;
    oneEuro: OneEuroFilter;
    kalman: KalmanFilter;
  };
  private speed: number = 0;
  private lastPosition: Point | null = null;

  constructor() {
    this.filters = {
      movingAvg: new MovingAverageFilter(5),
      ema: new ExponentialMovingAverage(0.3),
      oneEuro: new OneEuroFilter(),
      kalman: new KalmanFilter(),
    };
  }

  update(point: Point, timestamp?: number): Point {
    if (this.lastPosition) {
      const dt = timestamp ? Math.max(timestamp - (this.lastPosition.time ?? timestamp), 0.001) : 0.016;
      this.speed = Math.sqrt(
        (point.x - this.lastPosition.x) ** 2 + (point.y - this.lastPosition.y) ** 2,
      ) / dt;
    }

    this.lastPosition = { ...point, time: timestamp };

    const movingAvg = this.filters.movingAvg.update(point);
    const ema = this.filters.ema.update(movingAvg);
    const oneEuro = this.filters.oneEuro.update(ema, timestamp);
    const kalman = this.filters.kalman.update(oneEuro);

    if (this.speed > 500) {
      return lerpPoints(kalman, point, 0.3);
    } else if (this.speed > 200) {
      return lerpPoints(kalman, point, 0.5);
    }
    return kalman;
  }

  reset(): void {
    Object.values(this.filters).forEach((f) => f.reset());
    this.speed = 0;
    this.lastPosition = null;
  }
}

function lerpPoints(a: Point, b: Point, t: number): Point {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
  };
}
