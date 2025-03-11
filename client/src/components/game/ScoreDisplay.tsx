import React from "react";
import { Trophy, Heart, Clock, Battery } from "lucide-react";

type ScoreDisplayProps = {
  score: number;
  mode: "classic" | "speed" | "time" | "live" | "test";
  extraInfo?: {
    attempts?: number;
    timeLeft?: number;
    lives?: number;
  };
};

export default function ScoreDisplay({ score, mode, extraInfo }: ScoreDisplayProps) {
  // Define mode-specific icons and colors
  const modeConfig = {
    classic: { icon: <Trophy className="w-5 h-5 text-yellow-500" />, color: "text-yellow-500" },
    speed: { icon: <Clock className="w-5 h-5 text-purple-500" />, color: "text-purple-500" },
    time: { icon: <Clock className="w-5 h-5 text-blue-500" />, color: "text-blue-500" },
    live: { icon: <Heart className="w-5 h-5 text-red-500" />, color: "text-red-500" },
    test: { icon: <Battery className="w-5 h-5 text-green-500" />, color: "text-green-500" }
  };

  return (
    <div className="bg-zinc-800 rounded-xl p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {modeConfig[mode].icon}
          <span className={`font-semibold ${modeConfig[mode].color}`}>
            {mode === "classic" && "Klasik Mod"}
            {mode === "speed" && "Hızlı Mod"}
            {mode === "time" && "Zamana Karşı"}
            {mode === "live" && "Canlı Mod"}
            {mode === "test" && "Test Modu"}
          </span>
        </div>
        
        <div className="text-xl font-bold">{score} Puan</div>
      </div>
      
      {extraInfo && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {extraInfo.attempts !== undefined && (
            <div className="bg-zinc-700 rounded-lg p-2 text-center">
              <div className="text-xs text-zinc-400">Tahmin</div>
              <div className="font-semibold">{extraInfo.attempts}</div>
            </div>
          )}
          
          {extraInfo.timeLeft !== undefined && (
            <div className="bg-zinc-700 rounded-lg p-2 text-center">
              <div className="text-xs text-zinc-400">Kalan Süre</div>
              <div className="font-semibold">{extraInfo.timeLeft}s</div>
            </div>
          )}
          
          {extraInfo.lives !== undefined && (
            <div className="bg-zinc-700 rounded-lg p-2 text-center">
              <div className="text-xs text-zinc-400">Can</div>
              <div className="font-semibold">
                {Array(extraInfo.lives).fill("❤️").join(" ")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
