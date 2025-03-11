import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image } from "@shared/schema";

import ImageReveal from "@/components/game/ImageReveal";
import GameControls from "@/components/game/GameControls";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import CategorySelector from "@/components/game/CategorySelector";
import GameTimer from "@/components/game/GameTimer";
import { calculateScore } from "@/lib/gameHelpers";

export default function TimeGame() {
  const { toast } = useToast();
  const [_location, navigate] = useLocation();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [currentImageId, setCurrentImageId] = useState<number | undefined>(undefined);
  const [revealPercent, setRevealPercent] = useState(20);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Fetch the current image
  const { data: currentImage, isLoading: isImageLoading } = useQuery<Image>({
    queryKey: currentImageId ? [`/api/images/${currentImageId}`] : null,
    enabled: !!currentImageId,
  });

  // Fetch a random image when needed
  const { refetch: refetchRandomImage } = useQuery<Image>({
    queryKey: ['/api/game/random-image', selectedCategoryId],
    queryFn: () => {
      const url = selectedCategoryId
        ? `/api/game/random-image?categoryId=${selectedCategoryId}`
        : '/api/game/random-image';
      return fetch(url).then(res => res.json());
    },
    enabled: false,
  });

  // Check answer mutation
  const checkAnswerMutation = useMutation({
    mutationFn: async (guess: string) => {
      const response = await fetch('/api/game/check-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: currentImageId, answer: guess }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isCorrect) {
        // Calculate score based on reveal percentage and time remaining
        const timeBonus = timeRemaining * 10; // 10 points per second left
        const roundScore = calculateScore(revealPercent) + timeBonus;
        setScore(prev => prev + roundScore);
        setGameWon(true);
        setGameActive(false);
        
        toast({
          title: "Doğru Tahmin!",
          description: `Tebrikler! ${roundScore} puan kazandınız.`,
          variant: "success",
        });
        
        // Save game score in the background
        saveGameScore({
          userId: undefined, // Guest user
          imageId: currentImageId!,
          gameMode: "time",
          attemptsCount: attempts + 1,
          timeSpent: 60 - timeRemaining, // How much time was used
          score: roundScore,
          completed: true
        });
      } else {
        // Wrong guess decreases reveal percentage
        increaseRevealPercent();
        setAttempts(prev => prev + 1);
        
        toast({
          title: "Yanlış Tahmin",
          description: "Tekrar deneyin, ama acele edin!",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Tahmin kontrol edilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Save game score mutation
  const saveGameScoreMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      const response = await fetch('/api/game/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images/popular'] });
      queryClient.invalidateQueries({ queryKey: ['/api/images/favorites'] });
    },
  });

  // Function to save game score
  const saveGameScore = (scoreData: any) => {
    saveGameScoreMutation.mutate(scoreData);
  };

  // Load a random image when component mounts or category changes
  useEffect(() => {
    if (!currentImageId) {
      loadRandomImage();
    }
  }, [selectedCategoryId]);

  // Function to increase reveal percentage
  const increaseRevealPercent = () => {
    setRevealPercent(prev => {
      const newPercent = Math.min(prev + 10, 100);
      return newPercent;
    });
  };

  // Function to start the game
  const startGame = () => {
    setGameActive(true);
    setTimeRemaining(60);
    setAttempts(0);
  };

  // Function to handle time expiration
  const handleTimeExpired = () => {
    setGameOver(true);
    setGameActive(false);
    
    // Save game score with 0 points for timeout
    if (currentImageId) {
      saveGameScore({
        userId: undefined, // Guest user
        imageId: currentImageId,
        gameMode: "time",
        attemptsCount: attempts,
        timeSpent: 60, // Full time spent
        score: 0,
        completed: false
      });
    }
    
    toast({
      title: "Zaman Doldu!",
      description: "Bu görsel için süreniz doldu.",
      variant: "destructive",
    });
  };

  // Function to load a random image
  const loadRandomImage = async () => {
    try {
      const result = await refetchRandomImage();
      if (result.data) {
        setCurrentImageId(result.data.id);
        setRevealPercent(20);
        setGameOver(false);
        setGameWon(false);
        setGameActive(false);
        setTimeRemaining(60);
        setAttempts(0);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yeni görsel yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Handle guess submission
  const handleGuess = (guess: string) => {
    if (gameOver || gameWon || !gameActive) return;
    checkAnswerMutation.mutate(guess);
  };

  // Handle skipping current image
  const handleSkip = () => {
    // Save a score of 0 if skipping
    if (currentImageId && gameActive) {
      saveGameScore({
        userId: undefined, // Guest user
        imageId: currentImageId,
        gameMode: "time",
        attemptsCount: attempts,
        timeSpent: 60 - timeRemaining,
        score: 0,
        completed: false
      });
    }
    
    loadRandomImage();
  };

  // Handle category change
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    loadRandomImage();
  };

  // Handle next game action
  const handleNextGame = () => {
    loadRandomImage();
  };

  // Handle go to home action
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Zamana Karşı Oyun Modu</h1>
        <p className="text-zinc-400">
          Bu modda, görsel tahminini belirli bir süre içinde yapmalısınız. Yanlış tahminlerle daha fazla ipucu açılır, ama puanınız düşer.
        </p>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Resmi Tahmin Et</CardTitle>
                <CategorySelector
                  onCategoryChange={handleCategoryChange}
                  selectedCategoryId={selectedCategoryId}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isImageLoading ? (
                <div className="animate-pulse bg-zinc-800 h-96 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-500">Görsel yükleniyor...</p>
                </div>
              ) : currentImage ? (
                <div className="space-y-6">
                  <div className="relative">
                    <ImageReveal
                      imageUrl={currentImage.imageUrl}
                      revealPercent={revealPercent}
                      className="w-full h-96"
                    />
                    
                    {!gameActive && !gameOver && !gameWon && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg flex flex-col items-center justify-center">
                        <h3 className="text-2xl font-bold mb-6">Zamana Karşı Moda Hazır mısın?</h3>
                        <p className="mb-4 text-center max-w-md">
                          60 saniye içinde resmi tahmin etmelisin. Yanlış tahminlerle daha fazla ipucu görürsün, ama puanın azalır!
                        </p>
                        <Button size="lg" onClick={startGame}>Oyunu Başlat</Button>
                      </div>
                    )}
                  </div>
                  
                  {gameActive && (
                    <GameTimer
                      initialTime={60}
                      isRunning={gameActive}
                      onTimeExpired={handleTimeExpired}
                      className="mb-4"
                    />
                  )}
                  
                  {gameOver || gameWon ? (
                    <div className="bg-zinc-800 p-4 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">
                        {gameWon ? "Tebrikler! 🎉" : "Zaman Doldu!"}
                      </h3>
                      <p className="mb-4">
                        {gameWon
                          ? `Doğru tahmin! ${score} puan kazandınız.`
                          : `Süre doldu. Doğru cevap: ${(currentImage.answers as string[])[0]}`}
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={handleNextGame}>Sonraki Resim</Button>
                        <Button variant="outline" onClick={handleGoHome}>Ana Sayfaya Dön</Button>
                      </div>
                    </div>
                  ) : (
                    <GameControls
                      onGuess={handleGuess}
                      onSkip={handleSkip}
                      isDisabled={!gameActive || checkAnswerMutation.isPending}
                      placeholder={gameActive ? "Tahmininizi yazın..." : "Oyunu başlatın..."}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-zinc-800 h-96 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-500">Görsel bulunamadı.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-12 md:col-span-4">
          <ScoreDisplay
            score={score}
            mode="time"
            extraInfo={{ 
              attempts: attempts,
              timeLeft: gameActive ? timeRemaining : undefined
            }}
          />
          
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Nasıl Oynanır?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Oyun başladığında 60 saniyen olur.</p>
              <p>2. Her yanlış tahminde, daha fazla ipucu görürsün ama alacağın puan azalır.</p>
              <p>3. Süre dolmadan doğru tahmini yaparsan kalan süre kadar bonus puan kazanırsın.</p>
              <p>4. Süre dolarsa, o resim için puan alamazsın.</p>
              <p className="font-semibold mt-4">İpucu: Aceleden kaynaklı yanlış tahmin yapmaktan kaçının!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
