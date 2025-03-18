import React from "react";
import { Trophy, Heart, Clock, Battery, Eye, Zap, Hash, ArrowRight } from "lucide-react";
import { formatTime } from "@/lib/gameHelpers";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type ScoreDisplayProps = {
  score: number;
  mode: "classic" | "speed" | "time" | "live" | "test";
  extraInfo?: {
    attempts?: number;
    timeLeft?: number;
    lives?: number;
    revealPercent?: number;
    correctAnswers?: number;
    totalQuestions?: number; 
    wrongAttempts?: number;
    timeElapsed?: number;
  };
  className?: string;
  compact?: boolean;
};

export default function ScoreDisplay({ 
  score, 
  mode, 
  extraInfo, 
  className = "",
  compact = false
}: ScoreDisplayProps) {
  // Define mode-specific icons and colors
  const modeConfig = {
    classic: { icon: <Trophy className="w-5 h-5 text-yellow-500" />, color: "text-yellow-500" },
    speed: { icon: <Clock className="w-5 h-5 text-purple-500" />, color: "text-purple-500" },
    time: { icon: <Clock className="w-5 h-5 text-blue-500" />, color: "text-blue-500" },
    live: { icon: <Heart className="w-5 h-5 text-red-500" />, color: "text-red-500" },
    test: { icon: <Battery className="w-5 h-5 text-green-500" />, color: "text-green-500" }
  };

  // Kalan doğru cevap sayısını hesapla
  const remainingQuestions = 
    extraInfo?.totalQuestions && extraInfo?.correctAnswers !== undefined
      ? extraInfo.totalQuestions - extraInfo.correctAnswers
      : undefined;

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-2 p-2 rounded-lg bg-black/20 ${className}`}>
        <div className="flex items-center gap-2">
          {modeConfig[mode].icon}
          <span className={`text-sm font-medium ${modeConfig[mode].color}`}>
            {mode === "classic" && "Klasik"}
            {mode === "speed" && "Hızlı"}
            {mode === "time" && "Zamanlı"}
            {mode === "live" && "Canlı"}
            {mode === "test" && "Test"}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {extraInfo?.revealPercent !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4 text-green-400" />
              <span className="text-sm">{Math.round(extraInfo.revealPercent)}%</span>
            </div>
          )}
          
          {extraInfo?.timeElapsed !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-mono">{formatTime(extraInfo.timeElapsed)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 font-bold">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>{score}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-black/20 rounded-xl p-4 flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-3">
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
        
        <div className="text-xl font-bold flex items-center">
          <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
          {score} Puan
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
        {extraInfo?.attempts !== undefined && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">Tahmin</div>
            <div className="font-semibold flex items-center justify-center">
              <Hash className="w-4 h-4 mr-1 text-blue-400" />
              {extraInfo.attempts}
            </div>
          </div>
        )}
        
        {extraInfo?.wrongAttempts !== undefined && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">Yanlış</div>
            <div className="font-semibold flex items-center justify-center">
              <Zap className="w-4 h-4 mr-1 text-amber-400" />
              {extraInfo.wrongAttempts}
            </div>
          </div>
        )}
        
        {extraInfo?.timeElapsed !== undefined && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">Geçen Süre</div>
            <div className="font-semibold flex items-center justify-center">
              <Clock className="w-4 h-4 mr-1 text-blue-400" />
              {formatTime(extraInfo.timeElapsed)}
            </div>
          </div>
        )}
        
        {extraInfo?.timeLeft !== undefined && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">Kalan Süre</div>
            <div className="font-semibold flex items-center justify-center">
              <Clock className="w-4 h-4 mr-1 text-yellow-500" />
              {formatTime(extraInfo.timeLeft)}
            </div>
          </div>
        )}
        
        {extraInfo?.lives !== undefined && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">Can</div>
            <div className="font-semibold flex items-center justify-center">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              {extraInfo.lives}
            </div>
          </div>
        )}
        
        {extraInfo?.revealPercent !== undefined && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">Görünür</div>
            <div className="flex flex-col">
              <Progress 
                value={extraInfo.revealPercent} 
                max={100} 
                className="h-2 w-full mb-1"
              />
              <span className="text-sm">
                {Math.round(extraInfo.revealPercent)}%
              </span>
            </div>
          </div>
        )}
        
        {remainingQuestions !== undefined && extraInfo && (
          <div className="bg-black/30 rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">İlerleme</div>
            <div className="flex items-center justify-center">
              <Badge variant="success" className="mr-1">
                {extraInfo.correctAnswers ?? 0}
              </Badge>
              <ArrowRight className="w-3 h-3 mx-1" />
              <Badge variant="outline">
                {extraInfo.totalQuestions ?? 0}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
