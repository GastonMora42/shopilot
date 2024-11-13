// components/CountdownTimer.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface CountdownTimerProps {
  expiresAt: number | null;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = expiresAt - now;
      setTimeLeft(Math.max(0, difference));
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt || timeLeft === 0) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={cn(
        "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50",
        timeLeft <= 60000 ? "bg-red-100" : "bg-yellow-100"
      )}
    >
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        <p className={cn(
          "font-medium",
          timeLeft <= 60000 ? "text-red-800" : "text-yellow-800"
        )}>
          Tiempo restante: {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
      </div>
    </motion.div>
  );
}