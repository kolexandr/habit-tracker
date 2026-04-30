import { useEffect, useMemo, useState } from 'react';
import { apiFetch, readApiError } from '../lib/api';

type Habit = {
  id: string;
  name: string;
  description: string | null;
  habitType: 'HEALTH' | 'PRODUCTIVITY' | 'MINDFULNESS' | 'FITNESS' | 'LEARNING' | 'OTHER';
  habitStatus: 'ACTIVE' | 'ARCHIVE';
  scheduleType: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  targetPerPeriod: number;
  currentStreak: number;
};

const categories = ['All', 'Health', 'Productivity', 'Mindfulness', 'Fitness', 'Learning', 'Other'] as const;

const Library = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHabits = async () => {
      try {
        const response = await apiFetch('/api/habits/');

        if (!response.ok) {
          throw new Error(await readApiError(response, 'Could not load your habits.'));
        }

        const data = (await response.json()) as { data: Habit[] };
        setHabits(data.data);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Could not load your habits.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadHabits();
  }, []);

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      const categoryMatches =
        selectedCategory === 'All' || habit.habitType === selectedCategory.toUpperCase();
      const searchMatches =
        searchTerm.trim() === '' ||
        habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        habit.description?.toLowerCase().includes(searchTerm.toLowerCase());

      return categoryMatches && searchMatches;
    });
  }, [habits, searchTerm, selectedCategory]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Habit Library</h1>
      
      <input 
        type="text" 
        placeholder="Search habits..." 
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="w-full border p-3 rounded-md mb-6"
      />

      <div className="flex gap-6 border-b mb-8 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`pb-2 px-1 ${selectedCategory === cat ? 'border-b-2 border-black font-bold' : 'text-gray-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-slate-500">Loading your habits...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!isLoading && !error && filteredHabits.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No habits matched your search yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHabits.map((habit) => (
          <div key={habit.id} className="border p-6 rounded-lg bg-white shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-lg mb-2">{habit.name}</h3>
            <p className="text-gray-500 text-sm mb-4 flex-1">
              {habit.description || 'No description added for this habit yet.'}
            </p>
            <div className="text-xs text-gray-400 mb-4 flex items-center justify-between">
              <span>{habit.scheduleType}</span>
              <span>{habit.habitStatus}</span>
            </div>
            <div className="mt-auto flex items-center justify-between text-sm text-slate-600">
              <span>Target: {habit.targetPerPeriod}</span>
              <span>Streak: {habit.currentStreak}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;
