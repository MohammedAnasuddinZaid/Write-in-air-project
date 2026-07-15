class OneEuroFilter {
  private prevX = 0;
  private prevY = 0;
  private prevTime = 0;
  private minCutoff = 0.5;
  private beta = 0.04;

  reset(): void {
    this.prevX = 0;
    this.prevY = 0;
    this.prevTime = 0;
  }

  smooth(rawX: number, rawY: number): { x: number; y: number } {
    const now = performance.now();
    if (this.prevTime === 0) {
      this.prevX = rawX;
      this.prevY = rawY;
      this.prevTime = now;
      return { x: rawX, y: rawY };
    }

    const dt = (now - this.prevTime) / 1000;
    if (dt <= 0) return { x: rawX, y: rawY };

    const dx = (rawX - this.prevX) / dt;
    const dy = (rawY - this.prevY) / dt;
    const speed = Math.sqrt(dx * dx + dy * dy);

    const cutoff = this.minCutoff + this.beta * speed;
    const alpha = 1 / (1 + dt * cutoff);

    const smoothedX = this.prevX + alpha * (rawX - this.prevX);
    const smoothedY = this.prevY + alpha * (rawY - this.prevY);

    this.prevX = smoothedX;
    this.prevY = smoothedY;
    this.prevTime = now;

    return { x: smoothedX, y: smoothedY };
  }
}

const smoothingFilter = new OneEuroFilter();

export { OneEuroFilter, smoothingFilter };
