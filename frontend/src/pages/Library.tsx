import { useEffect, useMemo, useState } from 'react';
import { apiFetch, readApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type HabitTemplate = {
  id: string;
  name: string;
  description: string | null;
  habitType: 'HEALTH' | 'PRODUCTIVITY' | 'MINDFULNESS' | 'FITNESS' | 'LEARNING' | 'OTHER';
  scheduleType: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  targetPerPeriod: number;
  source: 'PLATFORM' | 'USER';
  createdByUser: {
    id: string;
    username: string;
  } | null;
};

const categories = ['All', 'Health', 'Productivity', 'Mindfulness', 'Fitness', 'Learning', 'Other'] as const;

const Library = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleSearchTerm, setMuscleSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isFitnessImporting, setIsFitnessImporting] = useState(false);
  const [claimingTemplateId, setClaimingTemplateId] = useState<string | null>(null);
  const [claimedTemplateIds, setClaimedTemplateIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await apiFetch('/api/templates/');

        if (!response.ok) {
          throw new Error(await readApiError(response, 'Could not load the habit library.'));
        }

        const data = (await response.json()) as { data: HabitTemplate[] };
        setTemplates(data.data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not load the habit library.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const categoryMatches =
        selectedCategory === 'All' || template.habitType === selectedCategory.toUpperCase();
      const searchMatches =
        searchTerm.trim() === '' ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase());

      return categoryMatches && searchMatches;
    });
  }, [templates, searchTerm, selectedCategory]);

  const handleClaim = async (templateId: string) => {
    setClaimingTemplateId(templateId);
    setError('');

    try {
      const response = await apiFetch(`/api/templates/${templateId}/claim`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not claim this habit.'));
      }

      setClaimedTemplateIds((current) =>
        current.includes(templateId) ? current : [...current, templateId],
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not claim this habit.',
      );
    } finally {
      setClaimingTemplateId(null);
    }
  };

  const handleFitnessImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedMuscle = muscleSearchTerm.trim().toLowerCase();

    if (!normalizedMuscle) {
      setError('Enter a muscle type to import fitness habits.');
      return;
    }

    setIsFitnessImporting(true);
    setError('');

    try {
      const response = await apiFetch('/api/fitness/import', {
        method: 'POST',
        body: JSON.stringify({
          muscle: normalizedMuscle,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not import fitness habits.'));
      }

      const data = (await response.json()) as { data: HabitTemplate[] };

      setTemplates((current) => {
        const existingIds = new Set(current.map((template) => template.id));
        const incomingTemplates = data.data.filter((template) => !existingIds.has(template.id));
        return [...incomingTemplates, ...current];
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not import fitness habits.',
      );
    } finally {
      setIsFitnessImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Habit Library</h1>

      {selectedCategory === 'Fitness' && (
        <form onSubmit={handleFitnessImport} className="mb-4 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Search by muscle type, like biceps or chest"
            value={muscleSearchTerm}
            onChange={(event) => setMuscleSearchTerm(event.target.value)}
            className="w-full rounded-md border p-3 md:flex-1"
          />
          <button
            type="submit"
            disabled={isFitnessImporting}
            className="rounded-md bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isFitnessImporting ? 'Importing...' : 'Import exercises'}
          </button>
        </form>
      )}

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

      {isLoading && <p className="text-slate-500">Loading the habit library...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!isLoading && !error && filteredTemplates.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No habits matched your search yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const isOwnedByCurrentUser = template.createdByUser?.id === user?.id;
          const creatorLabel =
            template.source === 'PLATFORM'
              ? 'Platform'
              : template.createdByUser?.username ?? 'Community';

          return (
            <div key={template.id} className="border p-6 rounded-lg bg-white shadow-sm flex flex-col h-full">
              <h3 className="font-bold text-lg mb-2">{template.name}</h3>
              <p className="text-gray-500 text-sm mb-4 flex-1">
                {template.description || 'No description added for this habit yet.'}
              </p>
              <div className="text-xs text-gray-400 mb-4 flex items-center justify-between">
                <span>{template.scheduleType}</span>
                <span>{template.source === 'PLATFORM' ? 'Platform' : 'Community'}</span>
              </div>
              <div className="mt-auto flex items-center justify-between text-sm text-slate-600">
                <span>Target: {template.targetPerPeriod}</span>
                <span>By {creatorLabel}</span>
              </div>
              <button
                type="button"
                disabled={
                  claimingTemplateId === template.id ||
                  claimedTemplateIds.includes(template.id) ||
                  isOwnedByCurrentUser
                }
                onClick={() => void handleClaim(template.id)}
                className="mt-4 w-full rounded-lg border-2 border-gray-800 py-2 font-bold transition hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {isOwnedByCurrentUser
                  ? 'Already yours'
                  : claimedTemplateIds.includes(template.id)
                    ? 'Claimed'
                    : claimingTemplateId === template.id
                      ? 'Claiming...'
                      : 'Claim'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Library;
