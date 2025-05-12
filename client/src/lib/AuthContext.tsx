import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from './FirebaseContext';

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
  const { toast } = useToast();
  const firebase = useFirebase();

  return (
    <AuthContext.Provider value={{ 
      user: firebase.user, 
      loading: firebase.loading, 
      initialized: firebase.initialized, 
      signInWithGoogle: firebase.signInWithGoogle, 
      signInWithEmail: firebase.signInWithEmail,
      signUpWithEmail: firebase.signUpWithEmail,
      sendPasswordResetEmail: firebase.sendPasswordResetEmail,
      resendConfirmationEmail: firebase.resendConfirmationEmail,
      signOut: firebase.signOut 
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