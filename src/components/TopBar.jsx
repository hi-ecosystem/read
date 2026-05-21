import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ title, subtitle, onBack, trailing }) {
  const navigate = useNavigate();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px 12px', background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {onBack ? (
        <button onClick={() => onBack ? onBack() : navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--surface)',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }} aria-label="Back">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 18 18">
            <polyline points="11,4 6,9 11,14"/>
          </svg>
        </button>
      ) : (
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {title}<span style={{ color: 'var(--accent)' }}>.</span>
          </h1>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.02em' }}>{subtitle}</div>}
        </div>
      )}
      {onBack && (
        <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>{title}</div>
      )}
      {trailing ?? <div style={{ width: 36 }} />}
    </div>
  );
}
