import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User } from '../types';
import { setDemoSessionActive, isDemoSessionActive } from '../services/demoStorage';

const DEMO_GUEST: User = { id: 'demo', name: 'Guest', email: 'Local demo' };

interface AuthContextValue {
  user: User | null;
  isDemoMode: boolean;
  loading: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => isDemoSessionActive());
  const isDemoModeRef = useRef(isDemoMode);
  isDemoModeRef.current = isDemoMode;

  const [user, setUser] = useState<User | null>(() =>
    isDemoSessionActive() ? DEMO_GUEST : null
  );
  const [loading, setLoading] = useState(() => !isDemoSessionActive());

  const enterDemo = useCallback(() => {
    setDemoSessionActive(true);
    setIsDemoMode(true);
    isDemoModeRef.current = true;
    setUser(DEMO_GUEST);
    setLoading(false);
  }, []);

  const exitDemo = useCallback(() => {
    setDemoSessionActive(false);
    setIsDemoMode(false);
    isDemoModeRef.current = false;
    setUser(null);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const isOAuthCallback = hashParams.has('access_token') || hashParams.has('error');

    if (hashParams.has('error')) {
      const errorDescription = hashParams.get('error_description') || hashParams.get('error');
      console.error('OAuth error:', errorDescription);
      window.history.replaceState(null, '', window.location.pathname);
      setLoading(false);
      const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {});
      return () => subscription.unsubscribe();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setDemoSessionActive(false);
        setIsDemoMode(false);
        isDemoModeRef.current = false;
        setUser({
          id: session.user.id,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'User',
          email: session.user.email || '',
        });
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    const checkSession = async () => {
      if (isOAuthCallback) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session error:', error);
      }

      if (session?.user) {
        setDemoSessionActive(false);
        setIsDemoMode(false);
        isDemoModeRef.current = false;
        setUser({
          id: session.user.id,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split('@')[0] ||
            'User',
          email: session.user.email || '',
        });
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }

      if (!isOAuthCallback || !session?.user) {
        setLoading(false);
      }
    };

    void checkSession();

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key && (e.key.includes('supabase') || e.key.startsWith('sb-'))) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setDemoSessionActive(false);
          setIsDemoMode(false);
          isDemoModeRef.current = false;
          setUser({
            id: session.user.id,
            name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0] ||
              'User',
            email: session.user.email || '',
          });
        } else if (!isDemoSessionActive()) {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const logout = async () => {
    if (isDemoModeRef.current) {
      exitDemo();
      return;
    }
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    user,
    isDemoMode,
    loading,
    enterDemo,
    exitDemo,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
