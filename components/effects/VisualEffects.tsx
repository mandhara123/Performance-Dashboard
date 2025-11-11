import React, { useEffect, useRef } from 'react';

interface ParticleSystemProps {
  width: number;
  height: number;
  particleCount?: number;
  color?: string;
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  width,
  height,
  particleCount = 50,
  color = '#3b82f6',
  speed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      life: Math.random() * 100,
      maxLife: 100,
      size: Math.random() * 3 + 1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particlesRef.current.forEach((particle, index) => {
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 1;

        // Wrap around edges
        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;

        // Reset if dead
        if (particle.life <= 0) {
          particle.x = Math.random() * width;
          particle.y = Math.random() * height;
          particle.life = particle.maxLife;
        }

        // Draw particle
        const alpha = particle.life / particle.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw connections
        particlesRef.current.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.save();
            ctx.globalAlpha = (1 - distance / 100) * 0.2;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, particleCount, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
};

export const GlowEffect: React.FC<{ children: React.ReactNode; intensity?: number }> = ({
  children,
  intensity = 1,
}) => {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-lg blur-xl opacity-30"
        style={{
          background: `radial-gradient(circle, rgba(59, 130, 246, ${0.3 * intensity}) 0%, transparent 70%)`,
          transform: `scale(${1 + intensity * 0.1})`,
        }}
      />
      {children}
    </div>
  );
};

export const PulseLoader: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#3b82f6',
}) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className="animate-ping rounded-full opacity-75"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          animationDuration: '1s',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          backgroundColor: color,
        }}
      />
    </div>
  );
};