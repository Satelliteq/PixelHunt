import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, User, Heart, Share2, Trophy, Award, Clock, ThumbsUp } from 'lucide-react';
import type { Image, Test } from '../../shared/schema';
import { toast } from '@/hooks/use-toast';
import { formatTime, checkAnswer, calculateScore, playSoundEffect, calculateNewRevealPercent } from '@/lib/gameHelpers';
import GameControls from '@/components/game/GameControls';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import ImageReveal from '@/components/game/ImageReveal';
import ContentCard from '@/components/game/ContentCard';

export default function GameScreen() {
  const [, setLocation] = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [revealPercent, setRevealPercent] = useState(20); // Start with 20% revealed
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [guessHistory, setGuessHistory] = useState<Array<{
    guess: string;
    isCorrect: boolean;
    isClose?: boolean;
  }>>([]);
  
  // Reference to the correct answers for current image
  const correctAnswersRef = useRef<string[]>([]);

  // Fetch test data
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  // Fetch current image data
  const { data: currentImage, isLoading: isImageLoading } = useQuery({
    queryKey: [`/api/images/${test?.imageIds?.[currentImageIndex]}`],
    enabled: !!test && Array.isArray(test.imageIds) && test.imageIds.length > 0 && currentImageIndex < test.imageIds.length,
  });

  // Update correct answers when image changes
  useEffect(() => {
    if (currentImage?.correctAnswers) {
      correctAnswersRef.current = Array.isArray(currentImage.correctAnswers) 
        ? currentImage.correctAnswers 
        : [currentImage.correctAnswers];
    }
  }, [currentImage]);

  // Timer effect
  useEffect(() => {
    if (gameStatus === 'playing') {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStatus]);

  // Automatically increase reveal percentage over time for a more dynamic experience
  useEffect(() => {
    if (gameStatus === 'playing' && revealPercent < 100) {
      const revealTimer = setInterval(() => {
        setRevealPercent(prev => Math.min(prev + 5, 100));
      }, 10000); // Increase by 5% every 10 seconds
      return () => clearInterval(revealTimer);
    }
  }, [gameStatus, revealPercent]);

  // Handle guess submission
  const handleGuess = (guess: string) => {
    if (!guess.trim() || !currentImage) return;
    
    // Check if answer is correct using our utility
    const answerResult = checkAnswer(guess, correctAnswersRef.current);
    const isCorrect = answerResult.isCorrect;
    const isClose = answerResult.isClose;
    
    // Add to guess history
    setGuessHistory(prev => [
      ...prev, 
      { 
        guess, 
        isCorrect, 
        isClose: !isCorrect && isClose
      }
    ]);
    
    if (isCorrect) {
      // Play sound for correct answer
      playSoundEffect('correct', 0.5);
      
      // Calculate score
      const earnedScore = calculateScore(revealPercent, timeElapsed, false);
      
      // Update score
      setScore(prev => prev + earnedScore);
      
      // Show toast
      toast({
        title: "Doğru Cevap!",
        description: `+${earnedScore} puan kazandınız.`,
        variant: "default"
      });
      
      // Move to next image or finish game
      if (test && Array.isArray(test.imageIds) && currentImageIndex < test.imageIds.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
        setWrongAttempts(0);
        setUserAnswer('');
        setGuessHistory([]);
        setRevealPercent(20); // Reset reveal percentage
      } else {
        // End of game
        setGameStatus('finished');
        playSoundEffect('complete', 0.7);
        
        // Save score to backend
        apiRequest({
          url: '/api/game/scores',
          method: 'POST',
          body: JSON.stringify({
            testId: Number(testId),
            score,
            completionTime: timeElapsed,
            completed: true
          })
        }).catch(err => {
          console.error("Error saving score:", err);
        });
      }
    } else {
      // Wrong answer handling
      if (isClose) {
        playSoundEffect('close', 0.5);
        toast({
          title: "Çok Yaklaştın!",
          description: "Cevabın çok yakın, tekrar dene.",
          variant: "default"
        });
      } else {
        playSoundEffect('incorrect', 0.5);
        toast({
          title: "Yanlış Cevap",
          description: "Tekrar deneyin veya biraz daha bekleyin.",
          variant: "default"
        });
      }
      
      // Increment wrong attempts counter
      setWrongAttempts(prev => prev + 1);
      
      // Increase reveal percentage based on wrong attempts
      setRevealPercent(prev => 
        calculateNewRevealPercent(prev, wrongAttempts, 90)
      );
    }
  };

  // Handle skip button
  const handleSkip = () => {
    if (test && Array.isArray(test.imageIds) && currentImageIndex < test.imageIds.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setUserAnswer('');
      setWrongAttempts(0);
      setGuessHistory([]);
      setRevealPercent(20);
    } else {
      setGameStatus('finished');
    }
  };

  // Handle manually revealing more of the image
  const handleRevealMore = () => {
    const newRevealPercent = Math.min(revealPercent + 10, 90);
    setRevealPercent(newRevealPercent);
    
    // Play reveal sound
    playSoundEffect('reveal', 0.3);
    
    toast({
      title: "Görsel Açıldı",
      description: `Görsel %${newRevealPercent} oranında görünür.`,
      variant: "default"
    });
  };

  // Loading state
  if (isTestLoading || isImageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-2xl w-full">
          <div className="animate-pulse bg-zinc-800/50 h-8 w-64 mx-auto rounded mb-8"></div>
          <div className="animate-pulse bg-zinc-800/40 h-72 w-full max-w-xl mx-auto rounded mb-6"></div>
          <div className="animate-pulse bg-zinc-800/50 h-10 w-full max-w-md mx-auto rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (!test || (!currentImage && gameStatus === 'playing')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Test bulunamadı</h2>
          <p className="text-muted-foreground mb-6">İstediğiniz test mevcut değil veya yüklenirken bir sorun oluştu.</p>
          <Button onClick={() => window.history.back()}>Geri Dön</Button>
        </div>
      </div>
    );
  }

  // Game content
  return (
    <div className="bg-gradient-to-b from-black/30 to-transparent min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
      
        {/* Game Header with Stats */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between mb-6 shadow-lg">
          <div>
            <h1 className="font-bold text-xl">{test.title}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {test.creatorId ? "Kullanıcı" : "Anonim"}</span>
              <span>•</span>
              <span className="flex items-center"><Heart className="w-3 h-3 mr-1" /> {test.likeCount || 0}</span>
            </p>
          </div>
          
          {/* Score Display */}
          <ScoreDisplay 
            score={score}
            mode="classic"
            extraInfo={{
              timeElapsed,
              revealPercent,
              wrongAttempts,
              totalQuestions: test.imageIds?.length || 0,
              correctAnswers: currentImageIndex
            }}
            compact={true}
            className="mt-3 sm:mt-0"
          />
        </div>
        
        {gameStatus === 'playing' && currentImage ? (
          <>
            {/* Current Progress */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium bg-black/30 rounded-full px-3 py-1">
                Görsel {currentImageIndex + 1}/{test.imageIds?.length || 0}
              </p>
            </div>
            
            {/* Game Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Reveal */}
              <div className="md:col-span-2">
                <ImageReveal 
                  imageUrl={currentImage.imageUrl}
                  revealPercent={revealPercent}
                  gridSize={4}
                  className="aspect-video rounded-xl shadow-xl overflow-hidden"
                />
              </div>
              
              {/* Game Controls */}
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 flex flex-col">
                <ScoreDisplay 
                  score={score}
                  mode="classic"
                  extraInfo={{
                    attempts: guessHistory.length,
                    timeElapsed,
                    revealPercent,
                    wrongAttempts
                  }}
                  className="mb-4"
                />
                
                <GameControls 
                  onGuess={handleGuess}
                  onSkip={handleSkip}
                  onRevealPiece={handleRevealMore}
                  placeholder="Bu nedir? Tahmin et..."
                  guessHistory={guessHistory}
                />
              </div>
            </div>
          </>
        ) : (
          // Game Finished Screen
          <div className="py-8 px-4 rounded-xl bg-black/30 backdrop-blur-sm">
            <div className="max-w-lg mx-auto text-center">
              <Trophy className="h-20 w-20 mx-auto text-yellow-500 mb-6" />
              <h1 className="text-3xl font-bold mb-2">Tebrikler!</h1>
              <p className="text-xl mb-8">
                {test.title} testini {formatTime(timeElapsed)} sürede tamamladınız.
              </p>
              
              <ScoreDisplay 
                score={score}
                mode="classic"
                extraInfo={{
                  timeElapsed,
                  totalQuestions: test.imageIds?.length || 0,
                  correctAnswers: test.imageIds?.length || 0
                }}
                className="mb-8"
              />
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => window.location.reload()} size="lg">
                  <Trophy className="w-4 h-4 mr-2" /> Yeniden Oyna
                </Button>
                <Button variant="outline" onClick={() => setLocation('/tests')} size="lg">
                  Diğer Testlere Dön
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={async () => {
                    try {
                      await apiRequest({
                        url: `/api/tests/${testId}/like`,
                        method: 'POST'
                      });
                      toast({
                        title: "Beğeni eklendi",
                        description: "Bu testi beğendiniz!",
                        variant: "default"
                      });
                    } catch (error) {
                      toast({
                        title: "Hata",
                        description: "Beğeni eklenirken bir sorun oluştu.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" /> Beğen
                </Button>
              </div>
              
              {/* Social Share */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-sm mb-4">Skorunuzu paylaşın</p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="sm" onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${test.title} skorum: ${score}`,
                        text: `${test.title} testinde ${formatTime(timeElapsed)} sürede ${score} puan topladım!`,
                        url: window.location.href
                      });
                    }
                  }}>
                    <Share2 className="w-4 h-4 mr-2" /> Paylaş
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}