import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from './firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  initialized: false,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

// Admin listesi
const ADMIN_LIST = {
  emails: ['pixelhuntfun@gmail.com'],
  uids: ['108973046762004266106']
};

// User tipini genişlet
export interface ExtendedUser extends FirebaseUser {
  role?: string;
  customClaims?: {
    role?: string;
    [key: string]: any;
  };
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin kontrolü
  const checkAdminStatus = async (user: ExtendedUser) => {
    try {
      // Önce hardcoded admin listesini kontrol et
      const isAdminByList = ADMIN_LIST.emails.includes(user.email || '') || 
                          ADMIN_LIST.uids.includes(user.uid);
      
      if (isAdminByList) {
        return true;
      }

      // Firestore'dan admin rolünü kontrol et
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.role === 'admin';
      }

      return false;
    } catch (error) {
      console.error('Admin kontrolü hatası:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Admin durumunu kontrol et
        const adminStatus = await checkAdminStatus(user as ExtendedUser);
        setIsAdmin(adminStatus);
        
        // Kullanıcı verilerini Firestore'dan al
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Kullanıcı nesnesini genişlet
          const extendedUser = {
            ...user,
            role: userData.role,
            customClaims: userData.customClaims
          };
          setUser(extendedUser as ExtendedUser);
        } else {
          setUser(user as ExtendedUser);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Giriş yapan kullanıcının admin durumunu kontrol et
        const adminStatus = await checkAdminStatus(result.user as ExtendedUser);
        setIsAdmin(adminStatus);
        
        toast({
          title: "Başarılı",
          description: "Google hesabınızla giriş yapıldı.",
        });
      }
    } catch (error: any) {
      console.error('Google ile giriş hatası:', error);
      
      let errorMessage = "Google ile giriş yapılırken bir hata oluştu.";
      
      if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup penceresi engellendi. Lütfen tarayıcı ayarlarınızdan popup engelleyiciyi kapatın.";
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

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
    } catch (error) {
      console.error('Çıkış hatası:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, initialized, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};