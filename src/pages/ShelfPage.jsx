import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import TopBar from '../components/TopBar';
import BookCover from '../components/BookCover';
import Chip from '../components/Chip';
import ProgressBar from '../components/ProgressBar';
import StarRating from '../components/StarRating';
import { getMyShelf, logPages, moveShelf, finishBook, removeFromShelf, upsertReview, getMyReview } from '../services/readApi';
import { coverUrl } from '../services/openLibrary';
import './ShelfPage.css';

const TABS = [
  { id: 'reading',  label: 'Reading' },
  { id: 'finished', label: 'Finished' },
  { id: 'want',     label: 'Want' },
];

const SHELF_LABELS = { reading: 'Reading', finished: 'Finished', want: 'Want to read' };

/* ── Bottom sheet wrapper ── */
function Sheet({ onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        padding: '20px 20px 44px', width: '100%', maxWidth: 480,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 18px' }} />
        {children}
      </div>
    </div>
  );
}

/* ── Action button in sheet ── */
function SheetBtn({ label, sub, danger, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '13px 0', textAlign: 'left',
      background: 'none', border: 'none', borderTop: '1px solid var(--border)',
      cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex',
      flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: 15, fontWeight: 500, color: danger ? '#e53' : 'var(--text)' }}>{label}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</span>}
    </button>
  );
}

export default function ShelfPage() {
  const [tab, setTab]     = useState('reading');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts]   = useState({ reading: 0, finished: 0, want: 0 });

  // Log pages sheet
  const [logBook, setLogBook] = useState(null);
  const [mode, setMode]       = useState('page');
  const [value, setValue]     = useState('');
  const [note, setNote]       = useState('');
  const [markFinished, setMarkFinished] = useState(false);
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef(null);

  // Review sheet
  const [reviewBook, setReviewBook]     = useState(null);
  const [rating, setRating]             = useState(0);
  const [reviewBody, setReviewBody]     = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  // Actions sheet
  const [actionBook, setActionBook]   = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const reload = () =>
    getMyShelf()
      .then(all => {
        setCounts({
          reading:  all.filter(b => b.shelf === 'reading').length,
          finished: all.filter(b => b.shelf === 'finished').length,
          want:     all.filter(b => b.shelf === 'want').length,
        });
        setBooks(all);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { reload(); }, []);

  /* ── Log pages ── */
  const openLog = (book) => {
    setLogBook(book);
    setMode('page');
    setValue(book.current_page > 0 ? String(book.current_page) : '');
    setNote('');
    setMarkFinished(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const closeLog = () => { setLogBook(null); setValue(''); setNote(''); setMarkFinished(false); };

  const switchMode = (m) => {
    if (!logBook || m === mode) return;
    const num = parseFloat(value);
    if (!isNaN(num) && logBook.pages) {
      setValue(m === 'pct'
        ? String(Math.round((num / logBook.pages) * 100))
        : String(Math.round((num / 100) * logBook.pages)));
    }
    setMode(m);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const resolvedPage = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return null;
    if (mode === 'pct') return logBook?.pages ? Math.min(logBook.pages, Math.round((num / 100) * logBook.pages)) : null;
    return Math.round(num);
  };

  const handleLog = async () => {
    const p = resolvedPage();
    if (!p || p < 1) return;
    setSaving(true);
    try {
      await logPages(logBook.book_id, p, note.trim() || null, false);
      if (markFinished) await finishBook(logBook.book_id);
      setBooks(prev => prev.map(b =>
        b.book_id === logBook.book_id
          ? { ...b, current_page: p, shelf: markFinished ? 'finished' : b.shelf }
          : b
      ));
      setCounts(prev => markFinished
        ? { ...prev, reading: prev.reading - 1, finished: prev.finished + 1 }
        : prev);
      toast.success(markFinished ? '🎉 Book finished!' : 'Progress saved!');
      closeLog();
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  /* ── Review ── */
  const openReview = async (book, e) => {
    e?.stopPropagation();
    setReviewBook(book);
    setRating(0); setReviewBody('');
    setLoadingReview(true);
    try {
      const existing = await getMyReview(book.book_id);
      if (existing) { setRating(existing.rating ?? 0); setReviewBody(existing.body ?? ''); }
    } catch { /* ignore */ } finally { setLoadingReview(false); }
  };
  const closeReview = () => { setReviewBook(null); setRating(0); setReviewBody(''); };

  const handleSaveReview = async () => {
    if (!rating && !reviewBody.trim()) return;
    setSavingReview(true);
    try {
      await upsertReview(reviewBook.book_id, rating, reviewBody.trim());
      toast.success('Review saved!');
      closeReview();
    } catch (e) {
      toast.error(e.message || 'Could not save');
    } finally { setSavingReview(false); }
  };

  /* ── Actions ── */
  const openActions = (book, e) => {
    e.stopPropagation();
    setActionBook(book);
    setConfirmRemove(false);
  };
  const closeActions = () => { setActionBook(null); setConfirmRemove(false); };

  const doMove = async (shelf) => {
    setActionLoading(true);
    try {
      await moveShelf(actionBook.book_id, shelf);
      setBooks(prev => prev.map(b => b.book_id === actionBook.book_id ? { ...b, shelf } : b));
      setCounts(prev => {
        const from = actionBook.shelf;
        return { ...prev, [from]: prev[from] - 1, [shelf]: prev[shelf] + 1 };
      });
      toast.success(`Moved to ${SHELF_LABELS[shelf]}`);
      closeActions();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const doFinish = async () => {
    setActionLoading(true);
    try {
      await finishBook(actionBook.book_id);
      setBooks(prev => prev.map(b => b.book_id === actionBook.book_id ? { ...b, shelf: 'finished' } : b));
      setCounts(prev => ({ ...prev, reading: prev.reading - 1, finished: prev.finished + 1 }));
      toast.success('🎉 Book finished!');
      closeActions();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const doRemove = async () => {
    setActionLoading(true);
    try {
      await removeFromShelf(actionBook.book_id);
      const removed = actionBook;
      setBooks(prev => prev.filter(b => b.book_id !== removed.book_id));
      setCounts(prev => ({ ...prev, [removed.shelf]: prev[removed.shelf] - 1 }));
      toast.success('Removed from shelf');
      closeActions();
    } catch (e) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const visible = books.filter(b => b.shelf === tab);
  const total = books.length;
  const rp = logBook ? resolvedPage() : null;
  const pctHint = logBook?.pages && rp ? Math.round((rp / logBook.pages) * 100) : null;
  const atEnd = logBook?.pages && rp && rp >= logBook.pages;

  return (
    <div className="shelf-page">

      {/* ── Log pages sheet ── */}
      {logBook && (
        <Sheet onClose={closeLog}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <BookCover title={logBook.title} coverUrl={coverUrl(logBook.cover_id)} width={36} height={54} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{logBook.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {logBook.pages ? `at ${logBook.current_page} / ${logBook.pages}p` : 'Log progress'}
              </div>
            </div>
            {logBook.pages && (
              <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, gap: 2 }}>
                {['page', 'pct'].map(m => (
                  <button key={m} onClick={() => switchMode(m)} style={{
                    padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-ui)',
                    background: mode === m ? 'var(--text)' : 'transparent',
                    color: mode === m ? 'var(--bg)' : 'var(--muted)', transition: 'all .15s',
                  }}>{m === 'page' ? 'Page' : '%'}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input
              ref={inputRef}
              type="number" min="0"
              max={mode === 'pct' ? 100 : (logBook.pages ?? 9999)}
              value={value}
              onChange={e => { setValue(e.target.value); setMarkFinished(false); }}
              onKeyDown={e => e.key === 'Enter' && handleLog()}
              placeholder={mode === 'pct' ? '0 – 100' : '42'}
              style={{
                width: '100%', padding: '14px 48px 14px 16px', fontSize: 28,
                fontFamily: 'var(--font-mono)', fontWeight: 500,
                border: '1px solid var(--border)', borderRadius: 14,
                background: 'var(--bg)', color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <span style={{
              position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
              fontSize: 18, color: 'var(--muted)', fontFamily: 'var(--font-mono)', pointerEvents: 'none',
            }}>{mode === 'pct' ? '%' : 'p'}</span>
          </div>

          {rp && logBook.pages && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, paddingLeft: 4 }}>
              {mode === 'pct' ? `≈ page ${rp} of ${logBook.pages}` : `${pctHint}% of the book`}
            </div>
          )}

          {/* Finish book toggle — shows when page >= total */}
          {atEnd && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 12,
              background: 'var(--accent-tint-bg, rgba(255,77,28,0.08))',
              marginBottom: 12, cursor: 'pointer',
            }}>
              <input
                type="checkbox" checked={markFinished}
                onChange={e => setMarkFinished(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent)', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>🎉 Mark as finished</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Move this book to your Finished shelf</div>
              </div>
            </label>
          )}

          <input
            type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="Leave a note… (optional)"
            style={{
              width: '100%', padding: '10px 14px', fontSize: 14,
              fontFamily: 'var(--font-ui)',
              border: '1px solid var(--border)', borderRadius: 12,
              background: 'var(--bg)', color: 'var(--text)',
              outline: 'none', boxSizing: 'border-box', marginBottom: 14,
            }}
          />
          <button
            className="btn btn-primary" style={{ width: '100%' }}
            disabled={!value || !resolvedPage() || saving}
            onClick={handleLog}
          >
            {saving ? 'Saving…' : markFinished ? '🎉 Save & finish book' : 'Save progress'}
          </button>
        </Sheet>
      )}

      {/* ── Review sheet ── */}
      {reviewBook && (
        <Sheet onClose={closeReview}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
            <BookCover title={reviewBook.title} coverUrl={coverUrl(reviewBook.cover_id)} width={36} height={54} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{reviewBook.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{reviewBook.author}</div>
            </div>
          </div>
          {loadingReview ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
          ) : (<>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 10 }}>
              Rating <span style={{ fontWeight: 400 }}>(optional)</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <StarRating value={rating} onChange={setRating} size={28} />
              {rating > 0 && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                  {['','Didn\'t like it','It was ok','Liked it','Really liked it','Loved it'][rating]}
                  {' · '}
                  <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setRating(0)}>clear</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 6 }}>
              Review <span style={{ fontWeight: 400 }}>(optional)</span>
            </div>
            <textarea
              value={reviewBody} onChange={e => setReviewBody(e.target.value)}
              placeholder="What did you think? Why did you stop reading? Would you recommend it?…"
              rows={4}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14,
                fontFamily: 'var(--font-ui)', lineHeight: 1.5,
                border: '1px solid var(--border)', borderRadius: 12,
                background: 'var(--bg)', color: 'var(--text)',
                outline: 'none', boxSizing: 'border-box', resize: 'none', marginBottom: 16,
              }}
            />
            <button
              className="btn btn-primary" style={{ width: '100%' }}
              disabled={(!rating && !reviewBody.trim()) || savingReview}
              onClick={handleSaveReview}
            >
              {savingReview ? 'Saving…' : 'Save review'}
            </button>
          </>)}
        </Sheet>
      )}

      {/* ── Actions sheet ── */}
      {actionBook && (
        <Sheet onClose={closeActions}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
            <BookCover title={actionBook.title} coverUrl={coverUrl(actionBook.cover_id)} width={32} height={48} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{actionBook.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{SHELF_LABELS[actionBook.shelf]}</div>
            </div>
          </div>

          {actionBook.shelf === 'reading' && (<>
            <SheetBtn label="Update progress" onClick={() => { closeActions(); openLog(actionBook); }} />
            <SheetBtn label="Mark as finished" sub="Move to Finished shelf" onClick={doFinish} disabled={actionLoading} />
            <SheetBtn label="Write a review" onClick={() => { closeActions(); openReview(actionBook); }} />
            <SheetBtn label="Move to Want to read" onClick={() => doMove('want')} disabled={actionLoading} />
          </>)}

          {actionBook.shelf === 'finished' && (<>
            <SheetBtn label="Write a review" onClick={() => { closeActions(); openReview(actionBook); }} />
            <SheetBtn label="Move back to Reading" onClick={() => doMove('reading')} disabled={actionLoading} />
          </>)}

          {actionBook.shelf === 'want' && (
            <SheetBtn label="Start reading" onClick={() => doMove('reading')} disabled={actionLoading} />
          )}

          {confirmRemove ? (
            <SheetBtn label="Confirm remove" danger onClick={doRemove} disabled={actionLoading} />
          ) : (
            <SheetBtn label="Remove from shelf" danger onClick={() => setConfirmRemove(true)} />
          )}
        </Sheet>
      )}

      <TopBar
        title="My books"
        subtitle={`${total} total · ${counts.finished} finished`}
        trailing={<div style={{ width: 36 }} />}
      />

      <div className="shelf-seg">
        {TABS.map(t => (
          <button key={t.id} className={`shelf-seg__btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}<span className="shelf-seg__count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div className="shelf-empty"><p>No books in {tab}.</p></div>
      ) : (
        <div className="shelf-list">
          {visible.map(book => {
            const pct = book.pages ? Math.round((book.current_page / book.pages) * 100) : 0;
            const url = coverUrl(book.cover_id);
            return (
              <div
                key={book.book_id}
                className="shelf-row shelf-row--tappable"
                onClick={(e) => tab === 'reading' ? openLog(book) : openActions(book, e)}
              >
                <BookCover title={book.title} author={book.author} coverUrl={url} width={64} height={96} />
                <div className="shelf-row__meta">
                  <div className="shelf-row__title-row">
                    <span className="shelf-row__title">{book.title}</span>
                    {book.duo_id && <Chip variant="duo" style={{ fontSize: 10, height: 20, padding: '0 7px' }}>duo</Chip>}
                  </div>
                  <div className="shelf-row__author">{book.author}{book.pages ? ` · ${book.pages}p` : ''}</div>

                  {tab === 'reading' && (<>
                    <div className="shelf-row__pages">
                      <span className="mono" style={{ fontSize: 11, color: 'var(--text)' }}>
                        {book.current_page} / {book.pages ?? '?'}
                      </span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} height={4} duo={!!book.duo_id} style={{ margin: '5px 0' }} />
                    <div className="shelf-row__status">
                      {book.duo_id
                        ? `with ${book.duo_partner_username} · ${book.duo_streak ?? 0}d streak`
                        : `updated ${timeAgo(book.updated_at)}`}
                    </div>
                  </>)}

                  {tab === 'finished' && (
                    <div className="shelf-row__status">finished {book.finished_at ? timeAgo(book.finished_at) : ''}</div>
                  )}
                  {tab === 'want' && (
                    <div className="shelf-row__status" style={{ color: 'var(--accent)', fontSize: 11 }}>tap to start reading</div>
                  )}
                </div>
                {/* kebab */}
                <button
                  onClick={e => openActions(book, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', color: 'var(--muted)', alignSelf: 'center', flexShrink: 0 }}
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <circle cx="8" cy="3" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="8" cy="13" r="1.3"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ height: 96 }} />
    </div>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
