import type { CameraConfig } from '@/lib/types';
import { CAMERA_DEFAULT_RESOLUTION, CAMERA_DEFAULT_FPS } from '@/lib/constants';
import { logger } from './logger';

type CameraCallback = (stream: MediaStream) => void;
type ErrorCallback = (error: string) => void;

class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private config: CameraConfig = {
    resolution: CAMERA_DEFAULT_RESOLUTION,
    fps: CAMERA_DEFAULT_FPS,
    mirror: true,
    autoExposure: true,
  };
  private onStreamCallback: CameraCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  private isActive = false;

  async initialize(config: Partial<CameraConfig> = {}): Promise<MediaStream> {
    this.config = { ...this.config, ...config };
    this.cleanup();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.config.resolution.width },
          height: { ideal: this.config.resolution.height },
          frameRate: { ideal: this.config.fps },
          facingMode: 'user',
        },
        audio: false,
      };

      if (this.config.deviceId) {
        (constraints.video as MediaTrackConstraints).deviceId = {
          exact: this.config.deviceId,
        };
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isActive = true;

      this.applyMirror();
      this.configureAutoExposure();

      this.onStreamCallback?.(this.stream);
      logger.info('Camera initialized successfully');
      return this.stream;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown camera error';
      logger.error('Camera initialization failed', error);
      this.onErrorCallback?.(message);
      throw new Error(`Camera initialization failed: ${message}`);
    }
  }

  async switchCamera(deviceId: string): Promise<void> {
    await this.initialize({ ...this.config, deviceId });
  }

  attachToVideo(video: HTMLVideoElement): void {
    this.videoElement = video;
    if (this.stream) {
      video.srcObject = this.stream;
      video.play().catch((err) => logger.error('Video playback failed', err));
    }
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  getConfig(): CameraConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.videoElement && this.stream) {
      this.applyMirror();
    }
  }

  onStream(callback: CameraCallback): void {
    this.onStreamCallback = callback;
  }

  onError(callback: ErrorCallback): void {
    this.onErrorCallback = callback;
  }

  async getDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  isActiveCamera(): boolean {
    return this.isActive;
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  takeSnapshot(): string | null {
    if (!this.videoElement || !this.stream) return null;
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(this.videoElement, 0, 0);
    return canvas.toDataURL('image/png');
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isActive = false;
    logger.info('Camera cleaned up');
  }

  private applyMirror(): void {
    if (this.videoElement) {
      this.videoElement.style.transform = this.config.mirror ? 'scaleX(-1)' : 'scaleX(1)';
    }
  }

  private configureAutoExposure(): void {
    if (!this.stream) return;
    const track = this.stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = track.getCapabilities() as Record<string, unknown>;
      const exposureModes = capabilities?.exposureMode as string[] | undefined;
      if (exposureModes?.includes('continuous')) {
        track.applyConstraints({ advanced: [{ exposureMode: 'continuous' }] as unknown as Record<string, unknown>[] });
      }
    } catch {
      // Auto-exposure not supported, continue without it
    }
  }
}

export const cameraService = new CameraService();
