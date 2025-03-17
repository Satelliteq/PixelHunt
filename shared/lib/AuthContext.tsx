import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { User } from '../schema';

type ToastProps = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
};

// Mock toast function - this will be replaced in the client implementation
const mockToast = ({ title, description, variant }: ToastProps) => {
  console.log(`Toast (${variant || 'default'}): ${title} - ${description}`);
};

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
  const toast = mockToast; // Will be replaced in client implementation

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Try to get session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          // Get user data from our database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', sessionData.session.user.id)
            .single();
          
          if (userData && !userError) {
            setUser(userData as User);
          } else {
            // User exists in auth but not in our db
            console.warn('User not found in database');
          }
        }

        // Setup auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              // Get user data when signed in
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', session.user.id)
                .single();
              
              if (userData && !userError) {
                setUser(userData as User);
              } else {
                // Might be first sign in with OAuth, create user profile
                console.log('Creating user profile for new OAuth user');
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
          }
        );
        
        setInitialized(true);
        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        return null;
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Giriş hatası',
        description: error.message || 'Google ile giriş yapılırken bir hata oluştu',
        variant: 'destructive',
      });
      return null;
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
        return null;
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Giriş hatası',
        description: error.message || 'E-posta ile giriş yapılırken bir hata oluştu',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, userData?: Record<string, any>) => {
    try {
      // First create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData?.username || email.split('@')[0],
          },
        },
      });
      
      if (error) {
        toast({
          title: 'Kayıt hatası',
          description: error.message,
          variant: 'destructive',
        });
        return null;
      }

      if (data.user) {
        // Create user profile in our database
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              auth_id: data.user.id,
              email: email,
              username: userData?.username || email.split('@')[0],
              password: 'HASHED_IN_BACKEND', // Actual password hashing should be done in backend
              ...userData,
            },
          ])
          .select()
          .single();
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          toast({
            title: 'Kayıt hatası',
            description: 'Kullanıcı profili oluşturulurken bir hata oluştu',
            variant: 'destructive',
          });
        } else {
          setUser(profileData as User);
        }
      }
      
      return data;
    } catch (error: any) {
      toast({
        title: 'Kayıt hatası',
        description: error.message || 'Kayıt olurken bir hata oluştu',
        variant: 'destructive',
      });
      return null;
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
        return;
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
        return;
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
        return;
      }
      
      setUser(null);
      toast({
        title: 'Çıkış yapıldı',
        description: 'Başarıyla çıkış yaptınız',
      });
    } catch (error: any) {
      toast({
        title: 'Çıkış hatası',
        description: error.message || 'Çıkış yapılırken bir hata oluştu',
        variant: 'destructive',
      });
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
  return useContext(AuthContext);
}