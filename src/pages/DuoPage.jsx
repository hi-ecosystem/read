import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import BookCover from '../components/BookCover';
import ProgressBar from '../components/ProgressBar';
import './DuoPage.css';

const MOCK_DUO = {
  partner: 'Jonas L.',
  book: { title: 'Pachinko', author: 'Min Jin Lee', pages: 384, coverUrl: null },
  startDate: 'may 15',
  streak: 6,
  myProgress: 132,
  partnerProgress: 102,
  finishBy: 'Jun 4',
  pace: '~22 p/day',
  checkIns: '12 / 12',
  days: [
    { label: 'M', both: true }, { label: 'T', both: true }, { label: 'W', both: true },
    { label: 'T', both: true }, { label: 'F', both: true }, { label: 'S', both: false },
    { label: 'S', active: true },
  ],
  messages: [
    { id: 1, user: 'Jonas L.', page: 104, time: '1h', text: 'ok the time skip just hit me. you there yet?' },
    { id: 2, user: 'You', page: 132, time: 'just now', text: "yeah — Sunja's chapter wrecked me a little" },
  ],
};

export default function DuoPage() {
  const navigate = useNavigate();
  const [checkedIn, setCheckedIn] = useState(false);
  const duo = MOCK_DUO;
  const myPct = Math.round((duo.myProgress / duo.book.pages) * 100);
  const partnerPct = Math.round((duo.partnerProgress / duo.book.pages) * 100);

  return (
    <div className="duo-page">
      <TopBar
        title={`You & ${duo.partner.split(' ')[0]}`}
        onBack={() => navigate(-1)}
        trailing={
          <button className="icon-btn" aria-label="More">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 18 18">
              <circle cx="4" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="14" cy="9" r="1.2" fill="currentColor"/>
            </svg>
          </button>
        }
      />

      {/* Hero */}
      <div className="duo-hero">
        <BookCover title={duo.book.title} author={duo.book.author} coverUrl={duo.book.coverUrl} width={78} height={116} />
        <div className="duo-hero__meta">
          <div className="label-upper">Reading together</div>
          <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', margin: '4px 0' }}>{duo.book.title}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>started {duo.startDate} · {duo.book.pages} pages</div>
          <div className="duo-streak">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--accent)"><path d="M8 1C5 4 3 6 3 9a5 5 0 0 0 10 0c0-2-1-4-2-5-1 2-2 3-3 2.5C7 5 8 1 8 1z"/></svg>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{duo.streak}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>day streak</span>
          </div>
        </div>
      </div>

      {/* Progress card */}
      <div className="card duo-progress">
        <div className="duo-progress__cols">
          <div className="duo-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Avatar name="You" size={24} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>You</span>
            </div>
            <div>
              <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{duo.myProgress}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}> / {duo.book.pages}</span>
            </div>
            <ProgressBar value={myPct} height={6} duo={true} style={{ margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{myPct}%</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--accent)' }}>+18 today</span>
            </div>
          </div>
          <div className="duo-progress__divider" />
          <div className="duo-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Avatar name={duo.partner} size={24} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{duo.partner.split(' ')[0]}</span>
            </div>
            <div>
              <span className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{duo.partnerProgress}</span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}> / {duo.book.pages}</span>
            </div>
            <ProgressBar value={partnerPct} height={6} duo={false} style={{ margin: '6px 0' }} />
            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{partnerPct}%</div>
          </div>
        </div>
        <div className="duo-progress__dashed" />
        <div className="duo-stats">
          {[['Finish by', duo.finishBy], ['Pace', duo.pace], ['Check-ins', duo.checkIns]].map(([l, v], i) => (
            <React.Fragment key={l}>
              {i > 0 && <div className="duo-stats__divider" />}
              <div className="duo-stat">
                <div className="label-upper">{l}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{v}</div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Streak strip */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Last 7 days</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>both checked in</span>
        </div>
        <div className="streak-strip">
          {duo.days.map((d, i) => (
            <div key={i} className={`streak-cell ${d.active ? 'active' : ''}`}>
              <span className="streak-cell__day">{d.label}</span>
              <div className={`streak-cell__dot ${d.both ? 'both' : ''}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Margin notes</span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>3 new</span>
        </div>
        <div className="card">
          {duo.messages.map((m, i) => (
            <div key={m.id} className={`duo-msg ${i > 0 ? 'bordered' : ''}`}>
              <Avatar name={m.user} size={24} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{m.user}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>p. {m.page} · {m.time}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.45 }}>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="duo-cta">
        <button
          className={`btn ${checkedIn ? 'btn-checked' : 'btn-primary'}`}
          style={{ flex: 1 }}
          onClick={() => setCheckedIn(true)}
          disabled={checkedIn}
        >
          {checkedIn ? '✓ Checked in today' : '+ Check in today'}
        </button>
        <button className="icon-btn" style={{ width: 48, height: 48, borderRadius: 12 }} aria-label="Open chat">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 20 20">
            <path d="M17 11a3 3 0 0 1-3 3H7l-3 3V5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3z"/>
          </svg>
        </button>
      </div>

      <div style={{ height: 96 }} />
    </div>
  );
}
