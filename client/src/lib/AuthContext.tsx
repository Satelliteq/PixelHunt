import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signInWithGoogle: () => Promise<void>;
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      // User state will be updated via the auth state change listener
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Giriş Hatası",
        description: "Google ile giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.",
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
    <AuthContext.Provider value={{ user, loading, initialized, signInWithGoogle, signOut }}>
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