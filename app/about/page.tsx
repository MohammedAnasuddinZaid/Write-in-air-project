import { GlassPanel } from '@/components/ui/GlassPanel';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#1a0a2e] p-6">
      <div className="mx-auto max-w-3xl">
        <GlassPanel blur="xl" className="p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-xl">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AirWriter AI</h1>
              <p className="text-sm text-white/40">Version 1.0.0</p>
            </div>
          </div>

          <p className="mb-6 leading-relaxed text-white/70">
            AirWriter AI lets you write in the air using your webcam. Hold up your hand, pinch
            your thumb and index finger together or extend your index finger, and trace letters
            in the air. Your strokes appear as golden calligraphy on screen and are recognized
            into text in real time.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-white">Key Features</h2>
          <ul className="mb-6 space-y-2 text-white/60">
            <li>• Real-time hand tracking powered by MediaPipe</li>
            <li>• Letter-by-letter handwriting recognition via Dynamic Time Warping (DTW)</li>
            <li>• Dual gesture modes: pinch (thumb+index) or point (index extended)</li>
            <li>• One Euro adaptive smoothing filter for wobble-free tracking</li>
            <li>• Golden calligraphy brush with gradient, glow, and variable width</li>
            <li>• Emoji celebrations for recognized phrases (HAPPY BIRTHDAY, RAMADAN, NEW YEAR, etc.)</li>
            <li>• Touch and mouse drawing support alongside air writing</li>
            <li>• Works entirely in the browser — no cloud dependency</li>
            <li>• Undo, redo, clear, and screenshot/export tools</li>
          </ul>

          <h2 className="mb-3 text-lg font-semibold text-white">Technology</h2>
          <p className="mb-6 leading-relaxed text-white/60">
            Built with Next.js, TypeScript, MediaPipe Tasks Vision, One Euro Filter, Framer Motion,
            and modern Web APIs. All AI processing and handwriting recognition runs locally on your
            device — nothing is sent to the cloud.
          </p>

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
