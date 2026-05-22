import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useLang } from '../context/LangContext';
import './LoginPage.css';

export default function LoginPage() {
  const { t } = useLang();
  const [step, setStep]       = useState('email');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const sendOtp = async () => {
    if (!email.trim()) { setError(t('loginErrEmail')); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (e) { setError(e.message); return; }
    setStep('otp');
  };

  const verifyOtp = async () => {
    if (otp.length < 6) { setError(t('loginErrCode')); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });
    setLoading(false);
    if (e) { setError(t('loginErrOtp')); return; }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">read<span className="login-dot">.</span></div>
        <p className="login-sub">{t('loginSub')}</p>

        {step === 'email' && (
          <>
            <input
              className="login-input"
              type="email"
              placeholder="Email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
            />
            <button className="login-btn" disabled={loading} onClick={sendOtp}>
              {loading ? t('loginSending') : t('loginSendBtn')}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="login-hint">{t('loginHint', email)}</p>
            <input
              className="login-input login-input--otp"
              type="text"
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              autoFocus
              autoComplete="one-time-code"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
            />
            <button className="login-btn" disabled={loading} onClick={verifyOtp}>
              {loading ? t('loginVerifying') : t('loginVerify')}
            </button>
            <button className="login-back" onClick={() => { setStep('email'); setOtp(''); setError(''); }}>
              {t('loginBack')}
            </button>
          </>
        )}

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
