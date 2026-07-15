'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

interface CameraFeedProps {
  className?: string;
  onVideoReady?: (video: HTMLVideoElement) => void;
  onError?: (error: string) => void;
}

export function CameraFeed({ className, onVideoReady, onError }: CameraFeedProps) {
  const { videoRef } = useCamera({ onError });
  const cameraReady = useAppStore((s) => s.cameraReady);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (cameraReady && localVideoRef.current) {
      onVideoReady?.(localVideoRef.current);
    }
  }, [cameraReady, onVideoReady]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 bg-black/40 backdrop-blur-sm shadow-2xl',
        'w-full max-w-[320px] md:max-w-[480px] aspect-[4/3]',
        className,
      )}
    >
      <video
        ref={(el) => {
          (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
          (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
        }}
        autoPlay
        playsInline
        muted
        className={cn(
          'h-full w-full object-cover',
          'scale-x-[-1]',
          !cameraReady && 'hidden',
        )}
      />

      {!cameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50">
          <CameraOff className="h-8 w-8" />
          <p className="text-sm font-medium">Camera not available</p>
        </div>
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            cameraReady ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400',
          )}
        />
        <span className="text-xs font-medium text-white/60">
          {cameraReady ? 'Camera Active' : 'Offline'}
        </span>
      </div>

      <div className="absolute top-3 right-3">
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
          <Camera className="h-3 w-3 text-white/60" />
        </div>
      </div>
    </motion.div>
  );
}
