import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Image } from "@shared/schema";

import ImageReveal from "@/components/game/ImageReveal";
import GameControls from "@/components/game/GameControls";
import ScoreDisplay from "@/components/game/ScoreDisplay";
import CategorySelector from "@/components/game/CategorySelector";
import { calculateScore } from "@/lib/gameHelpers";

const MAX_LIVES = 3;

export default function LiveGame() {
  const { toast } = useToast();
  const [_location, navigate] = useLocation();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [currentImageId, setCurrentImageId] = useState<number | undefined>(undefined);
  const [revealPercent, setRevealPercent] = useState(20);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
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
        // Calculate score based on reveal percentage and remaining lives
        const livesBonus = lives * 50; // 50 points per life remaining
        const roundScore = calculateScore(revealPercent) + livesBonus;
        setScore(prev => prev + roundScore);
        setGameWon(true);
        
        toast({
          title: "Doğru Tahmin!",
          description: `Tebrikler! ${roundScore} puan kazandınız.`,
          variant: "success",
        });
        
        // Save game score in the background
        saveGameScore({
          userId: undefined, // Guest user
          imageId: currentImageId!,
          gameMode: "live",
          attemptsCount: attempts + 1,
          timeSpent: 0, // Not tracking time in this mode
          score: roundScore,
          completed: true
        });
      } else {
        // Wrong guess costs a life
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            
            // Save 0 score for failure
            saveGameScore({
              userId: undefined, // Guest user
              imageId: currentImageId!,
              gameMode: "live",
              attemptsCount: attempts + 1,
              timeSpent: 0,
              score: 0,
              completed: false
            });
          }
          return newLives;
        });
        
        // Increase reveal percentage
        increaseRevealPercent();
        setAttempts(prev => prev + 1);
        
        toast({
          title: "Yanlış Tahmin",
          description: `Bir can kaybettiniz! Kalan: ${lives - 1}`,
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
      const newPercent = Math.min(prev + 15, 100);
      return newPercent;
    });
  };

  // Function to load a random image
  const loadRandomImage = async () => {
    try {
      const result = await refetchRandomImage();
      if (result.data) {
        setCurrentImageId(result.data.id);
        setRevealPercent(20);
        setLives(MAX_LIVES);
        setGameOver(false);
        setGameWon(false);
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
    if (gameOver || gameWon) return;
    checkAnswerMutation.mutate(guess);
  };

  // Handle skipping current image
  const handleSkip = () => {
    // Save a score of 0 if skipping
    if (currentImageId) {
      saveGameScore({
        userId: undefined, // Guest user
        imageId: currentImageId,
        gameMode: "live",
        attemptsCount: attempts,
        timeSpent: 0,
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
        <h1 className="text-2xl font-bold mb-4">Canlı Oyun Modu</h1>
        <p className="text-zinc-400">
          Bu modda, her resim için sınırlı sayıda can hakkınız var. Yanlış tahmin yaptıkça canlarınızı kaybedersiniz.
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
                    
                    <div className="absolute top-4 right-4 bg-black bg-opacity-70 px-3 py-2 rounded-full flex items-center">
                      <Heart className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-white font-bold">
                        {Array(lives).fill("❤️").join(" ")}
                        {Array(MAX_LIVES - lives).fill("🖤").join(" ")}
                      </span>
                    </div>
                  </div>
                  
                  {gameOver || gameWon ? (
                    <div className="bg-zinc-800 p-4 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">
                        {gameWon ? "Tebrikler! 🎉" : "Canlarınız Bitti!"}
                      </h3>
                      <p className="mb-4">
                        {gameWon
                          ? `Doğru tahmin! ${score} puan kazandınız.`
                          : `Canlarınız tükendi. Doğru cevap: ${(currentImage.answers as string[])[0]}`}
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
                      isDisabled={checkAnswerMutation.isPending}
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
            mode="live"
            extraInfo={{ 
              attempts: attempts,
              lives: lives
            }}
          />
          
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Nasıl Oynanır?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Her resim için {MAX_LIVES} canınız var.</p>
              <p>2. Her yanlış tahminde, bir can kaybedersiniz ve resim biraz daha açılır.</p>
              <p>3. Tüm canlarınızı kaybederseniz, o resim için puan alamazsınız.</p>
              <p>4. Kalan canlarınız kadar bonus puan kazanırsınız.</p>
              <p className="font-semibold mt-4">İpucu: Tahminlerinizi dikkatli yapın, canlarınız değerli!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
