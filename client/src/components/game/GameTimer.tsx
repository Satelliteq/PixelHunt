import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type GameTimerProps = {
  initialTime: number; // in seconds
  isRunning: boolean;
  onTimeExpired: () => void;
  className?: string;
};

export default function GameTimer({
  initialTime,
  isRunning,
  onTimeExpired,
  className
}: GameTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const percentLeft = (timeLeft / initialTime) * 100;
  
  // Determine color based on time left
  const getColorClass = () => {
    if (percentLeft > 66) return "bg-green-500";
    if (percentLeft > 33) return "bg-yellow-500";
    return "bg-red-500";
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, onTimeExpired]);

  // Reset timer when initialTime changes
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm text-zinc-400">Kalan Süre:</span>
        <span className={cn(
          "font-mono font-semibold",
          percentLeft <= 33 ? "text-red-500 animate-pulse" : ""
        )}>
          {formatTime(timeLeft)}
        </span>
      </div>
      
      <Progress 
        value={percentLeft} 
        className="h-2 bg-zinc-700"
        indicatorClassName={getColorClass()}
      />
    </div>
  );
}
