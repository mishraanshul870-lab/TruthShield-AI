import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import LoginRegister from './pages/LoginRegister';
import ResetPasswordPage from './pages/ResetPassword';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AnalyzeText = lazy(() => import('./pages/AnalyzeText'));
const AnalyzeImage = lazy(() => import('./pages/AnalyzeImage'));
const AnalyzeVideo = lazy(() => import('./pages/AnalyzeVideo'));
const VerifyUrl = lazy(() => import('./pages/VerifyUrl'));
const HistoryPage = lazy(() => import('./pages/History'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const ReportsPage = lazy(() => import('./pages/Reports'));

// Cyberpunk loading skeleton
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#0B0F1A] flex flex-col justify-center items-center p-6 space-y-6">
    <div className="w-full max-w-4xl space-y-8 animate-pulse">
      <div className="h-8 bg-slate-800/40 rounded w-1/3 border border-slate-700/10"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-slate-800/40 rounded-xl border border-slate-700/10"></div>
        <div className="h-32 bg-slate-800/40 rounded-xl border border-slate-700/10"></div>
        <div className="h-32 bg-slate-800/40 rounded-xl border border-slate-700/10"></div>
      </div>
      <div className="h-64 bg-slate-800/40 rounded-xl border border-slate-700/10 w-full"></div>
    </div>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-transparent text-white flex flex-row">
        {/* Left vertical sidebar (fixed 260px) */}
        {token && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        {/* Right scrollable viewport */}
        <div className={`flex-grow flex flex-col min-h-screen ${token ? 'lg:pl-64' : ''}`}>
          {token && <Topbar onMenuClick={() => setSidebarOpen(true)} />}
          
          <main className="flex-grow">
            <Suspense fallback={<LoadingSkeleton />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<LoginRegister />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Protected Client Command Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analyze-text" 
                  element={
                    <ProtectedRoute>
                      <AnalyzeText />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analyze-image" 
                  element={
                    <ProtectedRoute>
                      <AnalyzeImage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analyze-video" 
                  element={
                    <ProtectedRoute>
                      <AnalyzeVideo />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/verify-url" 
                  element={
                    <ProtectedRoute>
                      <VerifyUrl />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/history" 
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Wildcard Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
