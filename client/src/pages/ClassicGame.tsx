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
import { calculateScore } from "@/lib/gameHelpers";

export default function ClassicGame() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Extract imageId from URL if it exists
  const params = new URLSearchParams(location.split('?')[1] || '');
  const urlImageId = params.get('imageId');
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [currentImageId, setCurrentImageId] = useState<number | undefined>(urlImageId ? parseInt(urlImageId) : undefined);
  const [revealPercent, setRevealPercent] = useState(10);
  const [attempts, setAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

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
        // Calculate score based on reveal percentage
        const roundScore = calculateScore(revealPercent);
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
          gameMode: "classic",
          attemptsCount: attempts + 1,
          timeSpent: 0, // Not tracked in classic mode
          score: roundScore,
          completed: true
        });
      } else {
        // Increase reveal percentage on wrong guess
        increaseRevealPercent();
        setAttempts(prev => prev + 1);
        
        toast({
          title: "Yanlış Tahmin",
          description: "Tekrar deneyin.",
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
      if (newPercent >= 100) {
        setGameOver(true);
      }
      return newPercent;
    });
  };

  // Function to load a random image
  const loadRandomImage = async () => {
    try {
      const result = await refetchRandomImage();
      if (result.data) {
        setCurrentImageId(result.data.id);
        setRevealPercent(10);
        setAttempts(0);
        setGameOver(false);
        setGameWon(false);
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
    if (gameWon) return;
    
    // Save a score of 0 if skipping
    if (currentImageId) {
      saveGameScore({
        userId: undefined, // Guest user
        imageId: currentImageId,
        gameMode: "classic",
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
        <h1 className="text-2xl font-bold mb-4">Klasik Oyun Modu</h1>
        <p className="text-zinc-400">
          Standart tahmin modunda, resim adım adım açılır. Ne kadar az açılmış resimle doğru tahmini yaparsanız, o kadar çok puan kazanırsınız.
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
                  <ImageReveal
                    imageUrl={currentImage.imageUrl}
                    revealPercent={revealPercent}
                    className="w-full h-96"
                  />
                  
                  {gameOver || gameWon ? (
                    <div className="bg-zinc-800 p-4 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">
                        {gameWon ? "Tebrikler! 🎉" : "Oyun Bitti"}
                      </h3>
                      <p className="mb-4">
                        {gameWon
                          ? `Doğru tahmin! ${score} puan kazandınız.`
                          : `Resim tamamen açıldı. Doğru cevap: ${(currentImage.answers as string[])[0]}`}
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
            mode="classic"
            extraInfo={{ attempts }}
          />
          
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Nasıl Oynanır?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Size gösterilen resmi tahmin etmeye çalışın.</p>
              <p>2. Her yanlış tahminde, resim daha fazla açılır.</p>
              <p>3. Resim ne kadar az açıkken doğru tahmini yaparsanız o kadar çok puan alırsınız.</p>
              <p>4. Resim tamamen açılırsa, o resim için puan alamazsınız.</p>
              <p className="font-semibold mt-4">İpucu: Detaylara dikkat edin!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
