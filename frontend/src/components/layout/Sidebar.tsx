import { BookOpen, ChevronRight, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type SidebarProps = {
  onNavigate?: () => void;
};

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, accent: 'from-sky-500 to-cyan-400' },
  { to: '/library', label: 'Library', icon: BookOpen, accent: 'from-amber-500 to-orange-400' },
  { to: '/profile', label: 'Profile', icon: UserRound, accent: 'from-emerald-500 to-teal-400' },
];

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside className="flex h-full w-[18rem] flex-col border-r border-slate-200/70 bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_55%,#020617_100%)] text-white shadow-2xl">
      <div className="relative overflow-hidden border-b border-white/10 px-6 py-6">
        <div className="absolute -right-8 top-0 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl" />
        <NavLink
          to="/dashboard"
          onClick={onNavigate}
          className="relative flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <LayoutDashboard size={20} className="text-sky-300" />
          </div>
          <div>
            <p className="text-lg font-black tracking-tight">HabitTracker</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Daily momentum</p>
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 px-4 py-5">
        <div className="mb-4 px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
          Navigation
        </div>
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 transition duration-300 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-lg shadow-slate-950/20'
                      : 'text-slate-200 hover:bg-white/8 hover:text-white'
                  }`
                }
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-md transition duration-300 ${
                    isCurrent ? 'scale-100' : 'scale-95 group-hover:scale-100'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{item.label}</div>
                  <div className={`text-xs transition ${isCurrent ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-300'}`}>
                    {item.label === 'Dashboard'
                      ? 'Track today'
                      : item.label === 'Library'
                        ? 'Browse ideas'
                        : 'Manage account'}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className={`transition duration-300 ${isCurrent ? 'translate-x-0 text-slate-400' : '-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-slate-400'}`}
                />
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-3xl bg-white/6 p-4 ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 font-bold text-slate-900">
              {(user?.username ?? user?.email ?? 'S').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.username ?? 'Signed in'}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.email ?? 'Your habits are synced'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
