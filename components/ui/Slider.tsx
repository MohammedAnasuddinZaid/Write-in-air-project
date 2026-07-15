'use client';

import { cn } from '@/lib/utils';

interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  showValue?: boolean;
  unit?: string;
}

export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  className,
  showValue = true,
  unit,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/70">{label}</label>
          {showValue && (
            <span className="text-sm font-medium text-white/50">
              {value}
              {unit}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-white/10',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-400',
            '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-500/50',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125',
            '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-400',
            '[&::-moz-range-thumb]:border-0',
          )}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 pointer-events-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
