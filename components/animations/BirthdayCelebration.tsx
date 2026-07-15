'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cake, Gift, PartyPopper, Music } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { audioService } from '@/services/audio';
import { ParticleEngine } from './ParticleEngine';
import { Fireworks } from './Fireworks';

interface BirthdayCelebrationProps {
  phrase?: string;
}

export function BirthdayCelebration({ phrase = '🎉 HAPPY BIRTHDAY 🎉' }: BirthdayCelebrationProps) {
  const isCelebrating = useAppStore((s) => s.isCelebrating);
  const setIsCelebrating = useAppStore((s) => s.setIsCelebrating);
  const [stage, setStage] = useState(0);
  const [showCake, setShowCake] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showBalloons, setShowBalloons] = useState(false);
  const [showText, setShowText] = useState(false);

  const startCelebration = useCallback(() => {
    setStage(0);
    audioService.playBirthdayMelody();
    audioService.playConfetti();

    const timeline = [
      { delay: 0, action: () => setStage(1) },
      { delay: 500, action: () => { setShowBalloons(true); audioService.playSparkle(); } },
      { delay: 1000, action: () => { setShowGifts(true); audioService.playSparkle(); } },
      { delay: 1500, action: () => { setShowCake(true); audioService.playSparkle(); } },
      { delay: 2000, action: () => { setStage(2); audioService.playSuccess(); } },
      { delay: 2500, action: () => { setShowText(true); audioService.playFirework(); } },
      { delay: 3500, action: () => { audioService.playApplause(); setStage(3); } },
      { delay: 6000, action: () => { audioService.playFirework(); } },
    ];

    timeline.forEach(({ delay, action }) => setTimeout(action, delay));
  }, []);

  useEffect(() => {
    if (isCelebrating) {
      startCelebration();
    } else {
      setShowCake(false);
      setShowGifts(false);
      setShowBalloons(false);
      setShowText(false);
      setStage(0);
    }
  }, [isCelebrating, startCelebration]);

  return (
    <AnimatePresence>
      {isCelebrating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.15) 0%, rgba(0,0,0,0.6) 70%)',
          }}
        >
          <Fireworks active={stage >= 1} frequency={400} />
          <ParticleEngine active={stage >= 1} count={300} />

          {stage >= 3 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {showBalloons && (
            <motion.div
              className="absolute left-[10%] top-0"
              initial={{ y: '100vh' }}
              animate={{ y: '-20vh' }}
              transition={{ duration: 3, ease: 'easeOut', type: 'spring', stiffness: 50 }}
            >
                <PartyPopper className="h-20 w-20 text-pink-400 drop-shadow-2xl" />
            </motion.div>
          )}

          {showBalloons && (
            <motion.div
              className="absolute right-[15%] top-0"
              initial={{ y: '100vh' }}
              animate={{ y: '-10vh' }}
              transition={{ duration: 3.5, ease: 'easeOut', delay: 0.3, type: 'spring', stiffness: 40 }}
            >
                <PartyPopper className="h-16 w-16 text-purple-400 drop-shadow-2xl" />
            </motion.div>
          )}

          {showGifts && (
            <motion.div
              className="absolute bottom-[20%] left-[5%]"
              initial={{ x: '-100vw', rotate: -20 }}
              animate={{ x: 0, rotate: 0 }}
              transition={{ duration: 1, type: 'spring', stiffness: 100, damping: 20 }}
            >
              <div className="flex flex-col items-center">
                <Gift className="h-16 w-16 text-yellow-400 drop-shadow-2xl" />
                <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-yellow-300 to-pink-300" />
              </div>
            </motion.div>
          )}

          {showGifts && (
            <motion.div
              className="absolute bottom-[25%] right-[8%]"
              initial={{ x: '100vw', rotate: 20 }}
              animate={{ x: 0, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.2, type: 'spring', stiffness: 80, damping: 20 }}
            >
              <Gift className="h-20 w-20 text-pink-400 drop-shadow-2xl" />
            </motion.div>
          )}

          {showCake && (
            <motion.div
              className="absolute bottom-[10%] left-1/2 -translate-x-1/2"
              initial={{ y: '100vh', scale: 0.5 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ duration: 1.5, type: 'spring', stiffness: 60, damping: 15 }}
            >
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="h-6 w-2 rounded-full bg-gradient-to-t from-yellow-400 to-orange-300"
                        animate={{ scaleY: [1, 1.3, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.2 }}
                        style={{ transformOrigin: 'bottom' }}
                      />
                    ))}
                  </div>
                  <motion.div
                    className="mt-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-200 px-8 py-4 shadow-2xl"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Cake className="h-12 w-12 text-pink-500" />
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {showText && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.h1
                className="bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 bg-clip-text text-center text-5xl font-bold tracking-tight text-transparent drop-shadow-2xl sm:text-7xl md:text-8xl"
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{
                  scale: [0.5, 1.1, 1],
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 1.5,
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                }}
                style={{
                  textShadow: '0 0 40px rgba(251, 191, 36, 0.5), 0 0 80px rgba(251, 191, 36, 0.3)',
                  fontFamily: "'Georgia', serif",
                }}
              >
                {phrase}
              </motion.h1>
            </motion.div>
          )}

          {showText && (
            <motion.div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Music className="h-5 w-5 text-white/60" />
              <span className="text-sm text-white/40">♪ Birthday melody playing</span>
            </motion.div>
          )}

          <button
            onClick={() => setIsCelebrating(false)}
            className="absolute top-6 right-6 z-50 rounded-full bg-white/10 px-4 py-2 text-sm text-white/60 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
