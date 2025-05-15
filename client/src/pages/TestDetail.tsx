import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, Heart, Share2, Play, Clock, Calendar, User, MessageSquare, Loader2,
  ThumbsUp, Check, X, Trophy, Eye, UserCircle2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDistance } from 'date-fns';
import { tr } from 'date-fns/locale';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, updateDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TestDetail() {
  const [, setLocation] = useLocation();
  const { testId } = useParams<{ testId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
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
        
        // Fetch creator if creatorId exists and test is not anonymous
        let creator = null;
        if (testData.creatorId && !testData.isAnonymous) {
          const userRef = doc(db, 'users', testData.creatorId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            creator = {
              id: userDoc.id,
              ...userDoc.data()
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
          category,
          creator
        };
      } catch (error) {
        console.error("Error fetching test:", error);
        return null;
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
        const commentsRef = collection(db, 'testComments');
        const q = query(
          commentsRef,
          where('testId', '==', testId),
          orderBy('createdAt', 'desc'),
          limit(20)
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
    enabled: !!testId
  });
  
  // Fetch top scores
  const { data: topScores = [], isLoading: isLeaderboardLoading } = useQuery({
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
    enabled: !!testId
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

  // Like test mutation
  const handleLikeTest = async () => {
    if (!testId || !user) {
      toast({
        title: "Giriş Yapmalısınız",
        description: "Testi beğenmek için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Check if user has already liked this test
      const likesRef = collection(db, 'userActivities');
      const q = query(
        likesRef,
        where('userId', '==', user.uid),
        where('entityId', '==', testId),
        where('activityType', '==', 'like_test'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({
          title: "Zaten Beğendiniz",
          description: "Bu testi daha önce beğendiniz.",
          variant: "default",
        });
        return;
      }
      
      // Update test like count
      const testRef = doc(db, 'tests', testId);
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
        title: "Test Beğenildi",
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

  // Add comment
  const handleAddComment = async () => {
    if (!testId || !user) {
      toast({
        title: "Giriş Yapmalısınız",
        description: "Yorum yapmak için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }
    
    if (!commentText.trim()) {
      toast({
        title: "Yorum Boş Olamaz",
        description: "Lütfen bir yorum yazın.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingComment(true);
    
    try {
      // Add comment
      await addDoc(collection(db, 'testComments'), {
        testId: testId,
        userId: user.uid,
        comment: commentText.trim(),
        createdAt: serverTimestamp(),
        user: {
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL
        }
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
        title: "Yorum Eklendi",
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
        title: "Bağlantı Kopyalandı",
        description: "Test bağlantısı panoya kopyalandı.",
        variant: "default",
      });
      
      // Hide alert after 3 seconds
      setTimeout(() => {
        setShowShareAlert(false);
      }, 3000);
    });
  };

  // Handle start test
  const handleStartTest = () => {
    setLocation(`/play/${testId}`);
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isTestLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Test yükleniyor...</span>
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

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test details */}
        <div className="lg:col-span-2">
          <Card className="border shadow-md overflow-hidden">
            {test.thumbnailUrl && (
              <div className="relative w-full h-48 md:h-64">
                <img 
                  src={test.thumbnailUrl} 
                  alt={test.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-4 w-full">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {test.category && (
                        <Badge variant="outline" className="bg-primary/20 border-primary/30 text-primary-foreground">
                          {test.category.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-background/20 border-background/30">
                        {test.questions?.length || 0} Soru
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <CardHeader className={test.thumbnailUrl ? "pt-2" : ""}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{test.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {test.createdAt ? new Date(test.createdAt.seconds * 1000).toLocaleDateString() : ""}
                    </span>
                    
                    <span className="mx-1">•</span>
                    
                    <User className="h-4 w-4" />
                    <span>
                      {test.isAnonymous || !test.creatorId 
                        ? "Anonim" 
                        : test.creator 
                          ? test.creator.displayName || test.creator.username || "Kullanıcı"
                          : "Kullanıcı"
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 self-end md:self-start">
                  <Button 
                    variant={hasLiked ? "default" : "outline"}
                    size="sm" 
                    onClick={handleLikeTest}
                    className="flex gap-1 items-center"
                    disabled={hasLiked}
                  >
                    <ThumbsUp className="h-4 w-4" /> 
                    <span>{test.likeCount || 0}</span>
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
              <p className="text-muted-foreground mb-6">{test.description}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-sm text-muted-foreground mb-1">Oynanma</div>
                  <div className="font-semibold flex items-center justify-center">
                    <Play className="h-4 w-4 mr-1 text-primary" />
                    {test.playCount || 0}
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-sm text-muted-foreground mb-1">Beğeni</div>
                  <div className="font-semibold flex items-center justify-center">
                    <Heart className="h-4 w-4 mr-1 text-red-500" />
                    {test.likeCount || 0}
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-sm text-muted-foreground mb-1">Yorum</div>
                  <div className="font-semibold flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 mr-1 text-blue-500" />
                    {comments.length}
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleStartTest}
              >
                <Play className="mr-2 h-5 w-5" /> Testi Başlat
              </Button>
            </CardContent>
          </Card>
          
          {/* Tabs for comments and leaderboard */}
          <Tabs defaultValue="comments" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments">Yorumlar</TabsTrigger>
              <TabsTrigger value="leaderboard">En İyi Skorlar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments" className="mt-4">
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
                    <div className="text-center py-8 bg-muted/20 rounded-lg">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-muted-foreground">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
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
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {comment.user?.displayName || comment.user?.email?.split('@')[0] || "Anonim"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {comment.createdAt ? formatDistance(
                                    new Date(comment.createdAt), 
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
                    <div className="text-center py-8 bg-muted/20 rounded-lg">
                      <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-muted-foreground">Henüz skor kaydedilmemiş. İlk rekoru sen kır!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topScores.map((score, index) => (
                        <div 
                          key={score.id} 
                          className={`flex justify-between items-center p-3 rounded-md ${
                            index === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 
                            index === 1 ? 'bg-zinc-400/10 border border-zinc-400/20' :
                            index === 2 ? 'bg-amber-800/10 border border-amber-800/20' :
                            'bg-muted/30'
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
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Creator card */}
          <Card className="border shadow-md mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <UserCircle2 className="h-5 w-5 mr-2 text-primary" /> Oluşturan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {test.isAnonymous || !test.creatorId ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Anonim Kullanıcı</p>
                    <p className="text-xs text-muted-foreground">Kullanıcı bilgileri gizlenmiş</p>
                  </div>
                </div>
              ) : test.creator ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {test.creator.photoURL ? (
                      <AvatarImage src={test.creator.photoURL} alt={test.creator.displayName || 'User'} />
                    ) : (
                      <AvatarFallback>{test.creator.displayName?.[0] || test.creator.email?.[0] || 'U'}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{test.creator.displayName || test.creator.username || "Kullanıcı"}</p>
                    <p className="text-xs text-muted-foreground">Test Oluşturucu</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Kullanıcı</p>
                    <p className="text-xs text-muted-foreground">Kullanıcı bilgisi bulunamadı</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Test info card */}
          <Card className="border shadow-md mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Test Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Kategori</span>
                <span className="font-medium">{test.category?.name || "Genel"}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Soru Sayısı</span>
                <span className="font-medium">{test.questions?.length || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Oluşturulma</span>
                <span className="font-medium">
                  {test.createdAt ? new Date(test.createdAt.seconds * 1000).toLocaleDateString() : ""}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Oynanma</span>
                <span className="font-medium">{test.playCount || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Beğeni</span>
                <span className="font-medium">{test.likeCount || 0}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Similar tests */}
          <Card className="border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Benzer Testler</CardTitle>
              <CardDescription>
                {test.category?.name || "Benzer"} kategorisindeki diğer testler
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be populated with similar tests */}
                <div className="text-center py-4 text-muted-foreground">
                  Bu kategoride başka test bulunamadı.
                </div>
              </CardContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}