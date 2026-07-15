import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] gap-6">
      <h1 className="text-6xl font-bold text-white/20">404</h1>
      <p className="text-lg text-white/40">Page not found</p>
      <Link
        href="/"
        className="rounded-xl bg-primary-500/20 px-6 py-3 text-sm font-medium text-primary-400 transition-all hover:bg-primary-500/30"
      >
        Back to App
      </Link>
    </div>
  );
}
