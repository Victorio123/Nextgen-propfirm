import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  size: number;
  color: string;
  duration: number;
}

interface ParticleSystemProps {
  count?: number;
  className?: string;
}

export const ParticleSystem = ({ count = 15, className = "" }: ParticleSystemProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const colors = ['primary', 'accent', 'primary-glow'];
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 15,
          size: Math.random() * 4 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          duration: Math.random() * 10 + 15,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 20000);
    return () => clearInterval(interval);
  }, [count]);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute rounded-full bg-${particle.color} opacity-30 animate-particle-float`}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
};