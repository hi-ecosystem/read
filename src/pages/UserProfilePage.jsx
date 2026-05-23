import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import BookCover from '../components/BookCover';
import ReviewSheet from '../components/ReviewSheet';
import {
  getUserProfile,
  getFriendshipStatus,
  sendFriendRequest,
  cancelFriendRequest,
  removeFriend,
  respondToFriendRequest,
} from '../services/readApi';
import { resolveBookCover } from '../services/openLibrary';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import './UserProfilePage.css';

function FriendButton({ status, isRequester, busy, t, onAction }) {
  const base = {
    borderRadius: 20, fontSize: 13, fontWeight: 600,
    fontFamily: 'var(--font-ui)', cursor: busy ? 'not-allowed' : 'pointer',
    padding: '8px 18px', border: '1.5px solid', transition: 'all 0.15s',
  };

  if (status === 'accepted') {
    return (
      <button
        onClick={() => onAction('remove')}
        disabled={busy}
        style={{ ...base, background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        ✓ {t('friendFriends')}
      </button>
    );
  }

  if (status === 'pending' && isRequester) {
    return (
      <button
        onClick={() => onAction('cancel')}
        disabled={busy}
        style={{ ...base, background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        {t('friendSent')} ✓
      </button>
    );
  }

  if (status === 'pending' && !isRequester) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onAction('accept')}
          disabled={busy}
          style={{ ...base, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
        >
          {t('friendAccept')}
        </button>
        <button
          onClick={() => onAction('decline')}
          disabled={busy}
          style={{ ...base, background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          {t('friendDecline')}
        </button>
      </div>
    );
  }

  // status === 'none'
  return (
    <button
      onClick={() => onAction('add')}
      disabled={busy}
      style={{ ...base, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}
    >
      + {t('friendAdd')}
    </button>
  );
}

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
  const { user } = useAuth();
  const [profile, setProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [openReview, setOpenReview] = useState(null);

  // Section refs for stat-click scrolling
  const readingRef  = useRef(null);
  const finishedRef = useRef(null);
  const wantRef     = useRef(null);

  // Friend state: null=loading, or { status, friendship_id, is_requester }
  const [friendState, setFriendState]   = useState(null);
  const [friendBusy,  setFriendBusy]    = useState(false);

  const isOwnProfile = user && profile && (
    profile.username === (user.user_metadata?.username ?? '')
  );

  const loadFriendStatus = useCallback(async () => {
    try {
      const res = await getFriendshipStatus(username);
      setFriendState(res);
    } catch {
      setFriendState({ status: 'none' });
    }
  }, [username]);

  useEffect(() => {
    setLoading(true);
    setProfile(undefined);
    setFriendState(null);
    getUserProfile(username)
      .then(data => { setProfile(data); })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (profile && !isOwnProfile) loadFriendStatus();
  }, [profile, isOwnProfile, loadFriendStatus]);

  const handleFriendAction = async (action) => {
    if (friendBusy) return;
    setFriendBusy(true);
    try {
      if (action === 'add') {
        const res = await sendFriendRequest(username);
        if (res?.success) {
          await loadFriendStatus();
        } else {
          toast.error(t('friendErrSend'));
        }
      } else if (action === 'cancel') {
        await cancelFriendRequest(friendState.friendship_id);
        await loadFriendStatus();
      } else if (action === 'remove') {
        await removeFriend(friendState.friendship_id);
        toast(t('friendRemoved'));
        await loadFriendStatus();
      } else if (action === 'accept') {
        await respondToFriendRequest(friendState.friendship_id, 'accept');
        toast.success(t('friendAdded', profile.username));
        await loadFriendStatus();
      } else if (action === 'decline') {
        await respondToFriendRequest(friendState.friendship_id, 'decline');
        toast(t('friendDeclined'));
        await loadFriendStatus();
      }
    } catch {
      toast.error(t('friendErrSend'));
    } finally {
      setFriendBusy(false);
    }
  };

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
            {/* Friend button — only on other users' profiles */}
            {!isOwnProfile && friendState && (
              <FriendButton
                status={friendState.status}
                isRequester={friendState.is_requester}
                busy={friendBusy}
                t={t}
                onAction={handleFriendAction}
              />
            )}
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div
              className="profile-stat profile-stat--link"
              onClick={() => finishedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <span className="profile-stat__value">{profile.stats?.finished ?? 0}</span>
              <span className="profile-stat__label">{t('profileRead')}</span>
            </div>
            <div
              className="profile-stat profile-stat--link"
              onClick={() => readingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <span className="profile-stat__value">{profile.stats?.reading ?? 0}</span>
              <span className="profile-stat__label">{t('profileReading')}</span>
            </div>
            <div
              className="profile-stat profile-stat--link"
              onClick={() => finishedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <span className="profile-stat__value">{profile.stats?.reviews ?? 0}</span>
              <span className="profile-stat__label">{t('profileReviews')}</span>
            </div>
            <div
              className="profile-stat profile-stat--link"
              onClick={() => wantRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <span className="profile-stat__value">{profile.stats?.want ?? 0}</span>
              <span className="profile-stat__label">{t('profileWant')}</span>
            </div>
          </div>

          {/* ── Book sections — gated by privacy ──────────────────── */}
          {(!isOwnProfile && profile.profile_public === false) ? (
            /* Private profile */
            <div className="profile-empty">
              <div>{t('profilePrivate')}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{t('profilePrivateSub')}</div>
            </div>
          ) : (
            <>
              {/* Currently reading */}
              <div ref={readingRef}>
                {profile.show_reading_progress && profile.reading_books?.length > 0 && (
                  <div style={{ margin: '0 0 8px' }}>
                    <div className="profile-section-title">
                      {t('profileCurrentlyReading', profile.reading_books.length)}
                    </div>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, margin: '0 16px', overflow: 'hidden' }}>
                      {profile.reading_books.map(book => {
                        const pct = book.pages && book.current_page
                          ? Math.min(100, Math.round((book.current_page / book.pages) * 100))
                          : null;
                        return (
                          <div key={book.book_id} className="profile-book-row" style={{ cursor: 'default' }}>
                            <BookCover
                              title={book.title}
                              author={book.author}
                              coverUrl={resolveBookCover(book.cover_id, book.cover_url)}
                              width={52}
                              height={78}
                            />
                            <div className="profile-book-meta" style={{ flex: 1 }}>
                              <div className="profile-book-title">{book.title}</div>
                              <div className="profile-book-author">
                                {book.author}{book.pages ? ` · ${book.pages} p.` : ''}
                              </div>
                              {pct !== null && (
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                                      {book.current_page} / {book.pages} p.
                                    </span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>
                                      {pct}%
                                    </span>
                                  </div>
                                  <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%', borderRadius: 2,
                                      background: 'var(--accent)',
                                      width: `${pct}%`,
                                      transition: 'width 0.4s',
                                    }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Finished books */}
              <div ref={finishedRef}>
                {profile.finished_books?.length > 0 ? (
                  <div style={{ margin: '0 0 8px' }}>
                    <div className="profile-section-title">
                      {t('profileFinished', profile.finished_books.length)}
                    </div>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, margin: '0 16px', overflow: 'hidden' }}>
                      {profile.finished_books.map(book => {
                        const hasDetail = !!(book.review_body || book.rating);
                        return (
                          <div
                            key={book.book_id}
                            className="profile-book-row"
                            onClick={() => hasDetail && setOpenReview(book)}
                            style={{ cursor: hasDetail ? 'pointer' : 'default' }}
                          >
                            <BookCover
                              title={book.title}
                              author={book.author}
                              coverUrl={resolveBookCover(book.cover_id, book.cover_url)}
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
                                <div className="profile-book-review profile-book-review--clamp">
                                  {book.review_body}
                                </div>
                              )}
                              <div className="profile-book-date">
                                {book.finished_at ? t('profileFinishedAt', book.finished_at) : ''}
                                {hasDetail && <span className="profile-book-open"> →</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="profile-empty">
                    {t('profileEmpty')}
                  </div>
                )}
              </div>

              {/* Want to read */}
              <div ref={wantRef}>
                {profile.want_books?.length > 0 && (
                  <div style={{ margin: '0 0 8px' }}>
                    <div className="profile-section-title">
                      {t('profileWantTitle', profile.want_books.length)}
                    </div>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, margin: '0 16px', overflow: 'hidden' }}>
                      {profile.want_books.map(book => (
                        <div key={book.book_id} className="profile-book-row" style={{ cursor: 'default' }}>
                          <BookCover
                            title={book.title}
                            author={book.author}
                            coverUrl={resolveBookCover(book.cover_id, book.cover_url)}
                            width={52}
                            height={78}
                          />
                          <div className="profile-book-meta">
                            <div className="profile-book-title">{book.title}</div>
                            <div className="profile-book-author">
                              {book.author}{book.pages ? ` · ${book.pages} p.` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ height: 80 }} />
        </>
      )}

      {openReview && (
        <ReviewSheet
          item={openReview}
          onClose={() => setOpenReview(null)}
        />
      )}
    </div>
  );
}
