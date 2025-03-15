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
import { UserCircle, Mail, KeyRound, LogOut, AlertTriangle, Sparkles, Globe, User } from 'lucide-react';

export default function Profile() {
  const [_, setLocation] = useLocation();
  const { user, loading, initialized, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Initialize form values
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata.full_name || '');
      setUsername(user.user_metadata.username || '');
    }
  }, [user]);
  
  useEffect(() => {
    // Only redirect if auth is initialized and there's no user
    if (!loading && initialized && !user) {
      setLocation('/login');
    }
  }, [user, loading, initialized, setLocation]);
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setIsUpdatingProfile(true);
      // This code would normally update the Supabase user metadata
      // In a production environment with proper server-side endpoints
      
      toast({
        title: "Profil Güncellendi",
        description: "Profil bilgileriniz başarıyla güncellendi.",
        variant: "default"
      });
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
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
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
    const provider = user.app_metadata?.provider || 'email';
    const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('tr-TR') : '';
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('tr-TR') : '';
    
    return {
      provider,
      providerIcon: provider === 'google' ? '🔵 Google' : '✉️ E-posta',
      createdAt,
      lastSignIn
    };
  };
  
  const accountInfo = getAccountInfo();

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Profil Başlığı */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-6 gap-4 mb-8">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.user_metadata.avatar_url} />
          <AvatarFallback className="text-2xl">{user.email?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="space-y-1 flex-1">
          <h1 className="text-3xl font-bold">{user.user_metadata.full_name || user.email}</h1>
          <p className="text-muted-foreground text-lg">@{user.user_metadata.username || 'kullanıcı'}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {accountInfo.providerIcon} ile giriş
            </Badge>
            {user.email_confirmed_at && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                ✓ E-posta doğrulanmış
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              🗓️ {accountInfo.createdAt} tarihinde katıldı
            </Badge>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <Tabs defaultValue="tests">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="tests">Testlerim</TabsTrigger>
          <TabsTrigger value="played">Oynadıklarım</TabsTrigger>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="badges">Rozetler</TabsTrigger>
          <TabsTrigger value="account">Hesap</TabsTrigger>
        </TabsList>

        {/* Testlerim */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Oluşturduğunuz Testler</CardTitle>
              <CardDescription>Toplam 0 test oluşturdunuz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Henüz test oluşturmadınız.
              </div>
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
              <div className="text-center py-8 text-muted-foreground">
                Henüz test oynamadınız.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* İstatistikler */}
        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Skor İstatistikleri</CardTitle>
                <CardDescription>Tüm oyunlardaki performansınız</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreDisplay score={0} mode="classic" extraInfo={{ attempts: 0 }} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Zaman İstatistikleri</CardTitle>
                <CardDescription>Ortalama çözüm süreniz</CardDescription>
              </CardHeader>
              <CardContent>
                <GameTimer initialTime={0} isRunning={false} onTimeExpired={() => {}} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rozetler */}
        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle>Rozetleriniz</CardTitle>
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
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">E-posta Adresi</p>
                  <Input 
                    value={user.email || ''}
                    disabled
                    className="max-w-md bg-muted"
                  />
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Mail className="h-3 w-3 mr-1" /> 
                    E-posta adresiniz değiştirilemez. {user.email_confirmed_at ? 
                      <span className="text-green-600 dark:text-green-400 ml-1">✓ Doğrulanmış</span> : 
                      <span className="text-amber-600 dark:text-amber-400 ml-1">Doğrulanmamış</span>
                    }
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="mr-2"
                >
                  {isUpdatingProfile ? 'Güncelleniyor...' : 'Bilgileri Güncelle'}
                </Button>
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
                  <div className="flex items-center justify-between p-2 border rounded-md">
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
                  
                  <Alert variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
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
                  <User className="h-5 w-5 text-primary" />
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
                    
                    <Button variant="outline" className="gap-2 text-destructive" onClick={handleSignOut}>
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