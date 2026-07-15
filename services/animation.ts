import type { CelebrationEvent, AnimationConfig } from '@/lib/types';
import { logger } from './logger';

type AnimationCallback = (event: string, data?: unknown) => void;

class AnimationService {
  private config: AnimationConfig = {
    quality: 'high',
    particleCount: 200,
    fireworksEnabled: true,
    confettiEnabled: true,
    balloonsEnabled: true,
    musicEnabled: true,
    soundEffectsEnabled: true,
  };
  private isCelebrating = false;
  private currentTimeline: string | null = null;
  private eventCallbacks: Map<string, AnimationCallback> = new Map();

  updateConfig(config: Partial<AnimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  triggerCelebration(event: CelebrationEvent): void {
    if (this.isCelebrating) return;

    this.isCelebrating = true;
    logger.info(`Celebration started: ${event.type} - "${event.text}"`);

    this.emit('celebration:start', { type: event.type, text: event.text });

    if (event.type === 'birthday') {
      this.playBirthdaySequence(event.text);
    } else {
      this.playGenericCelebration(event);
    }
  }

  private playBirthdaySequence(text: string): void {
    this.currentTimeline = `birthday-${Date.now()}`;

    const timeline = [
      { time: 0, event: 'glow:start' },
      { time: 500, event: 'particles:golden' },
      { time: 1000, event: 'confetti:cannon' },
      { time: 1500, event: 'fireworks:start' },
      { time: 2000, event: 'balloons:rise' },
      { time: 2500, event: 'gifts:enter' },
      { time: 3000, event: 'cake:rise' },
      { time: 3500, event: 'candles:light' },
      { time: 4000, event: 'sparkles:golden' },
      { time: 4500, event: 'ribbon:reveal' },
      { time: 5000, event: 'text:appear', data: { text } },
      { time: 5500, event: 'text:scale' },
      { time: 6000, event: 'fireworks:intensify' },
      { time: 6500, event: 'glow:pulse' },
      { time: 7000, event: 'celebration:climax' },
    ];

    const startTime = performance.now();
    let lastIndex = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;

      while (lastIndex < timeline.length && elapsed >= timeline[lastIndex]!.time) {
        const item = timeline[lastIndex]!;
        this.emit(item.event, item.data);
        lastIndex++;
      }

      if (lastIndex < timeline.length) {
        requestAnimationFrame(tick);
      } else {
        this.isCelebrating = false;
        this.emit('celebration:complete');
      }
    };

    requestAnimationFrame(tick);
  }

  private playGenericCelebration(event: CelebrationEvent): void {
    this.currentTimeline = `celebration-${Date.now()}`;

    this.emit('confetti:cannon');
    this.emit('particles:golden');
    this.emit('fireworks:start');
    this.emit('text:appear', { text: event.text });

    setTimeout(() => {
      this.isCelebrating = false;
      this.emit('celebration:complete');
    }, 5000);
  }

  on(event: string, callback: AnimationCallback): void {
    this.eventCallbacks.set(event, callback);
  }

  off(event: string): void {
    this.eventCallbacks.delete(event);
  }

  private emit(event: string, data?: unknown): void {
    const callback = this.eventCallbacks.get(event);
    if (callback) {
      callback(event, data);
    }
  }

  isCelebratingCheck(): boolean {
    return this.isCelebrating;
  }

  getConfig(): AnimationConfig {
    return { ...this.config };
  }

  pause(): void {
    this.emit('animation:pause');
  }

  resume(): void {
    this.emit('animation:resume');
  }

  reset(): void {
    this.isCelebrating = false;
    this.currentTimeline = null;
    this.emit('celebration:reset');
  }

  cleanup(): void {
    this.reset();
    this.eventCallbacks.clear();
  }
}

export const animationService = new AnimationService();
