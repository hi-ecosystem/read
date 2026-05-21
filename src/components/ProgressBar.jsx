import React from 'react';

export default function ProgressBar({ value = 0, height = 4, duo = false, style = {} }) {
  return (
    <div style={{ height, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', ...style }}>
      <div style={{
        height: '100%', width: `${Math.min(100, Math.max(0, value))}%`,
        borderRadius: 99,
        background: duo ? 'var(--accent)' : 'var(--text)',
        transition: 'width 400ms ease-out',
      }} />
    </div>
  );
}
