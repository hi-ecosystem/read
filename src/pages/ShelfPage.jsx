import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import BookCover from '../components/BookCover';
import Chip from '../components/Chip';
import ProgressBar from '../components/ProgressBar';
import { getMyShelf } from '../services/readApi';
import { coverUrl } from '../services/openLibrary';
import './ShelfPage.css';

const TABS = [
  { id: 'reading',  label: 'Reading' },
  { id: 'finished', label: 'Finished' },
  { id: 'want',     label: 'Want' },
];

export default function ShelfPage() {
  const [tab, setTab]       = useState('reading');
  const [books, setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ reading: 0, finished: 0, want: 0 });

  useEffect(() => {
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
  }, []);

  const visible = books.filter(b => b.shelf === tab);
  const total = books.length;

  return (
    <div className="shelf-page">
      <TopBar
        title="My books"
        subtitle={`${total} total · ${counts.finished} finished`}
        trailing={
          <button className="icon-btn" aria-label="More">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 18 18">
              <circle cx="4" cy="9" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="9" r="1.2" fill="currentColor"/>
              <circle cx="14" cy="9" r="1.2" fill="currentColor"/>
            </svg>
          </button>
        }
      />

      <div className="shelf-seg">
        {TABS.map(t => (
          <button key={t.id} className={`shelf-seg__btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
            <span className="shelf-seg__count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div className="shelf-empty">
          <p>No books in {tab}.</p>
        </div>
      ) : (
        <div className="shelf-list">
          {visible.map(book => {
            const pct = book.pages ? Math.round((book.current_page / book.pages) * 100) : 0;
            const url = coverUrl(book.cover_id);
            return (
              <div key={book.id} className="shelf-row">
                <BookCover title={book.title} author={book.author} coverUrl={url} width={64} height={96} />
                <div className="shelf-row__meta">
                  <div className="shelf-row__title-row">
                    <span className="shelf-row__title">{book.title}</span>
                    {book.duo_id && (
                      <Chip variant="duo" style={{ fontSize: 10, height: 20, padding: '0 7px' }}>duo</Chip>
                    )}
                  </div>
                  <div className="shelf-row__author">{book.author}{book.pages ? ` · ${book.pages}p` : ''}</div>

                  {tab === 'reading' && (
                    <>
                      <div className="shelf-row__pages">
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text)' }}>
                          {book.current_page} / {book.pages ?? '?'}
                        </span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>
                          {pct}%
                        </span>
                      </div>
                      <ProgressBar value={pct} height={4} duo={!!book.duo_id} style={{ margin: '5px 0' }} />
                      <div className="shelf-row__status">
                        {book.duo_id
                          ? `with ${book.duo_partner_username} · day ${book.duo_streak ?? 0} streak`
                          : `solo · updated ${timeAgo(book.updated_at)}`}
                      </div>
                    </>
                  )}

                  {tab === 'finished' && book.finished_at && (
                    <div className="shelf-row__status">finished {timeAgo(book.finished_at)}</div>
                  )}
                </div>
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
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
