import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Heart, Share2, Play, Clock, Calendar, User, MessageSquare, Loader2,
  ThumbsUp, Check, X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatTime, checkAnswer, calculateScore, playSoundEffect } from '@/lib/gameHelpers';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import ImageReveal from '@/components/game/ImageReveal';
import ContentCard from '@/components/game/ContentCard';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/LanguageContext';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, updateDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export default function GameScreen() {
  const [, setLocation] = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
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
  const [hasLiked, setHasLiked] = useState(false);
  
  // Reference to the correct answers for current image
  const correctAnswersRef = useRef<string[]>([]);
  const imageRevealRef = useRef<any>(null);
  
  // Fetch test data
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`test-${testId}`],
    queryFn: async () => {
      if (!testId) return null;
      
      try {
        const testRef = doc(db, 'tests', testId);
        const testDoc = await getDoc(testRef);
        
        if (!testDoc.exists()) {
          return null;
        }
        
        const testData = testDoc.data();
        
        // Fetch category if categoryId exists
        let category = null;
        if (testData.categoryId) {
          const categoryRef = doc(db, 'categories', testData.categoryId);
          const categoryDoc = await getDoc(categoryRef);
          if (categoryDoc.exists()) {
            category = {
              id: categoryDoc.id,
              ...categoryDoc.data()
            };
          }
        }
        
        // Increment play count
        await updateDoc(testRef, {
          playCount: increment(1)
        });
        
        return {
          id: testDoc.id,
          ...testData,
          category
        };
      } catch (error) {
        console.error("Error fetching test:", error);
        return null;
      }
    },
    enabled: !!testId
  });
  
  // Fetch similar tests (for game completion screen)
  const { data: similarTests } = useQuery({
    queryKey: [`similar-tests-${test?.categoryId}`],
    queryFn: async () => {
      if (!test?.categoryId) return [];
      
      try {
        const testsRef = collection(db, 'tests');
        const q = query(
          testsRef,
          where('categoryId', '==', test.categoryId),
          where('isPublic', '==', true),
          where('approved', '==', true),
          limit(4)
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(t => t.id !== testId);
      } catch (error) {
        console.error("Error fetching similar tests:", error);
        return [];
      }
    },
    enabled: !!test?.categoryId && gameStatus === 'finished'
  });
  
  // Fetch test comments
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: [`test-comments-${testId}`],
    queryFn: async () => {
      if (!testId) return [];
      
      try {
        const commentsRef = collection(db, 'testComments');
        const q = query(
          commentsRef,
          where('testId', '==', testId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
      } catch (error) {
        console.error("Error fetching test comments:", error);
        return [];
      }
    },
    enabled: !!testId && gameStatus === 'finished'
  });
  
  // Fetch top scores
  const { data: topScores } = useQuery({
    queryKey: [`top-scores-${testId}`],
    queryFn: async () => {
      if (!testId) return [];
      
      try {
        const scoresRef = collection(db, 'gameScores');
        const q = query(
          scoresRef,
          where('testId', '==', testId),
          orderBy('score', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error("Error fetching top scores:", error);
        return [];
      }
    },
    enabled: gameStatus === 'finished'
  });
  
  // Check if user has already liked this test
  useEffect(() => {
    if (user && testId) {
      const checkUserLike = async () => {
        try {
          const likesRef = collection(db, 'userActivities');
          const q = query(
            likesRef,
            where('userId', '==', user.uid),
            where('entityId', '==', testId),
            where('activityType', '==', 'like_test'),
            limit(1)
          );
          
          const querySnapshot = await getDocs(q);
          setHasLiked(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking if user liked test:", error);
        }
      };
      
      checkUserLike();
    }
  }, [user, testId]);

  // Update correct answers when current question changes
  useEffect(() => {
    if (test?.questions && test.questions.length > currentImageIndex) {
      const currentQuestion = test.questions[currentImageIndex];
      correctAnswersRef.current = Array.isArray(currentQuestion.answers) 
        ? currentQuestion.answers 
        : [currentQuestion.answers];
    }
  }, [test, currentImageIndex]);

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
    if (!guess.trim() || !test?.questions) return;
    
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
      
      // Show correct guess effect
      if (imageRevealRef.current) {
        imageRevealRef.current.showCorrectGuessEffect();
      }
      
      // Calculate score based on reveal percentage
      const earnedScore = calculateScore(revealPercent);
      
      // Update score
      setScore(prev => prev + earnedScore);
      
      toast({
        title: "Doğru!",
        description: `+${earnedScore} puan kazandınız.`,
        variant: "success",
      });
      
      // Save game score in the background
      saveGameScore(earnedScore, true);
      
      // Move to next image or finish game
      if (test && Array.isArray(test.questions) && currentImageIndex < test.questions.length - 1) {
        setTimeout(() => {
          setCurrentImageIndex(prev => prev + 1);
          setUserAnswer('');
          setGuessHistory([]);
          setRevealPercent(30); // Reset reveal percentage for next question
        }, 1500);
      } else {
        // End of game
        setGameStatus('finished');
        playSoundEffect('complete', 0.7);
      }
    } else {
      // Play sound for incorrect answer
      if (isClose) {
        playSoundEffect('close', 0.5);
      } else {
        playSoundEffect('incorrect', 0.5);
      }
      
      // Increase reveal percentage on wrong guess
      setRevealPercent(prev => Math.min(prev + 10, 100));
      
      setUserAnswer('');
    }
  };

  // Save game score
  const saveGameScore = async (earnedScore: number, completed: boolean) => {
    try {
      if (!testId) return;
      
      const scoreData = {
        testId: testId,
        userId: user?.uid,
        score: earnedScore,
        completionTime: timeElapsed,
        attemptsCount: guessHistory.length,
        completed: completed,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'gameScores'), scoreData);
      
      // Add user activity if logged in
      if (user) {
        await addDoc(collection(db, 'userActivities'), {
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0],
          activityType: 'play_test',
          details: `Test oynandı: ${test?.title}, Skor: ${earnedScore}`,
          entityId: testId,
          entityType: 'test',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving game score:", error);
    }
  };

  // Handle skip button
  const handleSkip = () => {
    if (!test?.questions) return;
    
    // Save a score of 0 for skipping
    saveGameScore(0, false);
    
    // Show correct answer
    toast({
      title: "Görsel Atlandı",
      description: `Doğru cevap: ${correctAnswersRef.current[0]}`,
      variant: "warning",
    });
    
    // Move to next image or finish game
    if (test && Array.isArray(test.questions) && currentImageIndex < test.questions.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setUserAnswer('');
      setGuessHistory([]);
      setRevealPercent(30); // Reset reveal percentage for next question
    } else {
      // End of game
      setGameStatus('finished');
    }
  };
  
  // Handle like test
  const handleLikeTest = async () => {
    if (!user) {
      toast({
        title: "Giriş yapmalısınız",
        description: "Testi beğenmek için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }
    
    if (hasLiked) {
      toast({
        title: "Zaten beğendiniz",
        description: "Bu testi daha önce beğendiniz.",
        variant: "default",
      });
      return;
    }
    
    try {
      const testRef = doc(db, 'tests', testId);
      await updateDoc(testRef, {
        likeCount: increment(1)
      });
      
      // Record like activity
      await addDoc(collection(db, 'userActivities'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0],
        activityType: 'like_test',
        details: `Teste beğeni verildi: ${test?.title}`,
        entityId: testId,
        entityType: 'test',
        createdAt: serverTimestamp()
      });
      
      setHasLiked(true);
      
      toast({
        title: "Test beğenildi",
        description: "Bu testi beğendiniz!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error liking test:", error);
      toast({
        title: "Hata",
        description: "Test beğenilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };
  
  // Add comment
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "Giriş yapmalısınız",
        description: "Yorum yapmak için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }
    
    if (!commentText.trim()) {
      toast({
        title: "Yorum boş olamaz",
        description: "Lütfen bir yorum yazın.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingComment(true);
    
    try {
      await addDoc(collection(db, 'testComments'), {
        testId: testId,
        userId: user.uid,
        comment: commentText.trim(),
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Yorum eklendi",
        description: "Yorumunuz başarıyla eklendi.",
        variant: "default",
      });
      
      setCommentText('');
      refetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Hata",
        description: "Yorum eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsAddingComment(false);
    }
  };

  // Loading state
  if (isTestLoading) {
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
  if (!test) {
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

  // Get current question
  const currentQuestion = test.questions && test.questions.length > currentImageIndex 
    ? test.questions[currentImageIndex] 
    : null;

  // Game content
  return (
    <div className="max-w-content mx-auto pb-12 px-4 space-y-8">
      {gameStatus === 'playing' && currentQuestion ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-6">
            <div>
              <h1 className="text-3xl font-bold">{test?.title}</h1>
              <p className="text-muted-foreground mt-1">{test?.description}</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.history.back()} 
                className="h-9"
              >
                <X className="w-4 h-4 mr-2" />
                Testi Bitir
              </Button>
              
              <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-secondary">
                <Clock className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{formatTime(timeElapsed)}</span>
              </div>
              
              <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-secondary">
                <span className="text-sm font-medium">{currentImageIndex + 1}/{test?.questions?.length || 0}</span>
              </div>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-3/4">
              <Card className="overflow-hidden shadow-md">
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Resmi Tahmin Et</CardTitle>
                      <CardDescription>
                        Ne kadar az açılım ile tahmin ederseniz o kadar çok puan kazanırsınız
                      </CardDescription>
                    </div>
                    <div className="text-2xl font-bold">{score} <span className="text-sm font-normal text-muted-foreground">puan</span></div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {/* Image Reveal - Daha küçük ve çerçeveyi kaplayan görsel */}
                  <div className="rounded-lg overflow-hidden border border-border">
                    <ImageReveal 
                      ref={imageRevealRef}
                      imageUrl={currentQuestion.imageUrl}
                      revealPercent={revealPercent}
                      gridSize={5}
                      className="w-full aspect-[4/3] object-cover object-center"
                    />
                  </div>
                  
                  {/* Tahmin Giriş Alanı */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleGuess(userAnswer);
                      setUserAnswer('');
                    }}
                    className="mt-6"
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
                      <Input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Bu nedir? Tahmin et..."
                        className="flex-1"
                        autoFocus
                      />
                      <Button type="submit" className="w-full sm:w-auto">Tahmin Et</Button>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                        Bu resmi atla →
                      </Button>
                    </div>
                  </form>
                  
                  {/* Tahmin Geçmişi */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">SON TAHMİNLER</h3>
                    <div className="max-h-32 overflow-y-auto scrollbar-thin">
                      {guessHistory.length > 0 ? (
                        <div className="space-y-2">
                          {guessHistory.map((item, index) => (
                            <div 
                              key={index} 
                              className={`p-2 px-3 text-sm rounded-md flex items-center ${
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
                        <div className="text-center text-muted-foreground py-3 bg-muted/40 rounded-md">
                          <p className="text-sm">Tahminleriniz burada görünecek</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="w-full lg:w-1/4 space-y-4">
              <ScoreDisplay
                score={score}
                mode="test"
                extraInfo={{
                  revealPercent: revealPercent,
                  correctAnswers: currentImageIndex,
                  totalQuestions: test?.questions?.length || 0,
                  timeElapsed: timeElapsed
                }}
              />
              
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Play className="w-4 h-4 mr-2 text-primary" />
                    Test Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Kategori:</span>
                      <span className="font-medium">{test?.category?.name || "Genel"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Toplam Görsel:</span>
                      <span className="font-medium">{test?.questions?.length || 0}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Mevcut Aşama:</span>
                      <span className="font-medium">{currentImageIndex + 1}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Açılım Oranı:</span>
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
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Bağlantı kopyalandı",
                      description: "Test bağlantısı panoya kopyalandı.",
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
                  <span className="font-semibold">{test?.questions?.length || 0}</span> görsel
                </p>
                <p>
                  <span className="font-semibold">{test?.questions?.length || 0}</span> doğru tahmin
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
                    {similarTests.map((similarTest, index) => (
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
                            {similarTest.questions?.length || 0} görsel
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
                      <p className="font-medium">{test?.category?.name || "Genel"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted text-center">
                      <p className="text-xs text-muted-foreground mb-1">Görseller</p>
                      <p className="font-medium">{test?.questions?.length || 0}</p>
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
                    onClick={handleLikeTest}
                    disabled={hasLiked}
                  >
                    {hasLiked ? (
                      <>
                        <Check className="w-4 h-4 mr-2" /> Beğenildi
                      </>
                    ) : (
                      <>
                        <ThumbsUp className="w-4 h-4 mr-2" /> Beğen
                      </>
                    )}
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
                  {comments.map((comment, index) => (
                    <div key={index} className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                            {comment.userId ? comment.userId.toString().charAt(0).toUpperCase() : "A"}
                          </div>
                          <h4 className="font-medium">{comment.userId ? "Kullanıcı" : "Anonim"}</h4>
                        </div>
                        <span className="text-xs text-muted-foreground px-2 py-1 rounded">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-sm pl-10">{comment.comment}</p>
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
                  handleAddComment();
                }}>
                  <Input 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Yorumunuzu yazın..." 
                    className="flex-1" 
                  />
                  <Button type="submit" disabled={isAddingComment}>
                    {isAddingComment ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      "Yorum Yap"
                    )}
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