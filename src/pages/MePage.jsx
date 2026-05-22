import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import { getMyStats } from '../services/readApi';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

function StatBox({ value, label }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 8px' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

export default function MePage() {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getMyStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const name = stats?.username ?? user?.email?.split('@')[0] ?? 'You';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      <TopBar title="Me" trailing={<div style={{ width: 36 }} />} />

      {/* Profile header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 20px', gap: 12 }}>
        <Avatar name={name} size={72} />
        <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{user?.email}</div>
      </div>

      {/* Stats grid */}
      <div style={{ margin: '0 16px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : (<>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <StatBox value={stats?.books_reading}  label="Reading" />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.books_finished} label="Finished" />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.books_want}     label="Want" />
          </div>
          <div style={{ display: 'flex' }}>
            <StatBox value={stats?.pages_read?.toLocaleString()} label="Pages read" />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.reviews_written} label="Reviews" />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.duos_active}    label="Active duos" />
          </div>
        </>)}
      </div>

      {/* Logout */}
      <div style={{ margin: '0 16px' }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: '100%', padding: '13px', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-ui)', border: '1px solid var(--border)',
            borderRadius: 14, background: 'var(--surface)', color: 'var(--muted)',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
          }}
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>

      <div style={{ height: 96 }} />
    </div>
  );
}
