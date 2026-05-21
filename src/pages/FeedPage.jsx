import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import BookCover from '../components/BookCover';
import StarRating from '../components/StarRating';
import Chip from '../components/Chip';
import { getFeed, toggleLike } from '../services/readApi';
import { coverUrl } from '../services/openLibrary';
import './FeedPage.css';

const FILTERS = ['All', 'Friends', 'Duos', 'Reviews'];

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function FeedPage() {
  const [filter, setFilter] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  useEffect(() => {
    getFeed()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter(item => {
    if (filter === 'All') return true;
    if (filter === 'Friends') return !item.duo_id;
    if (filter === 'Duos') return !!item.duo_id;
    if (filter === 'Reviews') return item.type === 'finished' || item.type === 'rated';
    return true;
  });

  return (
    <div className="feed-page">
      <TopBar
        title="read"
        subtitle={`${today} · ${items.length} recent`}
        trailing={
          <button className="icon-btn" aria-label="Search">
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
          <p>Nothing from friends yet.</p>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
            Add friends to see their reading activity.
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
  const url = coverUrl(item.cover_id);
  const actionLabel = { started: 'started reading', finished: 'finished', rated: 'rated', checked_in: 'checked in' }[item.type] ?? item.type;

  const handleLike = async () => {
    if (!item.review_id) return;
    const nowLiked = !item.liked_by_me;
    const newCount = Number(item.likes_count) + (nowLiked ? 1 : -1);
    onLikeToggle(item.id, nowLiked, newCount);
    await toggleLike(item.review_id).catch(() =>
      onLikeToggle(item.id, item.liked_by_me, item.likes_count)
    );
  };

  if (item.type === 'started') {
    return (
      <div className="card feed-card feed-card--compact">
        <div className="feed-card__row">
          <Avatar name={item.username} size={36} />
          <div style={{ flex: 1 }}>
            <span className="feed-card__name">{item.username}</span>{' '}
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
        <Avatar name={item.username} size={36} />
        <div style={{ flex: 1 }}>
          <div>
            <span className="feed-card__name">{item.username}</span>{' '}
            <span className="feed-card__action">{actionLabel}</span>
          </div>
          <div className="feed-card__meta">
            {timeAgo(item.created_at)}
            {item.duo_partner_username ? ` · with ${item.duo_partner_username}` : ''}
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
              <button className="social-btn">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
                  <path d="M15 10a3 3 0 0 1-3 3H6l-3 3V5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3z"/>
                </svg>
                <span>{item.comments_count ?? 0}</span>
              </button>
            </div>
            <span className="feed-card__want">add to · want to read</span>
          </div>
        </>
      )}
    </div>
  );
}
