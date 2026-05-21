import React from 'react';

const BG_COLORS = ['#C24B2A','#1E2A3A','#6B7A5A','#8B6F3F','#B83D3D','#3D5B8B','#5A3D8B'];

function getBg(name) {
  let hash = 0;
  for (let c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export default function Avatar({ name = '?', size = 36, style = {} }) {
  const radius = size <= 24 ? 7 : size <= 40 ? 10 : 12;
  const fontSize = size <= 24 ? 10 : size <= 40 ? 13 : 16;
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: getBg(name), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 600, letterSpacing: '-0.01em',
      flexShrink: 0, ...style
    }}>
      {initials}
    </div>
  );
}
