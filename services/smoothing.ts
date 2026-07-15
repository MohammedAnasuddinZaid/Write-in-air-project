class OneEuroFilter {
  private prevX = 0;
  private prevY = 0;
  private prevTime = 0;
  private lastSpeed = 0;
  private minCutoff = 0.15;
  private beta = 0.8;

  reset(): void {
    this.prevX = 0;
    this.prevY = 0;
    this.prevTime = 0;
    this.lastSpeed = 0;
  }

  smooth(rawX: number, rawY: number): { x: number; y: number; speed: number } {
    const now = performance.now();
    if (this.prevTime === 0) {
      this.prevX = rawX;
      this.prevY = rawY;
      this.prevTime = now;
      return { x: rawX, y: rawY, speed: 0 };
    }

    const dt = (now - this.prevTime) / 1000;
    if (dt <= 0) return { x: rawX, y: rawY, speed: 0 };

    const dx = (rawX - this.prevX) / dt;
    const dy = (rawY - this.prevY) / dt;
    const rawSpeed = Math.sqrt(dx * dx + dy * dy);

    const cutoff = this.minCutoff + this.beta * rawSpeed;
    const alpha = 1 / (1 + dt * cutoff);

    const smoothedX = this.prevX + alpha * (rawX - this.prevX);
    const smoothedY = this.prevY + alpha * (rawY - this.prevY);

    const sdx = (smoothedX - this.prevX) / dt;
    const sdy = (smoothedY - this.prevY) / dt;
    this.lastSpeed = Math.sqrt(sdx * sdx + sdy * sdy);

    this.prevX = smoothedX;
    this.prevY = smoothedY;
    this.prevTime = now;

    return { x: smoothedX, y: smoothedY, speed: this.lastSpeed };
  }

  getSpeed(): number {
    return this.lastSpeed;
  }
}

const smoothingFilter = new OneEuroFilter();

export { OneEuroFilter, smoothingFilter };
