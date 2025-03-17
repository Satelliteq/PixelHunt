// This file is a wrapper around shared/lib/AuthContext.tsx for compatibility
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

// Basic context type
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

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initialized: false,
  signInWithGoogle: async () => null,
  signInWithEmail: async () => null,
  signUpWithEmail: async () => null,
  sendPasswordResetEmail: async () => {},
  resendConfirmationEmail: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  // Initialize auth on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        setInitialized(true);
        
        // Get current session if any
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setUser(data.session.user);
        }

        // Set up auth change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              setUser(session.user);
            } else {
              setUser(null);
            }
            setLoading(false);
          }
        );
        
        setLoading(false);
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        toast({
          title: 'Giriş hatası',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      return true;
    } catch (error: any) {
      toast({
        title: 'Giriş hatası',
        description: error.message || 'Google ile giriş yapılırken bir hata oluştu',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: 'Giriş hatası',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Giriş hatası',
        description: error.message || 'E-posta ile giriş yapılırken bir hata oluştu',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, userData?: Record<string, any>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {},
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        toast({
          title: 'Kayıt hatası',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: "Kayıt Başarılı",
        description: "Hesabınız oluşturuldu. Lütfen e-posta adresinizi kontrol edin ve hesabınızı doğrulayın.",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Kayıt hatası',
        description: error.message || 'Kayıt olurken bir hata oluştu',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Reset password
  const sendPasswordResetEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: 'Şifre sıfırlama hatası',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: 'E-posta gönderildi',
        description: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
      });
    } catch (error: any) {
      toast({
        title: 'Şifre sıfırlama hatası',
        description: error.message || 'Şifre sıfırlama işlemi başlatılırken bir hata oluştu',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Resend confirmation email
  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) {
        toast({
          title: 'E-posta gönderim hatası',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      toast({
        title: 'E-posta gönderildi',
        description: 'Doğrulama e-postası tekrar gönderildi',
      });
    } catch (error: any) {
      toast({
        title: 'E-posta gönderim hatası',
        description: error.message || 'Doğrulama e-postası gönderilirken bir hata oluştu',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: 'Çıkış hatası',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      
      setUser(null);
    } catch (error: any) {
      toast({
        title: 'Çıkış hatası',
        description: error.message || 'Çıkış yapılırken bir hata oluştu',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialized,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordResetEmail,
        resendConfirmationEmail,
        signOut,
      }}
    >
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