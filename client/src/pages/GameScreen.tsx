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
            {/* Modern Game Header - Navigation and Time */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between mb-6 shadow-lg">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => window.history.back()}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  <span className="sr-only">Geri Dön</span>
                </Button>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{test?.title}</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700/70 px-4 py-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{formatTime(timeElapsed)}</span>
                </div>
                
                <div className="flex items-center gap-1 bg-primary/10 px-4 py-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Aşama {currentImageIndex + 1}/{test?.imageIds?.length || 0}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  className="bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:border-red-800/50"
                  onClick={() => {
                    // Bildir butonu fonksiyonu
                    toast({
                      title: "İçerik Bildirildi",
                      description: "Bu test içeriği yöneticilere bildirildi. Teşekkürler!",
                      variant: "default"
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="sr-only">Bildir</span>
                </Button>
              </div>
            </div>
            
            {/* Score Display */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 backdrop-blur-sm rounded-xl p-3 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">Mevcut Skor</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{score}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">Tahmin</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{guessHistory.length}</p>
                </div>
              </div>
            </div>
            
            {/* Image Section with controls below */}
            <div className="mb-8">
              {/* Image Reveal with fixed percentage */}
              <div className="relative mb-4">
                <ImageReveal 
                  imageUrl={currentImage?.imageUrl || ''}
                  revealPercent={revealPercent}
                  gridSize={4}
                  className="aspect-video w-full rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                />
                
                {/* Progress indicator */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-medium">
                    {Math.round(revealPercent)}% açık
                  </div>
                </div>
              </div>
              
              {/* Guess Controls below image */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                {/* Guess History - Positioned directly above input */}
                <div className="mb-4 overflow-y-auto max-h-36 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  {guessHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {guessHistory.map((item, index) => (
                        <div 
                          key={index} 
                          className={`px-3 py-1.5 rounded-md text-sm ${
                            item.isCorrect 
                              ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400' 
                              : item.isClose 
                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800/50 dark:text-yellow-400' 
                                : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400'
                          }`}
                        >
                          {item.guess}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                      <p>Tahminleriniz burada görünecek</p>
                    </div>
                  )}
                </div>
                
                {/* Guess Input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGuess(userAnswer);
                    setUserAnswer('');
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Bu nedir? Tahmin et..."
                    className="flex-1 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
                  />
                  <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
                    Tahmin Et
                  </Button>
                  <Button type="button" variant="outline" onClick={handleSkip} className="border-gray-300 dark:border-gray-600">
                    Atla
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Test Info */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">{test?.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{test?.description || "Bu test hakkında bilgiler..."}</p>
            </div>
          </>
        ) : (
          // Modern Game Finished Screen with light/dark mode support
          <div className="py-6 rounded-xl">
            {/* Header section with score summary */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <Button 
                  variant="ghost" 
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setLocation('/tests')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  Testlere Dön
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
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
                <div className="inline-block p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-full mb-6">
                  <Trophy className="h-16 w-16 text-yellow-500" />
                </div>
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Tebrikler!</h1>
                <p className="text-xl mb-4 text-gray-700 dark:text-gray-300">
                  {test?.title} testini <span className="font-semibold">{formatTime(timeElapsed)}</span> sürede tamamladınız.
                </p>
              </div>
              
              <div className="max-w-md mx-auto bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-6 mt-8">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Toplam Puan</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{score}</p>
                </div>
                <div className="bg-white/60 dark:bg-gray-800/60 h-1 w-full rounded-full mb-4"></div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">{test?.imageIds?.length || 0}</span> görsel
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">{guessHistory.filter(g => g.isCorrect).length}</span> doğru tahmin
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900 dark:text-white">{timeElapsed}</span> saniye
                  </p>
                </div>
              </div>
            </div>
            
            {/* Main content section - Left side for Similar Tests + Scoreboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Left Column - Similar Tests + Stats */}
              <div className="space-y-6">
                {/* Similar Tests */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Benzer Testler</h2>
                  </div>
                  
                  {similarTests && similarTests.length > 0 ? (
                    <div className="space-y-3">
                      {(similarTests as Test[])
                        .filter(t => t.id !== Number(testId))
                        .slice(0, 5)
                        .map((similarTest, index) => (
                          <div 
                            key={index} 
                            className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/70 border border-gray-200 dark:border-gray-700 transition-colors"
                            onClick={() => window.location.href = `/test/${similarTest.id}`}
                          >
                            <h4 className="font-medium text-gray-900 dark:text-white">{similarTest.title}</h4>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" /> {similarTest.likeCount || 0}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                                {similarTest.imageIds?.length || 0} görsel
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                      <p>Benzer test bulunamadı</p>
                    </div>
                  )}
                </div>
                
                {/* Test Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-blue-500" /> 
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Test Bilgileri</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Kategori</h3>
                      <p className="font-medium text-gray-900 dark:text-white">{test?.categoryId ? "Film" : "Genel"}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Görseller</h3>
                      <p className="font-medium text-gray-900 dark:text-white">{test?.imageIds?.length || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Beğeni</h3>
                      <p className="font-medium text-gray-900 dark:text-white">{test?.likeCount || 0}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg text-center border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">Oynanma</h3>
                      <p className="font-medium text-gray-900 dark:text-white">{test?.playCount || 0}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    {test?.description || "Bu test hakkında bilgiler burada gösterilecektir."}
                  </p>
                  
                  <Button 
                    className="w-full bg-primary text-white hover:bg-primary/90" 
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
              
              {/* Right Column - Scoreboard and Actions */}
              <div className="space-y-6">
                {/* Top 5 Scoreboard */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <ListOrdered className="w-5 h-5 text-yellow-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skor Tablosu (Top 5)</h2>
                  </div>
                  
                  {topScores && topScores.length > 0 ? (
                    <div className="space-y-3">
                      {(topScores as GameScore[]).slice(0, 5).map((scoreItem, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full 
                              ${index === 0 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' 
                                : index === 1 
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' 
                                  : index === 2 
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400'
                              }`}>
                              <span className="font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{scoreItem.userId ? "Kullanıcı" : "Anonim"}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                {formatTime(scoreItem.completionTime || 0)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">{scoreItem.score}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p>Henüz skor kaydedilmemiş</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
                  <Button onClick={() => window.location.reload()} className="w-full bg-gradient-to-r from-primary to-primary/90 text-white mb-3" size="lg">
                    <Trophy className="w-5 h-5 mr-2" /> Yeniden Oyna
                  </Button>
                  <Button variant="outline" onClick={() => setLocation('/tests')} className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                    Diğer Testlere Göz At
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Comments Section - Full width at bottom */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yorumlar</h2>
              </div>
              
              {comments && comments.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto mb-6">
                  {(comments as TestComment[]).map((comment, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
                            {comment.userId ? comment.userId.toString().charAt(0).toUpperCase() : "A"}
                          </div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{comment.userId ? "Kullanıcı" : "Anonim"}</h4>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 pl-10">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
                  <p>Henüz yorum yapılmamış</p>
                  <p className="text-sm mt-1">Bu test hakkında ilk yorumu sen yap!</p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
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
                    className="flex-1 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700" 
                  />
                  <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
                    Yorum Yap
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}