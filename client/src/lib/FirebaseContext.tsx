import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type FirebaseContextType = {
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

const FirebaseContext = createContext<FirebaseContextType | null>(null);

// List of authorized domains for development
const AUTHORIZED_DOMAINS = [
  'localhost',
  'localhost:3000',
  'localhost:5173',
  'pixelhunt-7afa8.firebaseapp.com',
  'zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--3000--4d9fd228.local-credentialless.webcontainer-api.io',
  'zp1v56uxy8rdx5ypatb0ockcb9tr6a-oci3--5000--4d9fd228.local-credentialless.webcontainer-api.io',
  '.webcontainer-api.io'
];

// Hardcoded admin list for offline fallback
const ADMIN_LIST = {
  emails: ['pixelhuntfun@gmail.com'],
  uids: ['108973046762004266106']
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const signInWithGoogle = async () => {
    try {
      // Check if current domain is authorized
      const currentDomain = window.location.hostname + (window.location.port ? ':' + window.location.port : '');
      const domainParts = currentDomain.split('.');
      
      // Check if domain or any parent domain is in the authorized list
      let isAuthorized = false;
      for (let i = 0; i < domainParts.length; i++) {
        const testDomain = domainParts.slice(i).join('.');
        if (AUTHORIZED_DOMAINS.includes(testDomain)) {
          isAuthorized = true;
          break;
        }
      }
      
      // Also check if the full domain is authorized
      if (AUTHORIZED_DOMAINS.includes(currentDomain)) {
        isAuthorized = true;
      }
      
      // Check if domain ends with any of the authorized domains that start with a dot
      for (const domain of AUTHORIZED_DOMAINS) {
        if (domain.startsWith('.') && currentDomain.endsWith(domain)) {
          isAuthorized = true;
          break;
        }
      }
      
      if (!isAuthorized) {
        console.error('Unauthorized domain:', currentDomain);
        throw new Error('auth/unauthorized-domain');
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      try {
        // Check if this is a new user
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Create a new user document
          await setDoc(userRef, {
            uid: result.user.uid,
            username: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            email: result.user.email,
            avatarUrl: result.user.photoURL,
            role: 'user',
            score: 0,
            banned: false,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });
        } else {
          // Update last login time
          await updateDoc(userRef, {
            lastLoginAt: serverTimestamp()
          });
        }
      } catch (error) {
        console.warn('Failed to create/update user document, but authentication succeeded:', error);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      let errorMessage = "Google ile giriş yapılırken bir hata oluştu.";
      
      if (error.code === "auth/unauthorized-domain" || error.message === "auth/unauthorized-domain") {
        errorMessage = "Bu domain üzerinden giriş yapılamıyor. Lütfen yetkili bir domain kullanın.";
        console.error('Unauthorized domain. Current domain:', window.location.hostname);
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Giriş penceresi kapatıldı. Lütfen tekrar deneyin.";
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Birden fazla giriş penceresi açıldı. Lütfen tekrar deneyin.";
      }
      
      toast({
        title: "Google ile Giriş Hatası",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      try {
        // Update last login time
        const userRef = doc(db, 'users', result.user.uid);
        await updateDoc(userRef, {
          lastLoginAt: serverTimestamp()
        });
      } catch (error) {
        console.warn('Failed to update last login time, but authentication succeeded:', error);
      }
      
      return result;
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      
      let errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
      
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Bu hesap devre dışı bırakılmıştır.";
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
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      try {
        // Create a new user document
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          username: userData?.username || email.split('@')[0],
          email: email,
          role: 'user',
          score: 0,
          banned: false,
          ...userData,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } catch (error) {
        console.warn('Failed to create user document, but account creation succeeded:', error);
      }
      
      toast({
        title: "Kayıt Başarılı",
        description: "Hesabınız oluşturuldu. Hoş geldiniz!",
        variant: "default"
      });
      
      return result;
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      
      let errorMessage = "Kayıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Bu e-posta adresi zaten kullanılıyor. Lütfen giriş yapın veya farklı bir e-posta adresi kullanın.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Şifre çok zayıf. Lütfen daha güçlü bir şifre seçin.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Geçersiz e-posta adresi. Lütfen geçerli bir e-posta adresi girin.";
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
    try {
      await firebaseSendPasswordResetEmail(auth, email);
      
      toast({
        title: "Şifre Sıfırlama E-postası Gönderildi",
        description: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      let errorMessage = "Şifre sıfırlama e-postası gönderilirken bir hata oluştu. Lütfen tekrar deneyin.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Geçersiz e-posta adresi. Lütfen geçerli bir e-posta adresi girin.";
      }
      
      toast({
        title: "Şifre Sıfırlama Hatası",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  };
  
  const resendConfirmationEmail = async (email: string) => {
    toast({
      title: "Bilgi",
      description: "Firebase'de e-posta doğrulaması otomatik olarak gönderilir ve yeniden gönderme işlemi gerekli değildir.",
      variant: "default"
    });
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Çıkış Yapıldı",
        description: "Başarıyla çıkış yaptınız.",
        variant: "default"
      });
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

  // Check if user is admin
  const checkUserAdminStatus = async (user: User) => {
    // First check hardcoded admin list
    const isAdminByList = ADMIN_LIST.emails.includes(user.email || '') || 
                         ADMIN_LIST.uids.includes(user.uid);
    
    if (isAdminByList) {
      console.log("User is admin via hardcoded admin list");
      return true;
    }

    // If online, try to check Firestore
    if (navigator.onLine) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          if (userData.role === 'admin') {
            console.log("User is admin via Firestore role");
            return true;
          }
          
          // If user is in admin list but role is not set, update it
          if (isAdminByList) {
            try {
              await updateDoc(userRef, { role: 'admin' });
            } catch (error) {
              console.warn('Failed to update admin role:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to check Firestore admin status:', error);
        // Fall back to hardcoded list result
        return isAdminByList;
      }
    } else {
      console.log("Offline mode: Using hardcoded admin list only");
    }
    
    return isAdminByList;
  };

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setLoading(true);
      
      if (authUser) {
        try {
          await checkUserAdminStatus(authUser);
          setUser(authUser);
        } catch (error) {
          console.error('Error during auth state change:', error);
          setUser(authUser); // Still set the user even if admin check fails
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
      setInitialized(true);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ 
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
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}