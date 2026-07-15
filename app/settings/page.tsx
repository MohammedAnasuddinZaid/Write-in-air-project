'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Palette, Brush, Camera, Brain, Settings2, Volume2, Accessibility } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAppStore } from '@/stores/useAppStore';
import Link from 'next/link';

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const addToast = useAppStore((s) => s.addToast);

  const handleReset = () => {
    resetSettings();
    addToast({ type: 'info', message: 'Settings reset to defaults', duration: 2000 });
  };

  const handleSave = () => {
    addToast({ type: 'success', message: 'Settings saved', duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a0a2e] p-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <Link href="/">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-white/40">Customize your AirWriter experience</p>
          </div>
        </motion.div>

        <div className="grid gap-6">
          {/* Drawing Settings */}
          <GlassPanel blur="xl" className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Brush className="h-5 w-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-white">Drawing</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Slider
                label="Brush Size"
                value={settings.brush.size}
                min={1}
                max={20}
                step={0.5}
                onChange={(v) => updateSettings({ brush: { ...settings.brush, size: v } })}
              />
              <Slider
                label="Brush Opacity"
                value={Math.round(settings.brush.opacity * 100)}
                min={10}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => updateSettings({ brush: { ...settings.brush, opacity: v / 100 } })}
              />
              <Slider
                label="Glow Intensity"
                value={Math.round(settings.brush.glow * 100)}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => updateSettings({ brush: { ...settings.brush, glow: v / 100 } })}
              />
              <Slider
                label="Smoothing"
                value={Math.round(settings.writing.smoothing * 100)}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(v) => updateSettings({ writing: { ...settings.writing, smoothing: v / 100 } })}
              />
            </div>
          </GlassPanel>

          {/* Recognition Settings */}
          <GlassPanel blur="xl" className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Brain className="h-5 w-5 text-accent-400" />
              <h2 className="text-lg font-semibold text-white">Recognition</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Slider
                label="Confidence Threshold"
                value={Math.round(settings.recognition.confidenceThreshold * 100)}
                min={10}
                max={100}
                step={5}
                unit="%"
                onChange={(v) =>
                  updateSettings({
                    recognition: { ...settings.recognition, confidenceThreshold: v / 100 },
                  })
                }
              />
              <Slider
                label="Sensitivity"
                value={50}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={() => {}}
              />
            </div>
          </GlassPanel>

          {/* Animation Settings */}
          <GlassPanel blur="xl" className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold text-white">Animations</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Slider
                label="Particle Count"
                value={settings.animation.particleCount}
                min={0}
                max={500}
                step={25}
                onChange={(v) => updateSettings({ animation: { ...settings.animation, particleCount: v } })}
              />
              <Slider
                label="Animation Speed"
                value={50}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={() => {}}
              />
            </div>
          </GlassPanel>

          {/* Camera Settings */}
          <GlassPanel blur="xl" className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <Camera className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Camera</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <Slider
                label="Resolution Width"
                value={settings.camera.resolution.width}
                min={320}
                max={1920}
                step={160}
                onChange={(v) =>
                  updateSettings({
                    camera: { ...settings.camera, resolution: { ...settings.camera.resolution, width: v } },
                  })
                }
              />
              <Slider
                label="Target FPS"
                value={settings.camera.fps}
                min={15}
                max={60}
                step={5}
                onChange={(v) => updateSettings({ camera: { ...settings.camera, fps: v } })}
              />
            </div>
          </GlassPanel>

          {/* Actions */}
          <div className="flex justify-between gap-4">
            <Button variant="ghost" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
