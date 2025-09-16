import { useEffect, useState, useRef } from 'react';

interface InteractiveBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  opacity: number;
}

interface InteractiveBubblesProps {
  count?: number;
  className?: string;
}

export const InteractiveBubbles = ({ count = 5, className = "" }: InteractiveBubblesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<InteractiveBubble[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const initBubbles = () => {
      const newBubbles: InteractiveBubble[] = [];
      for (let i = 0; i < count; i++) {
        newBubbles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 80 + 40,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
      setBubbles(newBubbles);
    };

    initBubbles();
  }, [count]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const animateBubbles = () => {
      setBubbles(prevBubbles =>
        prevBubbles.map(bubble => {
          let { x, y, vx, vy } = bubble;

          // Mouse attraction
          const dx = mousePosition.x - x;
          const dy = mousePosition.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 200) {
            const force = (200 - distance) / 200 * 0.3;
            vx += (dx / distance) * force;
            vy += (dy / distance) * force;
          }

          // Update position
          x += vx;
          y += vy;

          // Boundary collision
          if (x < 0 || x > window.innerWidth) vx *= -0.8;
          if (y < 0 || y > window.innerHeight) vy *= -0.8;

          // Keep in bounds
          x = Math.max(0, Math.min(window.innerWidth, x));
          y = Math.max(0, Math.min(window.innerHeight, y));

          // Damping
          vx *= 0.99;
          vy *= 0.99;

          return { ...bubble, x, y, vx, vy };
        })
      );
    };

    const interval = setInterval(animateBubbles, 16);
    return () => clearInterval(interval);
  }, [mousePosition]);

  return (
    <div ref={containerRef} className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute rounded-full bg-gradient-primary blur-sm transition-all duration-75"
          style={{
            left: bubble.x - bubble.size / 2,
            top: bubble.y - bubble.size / 2,
            width: bubble.size,
            height: bubble.size,
            opacity: bubble.opacity,
          }}
        />
      ))}
    </div>
  );
};
