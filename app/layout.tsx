import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'AirWriter AI – Write in the Air',
  description:
    'Write in the air using your webcam. AI-powered handwriting recognition with beautiful birthday celebration animations.',
  keywords: [
    'air writing',
    'handwriting recognition',
    'AI',
    'webcam',
    'mediapipe',
    'birthday',
    'celebration',
  ],
  authors: [{ name: 'AirWriter AI Team' }],
  creator: 'AirWriter AI',
  publisher: 'AirWriter AI',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://airwriter-ai.vercel.app',
    siteName: 'AirWriter AI',
    title: 'AirWriter AI – Write in the Air',
    description:
      'Write in the air using your webcam. AI-powered handwriting recognition with beautiful birthday celebration animations.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AirWriter AI – Write in the Air',
    description:
      'Write in the air using your webcam. AI-powered handwriting recognition with beautiful birthday celebration animations.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('airwriter-theme');
                  if (theme === 'light' || (theme !== 'dark' && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        {children}
      </body>
    </html>
  );
}
