import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import BookCover from '../components/BookCover';
import StarRating from '../components/StarRating';
import Chip from '../components/Chip';
import ReviewSheet from '../components/ReviewSheet';
import { toast } from 'react-hot-toast';
import { getFeed, getPopularFeed, toggleLike, addToWant, searchUsers, getWeeklyPicks } from '../services/readApi';
import WeeklyPicks from '../components/WeeklyPicks';
import { resolveBookCover } from '../services/openLibrary';
import { useLang } from '../context/LangContext';
import './FeedPage.css';

const FILTER_KEYS = ['All', 'Friends', 'Duos', 'Reviews'];

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
  const { t } = useLang();
  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [weeklyPicks, setWeeklyPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

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
    getPopularFeed()
      .then(setPopularItems)
      .catch(console.error)
      .finally(() => setPopularLoading(false));
    getWeeklyPicks()
      .then(setWeeklyPicks)
      .catch(() => {});
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

  // All tab = global popular reviews; other tabs filter the friends feed
  const isAllTab = filter === 'All';
  const filtered = isAllTab ? popularItems : items.filter(item => {
    if (filter === 'Friends') return !item.duo_id;
    if (filter === 'Duos') return !!item.duo_id;
    if (filter === 'Reviews') return !!(item.review_body || item.rating);
    return true;
  });

  return (
    <div className="feed-page">

      {/* ── Search overlay ── */}
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
                {t('searchPrompt')}
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
        subtitle={isAllTab
          ? `${t('feedPopular')} · ${popularItems.length}`
          : `${today} · ${items.length} recent`}
        trailing={
          <button className="icon-btn" aria-label="Search" onClick={openSearch}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
              <circle cx="8" cy="8" r="5"/><line x1="12" y1="12" x2="16" y2="16"/>
            </svg>
          </button>
        }
      />

      <div className="feed-filters">
        {FILTER_KEYS.map(f => (
          <Chip key={f} variant={f === filter ? 'dark' : 'default'} onClick={() => setFilter(f)}>{f}</Chip>
        ))}
      </div>

      {isAllTab && weeklyPicks.length > 0 && (
        <WeeklyPicks picks={weeklyPicks} />
      )}

      {(isAllTab ? popularLoading : loading) ? (
        <div className="feed-loading">
          {[1, 2, 3].map(i => <div key={i} className="feed-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="feed-empty">
          <p>{t('feedEmpty')}</p>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            {t('feedEmptyHint')}
          </span>
        </div>
      ) : (
        <div className="feed-list">
          {filtered.map(item => (
            <FeedCard
              key={item.id}
              item={item}
              onLikeToggle={(id, liked, count) => {
                if (isAllTab) {
                  setPopularItems(prev => prev.map(it =>
                    it.id === id ? { ...it, liked_by_me: liked, likes_count: count } : it
                  ));
                } else {
                  setItems(prev => prev.map(it =>
                    it.id === id ? { ...it, liked_by_me: liked, likes_count: count } : it
                  ));
                }
              }}
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
  const { t } = useLang();
  const url = resolveBookCover(item.cover_id, item.cover_url);
  const actionLabel = {
    started:    t('actStarted'),
    finished:   t('actFinished'),
    rated:      t('actRated'),
    checked_in: t('actCheckedIn'),
  }[item.type] ?? item.type;
  const [addingWant, setAddingWant] = useState(false);
  const [sheetItem, setSheetItem] = useState(null);

  const openSheet = () => {
    if (item.review_body || item.rating) setSheetItem(item);
  };

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
      toast.success(t('addToWant'));
    } catch {
      toast.error(t('addError'));
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
                {' · '}{t('withLabel')}{' '}
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => goToProfile(item.duo_partner_username)}>
                  {item.duo_partner_username}
                </span>
              </>
            ) : null}
          </div>
        </div>
        {item.duo_id && <Chip variant="duo">duo</Chip>}
      </div>

      <div
        className="feed-card__body"
        onClick={openSheet}
        style={{ cursor: (item.review_body || item.rating) ? 'pointer' : 'default' }}
      >
        <BookCover title={item.title} author={item.author} coverUrl={url} width={60} height={88} />
        <div style={{ flex: 1 }}>
          {item.rating && <StarRating value={item.rating} />}
          {item.review_body ? (
            <div className="feed-card__quote feed-card__quote--clamp">
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
              <button className="social-btn" onClick={() => toast(t('commingSoon'))}>
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
              {addingWant ? t('addingWant') : t('addToWant')}
            </button>
          </div>
        </>
      )}

      {sheetItem && (
        <ReviewSheet
          item={sheetItem}
          onClose={() => setSheetItem(null)}
          onLike={item.review_id ? async () => {
            await handleLike();
            // keep sheet item in sync with parent item state
            setSheetItem(prev => prev ? {
              ...prev,
              liked_by_me: !prev.liked_by_me,
              likes_count: Number(prev.likes_count) + (prev.liked_by_me ? -1 : 1),
            } : null);
          } : undefined}
        />
      )}
    </div>
  );
}
