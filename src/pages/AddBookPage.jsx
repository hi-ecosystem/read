import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import TopBar from '../components/TopBar';
import BookCover from '../components/BookCover';
import { searchAllBooks } from '../services/bookSearch';
import { addBookToShelf, getMyShelf, getPopularBooks, getBookTopReview } from '../services/readApi';
import { useLang } from '../context/LangContext';
import ReviewSheet from '../components/ReviewSheet';
import './AddBookPage.css';

function StarsMini({ rating }) {
  if (!rating) return null;
  return (
    <span style={{ color: '#F59E0B', fontSize: 11, letterSpacing: 1 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

function BookRow({ book, isExp, onShelf, isSaving, topReview, readersCount, onToggle, onAdd, onOpenReview, t }) {
  return (
    <div>
      <div
        className={`add-result-row ${isExp ? 'expanded' : ''}`}
        onClick={onToggle}
      >
        <BookCover
          title={book.title} author={book.author} coverUrl={book.coverUrl}
          width={isExp ? 48 : 44} height={isExp ? 72 : 66}
        />
        <div className="add-result-row__meta">
          <div className="add-result-row__title">{book.title}</div>
          <div className="add-result-row__sub">
            {book.author}{book.year ? ` · ${book.year}` : ''}{book.pages ? ` · ${book.pages}p` : ''}
          </div>
          {onShelf ? (
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 3 }}>{t('onShelf')}</div>
          ) : readersCount != null ? (
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              {t('addReadersCount', readersCount)}
            </div>
          ) : null}
        </div>
        {!onShelf && (
          <button
            className={`icon-btn-sm ${isExp ? 'accent' : ''}`}
            aria-label="Add book"
            onClick={e => { e.stopPropagation(); onToggle(); }}
          >
            <svg
              width="16" height="16" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 16 16"
              style={{ transform: isExp ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
            </svg>
          </button>
        )}
      </div>

      {isExp && (
        <div className="add-expand">
          {/* Top review from read. */}
          {topReview?.review_body && (
            <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 5 }}>
              ★ {t('topReviewLabel')}
            </div>
            <div
              onClick={() => onOpenReview?.({
                title:       book.title,
                author:      book.author,
                cover_id:    book.coverId,
                cover_url:   book.coverUrl,
                pages:       book.pages,
                rating:      topReview.rating,
                review_body: topReview.review_body,
                username:    topReview.username,
                review_id:   topReview.review_id,
                likes_count: topReview.likes_count,
              })}
              style={{
                background: 'var(--bg)', borderRadius: 10, padding: '10px 12px',
                marginBottom: 14, borderLeft: '3px solid var(--accent)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <StarsMini rating={topReview.rating} />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                  {topReview.username}
                </span>
                {topReview.likes_count > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 'auto' }}>
                    ♥ {topReview.likes_count}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: 12, lineHeight: 1.6, color: 'var(--text)',
                fontFamily: 'var(--font-editorial)',
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {topReview.review_body}
              </div>
              <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 5, fontWeight: 600 }}>
                читать →
              </div>
            </div>
            </>
          )}

          <div className="label-upper" style={{ marginBottom: 10 }}>{t('addToShelfLabel')}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="add-shelf-btn" disabled={isSaving} onClick={() => onAdd('reading')}>
              <span style={{ fontSize: 18 }}>📖</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t('shelfReading')}</span>
            </button>
            <button className="add-shelf-btn" disabled={isSaving} onClick={() => onAdd('want')}>
              <span style={{ fontSize: 18 }}>🔖</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t('shelfWant')}</span>
            </button>
            <button className="add-shelf-btn" disabled={isSaving} onClick={() => onAdd('finished')}>
              <span style={{ fontSize: 18 }}>✅</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t('shelfFinished')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddBookPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [saving, setSaving]         = useState(null); // book.id being saved, or null
  const [shelfIds, setShelfIds]     = useState(new Set());
  const [popular, setPopular]       = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [topReviews, setTopReviews] = useState({}); // { [bookId]: review | null }
  const [openReview, setOpenReview] = useState(null); // full ReviewSheet item
  const timerRef = useRef(null);

  useEffect(() => {
    getMyShelf().then(all => setShelfIds(new Set(all.map(b => b.book_id)))).catch(() => {});
    getPopularBooks()
      .then(setPopular)
      .catch(() => {})
      .finally(() => setPopularLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const books = await searchAllBooks(query).catch(() => []);
      setResults(books);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleExpand = (bookId) => {
    setExpanded(prev => {
      const next = prev === bookId ? null : bookId;
      if (next && !(bookId in topReviews)) {
        getBookTopReview(bookId)
          .then(r => setTopReviews(prev => ({ ...prev, [bookId]: r })))
          .catch(() => setTopReviews(prev => ({ ...prev, [bookId]: null })));
      }
      return next;
    });
  };

  const handleAdd = async (book, shelf) => {
    if (saving) return;
    setSaving(book.id);
    try {
      await addBookToShelf(book, shelf);
      toast.success(t('addSuccess', t(`shelf${shelf.charAt(0).toUpperCase() + shelf.slice(1)}`)));
      navigate('/shelf');
    } catch (e) {
      toast.error(t('addError'));
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="add-page">
      <TopBar
        title={t('addTitle')}
        onBack={() => navigate(-1)}
        trailing={
          <button className="add-cancel" onClick={() => navigate(-1)}>{t('cancel')}</button>
        }
      />

      <div className="add-search-wrap">
        <div className="add-search">
          <svg width="18" height="18" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
            <circle cx="8" cy="8" r="5"/><line x1="12" y1="12" x2="16" y2="16"/>
          </svg>
          <input
            className="add-search__input"
            placeholder={t('addSearchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <span className="add-search__source">google · openlibrary</span>
        </div>
      </div>

      {query.trim() && (
        <div className="add-meta">
          <span className="label-upper">
            {loading ? t('addSearching') : t('addResults', results.length)}
          </span>
        </div>
      )}

      <div className="add-results">
        {results.map(book => {
          const isExp = expanded === book.id;
          const onShelf = shelfIds.has(book.id);
          const isSaving = saving === book.id;
          const topReview = topReviews[book.id];
          return (
            <BookRow key={book.id}
              book={book} isExp={isExp} onShelf={onShelf} isSaving={isSaving}
              topReview={topReview}
              onToggle={() => !onShelf && handleExpand(book.id)}
              onAdd={(shelf) => handleAdd(book, shelf)}
              onOpenReview={setOpenReview}
              t={t}
            />
          );
        })}

        {loading && [1, 2, 3, 4].map(i => (
          <div key={i} className="add-skeleton">
            <div className="skeleton-cover" />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ width: '70%' }} />
              <div className="skeleton-line" style={{ width: '45%', marginTop: 6 }} />
            </div>
          </div>
        ))}

        {!loading && query.trim() && results.length === 0 && (
          <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
            {t('addNoResultsHint')}
          </div>
        )}

        {/* Popular books — shown when no query */}
        {!query.trim() && (
          <>
            <div className="add-meta" style={{ paddingTop: 8 }}>
              <span className="label-upper">{t('addPopularTitle')}</span>
            </div>
            {popularLoading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="add-skeleton">
                  <div className="skeleton-cover" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-line" style={{ width: '70%' }} />
                    <div className="skeleton-line" style={{ width: '45%', marginTop: 6 }} />
                  </div>
                </div>
              ))
            ) : popular.map(book => {
              const isExp = expanded === book.id;
              const onShelf = shelfIds.has(book.id);
              const isSaving = saving === book.id;
              const topReview = topReviews[book.id];
              return (
                <BookRow key={book.id}
                  book={book} isExp={isExp} onShelf={onShelf} isSaving={isSaving}
                  topReview={topReview}
                  readersCount={book.readers}
                  onToggle={() => !onShelf && handleExpand(book.id)}
                  onAdd={(shelf) => handleAdd(book, shelf)}
                  onOpenReview={setOpenReview}
                  t={t}
                />
              );
            })}
          </>
        )}
      </div>

      <div style={{ height: 96 }} />

      {openReview && (
        <ReviewSheet item={openReview} onClose={() => setOpenReview(null)} />
      )}
    </div>
  );
}
