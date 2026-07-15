'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Particle } from '@/lib/types';
import { generateId, randomBetween, randomColor } from '@/lib/utils';
import { useAppStore } from '@/stores/useAppStore';

const PARTICLE_COLORS = [
  '#fbbf24', '#f472b6', '#a855f7', '#60a5fa', '#34d399',
  '#f87171', '#fb923c', '#facc15', '#e879f9', '#22d3ee',
  '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff',
];

function createParticle(type: Particle['type'] = 'confetti', x?: number, y?: number): Particle {
  return {
    id: generateId(),
    type,
    x: x ?? randomBetween(0, window.innerWidth),
    y: y ?? -20,
    vx: randomBetween(-3, 3),
    vy: randomBetween(2, 8),
    size: randomBetween(4, 12),
    color: randomColor(PARTICLE_COLORS),
    opacity: 1,
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.2, 0.2),
    lifetime: 0,
    maxLifetime: randomBetween(2000, 5000),
    gravity: 0.05,
    wind: randomBetween(-0.02, 0.02),
    bounce: true,
  };
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  spikes: number, outerRadius: number, innerRadius: number,
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

interface ParticleEngineProps {
  active?: boolean;
  count?: number;
  className?: string;
}

export function ParticleEngine({ active = false, count = 200, className }: ParticleEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const isCelebrating = useAppStore((s) => s.isCelebrating);

  const spawnParticles = useCallback(
    (num: number, x?: number, y?: number) => {
      const types: Particle['type'][] = ['confetti', 'star', 'heart', 'sparkle', 'glow'];
      for (let i = 0; i < num; i++) {
        const type = types[Math.floor(Math.random() * types.length)] ?? 'confetti';
        particlesRef.current.push(createParticle(type, x, y));
      }
      if (particlesRef.current.length > count * 3) {
        particlesRef.current = particlesRef.current.slice(-count * 2);
      }
    },
    [count],
  );

  useEffect(() => {
    if (!active && !isCelebrating) return;
    const interval = setInterval(() => {
      spawnParticles(Math.floor(count / 20));
    }, 200);
    return () => clearInterval(interval);
  }, [active, isCelebrating, count, spawnParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    if (active || isCelebrating) spawnParticles(count);

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx += p.wind;
        p.rotation += p.rotationSpeed;
        p.lifetime += 16;

        if (p.bounce && p.y > window.innerHeight) { p.y = window.innerHeight; p.vy *= -0.5; }
        if (p.x < -50 || p.x > window.innerWidth + 50) p.vx *= -1;

        p.opacity = Math.max(0, 1 - p.lifetime / p.maxLifetime);

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'confetti') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.type === 'star') {
          ctx.fillStyle = p.color;
          drawStar(ctx, 0, 0, 5, p.size / 2, p.size / 4);
        } else if (p.type === 'heart') {
          ctx.fillStyle = p.color;
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('♥', 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = p.type === 'glow' ? 20 : 10;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();
        return p.lifetime < p.maxLifetime;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, isCelebrating, count, spawnParticles]);

  if (!active && !isCelebrating) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-50 ${className ?? ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    />
  );
}
