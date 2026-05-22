import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import './LoginPage.css';

export default function LoginPage() {
  const [step, setStep]       = useState('email'); // 'email' | 'otp'
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const sendOtp = async () => {
    if (!email.trim()) { setError('Введи email'); return; }
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
    if (otp.length < 6) { setError('Введи 6-значный код'); return; }
    setLoading(true); setError('');
    const { error: e } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    });
    setLoading(false);
    if (e) { setError('Неверный или устаревший код'); return; }
    // onAuthStateChange in AuthContext will pick up the new session
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">read<span className="login-dot">.</span></div>
        <p className="login-sub">book tracker · hi. ecosystem</p>

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
              {loading ? 'Отправка…' : 'Получить код'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="login-hint">Код отправлен на {email}</p>
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
              {loading ? 'Проверка…' : 'Войти'}
            </button>
            <button className="login-back" onClick={() => { setStep('email'); setOtp(''); setError(''); }}>
              ← другой email
            </button>
          </>
        )}

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
