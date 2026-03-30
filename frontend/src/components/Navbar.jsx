import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Moon, Sun, Scan, ChevronRight } from 'lucide-react';
import { useApp, ROLE_CONFIG } from '../context/AppContext';

export default function Navbar() {
  const { role, darkMode, setDarkMode, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const config = role ? ROLE_CONFIG[role] : null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={role ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
              <span className="text-sm">🌿</span>
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">
              Food<span className="text-brand-400">Trace</span>
            </span>
          </Link>

          {/* Center: breadcrumb if on inner page */}
          {role && (
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500">
              <span className="text-slate-400 font-medium">{config?.emoji} {config?.label}</span>
              {location.pathname !== '/dashboard' && (
                <>
                  <ChevronRight size={14} />
                  <span className="text-slate-500">
                    {location.pathname.replace('/', '').replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Track button */}
            <Link
              to="/track"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
            >
              <Scan size={15} />
              Track
            </Link>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Logout */}
            {role && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Exit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
