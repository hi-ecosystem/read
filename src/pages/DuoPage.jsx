import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import BookCover from '../components/BookCover';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { supabase } from '../services/supabase';
import { getMyDuos, getDuo, getFriends, createDuo, sendDuoMessage, endDuo, getMyShelf, logPages } from '../services/readApi';
import { resolveBookCover } from '../services/openLibrary';
import './DuoPage.css';

function timeAgoI18n(ts, t) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)    return t('timeJustNow');
  if (diff < 3600)  return t('timeMinAgo',  Math.floor(diff / 60));
  if (diff < 86400) return t('timeHourAgo', Math.floor(diff / 3600));
  return t('timeDayAgo', Math.floor(diff / 86400));
}

/* ─── Create Duo Flow ────────────────────────────────── */
function CreateDuoFlow({ onClose, onCreated, t }) {
  const [step, setStep] = useState('book'); // 'book' | 'friend' | 'confirm'
  const [books, setBooks] = useState([]);
  const [friends, setFriends] = useState([]);
  const [book, setBook] = useState(null);
  const [friend, setFriend] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyShelf().then(all => setBooks(all)).catch(console.error).finally(() => setLoadingBooks(false));
  }, []);

  const goToFriend = (b) => {
    setBook(b);
    setStep('friend');
    if (friends.length === 0) {
      setLoadingFriends(true);
      getFriends().then(setFriends).catch(console.error).finally(() => setLoadingFriends(false));
    }
  };

  const goToConfirm = (f) => {
    setFriend(f);
    setStep('confirm');
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const duoId = await createDuo(book.book_id, friend.id);
      toast.success(t('duoToastStarted'));
      onCreated(duoId);
    } catch (e) {
      toast.error(e.message || t('addError'));
      setSaving(false);
    }
  };

  return (
    <div className="duo-page">
      <TopBar
        title={step === 'book' ? t('duoPickBook') : step === 'friend' ? t('duoPickFriend') : t('duoStartTitle')}
        onBack={step === 'book' ? onClose : () => setStep(step === 'friend' ? 'book' : 'friend')}
      />

      {/* Step 1: book */}
      {step === 'book' && (
        <div style={{ padding: '0 16px' }}>
          {loadingBooks ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('loading')}</div>
          ) : books.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              {t('duoAddBooksFirst')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {books.map(b => (
                <div key={b.book_id} className="card duo-pick-row" onClick={() => goToFriend(b)}>
                  <BookCover title={b.title} author={b.author} coverUrl={resolveBookCover(b.cover_id, b.cover_url)} width={40} height={60} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {b.author}{b.pages ? ` · ${b.pages}p` : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, textTransform: 'capitalize' }}>{b.shelf}</div>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 16 16">
                    <polyline points="6,4 10,8 6,12"/>
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: friend */}
      {step === 'friend' && (
        <div style={{ padding: '0 16px' }}>
          {/* selected book preview */}
          <div className="duo-selected-preview">
            <BookCover title={book.title} author={book.author} coverUrl={resolveBookCover(book.cover_id, book.cover_url)} width={32} height={48} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{book.title}</span>
          </div>

          {loadingFriends ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('loading')}</div>
          ) : friends.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              {t('duoNoFriends').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br/>}</span>)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {friends.map(f => (
                <div key={f.id} className="card duo-pick-row" onClick={() => goToConfirm(f)}>
                  <Avatar name={f.username} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.username}</div>
                  </div>
                  <svg width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 16 16">
                    <polyline points="6,4 10,8 6,12"/>
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: confirm */}
      {step === 'confirm' && (
        <div style={{ padding: '0 16px' }}>
          <div className="card duo-confirm-card">
            <BookCover title={book.title} author={book.author} coverUrl={resolveBookCover(book.cover_id, book.cover_url)} width={72} height={108} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{book.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{book.author}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={friend.username} size={28} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{t('duoWith')} {friend.username}</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '12px 0 16px', lineHeight: 1.5 }}>
            {t('duoConfirmSub', friend.username)}
          </p>

          <button
            className="btn btn-primary"
            style={{ width: '100%', height: 48, fontSize: 15 }}
            disabled={saving}
            onClick={handleCreate}
          >
            {saving ? t('duoStarting') : t('duoStartBtn')}
          </button>
        </div>
      )}

      <div style={{ height: 96 }} />
    </div>
  );
}

/* ─── Duo Detail ─────────────────────────────────────── */
function DuoDetail({ duoId, myId, onBack, t }) {
  const navigate = useNavigate();
  const [duo, setDuo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [updatingPage, setUpdatingPage] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);

  const reload = () => getDuo(duoId).then(setDuo).catch(console.error);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [duoId]);

  // Realtime: обновляем дуо при новых сообщениях или изменении прогресса
  useEffect(() => {
    const channel = supabase
      .channel(`duo-${duoId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'duo_messages',
        filter: `duo_id=eq.${duoId}`,
      }, () => getDuo(duoId).then(setDuo).catch(console.error))
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'book_shelf_items',
      }, () => getDuo(duoId).then(setDuo).catch(console.error))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [duoId]);

  const handleUpdatePage = async () => {
    const p = parseInt(pageInput, 10);
    if (!p || p < 1) return;
    const clamped = duo?.pages ? Math.min(p, duo.pages) : p;
    setUpdatingPage(true);
    try {
      await logPages(duo.book_id, clamped);
      setPageInput('');
      setShowPageInput(false);
      reload();
    } catch { toast.error(t('addError')); }
    finally { setUpdatingPage(false); }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endDuo(duoId);
      toast.success(t('duoToastEnded'));
      onBack();
    } catch (e) {
      toast.error(e.message || t('addError'));
      setEnding(false);
    }
  };

  const handleSend = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      await sendDuoMessage(duoId, msg.trim(), duo?.my_page ?? null);
      setMsg('');
      reload();
    } catch {
      toast.error(t('addError'));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="duo-page"><TopBar title="Duo" onBack={onBack} /><div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div></div>;
  if (!duo) return <div className="duo-page"><TopBar title="Duo" onBack={onBack} /><div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>{t('duoNotFound')}</div></div>;

  const pages = duo.pages ?? 1;
  const myPage = duo.my_page ?? 0;
  const partnerPage = duo.partner_page ?? 0;
  const myPct = Math.round((myPage / pages) * 100);
  const partnerPct = Math.round((partnerPage / pages) * 100);
  const url = resolveBookCover(duo.cover_id, duo.cover_url);
  const messages = duo.messages ?? [];

  return (
    <div className="duo-page">
      {/* End duo confirmation overlay */}
      {confirmEnd && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setConfirmEnd(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            padding: '24px 20px 40px', width: '100%', maxWidth: 480,
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t('duoEndTitle')}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
              {t('duoEndSub')}
            </div>
            <button
              className="btn"
              disabled={ending}
              onClick={handleEnd}
              style={{ width: '100%', background: '#e53', color: '#fff', marginBottom: 10 }}
            >
              {ending ? t('duoEnding') : t('duoEndBtn')}
            </button>
            <button
              className="btn"
              onClick={() => setConfirmEnd(false)}
              style={{ width: '100%', background: 'var(--border)', color: 'var(--text)' }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Menu overlay */}
      {showMenu && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center',
        }} onClick={() => setShowMenu(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            padding: '16px 20px 40px', width: '100%', maxWidth: 480,
          }}>
            <button
              className="btn"
              onClick={() => { setShowMenu(false); setConfirmEnd(true); }}
              style={{ width: '100%', background: 'var(--border)', color: '#e53' }}
            >
              {t('duoEndBtn')}
            </button>
          </div>
        </div>
      )}

      <TopBar
        title={`${t('duoYou')} & ${duo.partner_username ?? t('duoPartner')}`}
        onBack={onBack}
        trailing={
          <button className="icon-btn" onClick={() => setShowMenu(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 18 18">
              <circle cx="4" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="14" cy="9" r="1.2" fill="currentColor"/>
            </svg>
          </button>
        }
      />

      <div className="duo-hero">
        <BookCover title={duo.title} author={duo.author} coverUrl={url} width={78} height={116} />
        <div className="duo-hero__meta">
          <div className="label-upper">{t('duoReadingTogether')}</div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', margin: '4px 0' }}>{duo.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {duo.started_at ? t('duoStartedDate', new Date(duo.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) : ''}
            {duo.pages ? ` · ${t('duoPages', duo.pages)}` : ''}
          </div>
          {duo.streak > 0 && (
            <div className="duo-streak">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--accent)"><path d="M8 1C5 4 3 6 3 9a5 5 0 0 0 10 0c0-2-1-4-2-5-1 2-2 3-3 2.5C7 5 8 1 8 1z"/></svg>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{duo.streak}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('duoDayStreak')}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card duo-progress">
        <div className="duo-progress__cols">
          <div className="duo-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Avatar name={t('duoYou')} size={24} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{t('duoYou')}</span>
            </div>
            {showPageInput ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <input
                  type="number" min="1" max={pages} value={pageInput}
                  onChange={e => {
                    let v = e.target.value;
                    const n = parseInt(v, 10);
                    if (!isNaN(n) && n > pages) v = String(pages);
                    setPageInput(v);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleUpdatePage()}
                  autoFocus placeholder={String(myPage)}
                  style={{ width: 64, padding: '4px 8px', fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 500, border: '1px solid var(--accent)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                />
                <button onClick={handleUpdatePage} disabled={updatingPage} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{updatingPage ? '…' : t('duoSave')}</button>
                <button onClick={() => { setShowPageInput(false); setPageInput(''); }} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{myPage}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>/ {pages}</span>
                <button onClick={() => { setShowPageInput(true); setPageInput(String(myPage)); }} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'var(--font-ui)' }}>{t('duoUpdate')}</button>
              </div>
            )}
            <ProgressBar value={myPct} height={6} duo={true} style={{ margin: '6px 0' }} />
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{myPct}%</div>
          </div>
          <div className="duo-progress__divider" />
          <div className="duo-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => duo.partner_username && navigate(`/user/${duo.partner_username}`)}>
              <Avatar name={duo.partner_username ?? '?'} size={24} />
              <span style={{ fontSize: 12, fontWeight: 600, textDecoration: 'underline', textDecorationColor: 'var(--border)' }}>{duo.partner_username ?? t('duoPartner')}</span>
            </button>
            </div>
            <div><span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{partnerPage}</span><span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}> / {pages}</span></div>
            <ProgressBar value={partnerPct} height={6} duo={false} style={{ margin: '6px 0' }} />
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{partnerPct}%</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{t('duoMarginNotes')}</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('duoNotesCount', messages.length)}</span>
        </div>

        {messages.length > 0 && (
          <div className="card" style={{ marginBottom: 10 }}>
            {messages.map((m, i) => (
              <div key={m.id} className={`duo-msg ${i > 0 ? 'bordered' : ''}`}>
                <Avatar name={m.username} size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{m.user_id === myId ? t('duoYou') : m.username}</span>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {m.page ? `p. ${m.page} · ` : ''}{timeAgo(m.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.45 }}>{m.body}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="duo-compose">
          <input
            className="duo-compose__input"
            placeholder={t('duoComposePlaceholder')}
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button className="duo-compose__send" disabled={!msg.trim() || sending} onClick={handleSend}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
              <polyline points="3,9 9,3 15,9"/><line x1="9" y1="3" x2="9" y2="15"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ height: 96 }} />
    </div>
  );
}

/* ─── Duo List ───────────────────────────────────────── */
function DuoList({ duos, myId, onSelect, onCreate, t }) {
  return (
    <div className="duo-page">
      <TopBar
        title={t('duoTitle')}
        trailing={
          <button className="icon-btn" onClick={onCreate} aria-label={t('duoNewBtn')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 18 18">
              <line x1="9" y1="3" x2="9" y2="15"/><line x1="3" y1="9" x2="15" y2="9"/>
            </svg>
          </button>
        }
      />
      <div style={{ padding: '8px 16px 0' }}>
        {duos.map(duo => {
          const isUser1 = duo.user1?.id === myId;
          const partner = isUser1 ? duo.user2 : duo.user1;
          return (
            <div
              key={duo.id}
              className="card duo-pick-row"
              onClick={() => onSelect(duo.id)}
              style={{ marginBottom: 10 }}
            >
              <BookCover
                title={duo.books?.title}
                author={duo.books?.author}
                coverUrl={resolveBookCover(duo.books?.cover_id, duo.books?.cover_url)}
                width={44} height={66}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{duo.books?.title ?? '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {t('duoWith')} {partner?.username ?? t('duoPartner')}
                </div>
              </div>
              <svg width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 16 16">
                <polyline points="6,4 10,8 6,12"/>
              </svg>
            </div>
          );
        })}
      </div>
      <div style={{ height: 96 }} />
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function DuoPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const [duos, setDuos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // duo id
  const [creating, setCreating] = useState(false);

  const loadDuos = (keepSelection = false) =>
    getMyDuos()
      .then(data => {
        setDuos(data);
        if (!keepSelection && data.length === 1) setSelected(prev => prev ?? data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { loadDuos(); }, []);

  if (creating) {
    return (
      <CreateDuoFlow
        onClose={() => setCreating(false)}
        onCreated={duoId => { setCreating(false); setSelected(duoId); loadDuos(true); }}
        t={t}
      />
    );
  }

  if (loading) return (
    <div className="duo-page">
      <TopBar title={t('duoTitle')} />
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('loading')}</div>
    </div>
  );

  if (selected) return <DuoDetail duoId={selected} myId={user?.id} onBack={() => setSelected(null)} t={t} />;

  if (duos.length > 0) return (
    <DuoList duos={duos} myId={user?.id} onSelect={setSelected} onCreate={() => setCreating(true)} t={t} />
  );

  // No duos — empty state
  return (
    <div className="duo-page">
      <TopBar title={t('duoTitle')} />
      <div className="duo-empty">
        <div className="duo-empty__icon">
          <svg width="40" height="40" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 40 40">
            <circle cx="15" cy="20" r="10"/><circle cx="25" cy="20" r="10"/>
          </svg>
        </div>
        <div className="duo-empty__title">{t('duoEmpty')}</div>
        <div className="duo-empty__sub">{t('duoReadingTogether')} — {t('duoMarginNotes').toLowerCase()}.</div>
        <button className="btn btn-primary duo-empty__btn" onClick={() => setCreating(true)}>
          {t('duoNewBtn')}
        </button>
      </div>
    </div>
  );
}
