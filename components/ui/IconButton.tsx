'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface IconButtonProps {
  icon: ReactNode;
  label: string;
  variant?: 'glass' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const variants = {
  glass:
    'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white',
  ghost: 'hover:bg-white/10 text-white/70 hover:text-white',
  primary: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
};

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export function IconButton({
  icon,
  label,
  variant = 'glass',
  size = 'md',
  active = false,
  glow = false,
  className,
  disabled,
  onClick,
}: IconButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-xl transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-400/40',
        variants[variant],
        sizes[size],
        active && 'ring-2 ring-primary-400/60 bg-primary-500/30',
        glow && 'shadow-lg shadow-primary-500/20',
        className,
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </motion.button>
  );
}
