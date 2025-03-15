import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { FcGoogle } from 'react-icons/fc';
import { AlertTriangle, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogoWithText } from '@/components/icons/Logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Form şeması tanımları
const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"], 
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();
  const { user, loading, initialized, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordResetEmail } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa profile yönlendir
    if (!loading && user) {
      setLocation('/profile');
    }
  }, [user, loading, setLocation]);

  // Login formu
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // Şifre sıfırlama formu
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Register formu
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Google ile giriş fonksiyonu
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
  
  // E-posta ile giriş fonksiyonu
  const handleEmailLogin = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithEmail(values.email, values.password);
      setLocation('/profile');
    } catch (error) {
      console.error('Email login error:', error);
      // Hata mesajı toast ile gösterildi (AuthContext içinde)
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Kayıt ol fonksiyonu
  const handleRegister = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await signUpWithEmail(values.email, values.password, {
        username: values.username,
      });
      
      // Başarılı kayıt sonrası giriş tabına geç
      setActiveTab("login");
      registerForm.reset();
      
    } catch (error) {
      console.error('Registration error:', error);
      // Hata mesajı toast ile gösterildi (AuthContext içinde)
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Şifre sıfırlama fonksiyonu
  const handleResetPassword = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(values.email);
      setIsResetDialogOpen(false);
      resetPasswordForm.reset();
    } catch (error) {
      console.error('Password reset error:', error);
      // Hata mesajı toast ile gösterildi (AuthContext içinde)
    } finally {
      setIsSubmitting(false);
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
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <LogoWithText className="h-12" />
          </div>
          <CardTitle className="text-2xl">
            {activeTab === "login" ? "Hesabınıza giriş yapın" : "Yeni hesap oluşturun"}
          </CardTitle>
          <CardDescription>
            {activeTab === "login" 
              ? "Test çözmeye devam etmek veya yeni testler oluşturmak için giriş yapın" 
              : "Ücretsiz hesap oluşturarak test çözün ve kendi testlerinizi oluşturun"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Google ile giriş butonu */}
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full h-12 border-2 gap-2 text-base"
              onClick={handleGoogleLogin}
            >
              <FcGoogle className="h-5 w-5" />
              Google ile {activeTab === "login" ? "giriş yap" : "kayıt ol"}
            </Button>
          </div>
          
          {/* Ayraç */}
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
          
          {/* Giriş / Kayıt Tabları */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>
            
            {/* Giriş Tabı İçeriği */}
            <TabsContent value="login" className="space-y-4 mt-2">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input 
                              placeholder="E-posta adresi" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Şifre" 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                          </FormControl>
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-right">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="h-auto p-0 text-sm"
                      onClick={() => setIsResetDialogOpen(true)}
                    >
                      Şifrenizi mi unuttunuz?
                    </Button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Kayıt Tabı İçeriği */}
            <TabsContent value="register" className="space-y-4 mt-2">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input 
                              placeholder="Kullanıcı adı" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input 
                              placeholder="E-posta adresi" 
                              className="pl-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Şifre" 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                          </FormControl>
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Şifreyi onaylayın" 
                              className="pl-10 pr-10" 
                              {...field} 
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
          <p>
            {activeTab === "login" ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
            <Button 
              type="button" 
              variant="link" 
              className="h-auto p-0"
              onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
            >
              {activeTab === "login" ? "Kaydolun" : "Giriş yapın"}
            </Button>
          </p>
          <p>
            Devam ederek
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