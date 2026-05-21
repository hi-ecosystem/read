import React from 'react';

export default function Chip({ children, variant = 'default', onClick, style = {} }) {
  const variants = {
    default: { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' },
    dark:    { background: 'var(--text)', border: '1px solid var(--text)', color: 'var(--bg)' },
    accent:  { background: 'var(--accent)', border: '1px solid var(--accent)', color: '#fff' },
    duo:     { background: 'var(--accent-tint-bg)', border: '1px solid var(--accent-tint-border)', color: 'var(--accent)' },
  };
  return (
    <div onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      height: 24, padding: '0 10px', borderRadius: 9999,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
      cursor: onClick ? 'pointer' : 'default',
      ...variants[variant],
      ...style,
    }}>
      {children}
    </div>
  );
}
