import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getAuthHeaders: (instagramAccountId?: string) => Promise<Record<string, string>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  getAuthHeaders: async () => ({})
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Create or update user document in Firestore
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          
          if (!docSnap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              plan: 'Free',
            });
          }
        } catch (e) {
          console.warn("Firestore client-side user document sync bypassed (verify console security rules):", e);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getAuthHeaders = async (instagramAccountId?: string): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const firebaseUser = user ?? auth.currentUser;
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      } catch (err) {
        console.error('Error fetching Firebase ID token:', err);
      }
    }

    // Dev-only sandbox fallback (never send IG id as Bearer in production)
    if (!headers['Authorization'] && !import.meta.env.PROD) {
      const savedIgId = instagramAccountId || localStorage.getItem('assistly_ig_account_id');
      if (savedIgId) {
        headers['Authorization'] = `Bearer ${savedIgId}`;
      }
    }

    const igId = instagramAccountId || localStorage.getItem('assistly_ig_account_id');
    if (igId) {
      headers['X-Instagram-Account-Id'] = igId;
    }

    return headers;
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};
