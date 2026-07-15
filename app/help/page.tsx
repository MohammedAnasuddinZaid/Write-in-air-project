import { GlassPanel } from '@/components/ui/GlassPanel';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a0a2e] p-6">
      <div className="mx-auto max-w-3xl">
        <GlassPanel blur="xl" className="p-8">
          <h1 className="mb-6 text-2xl font-bold text-white">Help & Guide</h1>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-white">Getting Started</h2>
            <div className="space-y-3 text-white/60">
              <p>1. Allow camera access when prompted.</p>
              <p>2. The AI model will load automatically (takes a few seconds).</p>
              <p>3. Point your index finger at the camera.</p>
              <p>4. Pinch your thumb and index finger to start writing.</p>
              <p>5. Move your finger through the air to write.</p>
              <p>6. Release the pinch to stop writing.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-white">Gesture Controls</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { gesture: 'Pinch', action: 'Start / Stop writing' },
                { gesture: 'Open Palm', action: 'Clear canvas' },
                { gesture: 'Thumb Up', action: 'Undo last stroke' },
                { gesture: 'Peace Sign', action: 'Pause / Resume recognition' },
                { gesture: 'Three Fingers', action: 'Take screenshot' },
                { gesture: 'Four Fingers', action: 'Toggle UI visibility' },
                { gesture: 'Five Fingers', action: 'Reset everything' },
              ].map((item) => (
                <div key={item.gesture} className="rounded-xl bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white">{item.gesture}</p>
                  <p className="text-xs text-white/40">{item.action}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-white">Keyboard Shortcuts</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: 'Ctrl+Z', action: 'Undo' },
                { key: 'Ctrl+Y', action: 'Redo' },
                { key: 'Ctrl+Shift+C', action: 'Clear canvas' },
                { key: 'Ctrl+S', action: 'Screenshot' },
                { key: 'Ctrl+H', action: 'Toggle UI' },
                { key: 'Escape', action: 'Dismiss celebration' },
              ].map((item) => (
                <div key={item.key} className="rounded-xl bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white">{item.key}</p>
                  <p className="text-xs text-white/40">{item.action}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-white">Tips</h2>
            <ul className="space-y-2 text-white/60">
              <li>• Ensure good lighting for best tracking accuracy.</li>
              <li>• Keep your hand within the camera frame.</li>
              <li>• Write at a natural pace - no need to write slowly.</li>
              <li>• Use the pinch gesture to toggle writing mode.</li>
              <li>• Recognition happens automatically after a short pause.</li>
            </ul>
          </section>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-500/20 px-5 py-2.5 text-sm font-medium text-primary-400 transition-all hover:bg-primary-500/30"
          >
            ← Back to App
          </Link>
        </GlassPanel>
      </div>
    </div>
  );
}
