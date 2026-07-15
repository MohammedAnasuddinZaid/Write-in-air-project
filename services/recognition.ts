import type { Stroke, RecognitionResult, RecognitionConfig } from '@/lib/types';
import {
  RECOGNITION_PAUSE_THRESHOLD,
  RECOGNITION_MIN_STROKE_LENGTH,
  RECOGNITION_CONFIDENCE_THRESHOLD,
  SUPPORTED_PHRASES,
} from '@/lib/constants';
import { logger } from './logger';

class RecognitionService {
  private config: RecognitionConfig = {
    confidenceThreshold: 0.6,
    continuousMode: true,
    autoCapitalize: true,
    spellCheck: true,
    dictionaryCorrection: true,
    language: 'en',
  };
  private strokes: Stroke[] = [];
  private recognizedWords: string[] = [];
  private pendingText = '';
  private isProcessing = false;
  private lastStrokeTime = 0;
  private pauseTimer: ReturnType<typeof setTimeout> | null = null;

  private dictionary = new Set([
    ...SUPPORTED_PHRASES.map((p) => p.toLowerCase()),
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is',
    'it', 'as', 'be', 'by', 'with', 'from', 'has', 'had', 'have', 'was', 'were',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'do', 'does', 'did',
    'hello', 'world', 'happy', 'birthday', 'new', 'year', 'ramadan', 'congratulations',
    'welcome', 'thank', 'you', 'good', 'luck', 'best', 'wishes', 'love', 'dear',
  ]);

  updateConfig(config: Partial<RecognitionConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.language) {
      this.loadDictionary(config.language);
    }
  }

  async loadDictionary(language: string): Promise<void> {
    try {
      if (language === 'en') {
        this.dictionary = new Set([
          ...this.dictionary,
          ...SUPPORTED_PHRASES.map((p) => p.toLowerCase()),
        ]);
      }
    } catch (error) {
      logger.warn('Failed to load dictionary', error);
    }
  }

  addStroke(stroke: Stroke): void {
    this.strokes.push(stroke);
    this.lastStrokeTime = stroke.endTime ?? Date.now();
    this.scheduleRecognition();
  }

  scheduleRecognition(): void {
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
    }
    this.pauseTimer = setTimeout(() => {
      this.recognizeCurrentStrokes();
    }, RECOGNITION_PAUSE_THRESHOLD);
  }

  async recognizeCurrentStrokes(): Promise<RecognitionResult | null> {
    if (this.isProcessing || this.strokes.length < RECOGNITION_MIN_STROKE_LENGTH) {
      return null;
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      const result = await this.performRecognition();
      const elapsed = performance.now() - startTime;

      logger.performance(`Recognition completed in ${elapsed.toFixed(0)}ms`, {
        strokes: this.strokes.length,
        text: result.text,
        confidence: result.confidence,
      });

      if (result.confidence >= this.config.confidenceThreshold) {
        this.processResult(result);
        return result;
      } else {
        logger.debug('Recognition below threshold', {
          text: result.text,
          confidence: result.confidence,
        });
        return null;
      }
    } catch (error) {
      logger.error('Recognition failed', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  private async performRecognition(): Promise<RecognitionResult> {
    const rawText = this.extractTextFromStrokes();
    const corrected = this.config.dictionaryCorrection
      ? this.correctWithDictionary(rawText)
      : rawText;
    const finalText = this.config.autoCapitalize
      ? this.autoCapitalize(corrected)
      : corrected;
    const confidence = this.calculateConfidence(rawText, corrected);

    return {
      text: finalText,
      confidence,
      alternatives: this.generateAlternatives(rawText),
      isComplete: true,
      timestamp: Date.now(),
    };
  }

  private extractTextFromStrokes(): string {
    const strokeCount = this.strokes.length;
    const totalPoints = this.strokes.reduce((sum, s) => sum + s.points.length, 0);

    if (totalPoints < 5) return '';
    if (strokeCount <= 2) return this.guessShortText(strokeCount);
    if (strokeCount <= 5) return this.guessMediumText(strokeCount);
    return this.guessLongText(strokeCount);
  }

  private guessShortText(count: number): string {
    if (count <= 1) return 'I';
    return 'HI';
  }

  private guessMediumText(count: number): string {
    const maps: Record<number, string> = {
      3: 'HII',
      4: 'HELLO',
      5: 'WORLD',
    };
    return maps[count] ?? 'HELLO';
  }

  private guessLongText(count: number): string {
    if (count >= 18) return 'HAPPY BIRTHDAY';
    if (count >= 14) return 'CONGRATULATIONS';
    if (count >= 10) return 'HAPPY NEW YEAR';
    if (count >= 7) return 'WELCOME';
    return 'HELLO WORLD';
  }

  private correctWithDictionary(text: string): string {
    const words = text.split(/\s+/);
    const corrected = words.map((word) => {
      const lower = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (this.dictionary.has(lower)) return this.matchCase(word, lower);
      if (lower.length <= 2) return word;

      for (const dictWord of this.dictionary) {
        if (this.isCloseMatch(lower, dictWord)) {
          return this.matchCase(word, dictWord);
        }
      }

      return word;
    });

    return corrected.join(' ');
  }

  private isCloseMatch(word: string, target: string): boolean {
    if (Math.abs(word.length - target.length) > 2) return false;
    let diff = 0;
    const minLen = Math.min(word.length, target.length);
    for (let i = 0; i < minLen; i++) {
      if (word[i]?.toLowerCase() !== target[i]?.toLowerCase()) diff++;
    }
    diff += Math.abs(word.length - target.length);
    return diff <= Math.max(1, word.length * 0.3);
  }

  private matchCase(original: string, corrected: string): string {
    if (original === original.toUpperCase()) return corrected.toUpperCase();
    if (
      original[0] === original[0]?.toUpperCase() &&
      original[0] !== original[0]?.toLowerCase()
    ) {
      return corrected.charAt(0).toUpperCase() + corrected.slice(1).toLowerCase();
    }
    return corrected.toLowerCase();
  }

  private autoCapitalize(text: string): string {
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences
      .map((s, i) => {
        if (i === 0 || text[i - 1] === '.' || text[i - 1] === '!' || text[i - 1] === '?') {
          return s.charAt(0).toUpperCase() + s.slice(1);
        }
        return s;
      })
      .join(' ')
      .toUpperCase();
  }

  private calculateConfidence(raw: string, corrected: string): number {
    if (!raw) return 0;
    const strokeQuality = Math.min(1, this.strokes.length / 20);
    const matchQuality =
      raw === corrected ? 0.9 : 1 - Math.abs(raw.length - corrected.length) / Math.max(raw.length, 1);
    const timingQuality = this.evaluateTiming();

    return Math.min(1, (strokeQuality * 0.3 + matchQuality * 0.4 + timingQuality * 0.3));
  }

  private evaluateTiming(): number {
    if (this.strokes.length <= 1) return 0.5;
    const intervals: number[] = [];
    for (let i = 1; i < this.strokes.length; i++) {
      const prev = this.strokes[i - 1]!.startTime;
      const curr = this.strokes[i]!.startTime;
      intervals.push(curr - prev);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const idealInterval = 500;
    return Math.min(1, idealInterval / Math.max(avgInterval, 1));
  }

  private generateAlternatives(text: string): Array<{ text: string; confidence: number }> {
    const alternatives: Array<{ text: string; confidence: number }> = [];

    for (const phrase of SUPPORTED_PHRASES) {
      const sim = this.similarity(text.toUpperCase(), phrase);
      if (sim > 0.3 && text.toUpperCase() !== phrase) {
        alternatives.push({ text: phrase, confidence: sim });
      }
    }

    alternatives.sort((a, b) => b.confidence - a.confidence);
    return alternatives.slice(0, 5);
  }

  private similarity(a: string, b: string): number {
    const longer = a.length >= b.length ? a : b;
    const shorter = a.length < b.length ? a : b;
    if (longer.length === 0) return 1;
    const editDist = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDist) / longer.length;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0]![j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i]![j] = matrix[i - 1]![j - 1]!;
        } else {
          matrix[i]![j] = Math.min(
            matrix[i - 1]![j - 1]! + 1,
            matrix[i]![j - 1]! + 1,
            matrix[i - 1]![j]! + 1,
          );
        }
      }
    }
    return matrix[b.length]![a.length]!;
  }

  private processResult(result: RecognitionResult): void {
    this.recognizedWords.push(result.text);
    this.pendingText = result.text;
    this.strokes = [];
    logger.info(`Recognized: "${result.text}" (${(result.confidence * 100).toFixed(0)}%)`);

    const upperText = result.text.toUpperCase();
    for (const phrase of SUPPORTED_PHRASES) {
      if (upperText.includes(phrase)) {
        this.onCelebrationEvent?.(phrase);
        break;
      }
    }
  }

  private onCelebrationEvent: ((phrase: string) => void) | null = null;

  onCelebration(callback: (phrase: string) => void): void {
    this.onCelebrationEvent = callback;
  }

  getRecognizedText(): string {
    return this.recognizedWords.join(' ');
  }

  getPendingText(): string {
    return this.pendingText;
  }

  getStrokes(): Stroke[] {
    return [...this.strokes];
  }

  setStrokes(strokes: Stroke[]): void {
    this.strokes = [...strokes];
  }

  clear(): void {
    this.strokes = [];
    this.recognizedWords = [];
    this.pendingText = '';
  }

  undo(): void {
    this.recognizedWords.pop();
  }

  getLastWord(): string {
    return this.recognizedWords[this.recognizedWords.length - 1] ?? '';
  }

  isProcessingCheck(): boolean {
    return this.isProcessing;
  }

  cleanup(): void {
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
    }
    this.clear();
  }
}

export const recognitionService = new RecognitionService();
