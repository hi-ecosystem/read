import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import BottomNav from './components/BottomNav';
import FeedPage from './pages/FeedPage';
import ShelfPage from './pages/ShelfPage';
import AddBookPage from './pages/AddBookPage';
import DuoPage from './pages/DuoPage';
import MePage from './pages/MePage';
import LoginPage from './pages/LoginPage';
import UserProfilePage from './pages/UserProfilePage';
import './App.css';

function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 28, color: 'var(--text)' }}>read<span style={{ color: 'var(--accent)' }}>.</span></div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <>
      <Routes>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/shelf" element={<ShelfPage />} />
        <Route path="/add" element={<AddBookPage />} />
        <Route path="/duo" element={<DuoPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: 12, fontFamily: 'inherit', fontSize: 14 } }} />
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
  );
}
