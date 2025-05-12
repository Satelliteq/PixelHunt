import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserCircle2, ThumbsUp, Share2, Play, Clock, Calendar, User, MessageSquare } from "lucide-react";
import { formatDistance } from "date-fns";
import { tr } from "date-fns/locale";
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TestDetail() {
  const { testId } = useParams<{ testId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [showShareAlert, setShowShareAlert] = useState(false);

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
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        const commentsData = [];
        for (const doc of querySnapshot.docs) {
          const commentData = doc.data();
          
          // Fetch user data if userId exists
          let userData = null;
          if (commentData.userId) {
            const userRef = doc(db, 'users', commentData.userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              userData = {
                id: userDoc.id,
                ...userDoc.data()
              };
            }
          }
          
          commentsData.push({
            id: doc.id,
            ...commentData,
            user: userData,
            createdAt: commentData.createdAt?.toDate()
          });
        }
        
        return commentsData;
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
    },
    enabled: !!testId
  });

  // Fetch test leaderboard (top 5 scores by completion time)
  const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: [`test-leaderboard-${testId}`],
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
        
        const scoresData = [];
        for (const doc of querySnapshot.docs) {
          const scoreData = doc.data();
          
          // Fetch user data if userId exists
          let userData = null;
          if (scoreData.userId) {
            const userRef = doc(db, 'users', scoreData.userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              userData = {
                id: userDoc.id,
                ...userDoc.data()
              };
            }
          }
          
          scoresData.push({
            id: doc.id,
            ...scoreData,
            user: userData,
            createdAt: scoreData.createdAt?.toDate()
          });
        }
        
        return scoresData;
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
      }
    },
    enabled: !!testId
  });

  // Fetch similar tests (same category)
  const { data: similarTests = [], isLoading: isSimilarTestsLoading } = useQuery({
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
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error("Error fetching similar tests:", error);
        return [];
      }
    },
    enabled: !!test?.categoryId
  });

  // Like test mutation
  const likeTestMutation = useMutation({
    mutationFn: async () => {
      if (!testId || !user) {
        throw new Error("Test ID or user not found");
      }
      
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
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Test beğenildi",
        description: "Bu testi beğendiniz!",
        variant: "default",
      });
      
      // Refetch test data to update like count
      refetchTest();
    },
    onError: (error) => {
      console.error("Error liking test:", error);
      toast({
        title: "Hata",
        description: "Test beğenilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!testId || !user || !commentText.trim()) {
        throw new Error("Missing required data");
      }
      
      const commentData = {
        testId: testId,
        userId: user.uid,
        comment: commentText.trim(),
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'testComments'), commentData);
      
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
      
      return docRef.id;
    },
    onSuccess: () => {
      toast({
        title: "Yorum eklendi",
        description: "Yorumunuz başarıyla eklendi.",
        variant: "default",
      });
      
      setCommentText("");
      
      // Refetch comments to update the list
      refetchComments();
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Hata",
        description: "Yorum eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Handle start test
  const handleStartTest = () => {
    navigate(`/play/${testId}`);
  };

  // Handle like test
  const handleLikeTest = () => {
    if (!user) {
      toast({
        title: "Giriş yapmalısınız",
        description: "Testi beğenmek için giriş yapmalısınız.",
        variant: "destructive",
      });
      return;
    }
    
    likeTestMutation.mutate();
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
  const handleAddComment = () => {
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
    
    addCommentMutation.mutate();
  };

  // Get filtered similar tests (exclude current test)
  const filteredSimilarTests = similarTests.filter(t => t.id !== test?.id).slice(0, 4);

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
            <Button onClick={() => navigate("/tests")}>Tüm Testlere Dön</Button>
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
          <Card>
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
                    variant="outline" 
                    size="sm" 
                    onClick={handleLikeTest}
                    className="flex gap-1 items-center"
                    disabled={likeTestMutation.isPending}
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
                <UserCircle2 className="h-5 w-5 text-muted-foreground" />
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
                          disabled={addCommentMutation.isPending}
                        >
                          {addCommentMutation.isPending ? "Gönderiliyor..." : "Gönder"}
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
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      Henüz skor kaydedilmemiş. İlk rekoru sen kır!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboard.map((score, index) => (
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Benzer Testler</CardTitle>
              <CardDescription>
                {test.category?.name || "Benzer"} kategorisindeki diğer testler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSimilarTestsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSimilarTests.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Bu kategoride başka test bulunamadı.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSimilarTests.map((similarTest) => (
                    <div 
                      key={similarTest.id} 
                      className="p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/test/${similarTest.id}`)}
                    >
                      <div className="font-medium mb-1 line-clamp-1">{similarTest.title}</div>
                      <div className="flex items-center text-xs text-muted-foreground justify-between">
                        <div>
                          <ThumbsUp className="h-3 w-3 inline mr-1" /> {similarTest.likeCount || 0}
                        </div>
                        <div>
                          <User className="h-3 w-3 inline mr-1" /> {similarTest.playCount || 0} oynama
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate(`/tests?category=${test.categoryId}`)}
              >
                Daha Fazla Test Gör
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}