import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <aside className="w-64 bg-gray-800 bg-blend-lighten text-white flex flex-col h-full">
      <div className="p-6 font-bold text-xl bg-gray-600 shadow-lg flex">
        <NavLink to="/dashboard">HabitTracker</NavLink>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <div className="flex">
          <img src="/dashboard.png" className="rounded-full w-8 h-8" />
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-950'}`}
          >
            Dashboard
          </NavLink>
        </div>

        <div className="flex">
          <img src="/book.png" className="rounded-full w-8 h-8" />
          <NavLink
            to="/library"
            className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-950'}`}
          >
            Library
          </NavLink>
        </div>

        <div className="flex">
          <img src="/user.png" className="rounded-full w-8 h-8" />
          <NavLink
            to="/profile"
            className={({ isActive }) => `block p-2 rounded ${isActive ? 'bg-gray-700' : 'hover:bg-gray-950'}`}
          >
            Profile
          </NavLink>
        </div>
      </nav>
      <div className="p-4 space-y-3 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-black"></div>
          <span className="text-sm font-medium">{user?.username ?? user?.email ?? 'Signed in'}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-gray-600 px-3 py-2 text-sm font-semibold text-left hover:bg-gray-700"
        >
          Log out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
