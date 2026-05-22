import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { t as translate } from '../i18n';

const LangContext = createContext({ lang: 'ru', setLang: () => {}, t: k => k });

/** Read lang from URL hash (#...&lang=en) if present,
 *  save it to this origin's localStorage, then return it.
 *  Falls back to own localStorage, then 'ru'. */
function detectLang() {
  try {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const fromUrl = params.get('lang');
    if (fromUrl === 'ru' || fromUrl === 'en') {
      localStorage.setItem('hi_lang', fromUrl);
      return fromUrl;
    }
  } catch (_) {}
  return localStorage.getItem('hi_lang') || 'ru';
}

export function LangProvider({ children }) {
  // useState initializer runs synchronously during render — BEFORE any useEffect
  // so it reads the URL hash before AuthContext clears it via replaceState.
  const [lang, setLangState] = useState(detectLang);

  const setLang = useCallback((next) => {
    if (next !== 'ru' && next !== 'en') return;
    localStorage.setItem('hi_lang', next);
    setLangState(next);
  }, []);

  useEffect(() => {
    // Re-check on mount in case hash was set after initial render
    const initial = detectLang();
    if (initial !== lang) setLangState(initial);

    // Listen for cross-tab changes within the same origin
    const handler = e => {
      if (e.key === 'hi_lang' && (e.newValue === 'ru' || e.newValue === 'en')) {
        setLangState(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const t = useCallback((key, ...args) => translate(lang, key, ...args), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
