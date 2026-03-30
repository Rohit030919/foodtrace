import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import QRPage from './pages/QRPage';
import BatchTrackingPage from './pages/BatchTrackingPage';
import TrackPage from './pages/TrackPage';

function AppRoutes() {
  const { role } = useApp();

  return (
    <>
      <Navbar />
      <main className="relative z-10">
        <Routes>

          {/* ✅ ALWAYS show login at root */}
          <Route path="/" element={<LoginPage />} />

          {/* ✅ Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Other routes */}
          <Route path="/qr/:id" element={<QRPage />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/batch/:id" element={<BatchTrackingPage />} />
          <Route path="/track" element={<TrackPage />} />

          {/* Default fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#064e3b' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#7f1d1d' },
            },
            duration: 4000,
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}