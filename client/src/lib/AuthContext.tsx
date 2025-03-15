import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signInWithGoogle: () => Promise<any>;
  signInWithEmail: (email: string, password: string) => Promise<any>;
  signUpWithEmail: (email: string, password: string, userData?: Record<string, any>) => Promise<any>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Bağlantı Hatası",
        description: "Kimlik doğrulama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      throw new Error('Supabase is not configured');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      // Google OAuth, kullanıcıyı yönlendirme URL'sine yönlendirir
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Google ile Giriş Hatası",
        description: "Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Bağlantı Hatası",
        description: "Kimlik doğrulama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      throw new Error('Supabase is not configured');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      // User state will be updated via the auth state change listener
      return data;
    } catch (error) {
      console.error('Error signing in with email:', error);
      let errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
      
      // @ts-ignore
      if (error.code === "email_not_confirmed") {
        errorMessage = "E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol ediniz veya yeni bir doğrulama e-postası isteyiniz.";
      }
      // @ts-ignore
      else if (error.message && error.message.includes("Invalid login credentials")) {
        errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
      }
      
      toast({
        title: "Giriş Hatası",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const signUpWithEmail = async (email: string, password: string, userData?: Record<string, any>) => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Bağlantı Hatası",
        description: "Kimlik doğrulama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      throw new Error('Supabase is not configured');
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {},
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Kayıt Başarılı",
        description: "Hesabınız oluşturuldu. Lütfen e-posta adresinizi kontrol edin ve hesabınızı doğrulayın.",
        variant: "default"
      });
      
      return data;
    } catch (error) {
      console.error('Error signing up with email:', error);
      let errorMessage = "Kayıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.";
      
      // @ts-ignore
      if (error.message && error.message.includes("User already registered")) {
        errorMessage = "Bu e-posta adresi zaten kullanılıyor. Lütfen giriş yapın veya farklı bir e-posta adresi kullanın.";
      }
      
      toast({
        title: "Kayıt Hatası",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const sendPasswordResetEmail = async (email: string) => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Bağlantı Hatası",
        description: "Kimlik doğrulama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      throw new Error('Supabase is not configured');
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      
      toast({
        title: "Şifre Sıfırlama E-postası Gönderildi",
        description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast({
        title: "Şifre Sıfırlama Hatası",
        description: "Şifre sıfırlama e-postası gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const resendConfirmationEmail = async (email: string) => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Bağlantı Hatası",
        description: "Kimlik doğrulama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      throw new Error('Supabase is not configured');
    }
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      toast({
        title: "Doğrulama E-postası Gönderildi",
        description: "Yeni bir doğrulama e-postası adresinize gönderildi. Lütfen e-postanızı kontrol edin.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error resending confirmation email:', error);
      toast({
        title: "E-posta Gönderme Hatası",
        description: "Doğrulama e-postası gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      toast({
        title: "Bağlantı Hatası",
        description: "Kimlik doğrulama servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive"
      });
      setUser(null);
      return;
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Çıkış Hatası",
        description: "Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Check if env vars are loaded (wait for them if needed)
        if (!isSupabaseConfigured()) {
          // Wait for env vars to be available via window.__ENV__
          const checkEnvInterval = setInterval(() => {
            if (isSupabaseConfigured()) {
              clearInterval(checkEnvInterval);
              setInitialized(true);
              initializeAuth(); // Retry initialization
            }
          }, 300);
          
          // Set a timeout to stop checking after a few seconds
          setTimeout(() => {
            clearInterval(checkEnvInterval);
            console.error('Timed out waiting for Supabase configuration');
            setLoading(false);
          }, 5000);
          
          return;
        }
        
        // Once configured, initialize the auth state
        setInitialized(true);
        
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(data.session.user);
        }
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
          setLoading(false);
        });
        
        setLoading(false);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      initialized, 
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      sendPasswordResetEmail,
      resendConfirmationEmail,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}