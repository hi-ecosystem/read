import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import FeedPage from './pages/FeedPage';
import ShelfPage from './pages/ShelfPage';
import AddBookPage from './pages/AddBookPage';
import DuoPage from './pages/DuoPage';
import MePage from './pages/MePage';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ duration: 3000, style: { borderRadius: 12, fontFamily: 'inherit', fontSize: 14 } }} />
        <Routes>
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/shelf" element={<ShelfPage />} />
          <Route path="/add" element={<AddBookPage />} />
          <Route path="/duo" element={<DuoPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
  );
}
