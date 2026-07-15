# ✨ AirWriter AI – Birthday Celebration Edition

**Write in the air. Celebrate beautifully.**

AirWriter AI is a premium, production-ready browser-based application that lets you write in the air using your index finger tracked by your webcam. Powered by MediaPipe computer vision and AI, it recognizes handwritten phrases and triggers stunning cinematic birthday celebrations when "HAPPY BIRTHDAY" is detected.

![AirWriter AI](public/icons/icon-512.png)

---

## 🚀 Features

### ✍️ Air Writing
- Real-time finger tracking via webcam using MediaPipe Hand Landmarker
- Smooth, natural ink rendering with multiple brush styles
- Kalman Filter, One Euro Filter, and adaptive smoothing
- Gesture controls: pinch to write, open palm to clear, and more

### 🧠 AI Recognition
- Offline handwriting recognition (no cloud dependency)
- Dictionary correction and spell checking
- Context-aware phrase recognition
- Continuous recognition with confidence scoring

### 🎉 Birthday Celebration
- Cinematic multi-stage animation sequence
- Confetti, fireworks, balloons, gifts, and a 3D cake
- Glowing golden particles and light rays
- Royalty-free birthday melody and sound effects
- Animated typography with letter-by-letter reveal

### 🎨 Premium UI
- Glassmorphism design with animated gradients
- Dark/Light/System theme support
- Responsive layout for all screen sizes
- Smooth micro-interactions and transitions
- Professional typography with Inter and Poppins

### 📱 PWA Support
- Installable on desktop and mobile
- Offline operation after first load
- Service worker caching
- App manifest and splash screen

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **Next.js 15** | React framework with App Router |
| **TypeScript** | Strict type safety |
| **TailwindCSS** | Utility-first styling |
| **Framer Motion** | React animations |
| **GSAP** | High-performance animations |
| **MediaPipe Tasks Vision** | Hand landmark detection |
| **Zustand** | State management |
| **Canvas API** | Drawing engine |
| **idb** | IndexedDB storage |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- A webcam

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/airwriter-ai.git
cd airwriter-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Type Checking & Linting

```bash
npm run type-check
npm run lint
```

---

## 🎯 Usage Guide

1. **Allow camera access** when prompted by the browser
2. **Wait for the AI model to load** (indicated by status indicators)
3. **Point your index finger** at the camera
4. **Pinch** (thumb + index finger) to start writing
5. **Move your finger** through the air to draw
6. **Release pinch** to stop writing
7. **Recognition happens automatically** after a brief pause
8. **Say "HAPPY BIRTHDAY"** to trigger the celebration!

### Gesture Controls

| Gesture | Action |
|---|---|
| ✌️ Pinch | Start/Stop writing |
| ✋ Open Palm | Clear canvas |
| 👍 Thumb Up | Undo last stroke |
| ✌️ Peace Sign | Pause/Resume recognition |
| 🤟 Three Fingers | Take screenshot |
| 🖖 Four Fingers | Toggle UI visibility |
| ✋ Five Fingers | Reset everything |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+C` | Clear canvas |
| `Ctrl+S` | Screenshot |
| `Ctrl+H` | Toggle UI |
| `Escape` | Dismiss celebration |

---

## 🏗️ Project Architecture

```
airwriter-ai/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with theme
│   ├── page.tsx            # Main application page
│   ├── globals.css         # Global styles + Tailwind
│   ├── settings/           # Settings page
│   ├── about/              # About page
│   └── help/               # Help/guide page
├── components/
│   ├── ui/                 # Design system components
│   │   ├── GlassPanel      # Glassmorphism container
│   │   ├── Button          # Styled button
│   │   ├── IconButton      # Icon-only button
│   │   ├── Slider          # Range slider
│   │   └── Toast           # Notification toasts
│   ├── canvas/             # Drawing components
│   │   ├── CameraFeed      # Webcam display
│   │   └── DrawingCanvas   # Ink rendering canvas
│   ├── animations/         # Celebration system
│   │   ├── BirthdayCelebration  # Main celebration
│   │   ├── ParticleEngine  # Particle system
│   │   └── Fireworks       # Firework effects
│   └── layout/             # Layout components
│       └── Header          # Top navigation bar
├── hooks/                  # React hooks
│   ├── useCamera           # Camera management
│   ├── useMediaPipe        # MediaPipe integration
│   ├── useCanvas           # Canvas rendering
│   ├── useGesture          # Gesture recognition
│   ├── usePerformance      # FPS monitoring
│   ├── useTheme            # Theme management
│   └── useKeyboard         # Keyboard shortcuts
├── services/               # Core services
│   ├── camera.ts           # Camera API
│   ├── mediapipe.ts        # MediaPipe hand tracking
│   ├── drawing.ts          # Stroke engine
│   ├── gesture.ts          # Gesture detection
│   ├── recognition.ts      # Handwriting recognition
│   ├── animation.ts        # Animation orchestration
│   ├── audio.ts            # Sound engine
│   ├── storage.ts          # IndexedDB persistence
│   ├── theme.ts            # Theme management
│   ├── export.ts           # Export utilities
│   └── logger.ts           # Development logger
├── stores/                 # Zustand state stores
│   ├── useAppStore         # Global application state
│   ├── useSettingsStore    # User settings
│   └── useRecognitionStore # Recognition state
├── lib/                    # Shared utilities
│   ├── types.ts            # TypeScript types
│   ├── constants.ts        # Constants
│   ├── config.ts           # Default configuration
│   ├── utils.ts            # Utility functions
│   └── smoothing.ts        # Signal smoothing filters
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   ├── robots.txt
│   └── sitemap.xml
└── config/                 # Configuration
```

---

## ☁️ Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push the repository to GitHub
2. Import into Vercel
3. Deploy — no configuration needed

### Docker

```bash
docker build -t airwriter-ai .
docker run -p 3000:3000 airwriter-ai
```

### Static Export

```bash
npm run build
# Output in out/ directory
```

---

## 🔧 Configuration

Settings are available in-app and persisted to IndexedDB. Key configuration options:

| Setting | Default | Description |
|---|---|---|
| Brush Size | 3 | Drawing stroke width |
| Brush Opacity | 90% | Stroke transparency |
| Glow Intensity | 50% | Neon glow effect |
| Smoothing | 70% | Stroke smoothing amount |
| Confidence Threshold | 60% | Recognition minimum confidence |
| Particle Count | 200 | Max celebration particles |
| Camera FPS | 30 | Target frame rate |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [MediaPipe](https://mediapipe.dev/) for hand tracking
- [Next.js](https://nextjs.org/) for the framework
- [Framer Motion](https://www.framer.com/motion/) for animations
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Zustand](https://github.com/pmndrs/zustand) for state management

---

<p align="center">Made with ❤️ for birthdays everywhere</p>
