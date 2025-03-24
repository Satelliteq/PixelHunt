import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Test, Category, GameScore, TestComment } from "@shared/schema";
import { UserCircle2, ThumbsUp, Share2, Play, Clock, Calendar, User, MessageSquare } from "lucide-react";
import { formatDistance } from "date-fns";
import { tr } from "date-fns/locale";

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
import { Input } from "@/components/ui/input";
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
  const { data: test, isLoading: isTestLoading } = useQuery<Test>({
    queryKey: [`/api/tests/${testId}`],
    enabled: !!testId,
  });

  // Fetch category
  const { data: category, isLoading: isCategoryLoading } = useQuery<Category>({
    queryKey: [`/api/categories/${test?.categoryId}`],
    enabled: !!test?.categoryId,
  });

  // Fetch test comments
  const { data: comments = [], isLoading: isCommentsLoading } = useQuery<TestComment[]>({
    queryKey: [`/api/tests/${testId}/comments`],
    enabled: !!testId,
  });

  // Fetch test leaderboard (top 5 scores by completion time)
  const { data: leaderboard = [], isLoading: isLeaderboardLoading } = useQuery<GameScore[]>({
    queryKey: [`/api/game/scores/top?testId=${testId}&limit=5`],
    enabled: !!testId,
  });

  // Fetch similar tests (same category)
  const { data: similarTests = [], isLoading: isSimilarTestsLoading } = useQuery<Test[]>({
    queryKey: [`/api/tests/category/${test?.categoryId}`],
    enabled: !!test?.categoryId,
  });

  // Like test mutation
  const likeTestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/tests/${testId}/like`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Test beğenildi",
        description: "Bu testi beğendiniz!",
        variant: "default",
      });
      
      // Invalidate test data to refresh like count
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}`] });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Test beğenilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { userId: number | string; comment: string }) => {
      return apiRequest(`/api/tests/${testId}/comments`, {
        method: 'POST',
        data: commentData
      });
    },
    onSuccess: () => {
      toast({
        title: "Yorum eklendi",
        description: "Yorumunuz başarıyla eklendi.",
        variant: "default",
      });
      
      setCommentText("");
      
      // Invalidate comments to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/tests/${testId}/comments`] });
    },
    onError: () => {
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
    
    addCommentMutation.mutate({
      userId: Number(user.id),
      comment: commentText
    });
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
                    {category && (
                      <Badge variant="outline">{category.name}</Badge>
                    )}
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(test.createdAt || "").toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLikeTest}
                    className="flex gap-1 items-center"
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
                    : "Kullanıcı tarafından oluşturuldu"
                  }
                </span>
              </div>
              
              {test.imageUrl && (
                <div className="mb-4 rounded-md overflow-hidden">
                  <img 
                    src={test.imageUrl} 
                    alt={test.title} 
                    className="w-full h-48 object-cover"
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
                  {comments.length === 0 ? (
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
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {test.isAnonymous ? "Anonim" : "Kullanıcı"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistance(
                                    new Date(comment.createdAt || ""), 
                                    new Date(), 
                                    { addSuffix: true, locale: tr }
                                  )}
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
                  {leaderboard.length === 0 ? (
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
                              {test.isAnonymous ? "Anonim" : 
                               (score.userId ? "Kullanıcı" : "Anonim")}
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
                {category?.name || "Benzer"} kategorisindeki diğer testler
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSimilarTests.length === 0 ? (
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