import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, SkipForward } from "lucide-react";

type GameControlsProps = {
  onGuess: (guess: string) => void;
  onSkip: () => void;
  isDisabled?: boolean;
  enableSkip?: boolean;
  placeholder?: string;
};

export default function GameControls({
  onGuess,
  onSkip,
  isDisabled = false,
  enableSkip = true,
  placeholder = "Tahmininizi yazın..."
}: GameControlsProps) {
  const { toast } = useToast();
  const [guessInput, setGuessInput] = useState("");

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
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={guessInput}
          onChange={(e) => setGuessInput(e.target.value)}
          placeholder={placeholder}
          className="bg-zinc-800 border-zinc-700 focus:border-yellow-500"
          disabled={isDisabled}
        />
        <Button 
          type="submit" 
          className="bg-green-600 hover:bg-green-700" 
          disabled={isDisabled}
        >
          <Send className="w-4 h-4 mr-2" /> Tahmin Et
        </Button>
        
        {enableSkip && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSkip} 
            className="border-zinc-700 hover:bg-zinc-800" 
            disabled={isDisabled}
          >
            <SkipForward className="w-4 h-4 mr-2" /> Atla
          </Button>
        )}
      </div>
    </form>
  );
}
