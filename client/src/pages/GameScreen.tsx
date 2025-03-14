import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Heart, ThumbsUp, User, Award, AlertTriangle } from 'lucide-react';
import { Image, Test } from '../../shared/schema';
import { toast } from '@/hooks/use-toast';

export default function GameScreen() {
  const { testId } = useParams<{ testId: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [revealPercent, setRevealPercent] = useState(20); // Start with 20% revealed

  // Fetch test data
  const { data: test, isLoading: isTestLoading } = useQuery<Test>({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  // Fetch current image data
  const { data: currentImage, isLoading: isImageLoading } = useQuery<Image>({
    queryKey: [`/api/images/${test?.imageIds?.[currentImageIndex]}`],
    enabled: !!test && Array.isArray(test.imageIds) && currentImageIndex < test.imageIds.length,
  });

  // Timer effect
  useEffect(() => {
    if (gameStatus === 'playing') {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStatus]);

  // Automatically increase reveal percentage over time
  useEffect(() => {
    if (gameStatus === 'playing' && revealPercent < 100) {
      const revealTimer = setInterval(() => {
        setRevealPercent(prev => Math.min(prev + 5, 100));
      }, 10000); // Increase by 5% every 10 seconds
      return () => clearInterval(revealTimer);
    }
  }, [gameStatus, revealPercent]);

  // Handler for submitting answer
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !currentImage) return;

    try {
      const response = await apiRequest<{ isCorrect: boolean; score: number }>({
        url: '/api/game/check-answer',
        method: 'POST',
        body: JSON.stringify({
          imageId: currentImage.id,
          userAnswer: userAnswer.trim().toLowerCase(),
          revealPercent
        })
      });

      if (response.isCorrect) {
        // Add to current score
        setScore(prev => prev + response.score);
        toast({
          title: "Doğru Cevap!",
          description: `+${response.score} puan kazandınız.`,
          variant: "default"
        });

        // Move to next image or finish game
        if (test && Array.isArray(test.imageIds) && currentImageIndex < test.imageIds.length - 1) {
          setCurrentImageIndex(prev => prev + 1);
          setUserAnswer('');
          setRevealPercent(20); // Reset reveal percentage
        } else {
          setGameStatus('finished');
          // Save final score to backend
          await apiRequest({
            url: '/api/game/scores',
            method: 'POST',
            body: JSON.stringify({
              testId: Number(testId),
              score,
              completionTime: timeElapsed,
              attemptsCount: currentImageIndex + 1,
              completed: true
            })
          });
        }
      } else {
        toast({
          title: "Yanlış Cevap",
          description: "Tekrar deneyin veya ipucu için biraz bekleyin.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error checking answer:", error);
      toast({
        title: "Bir hata oluştu",
        description: "Cevabınız kontrol edilirken bir sorun oluştu.",
        variant: "destructive"
      });
    }
  };

  // Handler for skip button
  const handleSkip = () => {
    if (test && Array.isArray(test.imageIds) && currentImageIndex < test.imageIds.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setUserAnswer('');
      setRevealPercent(20);
    } else {
      setGameStatus('finished');
    }
  };

  // Format time function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isTestLoading || isImageLoading) {
    return (
      <div className="game-layout">
        <div className="game-ad-left"></div>
        <div className="game-content p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse bg-zinc-800 h-8 w-64 mx-auto rounded mb-8"></div>
            <div className="animate-pulse bg-zinc-800 h-72 w-full max-w-xl mx-auto rounded mb-6"></div>
            <div className="animate-pulse bg-zinc-800 h-10 w-full max-w-md mx-auto rounded"></div>
          </div>
        </div>
        <div className="game-ad-right"></div>
      </div>
    );
  }

  if (!test || !currentImage && gameStatus === 'playing') {
    return (
      <div className="game-layout">
        <div className="game-ad-left"></div>
        <div className="game-content p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Test bulunamadı</h2>
            <p className="text-muted-foreground mb-6">İstediğiniz test mevcut değil veya yüklenirken bir sorun oluştu.</p>
            <Button onClick={() => window.history.back()}>Geri Dön</Button>
          </div>
        </div>
        <div className="game-ad-right"></div>
      </div>
    );
  }

  return (
    <div className="game-layout">
      {/* Left Ad Space */}
      <div className="game-ad-left bg-muted/20 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Reklam Alanı</span>
      </div>
      
      {/* Game Content */}
      <div className="game-content pb-8">
        {gameStatus === 'playing' && currentImage ? (
          <>
            {/* Game Header */}
            <div className="bg-muted/30 p-4 flex items-center justify-between border-b">
              <div>
                <h1 className="font-bold text-lg">{test.title}</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {test.creatorId ? "Kullanıcı" : "Anonim"}</span>
                  <span>•</span>
                  <span className="flex items-center"><Heart className="w-3 h-3 mr-1" /> {test.likeCount || 0}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">SÜRE</p>
                  <p className="font-mono text-xl flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-yellow-500" /> 
                    {formatTime(timeElapsed)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">PUAN</p>
                  <p className="font-mono text-xl flex items-center">
                    <Award className="w-4 h-4 mr-2 text-primary" /> 
                    {score}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Game Stage */}
            <div className="py-6 px-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">Görsel {currentImageIndex + 1}/{test.imageIds?.length || 0}</p>
                <p className="text-sm">Açığa çıkarıldı: {revealPercent}%</p>
              </div>
              
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-2xl mx-auto mb-8 shadow-xl">
                {/* Image reveal with grid mask */}
                <div className="relative w-full h-full">
                  <img 
                    src={currentImage.imageUrl} 
                    alt="Tahmin edilecek görsel" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                    {Array.from({ length: 100 }).map((_, i) => {
                      // Show a percentage of cells based on revealPercent
                      // Higher numbers in the array are hidden
                      const isHidden = i >= revealPercent; 
                      return (
                        <div 
                          key={i} 
                          className={`${isHidden ? 'bg-black' : 'bg-transparent'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Answer Input */}
              <div className="max-w-xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    type="text"
                    placeholder="Cevabınızı yazın..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                    className="flex-grow"
                  />
                  <Button onClick={handleSubmitAnswer}>Kontrol Et</Button>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={handleSkip}>
                    Bu resmi atla
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Game Finished
          <div className="py-12 px-4 text-center">
            <div className="max-w-md mx-auto">
              <Award className="h-20 w-20 mx-auto text-primary mb-6" />
              <h1 className="text-3xl font-bold mb-2">Tebrikler!</h1>
              <p className="text-xl mb-8">
                {test.title} testini {formatTime(timeElapsed)} sürede tamamladınız.
              </p>
              
              <div className="bg-muted/30 rounded-lg p-6 mb-8">
                <div className="text-4xl font-bold mb-4">{score} Puan</div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-muted-foreground">Süre</p>
                    <p className="font-medium">{formatTime(timeElapsed)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Görsel</p>
                    <p className="font-medium">{test.imageIds?.length || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <Button onClick={() => window.location.reload()}>
                  Yeniden Oyna
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Diğer Testlere Dön
                </Button>
                <Button 
                  variant="ghost" 
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
                  <ThumbsUp className="w-4 h-4 mr-2" /> Bu testi beğendim
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Right Ad Space */}
      <div className="game-ad-right bg-muted/20 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Reklam Alanı</span>
      </div>
    </div>
  );
}