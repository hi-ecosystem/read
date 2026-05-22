import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import BookCover from '../components/BookCover';
import StarRating from '../components/StarRating';
import Chip from '../components/Chip';
import { toast } from 'react-hot-toast';
import { getFeed, toggleLike, addToWant, searchUsers } from '../services/readApi';
import { coverUrl } from '../services/openLibrary';
import './FeedPage.css';

const FILTERS = ['All', 'Friends', 'Duos', 'Reviews'];

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (!isFinite(diff) || diff < 0) return '';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Поиск пользователей
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    getFeed()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const filtered = items.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Friends') return !item.duo_id;
    if (filter === 'Duos') return !!item.duo_id;
    if (filter === 'Reviews') return item.type === 'finished' || item.type === 'rated';
    return true;
  });

  return (
    <div className="feed-page">

      {/* ── Поисковый оверлей ── */}
      {showSearch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'var(--bg)', display: 'flex', flexDirection: 'column',
        }}>
          {/* Строка поиска */}
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
                placeholder="Имя пользователя…"
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
              Отмена
            </button>
          </div>

          {/* Результаты */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {searching && (
              <div style={{ padding: '20px 16px', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>Поиск…</div>
            )}
            {!searching && searchQuery && searchResults.length === 0 && (
              <div style={{ padding: '40px 16px', color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
                Пользователь «{searchQuery}» не найден
              </div>
            )}
            {!searching && !searchQuery && (
              <div style={{ padding: '40px 16px', color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>
                Начни вводить имя пользователя
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

      <TopBar
        title="read"
        subtitle={`${today} · ${items.length} recent`}
        trailing={
          <button className="icon-btn" aria-label="Поиск" onClick={openSearch}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
              <circle cx="8" cy="8" r="5"/><line x1="12" y1="12" x2="16" y2="16"/>
            </svg>
          </button>
        }
      />

      <div className="feed-filters">
        {FILTERS.map(f => (
          <Chip key={f} variant={f === filter ? 'dark' : 'default'} onClick={() => setFilter(f)}>{f}</Chip>
        ))}
      </div>

      {loading ? (
        <div className="feed-loading">
          {[1, 2, 3].map(i => <div key={i} className="feed-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="feed-empty">
          <p>Пока нет активности друзей.</p>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            Найди друзей через поиск 🔍
          </span>
        </div>
      ) : (
        <div className="feed-list">
          {filtered.map(item => (
            <FeedCard
              key={item.id}
              item={item}
              onLikeToggle={(id, liked, count) =>
                setItems(prev => prev.map(it =>
                  it.id === id ? { ...it, liked_by_me: liked, likes_count: count } : it
                ))
              }
            />
          ))}
        </div>
      )}

      <div style={{ height: 96 }} />
    </div>
  );
}

function FeedCard({ item, onLikeToggle }) {
  const navigate = useNavigate();
  const url = coverUrl(item.cover_id);
  const actionLabel = { started: 'started reading', finished: 'finished', rated: 'rated', checked_in: 'checked in' }[item.type] ?? item.type;
  const [addingWant, setAddingWant] = useState(false);

  const handleLike = async () => {
    if (!item.review_id) return;
    const nowLiked = !item.liked_by_me;
    const newCount = Number(item.likes_count) + (nowLiked ? 1 : -1);
    onLikeToggle(item.id, nowLiked, newCount);
    await toggleLike(item.review_id).catch(() =>
      onLikeToggle(item.id, item.liked_by_me, item.likes_count)
    );
  };

  const handleAddToWant = async () => {
    if (!item.book_id || addingWant) return;
    setAddingWant(true);
    try {
      await addToWant(item.book_id);
      toast.success('Добавлено в «Хочу читать»');
    } catch {
      toast.error('Не удалось добавить');
    } finally {
      setAddingWant(false);
    }
  };

  const goToProfile = (username) => {
    if (username) navigate(`/user/${username}`);
  };

  if (item.type === 'started') {
    return (
      <div className="card feed-card feed-card--compact">
        <div className="feed-card__row">
          <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }} onClick={() => goToProfile(item.username)}>
            <Avatar name={item.username} size={36} />
          </button>
          <div style={{ flex: 1 }}>
            <span className="feed-card__name" style={{ cursor: 'pointer' }} onClick={() => goToProfile(item.username)}>{item.username}</span>{' '}
            <span className="feed-card__action">{actionLabel}</span>
            <div className="feed-card__meta">{timeAgo(item.created_at)}{item.pages ? ` · ${item.pages}p` : ''}</div>
          </div>
          <BookCover title={item.title} author={item.author} coverUrl={url} width={34} height={50} />
        </div>
      </div>
    );
  }

  return (
    <div className="card feed-card">
      <div className="feed-card__header">
        <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }} onClick={() => goToProfile(item.username)}>
          <Avatar name={item.username} size={36} />
        </button>
        <div style={{ flex: 1 }}>
          <div>
            <span className="feed-card__name" style={{ cursor: 'pointer' }} onClick={() => goToProfile(item.username)}>{item.username}</span>{' '}
            <span className="feed-card__action">{actionLabel}</span>
          </div>
          <div className="feed-card__meta">
            {timeAgo(item.created_at)}
            {item.duo_partner_username ? (
              <>
                {' · with '}
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => goToProfile(item.duo_partner_username)}>
                  {item.duo_partner_username}
                </span>
              </>
            ) : null}
          </div>
        </div>
        {item.duo_id && <Chip variant="duo">duo</Chip>}
      </div>

      <div className="feed-card__body">
        <BookCover title={item.title} author={item.author} coverUrl={url} width={60} height={88} />
        <div style={{ flex: 1 }}>
          {item.rating && <StarRating value={item.rating} />}
          {item.review_body ? (
            <div className="feed-card__quote">
              <span style={{ color: 'var(--accent)' }}>"</span>
              {item.review_body}
              <span style={{ color: 'var(--accent)' }}>"</span>
            </div>
          ) : (
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, fontFamily: 'var(--font-editorial)', color: 'var(--text-soft)' }}>
              {item.title}
            </div>
          )}
        </div>
      </div>

      {item.review_id && (
        <>
          <div className="feed-card__divider" />
          <div className="feed-card__social">
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <button className="social-btn" onClick={handleLike}>
                <svg width="18" height="18"
                  fill={item.liked_by_me ? '#FF4D1C' : 'none'}
                  stroke={item.liked_by_me ? '#FF4D1C' : 'currentColor'}
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
                  <path d="M9 15s-6-4.35-6-8.5A4 4 0 0 1 9 4.18 4 4 0 0 1 15 6.5C15 10.65 9 15 9 15z"/>
                </svg>
                <span>{item.likes_count ?? 0}</span>
              </button>
              <button className="social-btn" onClick={() => toast('Комментарии скоро появятся')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
                  <path d="M15 10a3 3 0 0 1-3 3H6l-3 3V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3z"/>
                </svg>
                <span>{item.comments_count ?? 0}</span>
              </button>
            </div>
            <button
              className="feed-card__want"
              onClick={handleAddToWant}
              disabled={addingWant}
              style={{ background: 'none', border: 'none', cursor: addingWant ? 'not-allowed' : 'pointer', padding: 0, fontFamily: 'inherit' }}
            >
              {addingWant ? 'Добавляю…' : 'add to · want to read'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
