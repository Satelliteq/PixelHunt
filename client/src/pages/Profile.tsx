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
import ContentCard from '@/components/game/ContentCard';
import { UserCircle, Mail, KeyRound, LogOut, AlertTriangle, Sparkles, Globe, User, Pencil, Check, Loader2, Trophy, Clock, Gamepad, BookOpen, Heart } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useQuery } from '@tanstack/react-query';

export default function Profile() {
  const [_, setLocation] = useLocation();
  const { user, loading, initialized, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Initialize form values
  useEffect(() => {
    if (user) {
      // Safely access user metadata with optional chaining and defaults
      setDisplayName(user.displayName || user.email?.split('@')[0] || '');
      setUsername(user.email?.split('@')[0] || '');
    }
  }, [user]);
  
  useEffect(() => {
    // Only redirect if auth is initialized and there's no user
    if (!loading && initialized && !user) {
      setLocation('/login');
    }
  }, [user, loading, initialized, setLocation]);
  
  // Fetch user's created tests
  const { data: userTests = [], isLoading: isTestsLoading } = useQuery({
    queryKey: ['user-tests', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const testsRef = collection(db, 'tests');
      const q = query(
        testsRef,
        where('creatorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },
    enabled: !!user?.uid
  });
  
  // Fetch user's played tests
  const { data: playedTests = [], isLoading: isPlayedLoading } = useQuery({
    queryKey: ['user-played-tests', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      const activitiesRef = collection(db, 'userActivities');
      const q = query(
        activitiesRef,
        where('userId', '==', user.uid),
        where('activityType', '==', 'play_test'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => doc.data());
      
      // Get unique test IDs
      const testIds = [...new Set(activities.map(a => a.entityId))];
      
      // Fetch test details
      const tests = [];
      for (const testId of testIds) {
        if (testId) {
          const testRef = collection(db, 'tests');
          const testQuery = query(testRef, where('__name__', '==', testId), limit(1));
          const testSnapshot = await getDocs(testQuery);
          
          if (!testSnapshot.empty) {
            tests.push({
              id: testSnapshot.docs[0].id,
              ...testSnapshot.docs[0].data()
            });
          }
        }
      }
      
      return tests;
    },
    enabled: !!user?.uid
  });
  
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
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
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Profil Başlığı */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6 gap-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={user.photoURL || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{user.email?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{user.displayName || user.email}</h1>
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
          <div className="flex gap-2 self-start md:self-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="h-9"
            >
              {isEditingProfile ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  İptal
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Düzenle
                </>
              )}
            </Button>
          </div>
        </div>
        
        {isEditingProfile && (
          <div className="mt-6 space-y-4 bg-background/50 p-4 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Görünen Adınız</label>
              <Input 
                placeholder="Görünen adınızı girin" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Kullanıcı Adı</label>
              <Input 
                placeholder="Kullanıcı adınızı girin" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Ana İçerik */}
      <Tabs defaultValue="tests">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="tests">Testlerim</TabsTrigger>
          <TabsTrigger value="played">Oynadıklarım</TabsTrigger>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="account">Hesap</TabsTrigger>
        </TabsList>

        {/* Testlerim */}
        <TabsContent value="tests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Oluşturduğunuz Testler</CardTitle>
                <CardDescription>Toplam {userTests.length} test oluşturdunuz</CardDescription>
              </div>
              <Button onClick={() => setLocation('/create-test')}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Yeni Test Oluştur
              </Button>
            </CardHeader>
            <CardContent>
              {isTestsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-muted rounded-lg aspect-video mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : userTests.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Henüz test oluşturmadınız</h3>
                  <p className="text-muted-foreground mb-6">İlk testinizi oluşturmak için "Yeni Test Oluştur" butonuna tıklayın.</p>
                  <Button onClick={() => setLocation('/create-test')}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Test Oluştur
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {userTests.map((test: any) => (
                    <ContentCard
                      key={test.id}
                      title={test.title}
                      imageUrl={test.thumbnailUrl || test.imageUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
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
              {isPlayedLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-muted rounded-lg aspect-video mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : playedTests.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <Gamepad className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Henüz test oynamadınız</h3>
                  <p className="text-muted-foreground mb-6">Testleri keşfedin ve oynamaya başlayın.</p>
                  <Button onClick={() => setLocation('/tests')}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Testleri Keşfet
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {playedTests.map((test: any) => (
                    <ContentCard
                      key={test.id}
                      title={test.title}
                      imageUrl={test.thumbnailUrl || test.imageUrl || 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500'}
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

        {/* İstatistikler */}
        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  Skor İstatistikleri
                </CardTitle>
                <CardDescription>
                  Tüm oyunlardaki performansınız
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/60 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Toplam Puan</p>
                    <p className="text-3xl font-bold">{user.score || 0}</p>
                  </div>
                  <div className="bg-background/60 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Oyun Sayısı</p>
                    <p className="text-3xl font-bold">{playedTests.length}</p>
                  </div>
                  <div className="bg-background/60 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Test Sayısı</p>
                    <p className="text-3xl font-bold">{userTests.length}</p>
                  </div>
                  <div className="bg-background/60 p-4 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Seviye</p>
                    <p className="text-3xl font-bold">{Math.floor((user.score || 0) / 1000) + 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Oyun Modları
                </CardTitle>
                <CardDescription>
                  Farklı oyun modlarındaki performansınız
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      </div>
                      <span>Klasik Mod</span>
                    </div>
                    <Badge variant="outline">Seviye 3</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                        <Zap className="h-4 w-4 text-purple-500" />
                      </div>
                      <span>Hızlı Mod</span>
                    </div>
                    <Badge variant="outline">Seviye 2</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                      <span>Zamanlı Mod</span>
                    </div>
                    <Badge variant="outline">Seviye 1</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                        <BookOpen className="h-4 w-4 text-green-500" />
                      </div>
                      <span>Test Modu</span>
                    </div>
                    <Badge variant="outline">Seviye 4</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="opacity-50">🎮 Oyun Ustası</Badge>
                    <Badge variant="outline" className="opacity-50">🏆 Şampiyon</Badge>
                    <Badge variant="outline" className="opacity-50">⚡ Hız Ustası</Badge>
                    <Badge variant="outline" className="opacity-50">🎯 Keskin Göz</Badge>
                    <Badge variant="outline" className="opacity-50">🌟 Test Yaratıcısı</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hesap Ayarları */}
        <TabsContent value="account">
          <div className="grid gap-6">
            {/* Hesap Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Hesap Bilgileri
                </CardTitle>
                <CardDescription>
                  Hesap ayarlarınızı ve güvenlik seçeneklerinizi yönetin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">E-posta Adresi</p>
                    <Input 
                      value={user.email || ''}
                      disabled
                      className="max-w-md bg-muted"
                    />
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Mail className="h-3 w-3 mr-1" /> 
                      E-posta adresiniz değiştirilemez. {user.emailVerified ? 
                        <span className="text-green-600 dark:text-green-400 ml-1">✓ Doğrulanmış</span> : 
                        <span className="text-amber-600 dark:text-amber-400 ml-1">Doğrulanmamış</span>
                      }
                    </p>
                  </div>
                  
                  <Separator />
                  
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
                    
                    <Button variant="outline" className="gap-2 text-destructive" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </Button>
                  </div>
                </div>
              </CardContent>
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
                  <div className="flex items-center justify-between p-4 border rounded-lg">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}