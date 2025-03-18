import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, SkipForward, PlusSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type GameControlsProps = {
  onGuess: (guess: string) => void;
  onSkip: () => void;
  onRevealPiece?: () => void;
  isDisabled?: boolean;
  enableSkip?: boolean;
  enableReveal?: boolean;
  placeholder?: string;
  guessHistory?: Array<{
    guess: string;
    isCorrect: boolean;
    isClose?: boolean;
  }>;
};

export default function GameControls({
  onGuess,
  onSkip,
  onRevealPiece,
  isDisabled = false,
  enableSkip = true,
  enableReveal = true,
  placeholder = "Tahmininizi yazın...",
  guessHistory = []
}: GameControlsProps) {
  const { toast } = useToast();
  const [guessInput, setGuessInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Otomatik odaklanma
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guessInput.trim()) {
      toast({
        title: "Tahmin gerekli",
        description: "Lütfen bir tahmin girin.",
        variant: "destructive",
      });
      return;
    }
    
    onGuess(guessInput.trim());
    setGuessInput("");
    
    // Yeniden odaklan
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder={placeholder}
            className="flex-grow"
            disabled={isDisabled}
            autoFocus
          />
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90" 
            disabled={isDisabled}
          >
            <Send className="w-4 h-4 mr-2" /> Tahmin Et
          </Button>
        </div>
        
        <div className="flex justify-between mt-2">
          {enableSkip && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSkip} 
              className="text-xs" 
              disabled={isDisabled}
              size="sm"
            >
              <SkipForward className="w-3 h-3 mr-1" /> Görseli Atla
            </Button>
          )}
          
          {enableReveal && onRevealPiece && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onRevealPiece} 
              className="text-xs" 
              disabled={isDisabled}
              size="sm"
            >
              <PlusSquare className="w-3 h-3 mr-1" /> Parça Aç
            </Button>
          )}
        </div>
      </form>
      
      {guessHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Tahmin Geçmişi</h4>
          <ScrollArea className="h-32 rounded-md border">
            <div className="p-4 space-y-2">
              {guessHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{item.guess}</span>
                  <Badge 
                    variant={
                      item.isCorrect ? "success" : 
                      item.isClose ? "default" : 
                      "destructive"
                    }
                    className={item.isClose ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                  >
                    {item.isCorrect ? "Doğru" : 
                     item.isClose ? "Yakın" : 
                     "Yanlış"}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
