import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 1500, className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const progress = time - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing out quart
      const easeOut = 1 - Math.pow(1 - percentage, 4);
      const currentCount = Math.floor(easeOut * value);
      
      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }
      
      if (percentage < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };

    startTimeRef.current = null;
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{count}</span>;
}
