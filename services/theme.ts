import type { ThemeMode } from '@/lib/types';
import { THEME_STORAGE_KEY } from '@/lib/constants';
import { logger } from './logger';

class ThemeService {
  private currentTheme: ThemeMode = 'system';
  private resolvedTheme: 'dark' | 'light' = 'dark';
  private listeners: Array<(theme: 'dark' | 'light') => void> = [];

  async initialize(): Promise<void> {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ['dark', 'light', 'system'].includes(saved)) {
        this.currentTheme = saved as ThemeMode;
      }
    } catch {
      this.currentTheme = 'system';
    }

    this.applyTheme(this.currentTheme);
    this.listenForSystemChanges();
    logger.info(`Theme initialized: ${this.currentTheme} (resolved: ${this.resolvedTheme})`);
  }

  setTheme(theme: ThemeMode): void {
    this.currentTheme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage not available
    }
    this.applyTheme(theme);
    logger.info(`Theme changed: ${theme}`);
    this.notifyListeners();
  }

  getTheme(): ThemeMode {
    return this.currentTheme;
  }

  getResolvedTheme(): 'dark' | 'light' {
    return this.resolvedTheme;
  }

  toggleTheme(): void {
    const newTheme = this.resolvedTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  private applyTheme(theme: ThemeMode): void {
    const resolved = this.resolveTheme(theme);
    this.resolvedTheme = resolved;
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
  }

  private resolveTheme(theme: ThemeMode): 'dark' | 'light' {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  private listenForSystemChanges(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
        this.notifyListeners();
      }
    });
  }

  onChange(callback: (theme: 'dark' | 'light') => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.resolvedTheme));
  }

  isDark(): boolean {
    return this.resolvedTheme === 'dark';
  }

  isLight(): boolean {
    return this.resolvedTheme === 'light';
  }
}

export const themeService = new ThemeService();
