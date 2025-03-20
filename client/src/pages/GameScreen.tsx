import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Heart, Share2, Trophy, Award, Clock, ThumbsUp,
  MessageSquare, Star, ListOrdered
} from 'lucide-react';
import type { Image, Test, TestComment, GameScore } from '@shared/schema';
import { toast } from '@/hooks/use-toast';
import { formatTime, checkAnswer, calculateScore, playSoundEffect } from '@/lib/gameHelpers';
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
  const [revealPercent, setRevealPercent] = useState(30); // Sabit bir görsel açılma oranı
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
  
  // Fetch similar tests (for game completion screen)
  const { data: similarTests } = useQuery({
    queryKey: [`/api/tests/category/${test?.categoryId}`],
    enabled: !!test && gameStatus === 'finished',
  });
  
  // Fetch test comments
  const { data: comments } = useQuery({
    queryKey: [`/api/tests/${testId}/comments`],
    enabled: !!testId && gameStatus === 'finished',
  });
  
  // Fetch top scores
  const { data: topScores } = useQuery({
    queryKey: [`/api/game/scores/top`],
    enabled: gameStatus === 'finished',
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

  // Handle guess submission
  const handleGuess = (guess: string) => {
    if (!guess.trim() || !currentImage) return;
    
    // Check if answer is correct using our utility
    const answerResult = checkAnswer(guess, correctAnswersRef.current);
    const isCorrect = answerResult.isCorrect;
    const isClose = answerResult.isClose;
    
    // Add to guess history
    setGuessHistory(prev => [
      { 
        guess, 
        isCorrect, 
        isClose: !isCorrect && isClose
      },
      ...prev
    ]);
    
    if (isCorrect) {
      // Play sound for correct answer
      playSoundEffect('correct', 0.5);
      
      // Calculate score - fixed score based only on reveal percentage (no time factor)
      const earnedScore = calculateScore(revealPercent);
      
      // Update score
      setScore(prev => prev + earnedScore);
      
      // Move to next image or finish game
      if (test && Array.isArray(test.imageIds) && currentImageIndex < test.imageIds.length - 1) {
        setCurrentImageIndex(prev => prev + 1);
        setUserAnswer('');
        setGuessHistory([]);
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
      // Play sound for incorrect answer
      if (isClose) {
        playSoundEffect('close', 0.5);
      } else {
        playSoundEffect('incorrect', 0.5);
      }
      
      // Wrong answers don't affect reveal percentage anymore
      setUserAnswer('');
    }
  };

  // Handle skip button
  const handleSkip = () => {
    if (test && Array.isArray(test.imageIds) && currentImageIndex < test.imageIds.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setUserAnswer('');
      setGuessHistory([]);
    } else {
      setGameStatus('finished');
    }
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
    <div className="max-w-4xl mx-auto pb-10">
      {gameStatus === 'playing' && currentImage ? (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">{test?.title}</h1>
            <div className="flex items-center justify-between">
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.history.back()} 
                >
                  ← Geri Dön
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="text-sm font-medium">{formatTime(timeElapsed)}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800">
                  <span className="text-sm font-medium">Aşama {currentImageIndex + 1}/{test?.imageIds?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-8">
              <Card className="border-muted bg-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Resmi Tahmin Et</CardTitle>
                    <div className="text-lg font-bold">{score} Puan</div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Image Reveal */}
                  <div className="mb-4">
                    <ImageReveal 
                      imageUrl={currentImage?.imageUrl || ''}
                      revealPercent={revealPercent}
                      gridSize={4}
                      className="w-full aspect-video rounded-lg overflow-hidden"
                    />
                  </div>
                  
                  {/* Tahmin Giriş Alanı */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGuess(userAnswer);
                      setUserAnswer('');
                    }}
                    className="mt-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Bu nedir? Tahmin et..."
                        className="flex-1"
                      />
                      <Button type="submit">Tahmin Et</Button>
                    </div>
                    <div className="flex justify-between">
                      <Button type="button" variant="outline" size="sm" onClick={handleSkip}>
                        Bu resmi atla
                      </Button>
                      <div className="text-sm text-muted-foreground">Ne kadar az açılım ile tahmin ederseniz o kadar çok puan kazanırsınız.</div>
                    </div>
                  </form>
                  
                  {/* Tahmin Geçmişi - Aynı Card içinde ama daha kompakt */}
                  <div className="mt-4 border-t border-border pt-4">
                    <h3 className="text-sm font-semibold mb-2">TAHMİNLER</h3>
                    <div className="max-h-32 overflow-y-auto">
                      {guessHistory.length > 0 ? (
                        <div className="space-y-1">
                          {guessHistory.map((item, index) => (
                            <div 
                              key={index} 
                              className={`p-2 text-sm rounded-md flex items-center ${
                                item.isCorrect 
                                  ? 'bg-green-500/10 border-l-2 border-green-500 dark:bg-green-700/20' 
                                  : item.isClose 
                                    ? 'bg-yellow-500/10 border-l-2 border-yellow-500 dark:bg-yellow-700/20' 
                                    : 'bg-red-500/10 border-l-2 border-red-500 dark:bg-red-700/20'
                              }`}
                            >
                              <span className="font-medium">{item.guess}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-2">
                          <p className="text-sm">Tahminleriniz burada görünecek</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="col-span-12 md:col-span-4">
              <ScoreDisplay
                score={score}
                mode="test"
                extraInfo={{
                  revealPercent: revealPercent,
                  correctAnswers: guessHistory.filter(g => g.isCorrect).length,
                  totalQuestions: test?.imageIds?.length || 0,
                  timeElapsed: timeElapsed
                }}
              />
              
              <Card className="border-muted bg-card mt-4">
                <CardHeader className="pb-2">
                  <CardTitle>Test Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {test?.description || "Bu test hakkında bilgiler..."}
                  </p>
                  <div className="text-sm">
                    <div className="flex justify-between py-1 border-b border-border">
                      <span>Toplam Görsel:</span>
                      <span className="font-medium">{test?.imageIds?.length || 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border">
                      <span>Mevcut Aşama:</span>
                      <span className="font-medium">{currentImageIndex + 1}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Açılım Oranı:</span>
                      <span className="font-medium">{revealPercent}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        // Game Finished Screen
        <div className="py-6 rounded-xl">
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/tests')}
              >
                ← Testlere Dön
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${test?.title} skorum: ${score}`,
                      text: `${test?.title} testinde ${formatTime(timeElapsed)} sürede ${score} puan topladım!`,
                      url: window.location.href
                    });
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" /> Paylaş
              </Button>
            </div>
            
            <div className="text-center">
              <div className="inline-block p-6 rounded-full mb-6">
                <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Tebrikler!</h1>
              <p className="text-xl mb-4">
                {test?.title} testini <span className="font-semibold">{formatTime(timeElapsed)}</span> sürede tamamladınız.
              </p>
            </div>
            
            <div className="max-w-md mx-auto p-6 mt-8 bg-card border border-border rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Toplam Puan</p>
                <p className="text-3xl font-bold">{score}</p>
              </div>
              <div className="bg-muted h-1 w-full rounded-full mb-4"></div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold">{test?.imageIds?.length || 0}</span> görsel
                </p>
                <p>
                  <span className="font-semibold">{guessHistory.filter(g => g.isCorrect).length}</span> doğru tahmin
                </p>
                <p>
                  <span className="font-semibold">{timeElapsed}</span> saniye
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <Card className="border-muted bg-card">
              <CardHeader>
                <CardTitle>Benzer Testler</CardTitle>
              </CardHeader>
              <CardContent>
                {similarTests && Array.isArray(similarTests) && similarTests.length > 0 ? (
                  <div className="space-y-3">
                    {(similarTests as Test[])
                      .filter(t => t.id !== Number(testId))
                      .slice(0, 5)
                      .map((similarTest, index) => (
                        <div 
                          key={index} 
                          className="p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => window.location.href = `/test/${similarTest.id}`}
                        >
                          <h4 className="font-medium">{similarTest.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-red-500" /> {similarTest.likeCount || 0}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {similarTest.imageIds?.length || 0} görsel
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Benzer test bulunamadı</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-muted bg-card">
              <CardHeader>
                <CardTitle>Test Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {test?.description || "Bu test hakkında bilgiler..."}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Kategori</p>
                      <p className="font-medium">{test?.categoryId ? "Film" : "Genel"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Görseller</p>
                      <p className="font-medium">{test?.imageIds?.length || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Beğeni</p>
                      <p className="font-medium">{test?.likeCount || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Oynanma</p>
                      <p className="font-medium">{test?.playCount || 0}</p>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      apiRequest({
                        url: `/api/tests/${testId}/like`,
                        method: 'POST'
                      }).catch(err => {
                        console.error("Error liking test:", err);
                      });
                    }}
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" /> Beğen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-muted bg-card">
            <CardHeader>
              <CardTitle>Yorumlar</CardTitle>
            </CardHeader>
            <CardContent>
              {comments && Array.isArray(comments) && comments.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto mb-6">
                  {(comments as TestComment[]).map((comment, index) => (
                    <div key={index} className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                            {comment.userId ? comment.userId.toString().charAt(0).toUpperCase() : "A"}
                          </div>
                          <h4 className="font-medium">{comment.userId ? "Kullanıcı" : "Anonim"}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground px-2 py-1 rounded">
                          {new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm pl-10">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground rounded-lg mb-6">
                  <p>Henüz yorum yapılmamış</p>
                  <p className="text-sm mt-1">Bu test hakkında ilk yorumu sen yap!</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-border">
                <form className="flex gap-2" onSubmit={(e) => {
                  e.preventDefault();
                  // Yorum gönderme işlemi
                  toast({
                    title: "Yorum gönderildi",
                    description: "Yorumunuz onaylama sürecinden sonra yayınlanacaktır.",
                    variant: "default"
                  });
                }}>
                  <Input 
                    placeholder="Yorumunuzu yazın..." 
                    className="flex-1" 
                  />
                  <Button type="submit">
                    Yorum Yap
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}