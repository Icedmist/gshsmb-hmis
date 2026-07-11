import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  loginUser,
  logoutUser,
  getUserProfile,
  changeUserPassword,
  resetUserPassword,
  onAuthStateChange,
  UserProfile,
} from '../lib/auth';
import { UserRole } from '../types';

interface AuthContextType {
  user: (Omit<UserProfile, 'firebase_uid' | 'created_at' | 'updated_at'> & { id: string }) | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (current: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile && profile.status === 'active') {
            const { firebase_uid, created_at, updated_at, ...safe } = profile;
            setUser(safe);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { profile } = await loginUser(email, password);
    const { firebase_uid, created_at, updated_at, ...safe } = profile;
    setUser(safe);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const changePassword = async (current: string, newPassword: string) => {
    await changeUserPassword(current, newPassword);
  };

  const resetPassword = async (email: string) => {
    await resetUserPassword(email);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role as UserRole);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, resetPassword, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
