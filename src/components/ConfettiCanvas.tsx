"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

export default function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const colors = [
      "#3b82f6", // Blue
      "#ec4899", // Pink
      "#10b981", // Green
      "#f59e0b", // Amber
      "#8b5cf6", // Purple
      "#ef4444", // Red
      "#0d9488", // Teal
      "#f43f5e", // Rose
    ];

    const createConfetti = () => {
      const particleCount = 100;
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        // Emit from bottom corners or middle bottom
        const isLeft = Math.random() > 0.5;
        const x = isLeft ? 0 : canvas.width;
        const y = canvas.height * 0.8;

        newParticles.push({
          x,
          y,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          speedX: (isLeft ? 1 : -1) * (Math.random() * 12 + 6),
          speedY: -(Math.random() * 20 + 10),
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1,
        });
      }

      particlesRef.current = [...particlesRef.current, ...newParticles];

      // Start loop if not already running
      if (!animationFrameRef.current) {
        animate();
      }
    };

    // Attach to window so it can be triggered globally
    (window as Window & { triggerConfetti?: () => void }).triggerConfetti = createConfetti;

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.5; // Gravity
        p.speedX *= 0.98; // Friction
        p.rotation += p.rotationSpeed;
        
        // Fade out as they fall below screen or slow down
        if (p.y > canvas.height) {
          p.opacity -= 0.05;
        }

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Draw rectangle
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      delete (window as Window & { triggerConfetti?: () => void }).triggerConfetti;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
