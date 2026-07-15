import { logger } from './logger';

interface AudioAsset {
  id: string;
  src: string;
  buffer?: AudioBuffer;
  gain?: GainNode;
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private assets: Map<string, AudioAsset> = new Map();
  private isMuted = false;
  private volume = 0.7;
  private isInitialized = false;
  private activeSources: AudioBufferSourceNode[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      this.isInitialized = true;
      logger.info('Audio service initialized');
    } catch (error) {
      logger.warn('AudioContext not available', error);
    }
  }

  async loadAsset(id: string, src: string): Promise<void> {
    if (!this.audioContext) return;
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.assets.set(id, { id, src, buffer: audioBuffer });
      logger.debug(`Audio asset loaded: ${id}`);
    } catch (error) {
      logger.warn(`Failed to load audio asset: ${id}`, error);
    }
  }

  async preloadAssets(assets: Array<{ id: string; src: string }>): Promise<void> {
    const results = await Promise.allSettled(
      assets.map((a) => this.loadAsset(a.id, a.src)),
    );
    const loaded = results.filter((r) => r.status === 'fulfilled').length;
    logger.info(`Audio assets loaded: ${loaded}/${assets.length}`);
  }

  play(id: string, loop: boolean = false, volume: number = 1): AudioBufferSourceNode | null {
    if (this.isMuted || !this.audioContext || !this.masterGain) return null;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const asset = this.assets.get(id);
    if (!asset?.buffer) return null;

    const source = this.audioContext.createBufferSource();
    source.buffer = asset.buffer;
    source.loop = loop;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);
    source.start(0);

    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
    };

    return source;
  }

  playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (this.isMuted || !this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(0);
    osc.stop(this.audioContext.currentTime + duration);
  }

  playSparkle(): void {
    this.playTone(800, 0.1, 'sine');
    setTimeout(() => this.playTone(1200, 0.1, 'sine'), 50);
    setTimeout(() => this.playTone(1600, 0.15, 'sine'), 100);
  }

  playSuccess(): void {
    if (!this.audioContext) return;
    this.playTone(523, 0.15, 'sine');
    setTimeout(() => this.playTone(659, 0.15, 'sine'), 100);
    setTimeout(() => this.playTone(784, 0.3, 'sine'), 200);
  }

  playClick(): void {
    this.playTone(1000, 0.05, 'square');
  }

  playFirework(): void {
    this.playTone(60, 0.3, 'sawtooth');
    setTimeout(() => {
      this.playTone(200, 0.1, 'sine');
      this.playTone(400, 0.1, 'sine');
      this.playTone(800, 0.1, 'sine');
    }, 200);
  }

  playConfetti(): void {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(200 + Math.random() * 400, 0.05, 'triangle');
      }, i * 50);
    }
  }

  playApplause(): void {
    if (!this.audioContext) return;
    const duration = 2;
    const interval = setInterval(() => {
      if (this.isMuted) { clearInterval(interval); return; }
      this.playTone(300 + Math.random() * 2000, 0.02, 'triangle');
    }, 30);
    setTimeout(() => clearInterval(interval), duration * 1000);
  }

  playBirthdayMelody(): void {
    const notes = [
      { freq: 392, time: 0 },
      { freq: 392, time: 200 },
      { freq: 440, time: 400 },
      { freq: 392, time: 600 },
      { freq: 523, time: 800 },
      { freq: 494, time: 1000 },
      { freq: 392, time: 1200 },
      { freq: 392, time: 1400 },
      { freq: 440, time: 1600 },
      { freq: 392, time: 1800 },
      { freq: 587, time: 2000 },
      { freq: 523, time: 2200 },
    ];

    notes.forEach(({ freq, time }) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine'), time);
    });
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  mute(): void {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  unmute(): void {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  isMutedCheck(): boolean {
    return this.isMuted;
  }

  stopAll(): void {
    this.activeSources.forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
    });
    this.activeSources = [];
  }

  cleanup(): void {
    this.stopAll();
    this.assets.clear();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
    logger.info('Audio service cleaned up');
  }
}

export const audioService = new AudioService();
