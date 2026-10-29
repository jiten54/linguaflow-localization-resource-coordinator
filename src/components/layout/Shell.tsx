import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Calendar,
  FileCheck2,
  ShieldCheck,
  MailCheck,
  BarChart3,
  Settings,
  PlusCircle,
  Search,
  Menu,
  X,
  Layers,
  FileUp,
  UserCheck,
  ChevronDown,
  Globe2,
  Clock,
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../lib/api';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(api.getCurrentUser());
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.getUsers().then(setAvailableUsers).catch(console.error);
  }, []);

  const handleSwitchUser = (user: User) => {
    api.setCurrentUser(user);
    setCurrentUser(user);
    setIsUserMenuOpen(false);
    // Reload page or trigger re-render
    window.location.reload();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { label: 'Operations Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Translation Projects', path: '/projects', icon: FolderKanban },
    { label: 'Resource Directory', path: '/resources', icon: Users },
    { label: 'Assignments & Workload', path: '/assignments', icon: Layers },
    { label: 'File Preparation Center', path: '/files', icon: FileUp },
    { label: 'Deadlines & Calendar', path: '/calendar', icon: Calendar },
    { label: 'Quality Assurance', path: '/quality', icon: ShieldCheck },
    { label: 'Communication Center', path: '/communications', icon: MailCheck },
    { label: 'Operational Reports', path: '/reports', icon: BarChart3 },
    { label: 'User Directory', path: '/settings/users', icon: UserCheck },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-200 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800 bg-slate-950/60">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              LinguaFlow
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 bg-indigo-900/80 text-indigo-300 rounded border border-indigo-700/50">
                OPS
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Localization Platform</div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-3">
          <NavLink
            to="/projects/new"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Translation Project</span>
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border-l-2 border-indigo-500 pl-2.5'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Operational Role Card in Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="uppercase tracking-wider font-mono">Active Profile</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Operational
            </span>
          </div>
          <div className="bg-slate-800/80 rounded-md p-2 border border-slate-700/50">
            <div className="font-semibold text-xs text-white truncate">{currentUser.name}</div>
            <div className="text-[11px] text-indigo-300 font-medium truncate">{currentUser.title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{currentUser.role.replace(/_/g, ' ')}</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-indigo-600" />
              LinguaFlow
            </span>
          </div>

          {/* Global Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-md items-center relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects (e.g. LF-2026-0101, Novartis, Oncology)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800 placeholder-slate-400"
            />
          </form>

          {/* Right controls: Role switcher & profile */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-medium text-slate-700 transition-colors border border-slate-200"
                title="Switch persona for role-based testing"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline text-slate-500 text-[11px]">Role:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[140px]">{currentUser.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      Switch Role Persona
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Test permissions and workflows across operations:
                    </p>
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {availableUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u)}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-indigo-50/60 transition-colors ${
                          u.id === currentUser.id ? 'bg-indigo-50 font-semibold text-indigo-900' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.title}</div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="px-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                    Associate Resource Coordinator testing environment
                  </div>
                </div>
              )}
            </div>

            {/* Live Operations Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Oct 29, 2026 · CET</span>
            </div>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-slate-200 px-4 py-3 space-y-1 border-b border-slate-800">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Subtle Footer */}
        <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            LinguaFlow — Localization Project &amp; Resource Coordination Platform (Independent Portfolio Simulation)
          </div>
          <div className="text-slate-400 text-[11px]">
            FastAPI / PostgreSQL Engine · RWS Resource Coordinator Operational Spec
          </div>
        </footer>
      </div>
    </div>
  );
};
