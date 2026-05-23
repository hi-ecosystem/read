import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookCover from './BookCover';
import StarRating from './StarRating';
import { resolveBookCover } from '../services/openLibrary';
import { useLang } from '../context/LangContext';

function Sheet({ onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', borderRadius: '20px 20px 0 0',
          padding: '20px 20px 48px', width: '100%', maxWidth: 480,
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border)', margin: '0 auto 22px',
        }} />
        {children}
      </div>
    </div>
  );
}

/**
 * item shape:
 *   title, author, cover_id, pages?, rating?, review_body?
 *   finished_at? | created_at?
 *   username?                       – shown in meta line (feed)
 *   review_id?, liked_by_me?, likes_count?  – like button (feed)
 * onClose  – close callback
 * onLike   – optional like toggle callback (feed)
 */
export default function ReviewSheet({ item, onClose, onLike }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  if (!item) return null;

  const url = resolveBookCover(item.cover_id, item.cover_url);
  const dateTs = item.finished_at || item.created_at;
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  const formattedDate = dateTs
    ? new Date(dateTs).toLocaleDateString(locale, {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  return (
    <Sheet onClose={onClose}>

      {/* ── Book header ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
        <BookCover
          title={item.title}
          author={item.author}
          coverUrl={url}
          width={64}
          height={96}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 17, fontWeight: 700, lineHeight: 1.3,
            fontFamily: 'var(--font-editorial)', color: 'var(--text)',
            marginBottom: 4,
          }}>
            {item.title}
          </div>
          {item.author && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>
              {item.author}
            </div>
          )}
          {item.pages && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {item.pages} p.
            </div>
          )}
          {item.rating ? (
            <div style={{ marginTop: 10 }}>
              <StarRating value={item.rating} />
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Review body ──────────────────────────────── */}
      {item.review_body && (
        <div style={{
          fontSize: 15,
          lineHeight: 1.72,
          color: 'var(--text)',
          fontFamily: 'var(--font-editorial)',
          borderLeft: '3px solid var(--accent)',
          paddingLeft: 14,
          marginBottom: 18,
          whiteSpace: 'pre-wrap',
        }}>
          {item.review_body}
        </div>
      )}

      {/* ── Meta ────────────────────────────────────── */}
      {(item.username || formattedDate) && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
          {item.username && (
            <span
              onClick={() => { onClose?.(); navigate(`/user/${item.username}`); }}
              style={{
                fontWeight: 600, color: 'var(--accent)',
                cursor: 'pointer', textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              {item.username}
            </span>
          )}
          {formattedDate && (
            <span style={{ color: 'var(--muted)' }}>
              {item.username ? ' · ' : ''}{formattedDate}
            </span>
          )}
        </div>
      )}

      {/* ── Like button (feed only) ──────────────────── */}
      {item.review_id && onLike && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button
            onClick={onLike}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: item.liked_by_me ? 'rgba(255,77,28,0.08)' : 'var(--bg)',
              border: `1px solid ${item.liked_by_me ? 'rgba(255,77,28,0.35)' : 'var(--border)'}`,
              borderRadius: 24, padding: '9px 20px',
              cursor: 'pointer', fontSize: 14,
              color: item.liked_by_me ? '#FF4D1C' : 'var(--text)',
              fontFamily: 'inherit', fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            <svg
              width="16" height="16"
              fill={item.liked_by_me ? '#FF4D1C' : 'none'}
              stroke={item.liked_by_me ? '#FF4D1C' : 'currentColor'}
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              viewBox="0 0 18 18"
            >
              <path d="M9 15s-6-4.35-6-8.5A4 4 0 0 1 9 4.18 4 4 0 0 1 15 6.5C15 10.65 9 15 9 15z"/>
            </svg>
            {item.likes_count ?? 0}
          </button>
        </div>
      )}

    </Sheet>
  );
}
