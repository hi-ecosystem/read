import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BookCover from '../components/BookCover';
import { getUserProfile } from '../services/readApi';
import { coverUrl } from '../services/openLibrary';
import { useLang } from '../context/LangContext';
import './UserProfilePage.css';

function Stars({ rating }) {
  if (!rating) return null;
  return (
    <div className="profile-stars">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`profile-star ${n <= rating ? '' : 'profile-star--empty'}`}>★</span>
      ))}
    </div>
  );
}

function Avatar({ name, size = 72 }) {
  const initials = (name ?? '?').slice(0, 2).toUpperCase();
  return (
    <div
      className="profile-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export default function UserProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [profile, setProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setProfile(undefined);
    getUserProfile(username)
      .then(data => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="profile-page">
      <TopBar title={username} onBack={() => navigate(-1)} />

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          {t('profileLoading')}
        </div>
      )}

      {!loading && profile === null && (
        <div className="profile-not-found">
          <span style={{ fontSize: 32 }}>👤</span>
          <span>{t('profileNotFound')}</span>
        </div>
      )}

      {!loading && profile && (
        <>
          {/* Avatar + name */}
          <div className="profile-header">
            <Avatar name={profile.username} size={72} />
            <div className="profile-username">{profile.username}</div>
            {profile.created_at && (
              <div className="profile-since">{t('profileSince', t('profileJoined', profile.created_at))}</div>
            )}
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="profile-stat">
              <span className="profile-stat__value">{profile.stats?.finished ?? 0}</span>
              <span className="profile-stat__label">{t('profileRead')}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__value">{profile.stats?.reading ?? 0}</span>
              <span className="profile-stat__label">{t('profileReading')}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__value">{profile.stats?.reviews ?? 0}</span>
              <span className="profile-stat__label">{t('profileReviews')}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat__value">{profile.stats?.want ?? 0}</span>
              <span className="profile-stat__label">{t('profileWant')}</span>
            </div>
          </div>

          {/* Finished books list */}
          {profile.finished_books?.length > 0 ? (
            <div style={{ margin: '0 0 8px' }}>
              <div className="profile-section-title">
                {t('profileFinished', profile.finished_books.length)}
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, margin: '0 16px', overflow: 'hidden' }}>
                {profile.finished_books.map(book => (
                  <div key={book.book_id} className="profile-book-row">
                    <BookCover
                      title={book.title}
                      author={book.author}
                      coverUrl={coverUrl(book.cover_id)}
                      width={52}
                      height={78}
                    />
                    <div className="profile-book-meta">
                      <div className="profile-book-title">{book.title}</div>
                      <div className="profile-book-author">
                        {book.author}{book.pages ? ` · ${book.pages} p.` : ''}
                      </div>
                      {book.rating && <Stars rating={book.rating} />}
                      {book.review_body && (
                        <div className="profile-book-review">
                          «{book.review_body}»
                        </div>
                      )}
                      <div className="profile-book-date">
                        {book.finished_at ? t('profileFinishedAt', book.finished_at) : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="profile-empty">
              {t('profileEmpty')}
            </div>
          )}

          <div style={{ height: 80 }} />
        </>
      )}
    </div>
  );
}
