import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Heart, Share2, Play, Clock, Calendar, User, MessageSquare, Loader2,
  ThumbsUp, Check, X, Trophy as TrophyIcon
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
  const [revealPercent, setRevealPercent] = useState(30);
  const [guessHistory, setGuessHistory] = useState<Array<{
    guess: string;
    isCorrect: boolean;
    isClose?: boolean;
  }>>([]);
  const [hasLiked, setHasLiked] = useState(false);
  
  const correctAnswersRef = useRef<string[]>([]);
  const imageRevealRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch test data
  const { data: test, isLoading: isTestLoading } = useQuery({
    queryKey: [`test-${testId}`],
    queryFn: async () => {
      if (!testId) return null;
      
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (!testDoc.exists()) return null;
        
        // Increment play count
        await updateDoc(doc(db, 'tests', testId), {
          playCount: increment(1)
        });
        
        return { id: testDoc.id, ...testDoc.data() };
      } catch (error) {
        console.error('Error fetching test:', error);
        throw error;
      }
    },
    enabled: !!testId
  });

  // Start timer when game starts
  useEffect(() => {
    if (test && test.questions && test.questions.length > 0) {
      startTimer();
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [test]);

  // Set correct answers for current question
  useEffect(() => {
    if (test && test.questions && test.questions[currentImageIndex]) {
      correctAnswersRef.current = test.questions[currentImageIndex].answers || [];
    }
  }, [test, currentImageIndex]);

  // Timer function
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  // Save game score to Firestore
  const saveGameScore = async (earnedScore: number, completed: boolean) => {
    try {
      if (!testId) return;
      
      const scoreData = {
        testId: testId,
        userId: user?.uid || null,
        score: earnedScore,
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

  // Handle guess submission
  const handleGuess = async () => {
    if (!userAnswer.trim() || !test || !test.questions) return;
    
    const currentQuestion = test.questions[currentImageIndex];
    if (!currentQuestion) return;
    
    const { isCorrect, isClose } = checkAnswer(userAnswer, correctAnswersRef.current);
    
    // Add to guess history
    setGuessHistory(prev => [...prev, { 
      guess: userAnswer, 
      isCorrect, 
      isClose 
    }]);
    
    if (isCorrect) {
      // Play correct sound
      playSoundEffect('correct');
      
      // Show correct animation
      if (imageRevealRef.current) {
        imageRevealRef.current.showCorrectGuessEffect();
      }
      
      // Calculate score based on reveal percentage
      const questionScore = calculateScore(revealPercent);
      setScore(prev => prev + questionScore);
      
      // Move to next question or finish game
      setTimeout(() => {
        if (currentImageIndex < test.questions.length - 1) {
          setCurrentImageIndex(prev => prev + 1);
          setRevealPercent(30);
          setUserAnswer('');
          setGuessHistory([]);
        } else {
          // Game finished
          setGameStatus('finished');
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          // Save final score
          saveGameScore(score + questionScore, true);
          
          toast({
            title: "Tebrikler!",
            description: `Testi tamamladınız. Toplam puanınız: ${score + questionScore}`,
          });
        }
      }, 1500);
    } else {
      // Play wrong sound
      playSoundEffect('incorrect');
      
      // Increase reveal percentage for wrong guess
      setRevealPercent(prev => Math.min(prev + 10, 100));
      
      // Clear input
      setUserAnswer('');
    }
  };

  // Handle skip question
  const handleSkip = () => {
    if (!test || !test.questions) return;
    
    toast({
      title: "Soru Atlandı",
      description: `Doğru cevap: ${correctAnswersRef.current[0]}`,
      variant: "destructive",
    });
    
    // Move to next question or finish game
    if (currentImageIndex < test.questions.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setRevealPercent(30);
      setUserAnswer('');
      setGuessHistory([]);
    } else {
      // Game finished
      setGameStatus('finished');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Save final score
      saveGameScore(score, false);
    }
  };

  // Handle like test
  const handleLikeTest = async () => {
    if (!testId || !user) {
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
      });
      return;
    }
    
    try {
      // Check if user already liked this test
      const likesQuery = query(
        collection(db, 'userActivities'),
        where('userId', '==', user.uid),
        where('entityId', '==', testId),
        where('activityType', '==', 'like_test')
      );
      
      const likesSnapshot = await getDocs(likesQuery);
      
      if (!likesSnapshot.empty) {
        toast({
          title: "Zaten beğendiniz",
          description: "Bu testi daha önce beğendiniz.",
        });
        return;
      }
      
      // Increment like count
      await updateDoc(doc(db, 'tests', testId), {
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
      });
    } catch (error) {
      console.error('Error liking test:', error);
      toast({
        title: "Hata",
        description: "Test beğenilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Handle adding comment
  const handleAddComment = async (comment: string) => {
    if (!testId || !user) {
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
      await addDoc(collection(db, 'testComments'), {
        testId: testId,
        userId: user.uid,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      });
      
      toast({
        title: "Yorum eklendi",
        description: "Yorumunuz başarıyla eklendi.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Test yükleniyor...</span>
      </div>
    );
  }

  // Test not found
  if (!test) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Test Bulunamadı</CardTitle>
            <CardDescription>İstediğiniz test mevcut değil veya kaldırılmış olabilir.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/tests")}>Tüm Testlere Dön</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No questions
  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>{test.title}</CardTitle>
            <CardDescription>Bu testte henüz soru bulunmuyor.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/tests")}>Tüm Testlere Dön</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = test.questions[currentImageIndex];

  return (
    <div className="game-layout min-h-screen bg-background">
      <div className="game-ad-left"></div>
      
      <div className="game-content">
        {/* Game Header */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{test.title}</h1>
              <p className="text-muted-foreground text-sm">{test.description}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLikeTest}
                disabled={hasLiked}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                {hasLiked ? 'Beğenildi' : 'Beğen'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/test/${testId}`;
                  if (navigator.share) {
                    navigator.share({
                      title: test.title,
                      text: test.description,
                      url: shareUrl
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast({
                      title: "Bağlantı kopyalandı",
                      description: "Test bağlantısı panoya kopyalandı."
                    });
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Paylaş
              </Button>
            </div>
          </div>
          
          {/* Game Status */}
          <div className="mb-6">
            <ScoreDisplay
              score={score}
              mode="test"
              compact={true}
              extraInfo={{
                correctAnswers: currentImageIndex,
                totalQuestions: test.questions.length,
                revealPercent: revealPercent,
                timeElapsed: timeElapsed
              }}
            />
          </div>
          
          {/* Game Content */}
          {gameStatus === 'playing' ? (
            <div className="space-y-6">
              {/* Question */}
              <div className="bg-card border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">
                  Soru {currentImageIndex + 1}/{test.questions.length}
                </h3>
                <p className="text-muted-foreground">
                  {currentQuestion.question || "Bu görselde ne görüyorsunuz?"}
                </p>
              </div>
              
              {/* Image */}
              <div className="relative">
                <ImageReveal
                  ref={imageRevealRef}
                  imageUrl={currentQuestion.imageUrl}
                  revealPercent={revealPercent}
                  className="w-full aspect-video max-h-[500px] object-contain"
                />
              </div>
              
              {/* Answer Input */}
              <div className="bg-card border rounded-lg p-4">
                <div className="flex gap-2 mb-4">
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Cevabınızı yazın..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleGuess();
                      }
                    }}
                  />
                  <Button onClick={handleGuess}>
                    <Check className="w-4 h-4 mr-2" />
                    Cevapla
                  </Button>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setRevealPercent(prev => Math.min(prev + 10, 100))}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Daha Fazla Göster
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSkip}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Bu Soruyu Atla
                  </Button>
                </div>
                
                {/* Guess History */}
                {guessHistory.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Tahminleriniz:</h4>
                    <div className="space-y-1">
                      {guessHistory.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            item.isCorrect ? 'bg-green-500 text-white' : 
                            item.isClose ? 'bg-yellow-500 text-white' : 
                            'bg-red-500 text-white'
                          }`}>
                            {item.isCorrect ? '✓' : item.isClose ? '~' : '✗'}
                          </span>
                          <span>{item.guess}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Game Finished
            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrophyIcon className="w-8 h-8 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Test Tamamlandı!</h2>
              <p className="text-muted-foreground mb-4">
                Tebrikler! {test.questions.length} sorudan {currentImageIndex + 1} tanesini doğru cevapladınız.
              </p>
              
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-primary mb-2">{score} Puan</div>
                <div className="text-sm text-muted-foreground">
                  Süre: {formatTime(timeElapsed)}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setLocation(`/test/${testId}`)}>
                  <TrophyIcon className="w-4 h-4 mr-2" />
                  Test Detaylarına Dön
                </Button>
                
                <Button variant="outline" onClick={() => setLocation('/tests')}>
                  Diğer Testlere Göz At
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="game-ad-right"></div>
    </div>
  );
}

// Add missing Eye component
const Eye = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);