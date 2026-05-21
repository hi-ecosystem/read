import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const tabs = [
  { id: 'feed',  label: 'Feed',  path: '/feed',  icon: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="13" y2="16"/>
    </svg>
  )},
  { id: 'shelf', label: 'Shelf', path: '/shelf', icon: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="4" height="16" rx="1"/><rect x="9" y="5" width="4" height="14" rx="1"/><rect x="15" y="2" width="4" height="17" rx="1"/>
    </svg>
  )},
  { id: 'add',   label: 'Add',   path: '/add',   icon: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="11" y1="7" x2="11" y2="15"/><line x1="7" y1="11" x2="15" y2="11"/>
    </svg>
  )},
  { id: 'duo',   label: 'Duo',   path: '/duo',   icon: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3"/><circle cx="14" cy="8" r="3"/><path d="M2 19c0-3.3 2.7-6 6-6"/><path d="M14 13c3.3 0 6 2.7 6 6"/>
    </svg>
  )},
  { id: 'me',    label: 'Me',    path: '/me',    icon: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="8" r="4"/><path d="M3 20a8 8 0 0 1 16 0"/>
    </svg>
  )},
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = tabs.find(t => pathname.startsWith(t.path))?.id ?? 'feed';
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button key={t.id} className={`nav-tab ${active === t.id ? 'active' : ''}`} onClick={() => navigate(t.path)} aria-label={t.label}>
          {t.icon}
          <span className="nav-tab__label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
