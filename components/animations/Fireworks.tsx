'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { randomBetween } from '@/lib/utils';

interface Firework {
  x: number;
  y: number;
  particles: FireworkParticle[];
  color: string;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  lifetime: number;
  maxLifetime: number;
}

const FIREWORK_COLORS = [
  '#fbbf24', '#f472b6', '#a855f7', '#60a5fa', '#34d399',
  '#f87171', '#fb923c', '#facc15', '#e879f9', '#22d3ee',
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
];

function createFirework(x?: number, y?: number): Firework {
  const cx = x ?? randomBetween(100, window.innerWidth - 100);
  const cy = y ?? randomBetween(100, window.innerHeight - 200);
  const color = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)] ?? '#fbbf24';
  const particleCount = 30 + Math.floor(Math.random() * 30);
  const particles: FireworkParticle[] = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + randomBetween(-0.3, 0.3);
    const speed = randomBetween(2, 6);
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randomBetween(2, 5),
      color,
      opacity: 1,
      lifetime: 0,
      maxLifetime: randomBetween(800, 1500),
    });
  }

  return { x: cx, y: cy, particles, color };
}

interface FireworksProps {
  active?: boolean;
  frequency?: number;
}

export function Fireworks({ active = false, frequency = 500 }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      fireworksRef.current = [];
      return;
    }

    const interval = setInterval(() => {
      fireworksRef.current.push(createFirework());
    }, frequency);

    return () => clearInterval(interval);
  }, [active, frequency]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      fireworksRef.current = fireworksRef.current.filter((fw) => {
        let alive = false;
        for (const p of fw.particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.04;
          p.lifetime += 16;
          p.opacity = Math.max(0, 1 - p.lifetime / p.maxLifetime);

          if (p.lifetime < p.maxLifetime) {
            alive = true;
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        return alive;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    if (active) animFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  );
}
