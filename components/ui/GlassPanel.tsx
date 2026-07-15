'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: 'light' | 'medium' | 'heavy';
  hover?: boolean;
  glow?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

const blurMap = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

const opacityMap = {
  light: 'bg-white/10 dark:bg-black/10',
  medium: 'bg-white/20 dark:bg-black/20',
  heavy: 'bg-white/30 dark:bg-black/30',
};

export function GlassPanel({
  children,
  className,
  blur = 'lg',
  opacity = 'medium',
  hover = false,
  glow = false,
  animate = false,
  onClick,
}: GlassPanelProps) {
  const Component = animate ? motion.div : 'div';
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' },
      }
    : {};

  return (
    <Component
      className={cn(
        'rounded-2xl border border-white/20 dark:border-white/10 shadow-xl',
        blurMap[blur],
        opacityMap[opacity],
        hover && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/30',
        glow && 'shadow-primary/20 dark:shadow-primary/10',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </Component>
  );
}
