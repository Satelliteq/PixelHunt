import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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

export default function TestDetail() {
  const [, setLocation] = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [showShareAlert, setShowShareAlert] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Fetch test data
  const { data: test, isLoading: isTestLoading, refetch: refetchTest } = useQuery({
    queryKey: [`test-${testId}`],
    queryFn: async () => {
      if (!testId) return null;
      
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (!testDoc.exists()) return null;
        
        const testData = testDoc.data();
        
        // Fetch category if categoryId exists
        let category = null;
        if (testData.categoryId) {
          const categoryDoc = await getDoc(doc(db, 'categories', testData.categoryId));
          if (categoryDoc.exists()) {
            category = {
              id: categoryDoc.id,
              ...categoryDoc.data()
            };
          }
        }
        
        // Fetch creator if creatorId exists and test is not anonymous
        let creator = null;
        if (testData.creatorId && !testData.isAnonymous) {
          const userDoc = await getDoc(doc(db, 'users', testData.creatorId));
          if (userDoc.exists()) {
            creator = {
              id: userDoc.id,
              ...userDoc.data()
            };
          }
        }
        
        // Increment play count
        await updateDoc(doc(db, 'tests', testId), {
          playCount: increment(1)
        });
        
        return {
          id: testDoc.id,
          ...testData,
          category,
          creator
        };
      } catch (error) {
        console.error("Error fetching test:", error);
        throw error;
      }
    },
    enabled: !!testId
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
        
        const querySnapshot = await getDocs(commentsQuery);
        
        const commentsData = [];
        for (const doc of querySnapshot.docs) {
          const commentData = {
            id: doc.id,
            ...doc.data()
          };
          
          // Fetch user data if userId exists
          if (commentData.userId) {
            const userDoc = await getDoc(doc(db, 'users', commentData.userId));
            if (userDoc.exists()) {
              commentData.user = {
                id: userDoc.id,
                ...userDoc.data()
              };
            }
          }
          
          commentsData.push(commentData);
        }
        
        return commentsData;
      } catch (error) {
        console.error("Error fetching test comments:", error);
        throw error;
      }
    },
    enabled: !!testId
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
        
        const querySnapshot = await getDocs(scoresQuery);
        
        const scoresData = [];
        for (const doc of querySnapshot.docs) {
          const scoreData = {
            id: doc.id,
            ...doc.data()
          };
          
          // Fetch user data if userId exists
          if (scoreData.userId) {
            const userDoc = await getDoc(doc(db, 'users', scoreData.userId));
            if (userDoc.exists()) {
              scoreData.user = {
                id: userDoc.id,
                ...userDoc.data()
              };
            }
          }
          
          scoresData.push(scoreData);
        }
        
        return scoresData;
      } catch (error) {
        console.error("Error fetching top scores:", error);
        throw error;
      }
    },
    enabled: !!testId
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
            where('activityType', '==', 'like_test')
          );
          
          const querySnapshot = await getDocs(likesQuery);
          setHasLiked(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking if user liked test:", error);
        }
      };
      
      checkUserLike();
    }
  }, [user, testId]);

  // Handle start test
  const handleStartTest = () => {
    setLocation(`/play/${testId}`);
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
        variant: "default",
      });
      
      // Refetch test data to update like count
      refetchTest();
    } catch (error) {
      console.error("Error liking test:", error);
      toast({
        title: "Hata",
        description: "Test beğenilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  // Handle share test
  const handleShareTest = () => {
    const shareUrl = `${window.location.origin}/test/${testId}`;
    
    // Try to use share API if available
    if (navigator.share) {
      navigator.share({
        title: test?.title || 'Test Paylaşımı',
        text: test?.description || '',
        url: shareUrl,
      }).catch(() => {
        // Fallback - copy to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Copy to clipboard
      copyToClipboard(shareUrl);
    }
  };
  
  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShareUrl(text);
      setShowShareAlert(true);
      
      toast({
        title: "Bağlantı kopyalandı",
        description: "Test bağlantısı panoya kopyalandı.",
        variant: "default",
      });
      
      // Hide alert after 3 seconds
      setTimeout(() => {
        setShowShareAlert(false);
      }, 3000);
    });
  };

  // Handle add comment
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
      
      // Refetch comments
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

  // Format time display
  const formatTimeDisplay = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get filtered similar tests (exclude current test)
  const filteredSimilarTests = [];

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

  return (
    <div className="container py-8">
      {/* Share alert */}
      {showShareAlert && (
        <Alert className="mb-4">
          <Share2 className="h-4 w-4" />
          <AlertTitle>Bağlantı Kopyalandı</AlertTitle>
          <AlertDescription>
            Test bağlantısı: <code className="bg-muted px-1 py-0.5 rounded text-sm">{shareUrl}</code>
          </AlertDescription>
        </Alert>
      )}
      
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
                      {test.createdAt ? new Date(test.createdAt.toDate()).toLocaleDateString() : ""}
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
                    onClick={handleStartTest}
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
                                  {comment.createdAt ? formatDistance(
                                    new Date(comment.createdAt.toDate()), 
                                    new Date(), 
                                    { addSuffix: true, locale: tr }
                                  ) : ""}
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
                              {score.completionTime ? formatTimeDisplay(score.completionTime) : "--:--"}
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

// Add missing components
const Alert = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-muted/30 border rounded-lg p-4 ${className || ''}`}>
    {children}
  </div>
);

const AlertTitle = ({ children }: { children: React.ReactNode }) => (
  <h5 className="text-base font-semibold mb-1">{children}</h5>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm text-muted-foreground">{children}</div>
);

const Avatar = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-full overflow-hidden ${className || ''}`}>
    {children}
  </div>
);

const AvatarImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => (
  <img src={src} alt={alt} className={`w-full h-full object-cover ${className || ''}`} />
);

const AvatarFallback = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-muted flex items-center justify-center text-muted-foreground font-medium ${className || ''}`}>
    {children}
  </div>
);

// Simplified formatDistance function
const formatDistance = (date: Date, baseDate: Date, options: { addSuffix: boolean, locale: any }) => {
  const seconds = Math.floor((baseDate.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'az önce';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dakika önce`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay önce`;
  
  const years = Math.floor(months / 12);
  return `${years} yıl önce`;
};

// Simplified tr locale
const tr = {};