import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import BookCover from '../components/BookCover';
import ProgressBar from '../components/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { getMyDuos, getDuo, getFriends, createDuo, sendDuoMessage, endDuo, getMyShelf, logPages } from '../services/readApi';
import { coverUrl } from '../services/openLibrary';
import './DuoPage.css';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─── Create Duo Flow ────────────────────────────────── */
function CreateDuoFlow({ onClose, onCreated }) {
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
      toast.success('Duo started!');
      onCreated(duoId);
    } catch (e) {
      toast.error(e.message || 'Could not create duo');
      setSaving(false);
    }
  };

  return (
    <div className="duo-page">
      <TopBar
        title={step === 'book' ? 'Pick a book' : step === 'friend' ? 'Pick a friend' : 'Start duo'}
        onBack={step === 'book' ? onClose : () => setStep(step === 'friend' ? 'book' : 'friend')}
      />

      {/* Step 1: book */}
      {step === 'book' && (
        <div style={{ padding: '0 16px' }}>
          {loadingBooks ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
          ) : books.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Add books to your shelf first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {books.map(b => (
                <div key={b.book_id} className="card duo-pick-row" onClick={() => goToFriend(b)}>
                  <BookCover title={b.title} author={b.author} coverUrl={coverUrl(b.cover_id)} width={40} height={60} />
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
            <BookCover title={book.title} author={book.author} coverUrl={coverUrl(book.cover_id)} width={32} height={48} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{book.title}</span>
          </div>

          {loadingFriends ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
          ) : friends.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No friends yet.<br/>Add friends to start a duo.
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
            <BookCover title={book.title} author={book.author} coverUrl={coverUrl(book.cover_id)} width={72} height={108} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{book.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{book.author}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar name={friend.username} size={28} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>with {friend.username}</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '12px 0 16px', lineHeight: 1.5 }}>
            The book will be added to {friend.username}'s shelf automatically. You'll both share progress, streaks and margin notes.
          </p>

          <button
            className="btn btn-primary"
            style={{ width: '100%', height: 48, fontSize: 15 }}
            disabled={saving}
            onClick={handleCreate}
          >
            {saving ? 'Starting…' : 'Start reading together'}
          </button>
        </div>
      )}

      <div style={{ height: 96 }} />
    </div>
  );
}

/* ─── Duo Detail ─────────────────────────────────────── */
function DuoDetail({ duoId, myId, onBack }) {
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
    setUpdatingPage(true);
    try {
      await logPages(duo.book_id, p);
      setPageInput('');
      setShowPageInput(false);
      reload();
    } catch { toast.error('Could not update'); }
    finally { setUpdatingPage(false); }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endDuo(duoId);
      toast.success('Duo ended');
      onBack();
    } catch (e) {
      toast.error(e.message || 'Could not end duo');
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
      toast.error('Could not send');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="duo-page"><TopBar title="Duo" onBack={onBack} /><div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div></div>;
  if (!duo) return <div className="duo-page"><TopBar title="Duo" onBack={onBack} /><div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Not found.</div></div>;

  const pages = duo.pages ?? 1;
  const myPage = duo.my_page ?? 0;
  const partnerPage = duo.partner_page ?? 0;
  const myPct = Math.round((myPage / pages) * 100);
  const partnerPct = Math.round((partnerPage / pages) * 100);
  const url = coverUrl(duo.cover_id);
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
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>End this duo?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
              The reading history and notes will be kept, but you won't be able to add new progress.
            </div>
            <button
              className="btn"
              disabled={ending}
              onClick={handleEnd}
              style={{ width: '100%', background: '#e53', color: '#fff', marginBottom: 10 }}
            >
              {ending ? 'Ending…' : 'End duo'}
            </button>
            <button
              className="btn"
              onClick={() => setConfirmEnd(false)}
              style={{ width: '100%', background: 'var(--border)', color: 'var(--text)' }}
            >
              Cancel
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
              End duo
            </button>
          </div>
        </div>
      )}

      <TopBar
        title={`Вы & ${duo.partner_username ?? 'партнёр'}`}
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
          <div className="label-upper">Reading together</div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', margin: '4px 0' }}>{duo.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {duo.started_at ? `started ${new Date(duo.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
            {duo.pages ? ` · ${duo.pages} pages` : ''}
          </div>
          {duo.streak > 0 && (
            <div className="duo-streak">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--accent)"><path d="M8 1C5 4 3 6 3 9a5 5 0 0 0 10 0c0-2-1-4-2-5-1 2-2 3-3 2.5C7 5 8 1 8 1z"/></svg>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{duo.streak}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>day streak</span>
            </div>
          )}
        </div>
      </div>

      <div className="card duo-progress">
        <div className="duo-progress__cols">
          <div className="duo-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Avatar name="You" size={24} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>You</span>
            </div>
            {showPageInput ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <input
                  type="number" min="1" max={pages} value={pageInput}
                  onChange={e => setPageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdatePage()}
                  autoFocus placeholder={String(myPage)}
                  style={{ width: 64, padding: '4px 8px', fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 500, border: '1px solid var(--accent)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                />
                <button onClick={handleUpdatePage} disabled={updatingPage} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{updatingPage ? '…' : 'Save'}</button>
                <button onClick={() => { setShowPageInput(false); setPageInput(''); }} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{myPage}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>/ {pages}</span>
                <button onClick={() => { setShowPageInput(true); setPageInput(String(myPage)); }} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontFamily: 'var(--font-ui)' }}>update</button>
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
              <span style={{ fontSize: 12, fontWeight: 600, textDecoration: 'underline', textDecorationColor: 'var(--border)' }}>{duo.partner_username ?? 'Партнёр'}</span>
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>Margin notes</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{messages.length} notes</span>
        </div>

        {messages.length > 0 && (
          <div className="card" style={{ marginBottom: 10 }}>
            {messages.map((m, i) => (
              <div key={m.id} className={`duo-msg ${i > 0 ? 'bordered' : ''}`}>
                <Avatar name={m.username} size={24} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{m.user_id === myId ? 'You' : m.username}</span>
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
            placeholder="Leave a margin note…"
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
function DuoList({ duos, myId, onSelect, onCreate }) {
  return (
    <div className="duo-page">
      <TopBar
        title="Дуо"
        trailing={
          <button className="icon-btn" onClick={onCreate} aria-label="Новое дуо">
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
                coverUrl={coverUrl(duo.books?.cover_id)}
                width={44} height={66}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{duo.books?.title ?? 'Книга'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  с {partner?.username ?? 'партнёром'}
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
  const [duos, setDuos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // duo id
  const [creating, setCreating] = useState(false);

  const loadDuos = (keepSelection = false) =>
    getMyDuos()
      .then(data => {
        setDuos(data);
        if (!keepSelection && data.length >= 1) setSelected(prev => prev ?? data[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { loadDuos(); }, []);

  if (creating) {
    return (
      <CreateDuoFlow
        onClose={() => setCreating(false)}
        onCreated={duoId => { setCreating(false); setSelected(duoId); loadDuos(true); }}
      />
    );
  }

  if (loading) return (
    <div className="duo-page">
      <TopBar title="Дуо" />
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Загрузка…</div>
    </div>
  );

  if (selected) return <DuoDetail duoId={selected} myId={user?.id} onBack={() => setSelected(null)} />;

  if (duos.length > 0) return (
    <DuoList duos={duos} myId={user?.id} onSelect={setSelected} onCreate={() => setCreating(true)} />
  );

  // No duos — empty state
  return (
    <div className="duo-page">
      <TopBar title="Дуо" />
      <div className="duo-empty">
        <div className="duo-empty__icon">
          <svg width="40" height="40" fill="none" stroke="var(--accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 40 40">
            <circle cx="15" cy="20" r="10"/><circle cx="25" cy="20" r="10"/>
          </svg>
        </div>
        <div className="duo-empty__title">Нет активных дуо</div>
        <div className="duo-empty__sub">Читайте книгу вместе с другом — общий прогресс, стрики и заметки на полях.</div>
        <button className="btn btn-primary duo-empty__btn" onClick={() => setCreating(true)}>
          Начать дуо
        </button>
      </div>
    </div>
  );
}
