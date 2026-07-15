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
            AirWriter AI is a cutting-edge browser-based application that lets you write in the air
            using your webcam. Powered by advanced computer vision and AI, it tracks your finger
            movements with exceptional precision and recognizes handwritten text in real time.
          </p>

          <h2 className="mb-3 text-lg font-semibold text-white">Key Features</h2>
          <ul className="mb-6 space-y-2 text-white/60">
            <li>• Real-time hand tracking powered by MediaPipe</li>
            <li>• AI-powered handwriting recognition</li>
            <li>• Gesture-based controls</li>
            <li>• Beautiful birthday celebration animations</li>
            <li>• Works entirely in the browser - no cloud dependency</li>
            <li>• Progressive Web App with offline support</li>
          </ul>

          <h2 className="mb-3 text-lg font-semibold text-white">Technology</h2>
          <p className="mb-6 leading-relaxed text-white/60">
            Built with Next.js, TypeScript, TensorFlow.js, MediaPipe, Framer Motion, GSAP, and modern
            web APIs. All AI processing happens locally on your device.
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
