import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Heart, Share2, Play, Clock, Calendar, User, MessageSquare, Loader2,
  ThumbsUp, Check, X, Trophy, Eye
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatTime, checkAnswer, calculateScore, playSoundEffect } from '@/lib/gameHelpers';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import ImageReveal from '@/components/game/ImageReveal';
import { ContentCard } from '@/components/game/ContentCard';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/LanguageContext';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, updateDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Badge } from '@/components/ui/badge';
import { incrementTestPlayCount } from '@/lib/firebaseHelpers';

export default function GameScreen() {
  const [, setLocation] = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');
  const [revealPercent, setRevealPercent] = useState(30);
  const [guessHistory, setGuessHistory] = useState<Array<{
    guess: string;
    isCorrect: boolean;
    isClose?: boolean;
  }>>([]);
  const [hasLiked, setHasLiked] = useState(false);
  
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
          console.error("Test bulunamadı:", testId);
          return null;
        }
        
        const testData = testDoc.data();
        console.log("Test verileri:", testData);
        
        return {
          id: testDoc.id,
          title: testData.title,
          description: testData.description || '',
          creatorId: testData.creatorId,
          categoryId: testData.categoryId,
          questions: testData.questions || [],
          thumbnailUrl: testData.thumbnailUrl || '',
          playCount: testData.playCount || 0,
          likeCount: testData.likeCount || 0,
          isPublic: testData.isPublic !== false,
          isAnonymous: testData.isAnonymous === true,
          approved: testData.approved === true,
          featured: testData.featured === true,
          createdAt: testData.createdAt?.toDate() || new Date(),
          updatedAt: testData.updatedAt?.toDate()
        };
      } catch (error) {
        console.error("Test getirme hatası:", error);
        return null;
      }
    },
    enabled: !!testId
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

  // Set correct answers when test data is loaded
  useEffect(() => {
    if (test?.questions && test.questions.length > 0 && currentImageIndex < test.questions.length) {
      const currentQuestion = test.questions[currentImageIndex];
      correctAnswersRef.current = currentQuestion.answers || [];
    }
  }, [test, currentImageIndex]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAnswer.trim() || gameStatus !== 'playing') return;
    
    handleGuess(userAnswer);
    setUserAnswer('');
  };

  // Handle guess
  const handleGuess = (guess: string) => {
    if (!test?.questions || currentImageIndex >= test.questions.length) return;
    
    const currentQuestion = test.questions[currentImageIndex];
    const { isCorrect, isClose } = checkAnswer(guess, currentQuestion.answers || []);
    
    // Add to guess history
    setGuessHistory(prev => [...prev, { guess, isCorrect, isClose }]);
    
    if (isCorrect) {
      // Play correct sound
      playSoundEffect('correct');
      
      // Show correct effect
      if (imageRevealRef.current) {
        imageRevealRef.current.showCorrectGuessEffect();
      }
      
      // Calculate score based on reveal percentage and time
      const questionScore = calculateScore(revealPercent);
      setScore(prev => prev + questionScore);
      
      // Show toast
      toast({
        title: "Doğru!",
        description: `+${questionScore} puan kazandınız.`,
        variant: "default",
      });
      
      // Save score for this question
      saveGameScore(questionScore, true);
      
      // Move to next question after a delay
      setTimeout(() => {
        if (currentImageIndex < test.questions.length - 1) {
          setCurrentImageIndex(prev => prev + 1);
          setRevealPercent(30); // Reset reveal percentage
          setGuessHistory([]);
        } else {
          // Game finished
          setGameStatus('finished');
          
          toast({
            title: "Tebrikler!",
            description: "Testi tamamladınız.",
            variant: "default",
          });
        }
      }, 1500);
    } else {
      // Play incorrect sound
      playSoundEffect('incorrect');
      
      // Increase reveal percentage
      setRevealPercent(prev => Math.min(prev + 10, 100));
      
      // Show toast for close answers
      if (isClose) {
        toast({
          title: "Yaklaştınız!",
          description: "Cevaba çok yakınsınız.",
          variant: "default",
        });
        playSoundEffect('close');
      } else {
        toast({
          title: "Yanlış",
          description: "Tekrar deneyin.",
          variant: "destructive",
        });
      }
    }
  };

  // Handle correct answer
  const handleCorrectAnswer = () => {
    if (!test?.questions || currentImageIndex >= test.questions.length) return;
    
    // Calculate score based on reveal percentage
    const earnedScore = calculateScore(revealPercent);
    setScore(prev => prev + earnedScore);
    
    // Move to next question
    if (currentImageIndex < test.questions.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setRevealPercent(30); // Reset reveal percentage
      setGuessHistory([]);
    } else {
      // Game finished
      setGameStatus('finished');
      // Save final score
      saveGameScore(score + earnedScore, true);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (!test?.questions || currentImageIndex >= test.questions.length) return;
    
    // Move to next question
    if (currentImageIndex < test.questions.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setRevealPercent(30); // Reset reveal percentage
      setGuessHistory([]);
    } else {
      // Game finished
      setGameStatus('finished');
      // Save final score
      saveGameScore(score, true);
    }
  };

  // Save game score
  const saveGameScore = async (finalScore: number, completed: boolean) => {
    try {
      if (!testId) return;
      
      const scoreData = {
        testId: testId,
        userId: user?.uid || null,
        score: finalScore,
        completionTime: timeElapsed,
        attemptsCount: guessHistory.length,
        completed: completed,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'gameScores'), scoreData);
      
      if (user) {
        await addDoc(collection(db, 'userActivities'), {
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0],
          activityType: 'play_test',
          details: `Test oynandı: ${test?.title}, Skor: ${finalScore}`,
          entityId: testId,
          entityType: 'test',
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving game score:", error);
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
      // Update test like count
      const testRef = doc(db, 'tests', testId!);
      await updateDoc(testRef, {
        likeCount: increment(1)
      });
      
      // Add user activity
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

  // Handle add comment
  const handleAddComment = async (comment: string) => {
    if (!user) {
      toast({
        title: "Giriş yapmalısınız",
        description: "Yorum yapmak için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }
    
    if (!comment.trim()) {
      toast({
        title: "Yorum boş olamaz",
        description: "Lütfen bir yorum yazın.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Add comment
      await addDoc(collection(db, 'testComments'), {
        testId: testId,
        userId: user.uid,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });
      
      // Add user activity
      await addDoc(collection(db, 'userActivities'), {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0],
        activityType: 'comment_test',
        details: `Teste yorum yapıldı: ${test?.title}`,
        entityId: testId,
        entityType: 'test',
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Yorum eklendi",
        description: "Yorumunuz başarıyla eklendi.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Hata",
        description: "Yorum eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isTestLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Test yükleniyor...</span>
      </div>
    );
  }

  // Test not found
  if (!test) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Test Bulunamadı</h1>
        <p className="text-muted-foreground mb-4 text-center">
          İstediğiniz test mevcut değil veya kaldırılmış olabilir.
        </p>
        <Button onClick={() => setLocation("/")}>Ana Sayfaya Dön</Button>
      </div>
    );
  }

  // Get current question
  const currentQuestion = test.questions && test.questions.length > 0 && currentImageIndex < test.questions.length
    ? test.questions[currentImageIndex]
    : null;

  // Game finished screen
  if (gameStatus === 'finished') {
    // Test oynanma sayısını artır
    incrementTestPlayCount(testId).catch(error => {
      console.error("Test oynanma sayısı artırılırken hata:", error);
    });

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <Card className="border-primary/10 shadow-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Test Tamamlandı! 🎉</CardTitle>
              <CardDescription>
                {test.title} testini tamamladınız.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">{score} Puan</h2>
                <p className="text-muted-foreground mt-2">
                  Toplam süre: {formatTime(timeElapsed)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation(`/test/${testId}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Test Detaylarını Gör
                </Button>
                
                <Button 
                  className="w-full"
                  onClick={() => {
                    setCurrentImageIndex(0);
                    setScore(0);
                    setTimeElapsed(0);
                    setRevealPercent(30);
                    setGuessHistory([]);
                    setGameStatus('playing');
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Tekrar Oyna
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/")}
                >
                  Ana Sayfaya Dön
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLikeTest}
                  disabled={hasLiked}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {hasLiked ? "Beğenildi" : "Beğen"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-4">
        {/* Game header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">{test.title}</h1>
          <ScoreDisplay 
            score={score} 
            mode="test" 
            extraInfo={{
              correctAnswers: currentImageIndex,
              totalQuestions: test.questions?.length || 0,
              timeElapsed: timeElapsed,
              revealPercent: revealPercent
            }}
            compact={true}
          />
        </div>
        
        {/* Progress indicator */}
        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-1 transition-all duration-300 ease-out"
            style={{ width: `${(currentImageIndex / (test.questions?.length || 1)) * 100}%` }}
          ></div>
        </div>
        
        {/* Main game area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Card className="border-primary/10 shadow-md h-full">
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <CardTitle className="text-lg">
                  Soru {currentImageIndex + 1}/{test.questions?.length || 0}
                </CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(timeElapsed)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQuestion ? (
                  <>
                    <div className="question-text mb-4">
                      <p className="text-lg">{currentQuestion.question || "Bu görselde ne görüyorsunuz?"}</p>
                    </div>
                    
                    <div className="flex justify-center">
                      <ImageReveal
                        ref={imageRevealRef}
                        imageUrl={currentQuestion.imageUrl}
                        revealPercent={revealPercent}
                        className="w-full h-[400px] object-contain"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p>Soru yükleniyor...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <Card className="border-primary/10 shadow-md h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Cevabınız</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-2">
                    <Input
                      type="text"
                      placeholder="Cevabınızı yazın..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="w-full"
                    />
                    <Button type="submit" className="w-full">
                      Tahmin Et
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleSkip}
                      className="w-full mt-1"
                    >
                      Soruyu Atla
                    </Button>
                  </div>
                </form>
                
                {/* Guess history */}
                {guessHistory.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Tahmin Geçmişi</h3>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                      {guessHistory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                          <span className="text-sm">{item.guess}</span>
                          <div>
                            {item.isCorrect ? (
                              <Badge className="bg-green-500">Doğru</Badge>
                            ) : item.isClose ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">Yakın</Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-500 text-red-500">Yanlış</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}