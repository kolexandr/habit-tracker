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

type AdviceResponse = {
  slip: {
    id: number;
    advice: string;
  };
};

type DictionaryDefinition = {
  definition: string;
  example?: string;
};

type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
};

type DictionaryEntry = {
  word: string;
  phonetic?: string;
  meanings: DictionaryMeaning[];
};

const DEFAULT_WORD = 'discipline';

const ProfilePage = () => {
  const { user, refreshAuth } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(true);
  const [adviceError, setAdviceError] = useState('');
  const [wordInput, setWordInput] = useState(DEFAULT_WORD);
  const [dictionaryEntry, setDictionaryEntry] = useState<DictionaryEntry | null>(null);
  const [isWordLoading, setIsWordLoading] = useState(true);
  const [wordError, setWordError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAdvice = async () => {
      setIsAdviceLoading(true);
      setAdviceError('');

      try {
        const adviceResponse = await fetch('https://api.adviceslip.com/advice', {
          cache: 'no-store',
        });

        if (!adviceResponse.ok) {
          throw new Error('Could not load advice right now.');
        }

        const adviceData = (await adviceResponse.json()) as AdviceResponse;
        setAdvice(adviceData);
      } catch (requestError) {
        setAdvice(null);
        setAdviceError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not load advice right now.',
        );
      } finally {
        setIsAdviceLoading(false);
      }
    };

    const loadDefinition = async (rawWord: string) => {
      const normalizedWord = rawWord.trim().toLowerCase();

      if (!normalizedWord) {
        setDictionaryEntry(null);
        setWordError('Type a word like "focus" or "consistency" to explore its meaning.');
        setIsWordLoading(false);
        return;
      }

      setIsWordLoading(true);
      setWordError('');

      try {
        const dictionaryResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`, {
          cache: 'no-store',
        });

        if (!dictionaryResponse.ok) {
          throw new Error(`No definition found for "${normalizedWord}".`);
        }

        const dictionaryData = (await dictionaryResponse.json()) as DictionaryEntry[];
        setDictionaryEntry(dictionaryData[0] ?? null);
      } catch (requestError) {
        setDictionaryEntry(null);
        setWordError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not load the definition right now.',
        );
      } finally {
        setIsWordLoading(false);
      }
    };

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
    void loadAdvice();
    void loadDefinition(DEFAULT_WORD);
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
  const primaryMeaning = dictionaryEntry?.meanings[0];
  const primaryDefinition = primaryMeaning?.definitions[0];

  const handleWordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedWord = wordInput.trim().toLowerCase();

    if (!normalizedWord) {
      setDictionaryEntry(null);
      setWordError('Type a word like "focus" or "consistency" to explore its meaning.');
      return;
    }

    setIsWordLoading(true);
    setWordError('');

    try {
      const dictionaryResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`, {
        cache: 'no-store',
      });

      if (!dictionaryResponse.ok) {
        throw new Error(`No definition found for "${normalizedWord}".`);
      }

      const dictionaryData = (await dictionaryResponse.json()) as DictionaryEntry[];
      setDictionaryEntry(dictionaryData[0] ?? null);
    } catch (requestError) {
      setDictionaryEntry(null);
      setWordError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not load the definition right now.',
      );
    } finally {
      setIsWordLoading(false);
    }
  };

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

      <div className="mb-10 rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-8 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-2xl text-white shadow-lg">
            💡
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Daily Advice</h2>
            <p className="text-sm text-slate-500">A small prompt to keep your momentum going.</p>
          </div>
        </div>

        {isAdviceLoading ? (
          <p className="text-slate-500">Loading advice...</p>
        ) : advice ? (
          <blockquote className="rounded-2xl border border-white/70 bg-white/80 p-5 text-lg leading-relaxed text-slate-700 shadow-sm">
            "{advice.slip.advice}"
          </blockquote>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-slate-500">
            {adviceError || 'Advice is unavailable right now.'}
          </div>
        )}
      </div>

      <div className="mb-10 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-2xl text-white shadow-lg">
            📚
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Word of the Day</h2>
            <p className="text-sm text-slate-500">Type a habit word and get a quick definition back.</p>
          </div>
        </div>

        <form onSubmit={handleWordSubmit} className="mb-5 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={wordInput}
            onChange={(event) => setWordInput(event.target.value)}
            placeholder="Try discipline, focus, consistency..."
            className="flex-1 rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
          <button
            type="submit"
            className="rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
          >
            Define word
          </button>
        </form>

        {isWordLoading ? (
          <p className="text-slate-500">Looking up the definition...</p>
        ) : dictionaryEntry && primaryMeaning && primaryDefinition ? (
          <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-bold capitalize text-slate-800">{dictionaryEntry.word}</h3>
              {dictionaryEntry.phonetic && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                  {dictionaryEntry.phonetic}
                </span>
              )}
              <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium uppercase tracking-wide text-cyan-700">
                {primaryMeaning.partOfSpeech}
              </span>
            </div>
            <p className="text-lg leading-relaxed text-slate-700">{primaryDefinition.definition}</p>
            {primaryDefinition.example && (
              <p className="mt-3 text-sm italic text-slate-500">Example: {primaryDefinition.example}</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-5 text-slate-500">
            {wordError || 'No definition is available right now.'}
          </div>
        )}
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
