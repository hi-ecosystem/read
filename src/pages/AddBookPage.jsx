import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import TopBar from '../components/TopBar';
import BookCover from '../components/BookCover';
import Chip from '../components/Chip';
import { searchBooks } from '../services/openLibrary';
import { addBookToShelf, getMyShelf } from '../services/readApi';
import { useLang } from '../context/LangContext';
import './AddBookPage.css';

const SHELVES = ['reading', 'finished', 'want'];

export default function AddBookPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [selectedShelf, setSelectedShelf] = useState('reading');
  const [saving, setSaving]         = useState(false);
  const [shelfIds, setShelfIds]     = useState(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    getMyShelf().then(all => setShelfIds(new Set(all.map(b => b.book_id)))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const books = await searchBooks(query).catch(() => []);
      setResults(books);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleAdd = async (book, shelf) => {
    setSaving(true);
    try {
      await addBookToShelf(book, shelf);
      toast.success(t('addSuccess', t(`shelf${shelf.charAt(0).toUpperCase() + shelf.slice(1)}`)));
      navigate('/shelf');
    } catch (e) {
      toast.error(t('addError'));
      console.error(e);
    } finally {
      setSaving(false);
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
          <span className="add-search__source">openlibrary</span>
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
          return (
            <div key={book.id}>
              <div
                className={`add-result-row ${isExp ? 'expanded' : ''}`}
                onClick={() => !onShelf && setExpanded(isExp ? null : book.id)}
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
                  {onShelf && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 3 }}>{t('onShelf')}</div>
                  )}
                </div>
                {!onShelf && (
                  <button
                    className={`icon-btn-sm ${isExp ? 'accent' : ''}`}
                    aria-label="Add book"
                    disabled={saving}
                    onClick={e => {
                      e.stopPropagation();
                      handleAdd(book, selectedShelf);
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 16 16">
                      <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                    </svg>
                  </button>
                )}
              </div>

              {isExp && (
                <div className="add-expand">
                  <div className="label-upper" style={{ marginBottom: 10 }}>{t('addToShelfLabel')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {SHELVES.map(s => (
                      <Chip
                        key={s}
                        variant={selectedShelf === s ? 'accent' : 'default'}
                        onClick={() => setSelectedShelf(s)}
                      >
                        {selectedShelf === s && '✓ '}{t(`shelf${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                      </Chip>
                    ))}
                  </div>

                  <div className="add-duo-row" onClick={() => toast(t('commingSoon'))}>
                    <div className="add-duo-row__icon">
                      <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="5" height="5" rx="1"/>
                        <rect x="9" y="9" width="5" height="5" rx="1"/>
                        <line x1="7" y1="4.5" x2="9" y2="4.5"/>
                        <line x1="11.5" y1="7" x2="11.5" y2="9"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t('duoInvite')}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t('duoInviteSub')}</div>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 16 16">
                      <polyline points="6,4 10,8 6,12"/>
                    </svg>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 12, height: 44, fontSize: 14 }}
                    disabled={saving}
                    onClick={() => handleAdd(book, selectedShelf)}
                  >
                    {saving ? t('saving') : t('addToShelf', t(`shelf${selectedShelf.charAt(0).toUpperCase() + selectedShelf.slice(1)}`))}
                  </button>
                </div>
              )}
            </div>
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
      </div>

      <div style={{ height: 96 }} />
    </div>
  );
}
