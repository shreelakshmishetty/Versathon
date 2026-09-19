import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, UploadCloud, History, GitCompare, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Activity size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">H2</span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80">
                Medical AI
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-500 hidden sm:block">Report Explanation System</p>
          </div>
        </Link>

        {/* Navigation Links */}
        {isAuthenticated ? (
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/dashboard"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/dashboard')
                  ? 'bg-teal-50 text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/upload"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/upload')
                  ? 'bg-teal-50 text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <UploadCloud size={15} />
              <span>Upload</span>
            </Link>
            <Link
              to="/compare"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/compare')
                  ? 'bg-teal-50 text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <GitCompare size={15} />
              <span>Compare</span>
            </Link>
            <Link
              to="/history"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isActive('/history')
                  ? 'bg-teal-50 text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <History size={15} />
              <span>History</span>
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-1 sm:mx-2" />

            <div className="flex items-center gap-2">
              <span className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-bold">
                <UserIcon size={13} className="text-teal-600" />
                {user?.name || 'Patient'}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold"
                title="Log out"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-teal-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white shadow-md shadow-teal-600/20 transition-all transform hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
