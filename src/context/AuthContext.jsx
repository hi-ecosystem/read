import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const raw = window.location.hash;

        // Fast path: SSO token from hi-dashboard
        if (raw.includes('access_token=')) {
          const p = new URLSearchParams(raw.substring(1));
          const at = p.get('access_token');
          const rt = p.get('refresh_token');
          window.history.replaceState(null, '', window.location.pathname);

          if (at && rt) {
            const { data, error } = await supabase.auth.setSession({
              access_token: at,
              refresh_token: rt,
            });
            if (!error && data?.session) {
              setUser(data.session.user);
              setLoading(false);
              return;
            }
          }
        }

        // Normal path: persisted session in localStorage
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Auth init error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_e, s) => setUser(s?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
