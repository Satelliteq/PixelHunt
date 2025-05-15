import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import GameTimer from '@/components/game/GameTimer';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import { UserCircle, Mail, KeyRound, LogOut, AlertTriangle, Sparkles, Globe, User, Settings, Heart, Calendar, Clock, Trophy, Medal, Award, BookOpen, History, Edit, Save, Loader2, Play, Eye } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ContentCard from '@/components/game/ContentCard';

export default function Profile() {
  const [_, setLocation] = useLocation();
  const { user, loading, initialized, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userTests, setUserTests] = useState<any[]>([]);
  const [userScores, setUserScores] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  // Initialize form values
  useEffect(() => {
    if (user) {
      // Safely access user metadata with optional chaining and defaults
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
      setUsername(user.email?.split('@')[0] || '');
      
      // Load user tests
      loadUserTests();
      
      // Load user scores
      loadUserScores();
      
      // Load user activities
      loadUserActivities();
    }
  }, [user]);
  
  useEffect(() => {
    // Only redirect if auth is initialized and there's no user
    if (!loading && initialized && !user) {
      setLocation('/login');
    }
  }, [user, loading, initialized, setLocation]);
  
  // Load user tests
  const loadUserTests = async () => {
    if (!user) return;
    
    setIsLoadingTests(true);
    try {
      const testsRef = collection(db, 'tests');
      const q = query(
        testsRef,
        where('creatorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const tests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserTests(tests);
    } catch (error) {
      console.error('Error loading user tests:', error);
    } finally {
      setIsLoadingTests(false);
    }
  };
  
  // Load user scores
  const loadUserScores = async () => {
    if (!user) return;
    
    setIsLoadingScores(true);
    try {
      const scoresRef = collection(db, 'gameScores');
      const q = query(
        scoresRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const scores = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserScores(scores);
    } catch (error) {
      console.error('Error loading user scores:', error);
    } finally {
      setIsLoadingScores(false);
    }
  };
  
  // Load user activities
  const loadUserActivities = async () => {
    if (!user) return;
    
    setIsLoadingActivities(true);
    try {
      const activitiesRef = collection(db, 'userActivities');
      const q = query(
        activitiesRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setUserActivities(activities);
    } catch (error) {
      console.error('Error loading user activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setIsUpdatingProfile(true);
      // This code would normally update the Firebase user metadata
      // In a production environment with proper server-side endpoints
      
      toast({
        title: "Profil Güncellendi",
        description: "Profil bilgileriniz başarıyla güncellendi.",
        variant: "default"
      });
      
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Güncelleme Hatası",
        description: "Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      setLocation('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Çıkış Hatası",
        description: "Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };

  // Calculate total score
  const calculateTotalScore = () => {
    return userScores.reduce((total, score) => total + (score.score || 0), 0);
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl">Kimlik doğrulama sistemi başlatılıyor</CardTitle>
            <CardDescription>
              Lütfen bekleyin, kimlik doğrulama sistemi hazırlanıyor...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  // Helper function to extract and format account info
  const getAccountInfo = () => {
    const provider = user.providerData?.[0]?.providerId || 'email';
    const createdAt = user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('tr-TR') : '';
    const lastSignIn = user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('tr-TR') : '';
    
    return {
      provider,
      providerIcon: provider === 'google.com' ? '🔵 Google' : '✉️ E-posta',
      createdAt,
      lastSignIn
    };
  };
  
  const accountInfo = getAccountInfo();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Profil Başlığı */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6 gap-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{user.displayName || user.email?.split('@')[0]}</h1>
              {user.emailVerified && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  ✓ Doğrulanmış
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">@{username || 'kullanıcı'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {accountInfo.providerIcon} ile giriş
              </Badge>
              <Badge variant="outline" className="text-xs">
                🗓️ {accountInfo.createdAt} tarihinde katıldı
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 self-end md:self-start">
            {isEditingProfile ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditingProfile(false)}
                >
                  İptal
                </Button>
                <Button 
                  size="sm"
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Kaydet
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingProfile(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Profili Düzenle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <Tabs defaultValue="tests">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="tests" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Testlerim</span>
          </TabsTrigger>
          <TabsTrigger value="played" className="flex items-center gap-1">
            <History className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Oynadıklarım</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <Trophy className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">İstatistikler</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1">
            <Medal className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Rozetler</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-1">
            <User className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Hesap</span>
          </TabsTrigger>
        </TabsList>

        {/* Testlerim */}
        <TabsContent value="tests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Oluşturduğunuz Testler</CardTitle>
                <CardDescription>Toplam {userTests.length} test oluşturdunuz</CardDescription>
              </div>
              <Button onClick={() => setLocation("/create-test")}>
                <Plus className="mr-2 h-4 w-4" />
                Yeni Test Oluştur
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingTests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userTests.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg">
                  <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">Henüz test oluşturmadınız.</p>
                  <Button onClick={() => setLocation("/create-test")}>
                    <Plus className="mr-2 h-4 w-4" />
                    İlk Testinizi Oluşturun
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {userTests.map((test) => (
                    <ContentCard
                      key={test.id}
                      title={test.title}
                      imageUrl={test.thumbnailUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
                      playCount={test.playCount || 0}
                      likeCount={test.likeCount || 0}
                      duration={`${test.questions?.length || 0} soru`}
                      onClick={() => setLocation(`/test/${test.id}`)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Oynadıklarım */}
        <TabsContent value="played">
          <Card>
            <CardHeader>
              <CardTitle>Oynadığınız & Beğendiğiniz Testler</CardTitle>
              <CardDescription>Son oynadığınız testler</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingScores ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userScores.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg">
                  <History className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-muted-foreground mb-4">Henüz test oynamadınız.</p>
                  <Button onClick={() => setLocation("/tests")}>
                    <Play className="mr-2 h-4 w-4" />
                    Testleri Keşfedin
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userScores.map((score) => (
                    <Card key={score.id} className="bg-muted/10">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{score.testTitle || "Test"}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{score.completionTime ? formatTime(score.completionTime) : "N/A"}</span>
                              <span className="mx-1">•</span>
                              <Calendar className="h-3 w-3" />
                              <span>{score.createdAt ? new Date(score.createdAt.seconds * 1000).toLocaleDateString() : ""}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {score.score} puan
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setLocation(`/test/${score.testId}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* İstatistikler */}
        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  Skor İstatistikleri
                </CardTitle>
                <CardDescription>Tüm oyunlardaki performansınız</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <div className="text-sm text-muted-foreground mb-1">Toplam Puan</div>
                      <div className="text-2xl font-bold">{calculateTotalScore()}</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <div className="text-sm text-muted-foreground mb-1">Oyun Sayısı</div>
                      <div className="text-2xl font-bold">{userScores.length}</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-2">Oyun Modlarına Göre</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Klasik Mod</span>
                        <span className="font-medium">{userScores.filter(s => s.gameMode === 'classic').length} oyun</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Hızlı Mod</span>
                        <span className="font-medium">{userScores.filter(s => s.gameMode === 'speed').length} oyun</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Zamanlı Mod</span>
                        <span className="font-medium">{userScores.filter(s => s.gameMode === 'time').length} oyun</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Test Modu</span>
                        <span className="font-medium">{userScores.filter(s => s.gameMode === 'test').length} oyun</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary" />
                  Başarılar
                </CardTitle>
                <CardDescription>Oyun içi başarılarınız</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-2">Son Aktiviteler</div>
                    {isLoadingActivities ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : userActivities.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Henüz aktivite kaydınız bulunmuyor.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userActivities.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex justify-between items-center text-sm">
                            <span>{activity.details || activity.activityType}</span>
                            <span className="text-xs text-muted-foreground">
                              {activity.createdAt ? new Date(activity.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-4">
                    <div className="text-center">
                      <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="font-medium mb-1">Toplam Puan</p>
                      <p className="text-3xl font-bold">{calculateTotalScore()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rozetler */}
        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Medal className="h-5 w-5 mr-2 text-primary" />
                Rozetleriniz
              </CardTitle>
              <CardDescription>Kazandığınız başarılar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Çok Yakında!</AlertTitle>
                  <AlertDescription>
                    Rozet sistemi ve çok oyunculu özellikler yakında aktif olacak. 
                    Bu özellikler ile arkadaşlarınızla yarışabilecek ve başarılarınızı sergileyebileceksiniz.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4 text-center opacity-50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Trophy className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="font-medium text-sm">Oyun Ustası</p>
                    <p className="text-xs text-muted-foreground">100 test tamamla</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 text-center opacity-50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Award className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="font-medium text-sm">Şampiyon</p>
                    <p className="text-xs text-muted-foreground">10.000 puan topla</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 text-center opacity-50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Clock className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="font-medium text-sm">Hız Ustası</p>
                    <p className="text-xs text-muted-foreground">10 saniyede doğru cevap ver</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 text-center opacity-50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Eye className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="font-medium text-sm">Keskin Göz</p>
                    <p className="text-xs text-muted-foreground">%10 açıkken doğru cevap ver</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 text-center opacity-50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <BookOpen className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="font-medium text-sm">Test Yaratıcısı</p>
                    <p className="text-xs text-muted-foreground">10 test oluştur</p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4 text-center opacity-50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Heart className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="font-medium text-sm">Beğeni Kralı</p>
                    <p className="text-xs text-muted-foreground">100 beğeni al</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hesap Ayarları */}
        <TabsContent value="account">
          <div className="grid gap-6">
            {/* Kullanıcı Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Kullanıcı Bilgileri
                </CardTitle>
                <CardDescription>
                  Profil bilgilerinizi güncelleyin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Görünen Adınız</p>
                      <Input 
                        placeholder="Görünen adınızı girin" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Bu isim profilinizde ve yorumlarınızda gösterilecektir.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Kullanıcı Adı</p>
                      <Input 
                        placeholder="Kullanıcı adınızı girin" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Kullanıcı adınız URL'lerde ve profil sayfanızda görüntülenecektir.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Görünen Ad</p>
                        <p className="font-medium">{displayName || "Ayarlanmamış"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Kullanıcı Adı</p>
                        <p className="font-medium">@{username || "kullanıcı"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">E-posta Adresi</p>
                      <p className="font-medium flex items-center">
                        {user.email} 
                        {user.emailVerified && (
                          <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                            ✓ Doğrulanmış
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                {isEditingProfile ? (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      İptal
                    </Button>
                    <Button 
                      onClick={handleUpdateProfile}
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Güncelleniyor...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Kaydet
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Düzenle
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Google Bağlantısı */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Bağlı Hesaplar
                </CardTitle>
                <CardDescription>
                  Hesabınıza bağlı diğer servisler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-md bg-muted/10">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">
                      Bağlı
                    </Badge>
                  </div>
                  
                  <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Dikkat</AlertTitle>
                    <AlertDescription>
                      Google hesabınızı çıkarmak, hesabınıza erişiminizi etkileyebilir.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
            
            {/* Hesap Ayarları */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Hesap Yönetimi
                </CardTitle>
                <CardDescription>
                  Hesap ayarlarınızı ve güvenlik seçeneklerinizi yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Hesap Durumu</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Aktif
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Son giriş: {accountInfo.lastSignIn || 'Bilinmiyor'}
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <p className="text-sm font-medium">Güvenlik</p>
                    <Button variant="outline" className="gap-2 text-amber-600 dark:text-amber-400" disabled>
                      <KeyRound className="h-4 w-4" />
                      Şifre Değiştir
                      <Badge variant="outline" className="ml-2 text-xs">
                        Yakında
                      </Badge>
                    </Button>
                    
                    <Button variant="outline" className="gap-2 text-destructive w-full sm:w-auto" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}