"use client";

import { useEffect, useRef } from "react";

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animation = 0;
    let skip = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = Math.max(680, window.innerHeight) * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${Math.max(680, window.innerHeight)}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      skip = (skip + 1) % 2;
      if (skip !== 0) {
        animation = requestAnimationFrame(draw);
        return;
      }
      const width = window.innerWidth;
      const height = Math.max(680, window.innerHeight);
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(6, 12, 32, 0.96)");
      gradient.addColorStop(0.45, "rgba(4, 8, 20, 0.92)");
      gradient.addColorStop(1, "rgba(3, 18, 25, 0.96)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      animation = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10 hero-mask" aria-hidden />;
}

