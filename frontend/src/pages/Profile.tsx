import React from 'react';

const ProfilePage = () => {
  const stats = [
    { label: 'Total Habits', value: '12', icon: '📋' },
    { label: 'Total Completions', value: '347', icon: '✅' },
    { label: 'Longest Streak', value: '15', icon: '🔥' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center gap-6 mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          OK
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Oleksandr koniukh</h1>
          <p className="text-slate-500 text-sm italic">Member since March 15, 2024</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
            <span className="text-2xl mb-2">{stat.icon}</span>
            <span className="text-3xl font-extrabold text-slate-800">{stat.value}</span>
            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Productivity Score - Visual Depth */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">📈</div>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Productivity Score</h2>
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-10 border-slate-100 relative">
            <span className="text-4xl font-black text-indigo-600">85</span>
            {/* Simple Progress Ring Overlay can be added here */}
        </div>
      </div>

      {/* Active Habits List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">My Active Habits</h3>
        {['Morning Exercise', 'Read for 30 minutes'].map((habit) => (
          <div key={habit} className="group bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
            <span className="font-semibold text-slate-700">{habit}</span>
            <div className="flex gap-2">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">Daily</span>
                <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold">🔥 12 day streak</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;