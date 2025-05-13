import React, { useState, useEffect, useRef } from "react";
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
import { calculateScore, playSoundEffect } from "@/lib/gameHelpers";
import { Zap } from "lucide-react";
import { getRandomImage, checkAnswer, saveGameScore } from "@/lib/firebaseHelpers";

export default function SpeedGame() {
  const { toast } = useToast();
  const [_location, navigate] = useLocation();
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [currentImageId, setCurrentImageId] = useState<string | undefined>(undefined);
  const [revealPercent, setRevealPercent] = useState(10);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [guessHistory, setGuessHistory] = useState<Array<{
    guess: string;
    isCorrect: boolean;
    isClose?: boolean;
  }>>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const revealTimerRef = useRef<NodeJS.Timeout | null>(null);
  const imageRevealRef = useRef<any>(null);

  // Fetch the current image
  const { data: currentImage, isLoading: isImageLoading } = useQuery<Image>({
    queryKey: currentImageId ? [`image-${currentImageId}`] : null,
    queryFn: async () => {
      if (!currentImageId) return null;
      return getRandomImage(selectedCategoryId);
    },
    enabled: !!currentImageId,
  });

  // Fetch a random image when needed
  const { refetch: refetchRandomImage } = useQuery<Image>({
    queryKey: ['random-image', selectedCategoryId],
    queryFn: () => getRandomImage(selectedCategoryId),
    enabled: false,
  });

  // Function to clear all timers
  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  // Function to start the game timers
  const startGame = () => {
    setGameActive(true);
    setTimeElapsed(0);
    setGuessHistory([]);
    
    // Timer for counting elapsed time
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    // Timer for revealing image progressively
    revealTimerRef.current = setInterval(() => {
      setRevealPercent(prev => {
        const newPercent = Math.min(prev + 3, 100);
        if (newPercent >= 100) {
          clearTimers();
          setGameOver(true);
          
          // Play sound effect for game over
          playSoundEffect('incorrect', 0.5);
          
          // Save a score of 0 for timeout
          if (currentImageId) {
            saveGameScore({
              userId: undefined,
              imageId: currentImageId,
              gameMode: "speed",
              attemptsCount: guessHistory.length,
              timeSpent: timeElapsed,
              score: 0,
              completed: false
            });
          }
          
          toast({
            title: "Zaman Doldu!",
            description: "Resim tamamen açıldı. Bir sonraki resme geçebilirsiniz.",
            variant: "destructive",
          });
        }
        return newPercent;
      });
    }, 1000);
  };

  // Load a random image when component mounts or category changes
  useEffect(() => {
    loadRandomImage();
    
    return () => {
      clearTimers();
    };
  }, [selectedCategoryId]);

  // Function to load a random image
  const loadRandomImage = async () => {
    try {
      clearTimers();
      
      const result = await refetchRandomImage();
      if (result.data) {
        setCurrentImageId(result.data.id);
        setRevealPercent(10);
        setGameOver(false);
        setGameWon(false);
        setGameActive(false);
        setTimeElapsed(0);
        setGuessHistory([]);
      }
    } catch (error) {
      console.error("Error loading random image:", error);
      toast({
        title: "Hata",
        description: "Yeni görsel yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Handle guess submission
  const handleGuess = async (guess: string) => {
    if (gameOver || gameWon || !gameActive || !currentImage) return;
    
    // Add to guess history
    const result = await checkAnswer(currentImage.id, guess);
    const isCorrect = result.isCorrect;
    const isClose = result.isClose;
    
    setGuessHistory(prev => [
      { 
        guess, 
        isCorrect, 
        isClose: !isCorrect && isClose
      },
      ...prev
    ]);
    
    if (isCorrect) {
      // Stop timers
      clearTimers();
      
      // Play sound for correct answer
      playSoundEffect('correct', 0.5);
      
      // Show correct guess effect
      if (imageRevealRef.current) {
        imageRevealRef.current.showCorrectGuessEffect();
      }
      
      // Calculate score based on reveal percentage and time
      const roundScore = calculateScore(revealPercent, timeElapsed);
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
        gameMode: "speed",
        attemptsCount: guessHistory.length + 1,
        timeSpent: timeElapsed,
        score: roundScore,
        completed: true
      });
    } else {
      // Play sound for incorrect answer
      if (isClose) {
        playSoundEffect('close', 0.5);
      } else {
        playSoundEffect('incorrect', 0.5);
      }
      
      toast({
        title: isClose ? "Yaklaştınız!" : "Yanlış Tahmin",
        description: isClose ? "Çok yaklaştınız, tekrar deneyin!" : "Tekrar deneyin.",
        variant: isClose ? "default" : "destructive",
      });
    }
  };

  // Handle skipping current image
  const handleSkip = () => {
    // Save a score of 0 if skipping
    if (currentImageId && gameActive) {
      saveGameScore({
        userId: undefined, // Guest user
        imageId: currentImageId,
        gameMode: "speed",
        attemptsCount: guessHistory.length,
        timeSpent: timeElapsed,
        score: 0,
        completed: false
      });
    }
    
    loadRandomImage();
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
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

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Hızlı Oyun Modu</h1>
        <p className="text-zinc-400">
          Hızlı modda, resim otomatik olarak açılmaya devam eder. Ne kadar hızlı tahminde bulunursanız, o kadar çok puan kazanırsınız.
        </p>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-500" />
                  Resmi Tahmin Et
                </CardTitle>
                <CategorySelector
                  onCategoryChange={handleCategoryChange}
                  selectedCategoryId={selectedCategoryId}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isImageLoading ? (
                <div className="animate-pulse bg-zinc-800 h-80 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-500">Görsel yükleniyor...</p>
                </div>
              ) : currentImage ? (
                <div className="space-y-6">
                  <div className="relative">
                    <ImageReveal
                      ref={imageRevealRef}
                      imageUrl={currentImage.imageUrl}
                      revealPercent={revealPercent}
                      className="w-full h-80 object-contain"
                      gridSize={5}
                    />
                    
                    {!gameActive && !gameOver && !gameWon && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg flex flex-col items-center justify-center">
                        <h3 className="text-2xl font-bold mb-6">Hızlı Moda Hazır mısın?</h3>
                        <p className="mb-4 text-center max-w-md">
                          Resim otomatik olarak açılacak. Doğru tahmini ne kadar erken yaparsanız, o kadar çok puan kazanırsınız!
                        </p>
                        <Button size="lg" onClick={startGame}>Oyunu Başlat</Button>
                      </div>
                    )}
                  </div>
                  
                  {gameActive && (
                    <div className="bg-zinc-800 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <span className="text-sm text-zinc-400">Geçen Süre:</span>
                        <span className="ml-2 font-mono">{formatTime(timeElapsed)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-zinc-400">Açılan Alan:</span>
                        <span className="ml-2 font-mono">{revealPercent}%</span>
                      </div>
                    </div>
                  )}
                  
                  {gameOver || gameWon ? (
                    <div className="bg-zinc-800 p-4 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">
                        {gameWon ? "Tebrikler! 🎉" : "Zaman Doldu!"}
                      </h3>
                      <p className="mb-4">
                        {gameWon
                          ? `Doğru tahmin! ${score} puan kazandınız. Süre: ${formatTime(timeElapsed)}`
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
                      isDisabled={!gameActive}
                      placeholder={gameActive ? "Tahmininizi yazın..." : "Oyunu başlatın..."}
                      guessHistory={guessHistory}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-zinc-800 h-80 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-500">Görsel bulunamadı.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-12 md:col-span-4">
          <ScoreDisplay
            score={score}
            mode="speed"
            extraInfo={{ 
              timeElapsed: gameActive ? timeElapsed : undefined,
              revealPercent: revealPercent
            }}
          />
          
          <Card className="bg-zinc-900 border-zinc-800 mt-4">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-500" />
                Nasıl Oynanır?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Oyun başladığında resim otomatik olarak açılır.</p>
              <p>2. Daha az açıkken doğru tahmini yaparsanız daha çok puan alırsınız.</p>
              <p>3. Resim tamamen açılırsa, o resim için puan alamazsınız.</p>
              <p>4. Aynı zamanda, ne kadar hızlı doğru tahmin ederseniz o kadar fazla puan kazanırsınız.</p>
              <p className="font-semibold mt-4">İpucu: Hızlı düşünün ve riskleri hesaplayın!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}