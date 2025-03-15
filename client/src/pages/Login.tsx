import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { FcGoogle } from 'react-icons/fc';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogoWithText } from '@/components/icons/Logo';

export default function Login() {
  const [_, setLocation] = useLocation();
  const { user, loading, initialized, signInWithGoogle } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa profile yönlendir
    if (!loading && user) {
      setLocation('/profile');
    }
  }, [user, loading, setLocation]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Giriş hatası',
        description: 'Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>;
  }
  
  if (!initialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <LogoWithText className="h-12" />
            </div>
            <CardTitle className="text-2xl">Bağlantı Hatası</CardTitle>
            <CardDescription>
              Kimlik doğrulama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-200">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <p>Kimlik doğrulama servisi bağlantı hatası</p>
              </div>
              <p className="text-sm mt-2">
                Sunucu yapılandırması eksik olabilir. Yine de uygulamayı anonim olarak kullanabilirsiniz.
              </p>
            </div>
            <Button 
              className="w-full"
              onClick={() => setLocation('/')}
            >
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <LogoWithText className="h-12" />
          </div>
          <CardTitle className="text-2xl">Hesabınıza giriş yapın</CardTitle>
          <CardDescription>
            Test çözmeye devam etmek veya yeni testler oluşturmak için giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-12 border-2 gap-2 text-base"
              onClick={handleGoogleLogin}
            >
              <FcGoogle className="h-5 w-5" />
              Google ile devam et
            </Button>
          </div>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                veya e-posta ile
              </span>
            </div>
          </div>
          
          <div className="text-center text-muted-foreground mt-6">
            <p>E-posta ile giriş özelliği çok yakında aktif olacak</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
          <p>
            Giriş yaparak 
            <a href="/terms" className="underline mx-1">Kullanım Şartlarını</a>
            ve
            <a href="/privacy" className="underline mx-1">Gizlilik Politikasını</a>
            kabul etmiş olursunuz
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}