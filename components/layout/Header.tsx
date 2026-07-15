'use client';

import { motion } from 'framer-motion';
import { Settings, Moon, Sun, HelpCircle, Monitor, Github } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAppStore } from '@/stores/useAppStore';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { resolved, toggleTheme } = useTheme();
  const toggleOpen = useSettingsStore((s) => s.toggleOpen);
  const cameraReady = useAppStore((s) => s.cameraReady);
  const modelLoaded = useAppStore((s) => s.modelLoaded);
  const isTracking = useAppStore((s) => s.isTracking);
  const isCelebrating = useAppStore((s) => s.isCelebrating);
  const performanceMetrics = useAppStore((s) => s.performanceMetrics);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 sm:px-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-accent-400 shadow-lg">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <span className="hidden text-sm font-semibold text-white sm:block">
            AirWriter
            <span className="text-white/40 font-normal"> AI</span>
          </span>
        </motion.div>

        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm',
            cameraReady ? 'bg-green-500/10' : 'bg-red-500/10',
          )}>
            <div className={cn(
              'h-1.5 w-1.5 rounded-full',
              cameraReady ? 'bg-green-400 shadow-sm shadow-green-400/50' : 'bg-red-400',
            )} />
            <span className="text-[10px] font-medium text-white/50">
              {cameraReady ? 'CAM' : 'OFF'}
            </span>
          </div>

          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-sm',
            modelLoaded ? 'bg-blue-500/10' : 'bg-yellow-500/10',
          )}>
            <div className={cn(
              'h-1.5 w-1.5 rounded-full',
              modelLoaded ? 'bg-blue-400' : 'bg-yellow-400',
            )} />
            <span className="text-[10px] font-medium text-white/50">
              {modelLoaded ? 'AI' : 'LOAD'}
            </span>
          </div>

          {isTracking && (
            <div className="flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              <span className="text-[10px] font-medium text-white/50">TRK</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {performanceMetrics.fps > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 backdrop-blur-sm md:flex">
            <span className="text-[10px] font-medium text-white/40">
              {performanceMetrics.fps} FPS
            </span>
          </div>
        )}

        <IconButton
          icon={resolved === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          label="Toggle theme"
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
        />

        <IconButton
          icon={<HelpCircle className="h-4 w-4" />}
          label="Help"
          variant="ghost"
          size="sm"
          onClick={() => window.open('/help', '_blank')}
        />

        <IconButton
          icon={<Settings className={cn('h-4 w-4', isCelebrating && 'animate-spin-slow')} />}
          label="Settings"
          variant="ghost"
          size="sm"
          onClick={toggleOpen}
        />
      </div>
    </motion.header>
  );
}
