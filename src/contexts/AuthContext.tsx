import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
import { auth } from '../lib/firebase';
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
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    const isActive = (profile: any) => {
      if (!profile) return false;
      if (profile.status !== undefined) return profile.status === 'active';
      if (profile.is_active !== undefined) return profile.is_active === true;
      return true;
    };

    const restore = async () => {
      if (cancelled) return;

      // 1. Restore cached user immediately
      const savedUser = localStorage.getItem('gshsmb_user');

      // 2. Check current Firebase auth session
      const firebaseUser = auth.currentUser;

      if (firebaseUser) {
        // Firebase has a valid session — verify profile from Firestore
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile && isActive(profile)) {
            const { ...safe } = profile;
            setUser(safe);
            localStorage.setItem('gshsmb_user', JSON.stringify(safe));
          } else if (profile && !isActive(profile)) {
            localStorage.removeItem('gshsmb_user');
            setUser(null);
          } else if (savedUser) {
            // Profile not found but cache exists — keep cached user
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed && parsed.id && parsed.email && parsed.role) {
                setUser(parsed as AuthContextType['user']);
              }
            } catch {}
          }
        } catch {
          // Network error — use cached user if available
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed && parsed.id && parsed.email && parsed.role) {
                setUser(parsed as AuthContextType['user']);
              }
            } catch {}
          }
        }
      } else if (savedUser) {
        // No Firebase session but cache exists — restore from cache
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.id && parsed.email && parsed.role) {
            setUser(parsed as AuthContextType['user']);
          }
        } catch {
          localStorage.removeItem('gshsmb_user');
        }
      }

      setLoading(false);

      // 3. Subscribe to future auth changes
      const unsub = onAuthStateChange(async (fbUser: FirebaseUser | null) => {
        if (cancelled) return;

        if (fbUser) {
          try {
            const profile = await getUserProfile(fbUser.uid);
            if (profile && isActive(profile)) {
              const { ...safe } = profile;
              setUser(safe);
              localStorage.setItem('gshsmb_user', JSON.stringify(safe));
            } else if (profile && !isActive(profile)) {
              localStorage.removeItem('gshsmb_user');
              setUser(null);
            }
          } catch {
            // keep cached user
          }
        } else {
          // Only clear if no cache — otherwise keep the cached user
          if (!localStorage.getItem('gshsmb_user')) {
            setUser(null);
          }
        }
      });

      unsubRef.current = unsub;
    };

    restore();

    // Safety fallback: stop loading after 5s
    const fallbackTimer = setTimeout(() => setLoading(false), 5000);

    return () => {
      cancelled = true;
      unsubRef.current?.();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { profile } = await loginUser(email, password);
    const { ...safe } = profile;
    setUser(safe);
    localStorage.setItem('gshsmb_user', JSON.stringify(safe));
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    localStorage.removeItem('gshsmb_user');
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
