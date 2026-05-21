import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const hash = window.location.hash;
      if (hash.includes('access_token=')) {
        const p = new URLSearchParams(hash.substring(1));
        const at = p.get('access_token'), rt = p.get('refresh_token');
        if (at && rt) {
          const { data, error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          window.history.replaceState(null, '', window.location.pathname);
          if (!error && data.session) { setUser(data.session.user); setLoading(false); return; }
        }
      }
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    init();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
