import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, User, Heart, Share2, Trophy, Award, Clock, ThumbsUp,
  MessageSquare, Star, ListOrdered
} from 'lucide-react';
import type { Image, Test, TestComment, GameScore } from '../../shared/schema';
import { toast } from '@/hooks/use-toast';
import { formatTime, checkAnswer, calculateScore, playSoundEffect } from '@/lib/gameHelpers';
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
    <div className="bg-gradient-to-b from-black/30 to-transparent min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6">
      
        {gameStatus === 'playing' && currentImage ? (
          <>
            {/* Minimal Game Header - Only shows stage and elapsed time */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between mb-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-primary/20 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">Aşama {currentImageIndex + 1}/{test?.imageIds?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="text-sm font-medium">{formatTime(timeElapsed)}</span>
                </div>
              </div>
              <div>
                <span className="text-lg font-bold">{score} Puan</span>
              </div>
            </div>
            
            {/* Game Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Reveal with fixed percentage */}
              <div className="md:col-span-2">
                <ImageReveal 
                  imageUrl={currentImage?.imageUrl || ''}
                  revealPercent={revealPercent}
                  gridSize={4}
                  className="aspect-video rounded-xl shadow-xl overflow-hidden"
                />
              </div>
              
              {/* Game Controls */}
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 flex flex-col">
                <h3 className="text-lg font-semibold mb-2">{test?.title}</h3>
                
                {/* Guess History - Positioned directly above input */}
                <div className="mb-4 overflow-y-auto max-h-52 bg-black/20 rounded-lg p-2">
                  {guessHistory.length > 0 ? (
                    <div className="space-y-2">
                      {guessHistory.map((item, index) => (
                        <div 
                          key={index} 
                          className={`px-3 py-2 rounded-md text-sm ${
                            item.isCorrect 
                              ? 'bg-green-500/20 border border-green-500/30' 
                              : item.isClose 
                                ? 'bg-yellow-500/20 border border-yellow-500/30' 
                                : 'bg-red-500/20 border border-red-500/30'
                          }`}
                        >
                          {item.guess}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-6">
                      <p>Tahminleriniz burada görünecek</p>
                    </div>
                  )}
                </div>
                
                {/* Guess Input */}
                <div className="mt-auto">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGuess(userAnswer);
                      setUserAnswer('');
                    }}
                    className="space-y-3"
                  >
                    <Input
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Bu nedir? Tahmin et..."
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="w-full">Tahmin Et</Button>
                      <Button type="button" variant="outline" onClick={handleSkip}>Atla</Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Game Finished Screen with Scoreboard, Comments and Similar Tests
          <div className="py-6 rounded-xl">
            <div className="text-center mb-8">
              <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h1 className="text-3xl font-bold mb-2">Tebrikler!</h1>
              <p className="text-xl mb-4">
                {test?.title} testini <span className="font-semibold">{formatTime(timeElapsed)}</span> sürede tamamladınız.
              </p>
              
              <div className="max-w-md mx-auto bg-black/30 rounded-lg p-4 mb-6">
                <p className="text-2xl font-bold mb-2">{score} Puan</p>
                <p className="text-sm text-muted-foreground">
                  {test?.imageIds?.length || 0} görseli {guessHistory.filter(g => g.isCorrect).length} doğru tahminle tamamladınız
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Top 5 Scoreboard */}
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <ListOrdered className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-bold">Skor Tablosu (Top 5)</h2>
                </div>
                
                {topScores && topScores.length > 0 ? (
                  <div className="space-y-3">
                    {(topScores as GameScore[]).slice(0, 5).map((scoreItem, index) => (
                      <div key={index} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg w-6">{index + 1}</span>
                          <div>
                            <p className="font-medium">{scoreItem.userId ? "Kullanıcı" : "Anonim"}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(scoreItem.completionTime || 0)}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold">{scoreItem.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Henüz skor kaydedilmemiş</p>
                  </div>
                )}
              </div>
              
              {/* Comments Section */}
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <h2 className="text-xl font-bold">Yorumlar</h2>
                </div>
                
                {comments && comments.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {(comments as TestComment[]).map((comment, index) => (
                      <div key={index} className="bg-black/20 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium">{comment.userId ? "Kullanıcı" : "Anonim"}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Henüz yorum yapılmamış</p>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <form className="space-y-3" onSubmit={(e) => {
                    e.preventDefault();
                    // Yorum gönderme işlemi
                  }}>
                    <Input placeholder="Yorumunuzu yazın..." />
                    <Button className="w-full">Yorum Yap</Button>
                  </form>
                </div>
              </div>
              
              {/* Similar Tests */}
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold">Benzer Testler</h2>
                </div>
                
                {similarTests && similarTests.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {(similarTests as Test[])
                      .filter(t => t.id !== Number(testId))
                      .slice(0, 5)
                      .map((similarTest, index) => (
                        <div 
                          key={index} 
                          className="bg-black/20 p-3 rounded-lg cursor-pointer hover:bg-black/30"
                          onClick={() => window.location.href = `/test/${similarTest.id}`}
                        >
                          <h4 className="font-medium">{similarTest.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {similarTest.likeCount || 0}
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
                  <div className="text-center py-10 text-muted-foreground">
                    <p>Benzer test bulunamadı</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <Button onClick={() => window.location.reload()} size="lg">
                <Trophy className="w-4 h-4 mr-2" /> Yeniden Oyna
              </Button>
              <Button variant="outline" onClick={() => setLocation('/tests')} size="lg">
                Diğer Testlere Dön
              </Button>
              <Button 
                variant="secondary" 
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
          </div>
        )}
      </div>
    </div>
  );
}