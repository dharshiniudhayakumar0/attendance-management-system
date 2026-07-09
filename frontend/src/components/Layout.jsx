import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const session = localStorage.getItem("user");
    if (!session) {
      navigate("/");
    } else {
      setUser(JSON.parse(session));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col md:flex-row">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            A
          </div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            AMS Portal
          </span>
        </div>

        {/* Nav Links */}
        <nav className="px-4 space-y-1.5">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive("/dashboard")
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
            </svg>
            Dashboard
          </Link>

          <Link
            to="/employees"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive("/employees")
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Employees
          </Link>

          <Link
            to="/attendance"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive("/attendance")
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Attendance
          </Link>

          <Link
            to="/reports"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              isActive("/reports")
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </Link>
        </nav>

        {/* Spacer to push everything else down */}
        <div className="flex-1" />

        {/* User profile & Logout at the bottom */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 space-y-3">
          <div className="p-3 bg-slate-950/40 border border-slate-805/50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-350 font-extrabold uppercase shrink-0">
              {user.username.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold truncate text-white">{user.username}</h4>
              <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 h-16 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md">
            A
          </div>
          <span className="font-extrabold text-md bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            AMS
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-slate-400 hover:text-white focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-4 space-y-2 absolute top-16 left-0 w-full z-20 shadow-xl">
          <Link
            to="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl text-sm font-medium ${
              isActive("/dashboard") ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/employees"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl text-sm font-medium ${
              isActive("/employees") ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Employees
          </Link>
          <Link
            to="/attendance"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl text-sm font-medium ${
              isActive("/attendance") ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Attendance
          </Link>
          <Link
            to="/reports"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block px-4 py-3 rounded-xl text-sm font-medium ${
              isActive("/reports") ? "bg-indigo-600 text-white" : "text-slate-400"
            }`}
          >
            Reports
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-slate-800"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
