import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Heart, Share2, Play, Clock, Calendar, User, MessageSquare, Loader2,
  ThumbsUp, Check, X, Trophy
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  
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
        
        const testData = testDoc.data();
        
        // Increment play count
        await updateDoc(doc(db, 'tests', testId), {
          playCount: increment(1)
        });
        
        return {
          id: testDoc.id,
          ...testData
        };
      } catch (error) {
        console.error('Error fetching test:', error);
        return null;
      }
    }
  });

  // Fetch test comments
  const { data: comments = [], isLoading: isCommentsLoading, refetch: refetchComments } = useQuery({
    queryKey: [`test-comments-${testId}`],
    queryFn: async () => {
      if (!testId) return [];
      
      try {
        const commentsQuery = query(
          collection(db, 'testComments'),
          where('testId', '==', testId),
          orderBy('createdAt', 'desc')
        );
        
        const commentsSnapshot = await getDocs(commentsQuery);
        
        return commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
      } catch (error) {
        console.error('Error fetching test comments:', error);
        return [];
      }
    }
  });

  // Fetch top scores
  const { data: topScores = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: [`top-scores-${testId}`],
    queryFn: async () => {
      if (!testId) return [];
      
      try {
        const scoresQuery = query(
          collection(db, 'gameScores'),
          where('testId', '==', testId),
          orderBy('score', 'desc'),
          limit(5)
        );
        
        const scoresSnapshot = await getDocs(scoresQuery);
        
        return scoresSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error('Error fetching top scores:', error);
        return [];
      }
    }
  });

  // Check if user has already liked this test
  useEffect(() => {
    if (user && testId) {
      const checkUserLike = async () => {
        try {
          const likesQuery = query(
            collection(db, 'userActivities'),
            where('userId', '==', user.uid),
            where('entityId', '==', testId),
            where('activityType', '==', 'like_test'),
            limit(1)
          );
          
          const likesSnapshot = await getDocs(likesQuery);
          setHasLiked(!likesSnapshot.empty);
        } catch (error) {
          console.error('Error checking if user liked test:', error);
        }
      };
      
      checkUserLike();
    }
  }, [user, testId]);

  // Start timer when test is loaded
  useEffect(() => {
    if (test && gameStatus === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [test, gameStatus]);

  // Set correct answers when test changes
  useEffect(() => {
    if (test && test.questions && test.questions.length > 0) {
      const currentQuestion = test.questions[currentImageIndex];
      correctAnswersRef.current = currentQuestion.answers || [];
    }
  }, [test, currentImageIndex]);

  // Handle user guess
  const handleGuess = () => {
    if (!userAnswer.trim() || gameStatus !== 'playing') return;
    
    const currentQuestion = test?.questions?.[currentImageIndex];
    if (!currentQuestion) return;
    
    const { isCorrect, isClose } = checkAnswer(userAnswer, correctAnswersRef.current);
    
    // Add to guess history
    setGuessHistory(prev => [
      { guess: userAnswer, isCorrect, isClose },
      ...prev
    ]);
    
    if (isCorrect) {
      // Play correct sound
      playSoundEffect('correct');
      
      // Show correct guess effect
      if (imageRevealRef.current) {
        imageRevealRef.current.showCorrectGuessEffect();
      }
      
      // Calculate score based on reveal percentage
      const earnedScore = calculateScore(revealPercent);
      setScore(prev => prev + earnedScore);
      
      // Move to next question or finish game
      setTimeout(() => {
        if (currentImageIndex < (test?.questions?.length || 0) - 1) {
          setCurrentImageIndex(prev => prev + 1);
          setRevealPercent(30);
          setUserAnswer('');
        } else {
          // Game finished
          setGameStatus('finished');
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          // Save game score
          saveGameScore(score + earnedScore, true);
        }
      }, 1500);
    } else {
      // Play incorrect sound
      playSoundEffect('incorrect');
      
      // Increase reveal percentage
      setRevealPercent(prev => Math.min(prev + 10, 100));
      
      // Clear input
      setUserAnswer('');
    }
  };

  // Handle skip question
  const handleSkip = () => {
    if (gameStatus !== 'playing') return;
    
    const currentQuestion = test?.questions?.[currentImageIndex];
    if (!currentQuestion) return;
    
    // Show correct answer
    toast({
      title: "Soru atlandı",
      description: `Doğru cevap: ${correctAnswersRef.current[0]}`,
      variant: "destructive",
    });
    
    // Move to next question or finish game
    if (currentImageIndex < (test?.questions?.length || 0) - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setRevealPercent(30);
      setUserAnswer('');
    } else {
      // Game finished
      setGameStatus('finished');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Save game score
      saveGameScore(score, false);
    }
  };

  // Save game score
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

  // Like test
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
        variant: "default",
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

  // Share test
  const handleShareTest = () => {
    const shareUrl = `${window.location.origin}/test/${testId}`;
    
    if (navigator.share) {
      navigator.share({
        title: test?.title || 'Pixelhunt Test',
        text: test?.description || 'Bu testi çözmeyi deneyin!',
        url: shareUrl,
      }).catch(err => {
        console.error('Error sharing:', err);
        copyToClipboard(shareUrl);
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Bağlantı kopyalandı",
        description: "Test bağlantısı panoya kopyalandı.",
        variant: "default",
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast({
        title: "Hata",
        description: "Bağlantı kopyalanırken bir hata oluştu.",
        variant: "destructive",
      });
    });
  };

  // Add comment
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
      
      setCommentText("");
      refetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
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
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
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
          <CardFooter>
            <Button onClick={() => setLocation("/tests")}>Tüm Testlere Dön</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Current question
  const currentQuestion = test.questions?.[currentImageIndex];

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Test details */}
        <div className="md:col-span-2">
          <Card className="border-primary/10 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{test.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {test.category && (
                      <Badge variant="outline">{test.category.name}</Badge>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {test.createdAt ? new Date(test.createdAt.seconds * 1000).toLocaleDateString() : ""}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={hasLiked ? "default" : "outline"}
                    size="sm" 
                    onClick={handleLikeTest}
                    className="flex gap-1 items-center"
                    disabled={hasLiked}
                  >
                    <ThumbsUp className="h-4 w-4" /> {test.likeCount || 0}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShareTest}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {test.isAnonymous || !test.creatorId 
                    ? "Anonim kullanıcı tarafından oluşturuldu" 
                    : test.creator 
                      ? `${test.creator.displayName || test.creator.username || "Kullanıcı"} tarafından oluşturuldu`
                      : "Kullanıcı tarafından oluşturuldu"
                  }
                </span>
              </div>
              
              {test.thumbnailUrl && (
                <div className="mb-4 rounded-md overflow-hidden">
                  <img 
                    src={test.thumbnailUrl} 
                    alt={test.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500";
                    }}
                  />
                </div>
              )}
              
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{test.playCount || 0} Oynama</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{comments.length} Yorum</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">{test.description}</p>
                
                <div className="w-full">
                  <Button 
                    className="w-full mt-4" 
                    size="lg"
                    onClick={() => setLocation(`/play/${testId}`)}
                  >
                    <Play className="mr-2 h-4 w-4" /> Testi Başlat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tabs for comments and leaderboard */}
          <Tabs defaultValue="comments" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments">Yorumlar</TabsTrigger>
              <TabsTrigger value="leaderboard">En İyi Skorlar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments" className="mt-4 space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {/* Comment input */}
                  {user && (
                    <div className="mb-6 space-y-2">
                      <Textarea
                        placeholder="Yorum yaz..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="resize-none"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleAddComment}
                          disabled={isAddingComment || !commentText.trim()}
                        >
                          {isAddingComment ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Gönderiliyor...
                            </>
                          ) : (
                            "Gönder"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Comments list */}
                  {isCommentsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Henüz yorum yapılmamış. İlk yorumu sen yap!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment, index) => (
                        <div key={comment.id} className="space-y-2">
                          {index > 0 && <Separator />}
                          <div className="flex gap-3 pt-2">
                            <Avatar className="h-8 w-8">
                              {comment.user?.photoURL ? (
                                <AvatarImage src={comment.user.photoURL} alt={comment.user.displayName || 'User'} />
                              ) : (
                                <AvatarFallback>{comment.user?.displayName?.[0] || comment.user?.email?.[0] || 'U'}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {comment.user?.displayName || comment.user?.email?.split('@')[0] || "Anonim"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
                                </span>
                              </div>
                              <p className="text-sm">{comment.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="leaderboard" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">En Hızlı Çözenler</CardTitle>
                  <CardDescription>Bu testi en hızlı bitiren ilk 5 kullanıcı</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLeaderboardLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : topScores.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      Henüz skor kaydedilmemiş. İlk rekoru sen kır!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topScores.map((score, index) => (
                        <div 
                          key={score.id} 
                          className={`flex justify-between items-center p-3 rounded-md ${
                            index === 0 ? 'bg-amber-500/10' : 'bg-card-secondary/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-amber-500 text-amber-950' : 
                              index === 1 ? 'bg-zinc-400 text-zinc-950' :
                              index === 2 ? 'bg-amber-800 text-amber-100' :
                              'bg-zinc-700 text-zinc-100'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="font-medium">
                              {score.user?.displayName || score.user?.email?.split('@')[0] || "Anonim"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {score.completionTime ? formatTime(score.completionTime) : "--:--"}
                            </Badge>
                            <div className="w-16 text-right font-mono">{score.score} puan</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Similar tests section */}
        <div>
          <Card className="border-primary/10 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Benzer Testler</CardTitle>
              <CardDescription>
                {test.category?.name || "Benzer"} kategorisindeki diğer testler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                Bu kategoride başka test bulunamadı.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}