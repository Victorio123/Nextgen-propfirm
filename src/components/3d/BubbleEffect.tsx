import { useEffect, useState } from 'react';

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
}

interface BubbleEffectProps {
  count?: number;
  className?: string;
}

export const BubbleEffect = ({ count = 8, className = "" }: BubbleEffectProps) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles: Bubble[] = [];
      for (let i = 0; i < count; i++) {
        newBubbles.push({
          id: i,
          size: Math.random() * 100 + 20,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 6,
          duration: Math.random() * 4 + 6,
        });
      }
      setBubbles(newBubbles);
    };

    generateBubbles();
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-gradient-primary opacity-10 animate-bubble-float blur-sm"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
          }}
        />
      ))}
    </div>
  );
};