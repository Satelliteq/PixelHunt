import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import GameTimer from '@/components/game/GameTimer';
import ScoreDisplay from '@/components/game/ScoreDisplay';
import { Sparkles } from 'lucide-react';

export default function Profile() {
  const [_, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Profil Başlığı */}
      <div className="flex items-center space-x-4 mb-8">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.user_metadata.avatar_url} />
          <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{user.user_metadata.full_name || user.email}</h1>
          <p className="text-muted-foreground">@{user.user_metadata.username || 'kullanıcı'}</p>
        </div>
      </div>

      {/* Ana İçerik */}
      <Tabs defaultValue="tests">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="tests">Testlerim</TabsTrigger>
          <TabsTrigger value="played">Oynadıklarım</TabsTrigger>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="badges">Rozetler</TabsTrigger>
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
      </Tabs>
    </div>
  );
}