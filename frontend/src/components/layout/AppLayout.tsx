import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div className="text-center">
              <p className="text-sm font-black tracking-tight text-slate-900">HabitTracker</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Daily momentum</p>
            </div>

            <div className="h-11 w-11" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          <div className="absolute inset-y-0 left-0 w-[19rem] max-w-[85vw] animate-[promptLift_0.28s_ease-out]">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-white backdrop-blur"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar onNavigate={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
