import React from 'react';
import TopBar from '../components/TopBar';

export default function MePage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      <TopBar title="Me" subtitle="your profile" trailing={<div style={{ width: 36 }} />} />
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
        Profile coming soon.
      </div>
    </div>
  );
}
