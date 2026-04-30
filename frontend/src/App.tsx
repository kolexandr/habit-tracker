import { Sparkles, ArrowRight, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const App = ({ userName = "Oleksandr" }) => {
  // Logic to determine greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Hero Introduction */}
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          Your daily briefing
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
          {greeting}, {userName}.
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          You've completed <span className="text-slate-900 font-semibold underline decoration-indigo-500">65% of your goals</span> this week. 
          Keep the momentum going—consistency is the secret to mastery.
        </p>
      </header>

      {/* Feature Section: The "Focus" Card */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative overflow-hidden bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
          <div className="relative z-10 space-y-6">
            <h3 className="text-indigo-400 font-bold flex items-center gap-2">
              <Target size={20} /> Today's Focus
            </h3>
            <h2 className="text-2xl font-bold max-w-md">
              "Mastering a new skill requires 20 hours of focused practice."
            </h2>
            <p className="text-slate-400 text-sm max-w-sm">
              Your "Guitar Practice" habit is currently at 12 hours. You're more than halfway to your first milestone!
            </p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition">
              Start Tracking <ArrowRight size={18} />
            </Link>
          </div>
          {/* Decorative Background Element */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">Current Stats</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Zap size={20} fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Global Streak</p>
                  <p className="text-xl font-bold text-slate-900">12 Days</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Target size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Habits Active</p>
                  <p className="text-xl font-bold text-slate-900">8 Habits</p>
                </div>
              </div>
            </div>
          </div>
          <Link to="/profile" className="text-indigo-600 font-bold text-sm flex items-center gap-1 mt-6 hover:underline">
            View Analytics <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Suggested from Library */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900">Recommended for you</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Mindfulness', 'Hydration', 'Deep Work', 'Sleep Tech'].map((item) => (
            <div key={item} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition cursor-pointer group">
              <div className="w-10 h-10 bg-slate-50 rounded-lg mb-3 group-hover:bg-indigo-50 transition"></div>
              <p className="font-bold text-slate-800">{item}</p>
              <p className="text-xs text-slate-400">Add to your day</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default App;
