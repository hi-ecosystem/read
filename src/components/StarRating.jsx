import React from 'react';

export default function StarRating({ value = 0, count, size = 14 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 14 14">
          <polygon points="7,1 8.8,5.2 13.4,5.6 10,8.6 11,13.2 7,10.7 3,13.2 4,8.6 0.6,5.6 5.2,5.2"
            fill={i <= value ? '#FF4D1C' : 'none'}
            stroke="#FF4D1C" strokeWidth="1" />
        </svg>
      ))}
      {count != null && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 3 }}>{count}</span>
      )}
    </div>
  );
}
