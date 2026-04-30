import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, readApiError } from '../lib/api';

type Habit = {
  id: string;
  name: string;
  scheduleType: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  habitStatus: 'ACTIVE' | 'ARCHIVE';
  currentStreak: number;
  habitCompletions?: { id: string }[];
};

type ProfileSummary = {
  totalHabits: number;
  totalCompletions: number;
  longestStreak: number;
};

const ProfilePage = () => {
  const { user, refreshAuth } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        await refreshAuth();
        const [habitsResponse, summaryResponse] = await Promise.all([
          apiFetch('/api/habits/mine'),
          apiFetch('/api/auth/profile-summary'),
        ]);

        if (!habitsResponse.ok) {
          throw new Error(await readApiError(habitsResponse, 'Could not load your profile details.'));
        }

        if (!summaryResponse.ok) {
          throw new Error(await readApiError(summaryResponse, 'Could not load your profile details.'));
        }

        const habitsData = (await habitsResponse.json()) as { data: Habit[] };
        const summaryData = (await summaryResponse.json()) as { stats: ProfileSummary };

        setHabits(habitsData.data);
        setSummary(summaryData.stats);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not load your profile details.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfileData();
  }, [refreshAuth]);

  const stats = useMemo(() => {
    return [
      { label: 'Total Habits', value: String(summary?.totalHabits ?? 0), icon: '📋' },
      { label: 'Total Completions', value: String(summary?.totalCompletions ?? 0), icon: '✅' },
      { label: 'Longest Streak', value: String(summary?.longestStreak ?? 0), icon: '🔥' },
    ];
  }, [summary]);

  const activeHabits = habits.filter((habit) => habit.habitStatus === 'ACTIVE');
  const initials =
    user?.username
      ?.split(' ')
      .map((part) => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2) || user?.email.slice(0, 2).toUpperCase() || 'HT';
  const memberSince = user
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  if (isLoading) {
    return <div className="max-w-4xl mx-auto text-slate-500">Loading your profile...</div>;
  }

  if (error) {
    return <div className="max-w-4xl mx-auto text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center gap-6 mb-10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
          {initials}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user?.username ?? user?.email}</h1>
          <p className="text-slate-500 text-sm italic">Member since {memberSince}</p>
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
            <span className="text-4xl font-black text-indigo-600">{user?.productivityScore ?? 0}</span>
        </div>
      </div>

      {/* Active Habits List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">My Active Habits</h3>
        {activeHabits.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
            No active habits yet.
          </div>
        )}
        {activeHabits.map((habit) => (
          <div key={habit.id} className="group bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
            <span className="font-semibold text-slate-700">{habit.name}</span>
            <div className="flex gap-2">
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold">{habit.scheduleType}</span>
                <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold">🔥 {habit.currentStreak} day streak</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
