import { drawingService } from './drawing';
import { logger } from './logger';

class ExportService {
  exportAsPNG(width?: number, height?: number): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = width ?? 1920;
    canvas.height = height ?? 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (width && height) {
      const scaleX = width / 1920;
      const scaleY = height / 1080;
      ctx.scale(scaleX, scaleY);
    }

    drawingService.renderAllStrokes(ctx);
    return canvas.toDataURL('image/png');
  }

  exportAsJPEG(quality: number = 0.92): string | null {
    const dataUrl = this.exportAsPNG();
    if (!dataUrl) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = new Image();
    img.src = dataUrl;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', quality);
  }

  exportAsSVG(): string {
    return drawingService.toSVG();
  }

  exportAsJSON(): string {
    return drawingService.toJSON();
  }

  downloadAsPNG(filename: string = 'airwriter-drawing.png'): void {
    const dataUrl = this.exportAsPNG();
    if (!dataUrl) return;
    this.downloadDataUrl(dataUrl, filename);
  }

  downloadAsSVG(filename: string = 'airwriter-drawing.svg'): void {
    const svg = this.exportAsSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    this.downloadBlob(blob, filename);
  }

  downloadAsJSON(filename: string = 'airwriter-strokes.json'): void {
    const json = this.exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    this.downloadBlob(blob, filename);
  }

  downloadDataUrl(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async copyToClipboard(): Promise<boolean> {
    try {
      const blob = await this.createClipboardBlob();
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('Failed to copy to clipboard', error);
      return false;
    }
  }

  private async createClipboardBlob(): Promise<Blob | null> {
    const dataUrl = this.exportAsPNG();
    if (!dataUrl) return null;
    const response = await fetch(dataUrl);
    return response.blob();
  }

  async shareDrawing(): Promise<boolean> {
    if (!navigator.share) return false;
    try {
      const blob = await this.createClipboardBlob();
      if (!blob) return false;
      await navigator.share({
        title: 'AirWriter AI Drawing',
        files: [new File([blob], 'airwriter-drawing.png', { type: 'image/png' })],
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const exportService = new ExportService();
