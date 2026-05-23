import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import { getMyStats, getPendingRequests, respondToFriendRequest, searchUsers, setShowReadingProgress, setProfilePublic } from '../services/readApi';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useFriendRequests } from '../context/FriendRequestContext';
import { toast } from 'react-hot-toast';

function LangToggle() {
  const { lang, setLang, t } = useLang();
  const toggle = (next) => {
    if (next !== lang) setLang(next);
  };
  return (
    <div style={{ margin: '0 16px 12px', display: 'flex', gap: 6 }}>
      {['ru', 'en'].map(l => (
        <button
          key={l}
          onClick={() => toggle(l)}
          style={{
            flex: 1, padding: '10px 0',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: l === lang ? 'var(--text)' : 'var(--surface)',
            color:      l === lang ? 'var(--bg)'   : 'var(--muted)',
            fontFamily: 'var(--font-ui)', fontWeight: 700,
            fontSize: 13, letterSpacing: '0.05em',
            cursor: l === lang ? 'default' : 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {l === 'ru' ? 'Русский' : 'English'}
        </button>
      ))}
    </div>
  );
}

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
  const { t } = useLang();
  const navigate = useNavigate();
  const { refreshPending } = useFriendRequests();
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showProgress, setShowProgress] = useState(true);
  const [profilePublic, setProfilePublicState] = useState(true);

  // Friend requests
  const [pending, setPending]       = useState([]);
  const [responding, setResponding] = useState({}); // { [friendshipId]: true }

  // Find-friends search overlay
  const [showSearch, setShowSearch]       = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);
  const searchTimer  = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    getMyStats()
      .then(data => {
        setStats(data);
        if (data?.show_reading_progress !== undefined) {
          setShowProgress(data.show_reading_progress);
        }
        if (data?.profile_public !== undefined) {
          setProfilePublicState(data.profile_public);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    getPendingRequests()
      .then(setPending)
      .catch(console.error);
  }, []);

  const handleToggleProgress = async (val) => {
    setShowProgress(val);
    try {
      await setShowReadingProgress(val);
    } catch {
      setShowProgress(!val); // rollback
    }
  };

  const handleTogglePublic = async (val) => {
    setProfilePublicState(val);
    try {
      await setProfilePublic(val);
    } catch {
      setProfilePublicState(!val); // rollback
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearching(true);
      searchUsers(searchQuery)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const openSearch = () => {
    setShowSearch(true);
    setSearchQuery('');
    setSearchResults([]);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const goToUser = (username) => {
    closeSearch();
    navigate(`/user/${username}`);
  };

  const handleRespond = async (friendshipId, action) => {
    if (responding[friendshipId]) return;
    const req = pending.find(r => r.friendship_id === friendshipId);
    setResponding(prev => ({ ...prev, [friendshipId]: true }));
    try {
      await respondToFriendRequest(friendshipId, action);
      setPending(prev => prev.filter(r => r.friendship_id !== friendshipId));
      refreshPending();
      if (action === 'accept') toast.success(t('friendAdded', req?.username ?? ''));
      else toast(t('friendDeclined'));
    } catch {
      toast.error(t('friendErrSend'));
    } finally {
      setResponding(prev => { const n = { ...prev }; delete n[friendshipId]; return n; });
    }
  };

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

  const btnBase = {
    borderRadius: 10, fontSize: 12, fontWeight: 600,
    fontFamily: 'var(--font-ui)', padding: '6px 14px',
    border: '1.5px solid', cursor: 'pointer',
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* ── Find-friends search overlay ── */}
      {showSearch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex', gap: 10, padding: '12px 16px',
            borderBottom: '1px solid var(--border)', alignItems: 'center',
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '0 12px',
            }}>
              <svg width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
                <circle cx="8" cy="8" r="5"/><line x1="12" y1="12" x2="16" y2="16"/>
              </svg>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                style={{
                  flex: 1, border: 'none', background: 'none', outline: 'none',
                  fontSize: 15, fontFamily: 'var(--font-ui)', color: 'var(--text)',
                  padding: '11px 0',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>
            <button
              onClick={closeSearch}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--accent)', fontFamily: 'var(--font-ui)', fontWeight: 600, padding: '8px 0', whiteSpace: 'nowrap' }}
            >
              {t('searchCancel')}
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {searching && (
              <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>{t('searchSearching')}</div>
            )}
            {!searching && searchQuery && searchResults.length === 0 && (
              <div style={{ padding: '40px 16px', color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
                {t('searchNotFound', searchQuery)}
              </div>
            )}
            {!searching && !searchQuery && (
              <div style={{ padding: '40px 16px', color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
                {t('friendSearchHint')}
              </div>
            )}
            {searchResults.map(u => (
              <div
                key={u.id}
                onClick={() => goToUser(u.username)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <Avatar name={u.username} size={40} />
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{u.username}</span>
                <svg style={{ marginLeft: 'auto' }} width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 16 16">
                  <polyline points="6,4 10,8 6,12"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      <TopBar title={t('meTitle')} trailing={<div style={{ width: 36 }} />} />

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
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('loading')}</div>
        ) : (<>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <StatBox value={stats?.books_reading}  label={t('statReading')} />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.books_finished} label={t('statFinished')} />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.books_want}     label={t('statWant')} />
          </div>
          <div style={{ display: 'flex' }}>
            <StatBox value={stats?.pages_read?.toLocaleString()} label={t('statPages')} />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.reviews_written} label={t('statReviews')} />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatBox value={stats?.duos_active}    label={t('statDuos')} />
          </div>
        </>)}
      </div>

      {/* Friends section */}
      <div style={{ margin: '0 16px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Pending requests */}
        {pending.length > 0 && (
          <>
            <div style={{ padding: '12px 16px 4px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {t('friendRequests', pending.length)}
            </div>
            {pending.map((req, i) => (
              <div key={req.friendship_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <button
                  onClick={() => goToUser(req.username)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                >
                  <Avatar name={req.username} size={36} />
                </button>
                <span
                  style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}
                  onClick={() => goToUser(req.username)}
                >
                  {req.username}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleRespond(req.friendship_id, 'accept')}
                    disabled={!!responding[req.friendship_id]}
                    style={{ ...btnBase, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
                  >
                    {t('friendAccept')}
                  </button>
                  <button
                    onClick={() => handleRespond(req.friendship_id, 'decline')}
                    disabled={!!responding[req.friendship_id]}
                    style={{ ...btnBase, background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
                  >
                    {t('friendDecline')}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border)' }} />
          </>
        )}

        {/* Find friends button */}
        <button
          onClick={openSearch}
          style={{
            width: '100%', padding: '14px 16px', fontSize: 14, fontWeight: 600,
            fontFamily: 'var(--font-ui)', border: 'none', borderRadius: 0,
            background: 'transparent', color: 'var(--accent)',
            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
            <circle cx="8" cy="8" r="5"/><line x1="12" y1="12" x2="16" y2="16"/>
          </svg>
          {t('friendFind')}
        </button>
      </div>

      {/* Settings */}
      <div style={{ margin: '0 16px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Reading progress toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t('settingProgress')}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t('settingProgressSub')}</div>
          </div>
          {/* iOS-style toggle */}
          <button
            role="switch"
            aria-checked={showProgress}
            onClick={() => handleToggleProgress(!showProgress)}
            style={{
              width: 44, height: 26, borderRadius: 13, border: 'none',
              background: showProgress ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer', flexShrink: 0, position: 'relative',
              transition: 'background 0.2s',
              padding: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: showProgress ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.2s',
              display: 'block',
            }} />
          </button>
        </div>

        {/* Profile privacy toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t('settingPrivacy')}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t('settingPrivacySub')}</div>
          </div>
          {/* iOS-style toggle */}
          <button
            role="switch"
            aria-checked={profilePublic}
            onClick={() => handleTogglePublic(!profilePublic)}
            style={{
              width: 44, height: 26, borderRadius: 13, border: 'none',
              background: profilePublic ? 'var(--accent)' : 'var(--border)',
              cursor: 'pointer', flexShrink: 0, position: 'relative',
              transition: 'background 0.2s',
              padding: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: profilePublic ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              transition: 'left 0.2s',
              display: 'block',
            }} />
          </button>
        </div>
      </div>

      {/* Language toggle */}
      <LangToggle />

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
          {loggingOut ? t('signingOut') : t('signOut')}
        </button>
      </div>

      <div style={{ height: 96 }} />
    </div>
  );
}
