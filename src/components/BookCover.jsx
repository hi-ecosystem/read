import React, { useState } from 'react';

export default function BookCover({ coverUrl, title, author, width = 64, height = 96 }) {
  const [err, setErr] = useState(false);
  const style = {
    width, height, borderRadius: 4, flexShrink: 0, objectFit: 'cover',
    boxShadow: 'var(--shadow-cover)',
  };
  if (coverUrl && !err) {
    return <img src={coverUrl} alt={title} style={style} onError={() => setErr(true)} />;
  }
  // Fallback placeholder
  const hue = (title?.charCodeAt(0) ?? 0) * 37 % 360;
  return (
    <div style={{
      ...style, background: `hsl(${hue},25%,38%)`,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '6px 5px',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ inset: 4, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 2, position: 'absolute', pointerEvents: 'none' }} />
      <span style={{ fontFamily: 'var(--font-editorial)', color: '#fff', fontSize: Math.max(7, width * 0.22), fontWeight: 600, lineHeight: 1.1, wordBreak: 'break-word' }}>{title}</span>
      <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: Math.max(6, width * 0.16), fontWeight: 400 }}>{author}</span>
    </div>
  );
}
