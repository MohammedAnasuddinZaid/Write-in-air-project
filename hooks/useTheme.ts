'use client';

import { useEffect, useState, useCallback } from 'react';
import { themeService } from '@/services/theme';
import type { ThemeMode } from '@/lib/types';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    themeService.initialize();
    setThemeState(themeService.getTheme());
    setResolved(themeService.getResolvedTheme());

    const unsubscribe = themeService.onChange((t) => setResolved(t));
    return unsubscribe;
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    themeService.setTheme(t);
    setThemeState(t);
    setResolved(themeService.getResolvedTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [resolved, setTheme]);

  const isDark = resolved === 'dark';
  const isLight = resolved === 'light';

  return { theme, resolved, setTheme, toggleTheme, isDark, isLight };
}
