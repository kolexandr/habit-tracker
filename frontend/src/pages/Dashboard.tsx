import { useCallback, useEffect, useMemo, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import HabitCard from '../components/UI/HabitCard';
import { apiFetch, readApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Habit = {
  id: string;
  name: string;
  description: string | null;
  scheduleType: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  habitType: 'HEALTH' | 'PRODUCTIVITY' | 'MINDFULNESS' | 'FITNESS' | 'LEARNING' | 'OTHER';
  habitStatus: 'ACTIVE' | 'ARCHIVE';
  isPublic: boolean;
  targetPerPeriod: number;
  currentStreak: number;
  endDate: string | null;
  habitCompletions: { id: string; completedAt?: string }[];
};

type HabitFormValues = {
  name: string;
  description: string;
  scheduleType: Habit['scheduleType'];
  habitType: Habit['habitType'];
  habitStatus: Habit['habitStatus'];
  isPublic: boolean;
  targetPerPeriod: number;
  endDate: string;
};

type GeneratedHabit = {
  name: string;
  description?: string;
  scheduleType: Habit['scheduleType'];
  habitType: Habit['habitType'];
  targetPerPeriod: number | string;
  endDate?: string;
};

type GenerationResponse = {
  data: {
    commentary: string;
    habits: GeneratedHabit[];
  };
};

type PromptComposerProps = {
  prompt: string;
  isGenerating: boolean;
  generationError: string;
  onPromptChange: (value: string) => void;
  onPromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPromptKeyDown: (event: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
};

type CoachViewState = 'idle' | 'loading' | 'results';

const scheduleOptions: Habit['scheduleType'][] = ['DAILY', 'WEEKLY', 'CUSTOM'];
const habitTypeOptions: Habit['habitType'][] = [
  'HEALTH',
  'PRODUCTIVITY',
  'MINDFULNESS',
  'FITNESS',
  'LEARNING',
  'OTHER',
];
const statusOptions: Habit['habitStatus'][] = ['ACTIVE', 'ARCHIVE'];

const emptyFormValues: HabitFormValues = {
  name: '',
  description: '',
  scheduleType: 'DAILY',
  habitType: 'OTHER',
  habitStatus: 'ACTIVE',
  isPublic: false,
  targetPerPeriod: 1,
  endDate: '',
};

const formatLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const buildCreatePayload = (values: HabitFormValues) => ({
  name: values.name.trim(),
  ...(values.description.trim() ? { description: values.description.trim() } : {}),
  scheduleType: values.scheduleType,
  habitType: values.habitType,
  habitStatus: values.habitStatus,
  isPublic: values.isPublic,
  targetPerPeriod: Number(values.targetPerPeriod),
  ...(values.endDate ? { endDate: values.endDate } : {}),
});

const buildPatchPayload = (values: HabitFormValues) => ({
  name: values.name.trim(),
  description: values.description.trim() ? values.description.trim() : null,
  scheduleType: values.scheduleType,
  habitType: values.habitType,
  habitStatus: values.habitStatus,
  isPublic: values.isPublic,
  targetPerPeriod: Number(values.targetPerPeriod),
  endDate: values.endDate || null,
});

const mapHabitToForm = (habit: Habit): HabitFormValues => ({
  name: habit.name,
  description: habit.description ?? '',
  scheduleType: habit.scheduleType,
  habitType: habit.habitType,
  habitStatus: habit.habitStatus,
  isPublic: habit.isPublic,
  targetPerPeriod: habit.targetPerPeriod,
  endDate: habit.endDate ? habit.endDate.slice(0, 10) : '',
});

const HabitFormFields = ({
  values,
  onChange,
  onSubmit,
  submitLabel,
  isSubmitting,
  error,
  secondaryAction,
}: {
  values: HabitFormValues;
  onChange: <K extends keyof HabitFormValues>(field: K, value: HabitFormValues[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSubmitting: boolean;
  error: string;
  secondaryAction?: React.ReactNode;
}) => (
  <form onSubmit={onSubmit} className="space-y-5">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Name</span>
        <input
          value={values.name}
          onChange={(event) => onChange('name', event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          required
          minLength={3}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Schedule Type</span>
        <select
          value={values.scheduleType}
          onChange={(event) => onChange('scheduleType', event.target.value as Habit['scheduleType'])}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        >
          {scheduleOptions.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Habit Type</span>
        <select
          value={values.habitType}
          onChange={(event) => onChange('habitType', event.target.value as Habit['habitType'])}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        >
          {habitTypeOptions.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Status</span>
        <select
          value={values.habitStatus}
          onChange={(event) => onChange('habitStatus', event.target.value as Habit['habitStatus'])}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Target Per Period</span>
        <input
          type="number"
          min={1}
          value={values.targetPerPeriod}
          onChange={(event) => onChange('targetPerPeriod', Number(event.target.value))}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          required
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">End Date</span>
        <input
          type="date"
          value={values.endDate}
          onChange={(event) => onChange('endDate', event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        />
      </label>
    </div>

    <label className="space-y-2 block">
      <span className="text-sm font-semibold text-slate-700">Description</span>
      <textarea
        value={values.description}
        onChange={(event) => onChange('description', event.target.value)}
        rows={4}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        placeholder="Optional description"
      />
    </label>

    <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={values.isPublic}
        onChange={(event) => onChange('isPublic', event.target.checked)}
      />
      Make this habit visible in the public library
    </label>

    {error && <p className="text-sm text-red-600">{error}</p>}

    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div>{secondaryAction}</div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  </form>
);

const PromptComposer = ({
  prompt,
  isGenerating,
  generationError,
  onPromptChange,
  onPromptSubmit,
  onPromptKeyDown,
}: PromptComposerProps) => (
  <form
    onSubmit={onPromptSubmit}
    className="rounded-[1.75rem] border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:p-4"
  >
    <div className="flex flex-col gap-3">
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={onPromptKeyDown}
        rows={2}
        placeholder="What is your goal this month?"
        className="min-h-20 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white sm:text-base"
      />

      {generationError && <p className="text-sm text-red-600">{generationError}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Press `Enter` to generate, `Shift+Enter` for a new line.
        </p>
        <button
          type="submit"
          disabled={isGenerating}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  </form>
);

const CoachLoadingState = () => (
  <section className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
    <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-600">AI Habit Coach</p>
    <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Consulting your personal coach...</h2>
    <div className="mt-6 flex items-center justify-center gap-2">
      <span className="h-3 w-3 rounded-full bg-slate-900 animate-[pulse_1.1s_ease-in-out_infinite]" />
      <span className="h-3 w-3 rounded-full bg-slate-700 animate-[pulse_1.1s_ease-in-out_0.18s_infinite]" />
      <span className="h-3 w-3 rounded-full bg-slate-500 animate-[pulse_1.1s_ease-in-out_0.36s_infinite]" />
    </div>
  </section>
);

const Dashboard = () => {
  const { refreshAuth } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingHabitId, setTogglingHabitId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [createValues, setCreateValues] = useState<HabitFormValues>(emptyFormValues);
  const [editValues, setEditValues] = useState<HabitFormValues>(emptyFormValues);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [modalError, setModalError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [generatedCommentary, setGeneratedCommentary] = useState('');
  const [animatedCommentary, setAnimatedCommentary] = useState('');
  const [generatedHabits, setGeneratedHabits] = useState<GeneratedHabit[]>([]);
  const [claimedGeneratedHabitNames, setClaimedGeneratedHabitNames] = useState<string[]>([]);
  const [claimingGeneratedHabitName, setClaimingGeneratedHabitName] = useState<string | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      const response = await apiFetch('/api/habits/mine');

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not load your dashboard.'));
      }

      const data = (await response.json()) as { data: Habit[] };
      setHabits(data.data);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Could not load your dashboard.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  useEffect(() => {
    if (!generatedCommentary) {
      setAnimatedCommentary('');
      return;
    }

    let index = 0;
    const interval = window.setInterval(() => {
      index += 1;
      setAnimatedCommentary(generatedCommentary.slice(0, index));

      if (index >= generatedCommentary.length) {
        window.clearInterval(interval);
      }
    }, 18);

    return () => window.clearInterval(interval);
  }, [generatedCommentary]);

  const normalizedHabits = useMemo(
    () =>
      habits.map((habit) => ({
        id: habit.id,
        title: habit.name,
        streak: habit.currentStreak,
        isCompleted: habit.habitCompletions.length > 0,
        scheduleType: habit.scheduleType,
      })),
    [habits],
  );

  const selectedHabit = useMemo(
    () => habits.find((habit) => habit.id === selectedHabitId) ?? null,
    [habits, selectedHabitId],
  );

  const coachViewState: CoachViewState = isGenerating
    ? 'loading'
    : generatedCommentary || generatedHabits.length > 0
      ? 'results'
      : 'idle';

  const displayedGeneratedHabits = generatedHabits.slice(0, 4);
  const isCoachOverlayVisible = coachViewState !== 'idle';

  const completedCount = normalizedHabits.filter((habit) => habit.isCompleted).length;
  const progress =
    normalizedHabits.length === 0 ? 0 : Math.round((completedCount / normalizedHabits.length) * 100);

  const handleToggleCompletion = async (habitId: string, isCompleted: boolean) => {
    setTogglingHabitId(habitId);
    setError('');

    try {
      const response = await apiFetch(`/api/habits/${habitId}/completions`, {
        method: isCompleted ? 'DELETE' : 'POST',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not update habit completion.'));
      }

      const responseData = (await response.json()) as {
        habit?: {
          id: string;
          currentStreak: number;
        };
      };

      setHabits((currentHabits) =>
        currentHabits.map((habit) =>
          habit.id !== habitId
            ? habit
            : {
                ...habit,
                currentStreak: responseData.habit?.currentStreak ?? habit.currentStreak,
                habitCompletions: isCompleted ? [] : [{ id: 'current-period' }],
              },
        ),
      );
      await refreshAuth();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not update habit completion.',
      );
    } finally {
      setTogglingHabitId(null);
    }
  };

  const openCreateModal = () => {
    setCreateValues(emptyFormValues);
    setModalError('');
    setIsCreateModalOpen(true);
  };

  const openManageModal = () => {
    setModalError('');
    setIsManageModalOpen(true);
    if (habits.length > 0) {
      setSelectedHabitId((current) => current ?? habits[0].id);
      const firstHabit = habits[0];
      setEditValues(mapHabitToForm(firstHabit));
    }
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsManageModalOpen(false);
    setModalError('');
    setIsSubmittingForm(false);
  };

  const handleCreateChange = <K extends keyof HabitFormValues>(field: K, value: HabitFormValues[K]) => {
    setCreateValues((current) => ({ ...current, [field]: value }));
  };

  const handleEditChange = <K extends keyof HabitFormValues>(field: K, value: HabitFormValues[K]) => {
    setEditValues((current) => ({ ...current, [field]: value }));
  };

  const handleCreateHabit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingForm(true);
    setModalError('');

    try {
      const response = await apiFetch('/api/habits/', {
        method: 'POST',
        body: JSON.stringify(buildCreatePayload(createValues)),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not create habit.'));
      }

      const responseData = (await response.json()) as { data: Omit<Habit, 'habitCompletions'> };

      setHabits((currentHabits) => [
        ...currentHabits,
        {
          ...responseData.data,
          habitCompletions: [],
        },
      ]);

      closeModals();
      await refreshAuth();
    } catch (requestError) {
      setModalError(
        requestError instanceof Error ? requestError.message : 'Could not create habit.',
      );
      setIsSubmittingForm(false);
    }
  };

  const handleSelectHabit = (habit: Habit) => {
    setSelectedHabitId(habit.id);
    setEditValues(mapHabitToForm(habit));
    setModalError('');
  };

  const handleUpdateHabit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedHabit) {
      setModalError('Choose a habit first.');
      return;
    }

    setIsSubmittingForm(true);
    setModalError('');

    try {
      const response = await apiFetch(`/api/habits/${selectedHabit.id}`, {
        method: 'PATCH',
        body: JSON.stringify(buildPatchPayload(editValues)),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not update habit.'));
      }

      closeModals();
      setIsLoading(true);
      await loadHabits();
      await refreshAuth();
    } catch (requestError) {
      setModalError(
        requestError instanceof Error ? requestError.message : 'Could not update habit.',
      );
      setIsSubmittingForm(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!selectedHabit) {
      setModalError('Choose a habit first.');
      return;
    }

    setIsSubmittingForm(true);
    setModalError('');

    try {
      const response = await apiFetch(`/api/habits/${selectedHabit.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not delete habit.'));
      }

      closeModals();
      setSelectedHabitId(null);
      setIsLoading(true);
      await loadHabits();
      await refreshAuth();
    } catch (requestError) {
      setModalError(
        requestError instanceof Error ? requestError.message : 'Could not delete habit.',
      );
      setIsSubmittingForm(false);
    }
  };

  const handleGenerateHabits = async () => {
    if (prompt.trim().length < 5) {
      setGenerationError('Please describe a goal in a bit more detail.');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');
    setGeneratedCommentary('');
    setAnimatedCommentary('');
    setGeneratedHabits([]);
    setClaimedGeneratedHabitNames([]);

    try {
      const response = await apiFetch('/api/gemini/', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not generate habits.'));
      }

      const data = (await response.json()) as GenerationResponse;
      setGeneratedCommentary(data.data.commentary ?? '');
      setGeneratedHabits(data.data.habits ?? []);
    } catch (requestError) {
      setGenerationError(
        requestError instanceof Error ? requestError.message : 'Could not generate habits.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleGenerateHabits();
  };

  const handlePromptKeyDown = async (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleGenerateHabits();
    }
  };

  const handleResetCoach = () => {
    setPrompt('');
    setIsGenerating(false);
    setGenerationError('');
    setGeneratedCommentary('');
    setAnimatedCommentary('');
    setGeneratedHabits([]);
    setClaimedGeneratedHabitNames([]);
    setClaimingGeneratedHabitName(null);
  };

  const handleClaimGeneratedHabit = async (generatedHabit: GeneratedHabit) => {
    setClaimingGeneratedHabitName(generatedHabit.name);
    setGenerationError('');

    try {
      const response = await apiFetch('/api/habits/', {
        method: 'POST',
        body: JSON.stringify({
          name: generatedHabit.name,
          ...(generatedHabit.description ? { description: generatedHabit.description } : {}),
          scheduleType: generatedHabit.scheduleType,
          habitType: generatedHabit.habitType,
          habitStatus: 'ACTIVE',
          isPublic: false,
          targetPerPeriod: Number(generatedHabit.targetPerPeriod),
          ...(generatedHabit.endDate ? { endDate: generatedHabit.endDate } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, 'Could not claim generated habit.'));
      }

      const responseData = (await response.json()) as { data: Omit<Habit, 'habitCompletions'> };
      setHabits((currentHabits) => [
        ...currentHabits,
        {
          ...responseData.data,
          habitCompletions: [],
        },
      ]);
      setClaimedGeneratedHabitNames((current) => [...current, generatedHabit.name]);
      await refreshAuth();
    } catch (requestError) {
      setGenerationError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not claim generated habit.',
      );
    } finally {
      setClaimingGeneratedHabitName(null);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-4xl">
        <div className="relative pb-36">
          <div
            className={`space-y-8 transition-all duration-300 ${
              isCoachOverlayVisible ? 'pointer-events-none scale-[0.99] blur-sm' : ''
            }`}
          >
            <section className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center sm:mx-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                  <circle
                    cx="56"
                    cy="56"
                    r="50"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * progress) / 100}
                    className="text-indigo-600 transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-2xl font-black text-slate-800">{progress}%</span>
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-slate-900">Current Progress</h2>
                <p className="text-slate-500 font-medium">
                  {completedCount} of {normalizedHabits.length} habits completed for the current period
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-bold text-slate-800">Your Habits</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Create Habit
                  </button>
                  <button
                    type="button"
                    onClick={openManageModal}
                    className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:border-indigo-400 hover:text-indigo-900"
                  >
                    Edit List
                  </button>
                </div>
              </div>

              {isLoading && <p className="px-2 text-slate-500">Loading your habits...</p>}
              {error && <p className="px-2 text-red-600">{error}</p>}
              {!isLoading && !error && normalizedHabits.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
                  You have no habits yet. Create one here or claim one from the library to get started.
                </div>
              )}

              <div className="space-y-3">
                {normalizedHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    id={habit.id}
                    title={`${habit.title} (${formatLabel(habit.scheduleType)})`}
                    streak={habit.streak}
                    isCompleted={habit.isCompleted}
                    isToggling={togglingHabitId === habit.id}
                    onToggle={handleToggleCompletion}
                  />
                ))}
              </div>
            </section>
          </div>

          {coachViewState !== 'idle' && (
            <div className="absolute inset-0 z-20 rounded-[2rem] bg-white/35 p-2 backdrop-blur-md sm:p-4">
              <div className="mx-auto max-w-4xl">
                {coachViewState === 'loading' && <CoachLoadingState />}

                {coachViewState === 'results' && (
                  <section className="space-y-5">
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                      <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-400">Coach Commentary</p>
                      <p className="mt-4 min-h-16 text-base leading-8 text-slate-700">
                        {animatedCommentary}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {displayedGeneratedHabits.map((habit, index) => {
                        const isClaimed = claimedGeneratedHabitNames.includes(habit.name);
                        const isClaiming = claimingGeneratedHabitName === habit.name;

                        return (
                          <article
                            key={`${habit.name}-${index}`}
                            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm opacity-0 animate-[cardRise_0.55s_ease-out_forwards]"
                            style={{ animationDelay: `${index * 120}ms` }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">{habit.name}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  {habit.description || 'Suggested by your AI habit coach.'}
                                </p>
                              </div>
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                                AI
                              </span>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                              <span className="rounded-full bg-slate-100 px-3 py-1">{formatLabel(habit.scheduleType)}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">{formatLabel(habit.habitType)}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">Target {habit.targetPerPeriod}</span>
                            </div>

                            <button
                              type="button"
                              disabled={isClaimed || isClaiming}
                              onClick={() => void handleClaimGeneratedHabit(habit)}
                              className="mt-6 w-full rounded-2xl border-2 border-slate-900 px-4 py-3 font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              {isClaimed ? 'Claimed' : isClaiming ? 'Claiming...' : 'Claim Habit'}
                            </button>
                          </article>
                        );
                      })}
                    </div>

                    {generationError && (
                      <p className="text-sm text-red-600">{generationError}</p>
                    )}

                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={handleResetCoach}
                        className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
                      >
                        Start over / Change Goal
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {coachViewState === 'idle' && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
          <div className="mx-auto max-w-4xl">
            <PromptComposer
              prompt={prompt}
              isGenerating={isGenerating}
              generationError={generationError}
              onPromptChange={setPrompt}
              onPromptSubmit={handlePromptSubmit}
              onPromptKeyDown={handlePromptKeyDown}
            />
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onClick={closeModals}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-900">Create Habit</h2>
              <button
                type="button"
                onClick={closeModals}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:border-slate-400"
              >
                Close
              </button>
            </div>

            <HabitFormFields
              values={createValues}
              onChange={handleCreateChange}
              onSubmit={handleCreateHabit}
              submitLabel="Create Habit"
              isSubmitting={isSubmittingForm}
              error={modalError}
              secondaryAction={
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:border-slate-500"
                >
                  Cancel
                </button>
              }
            />
          </div>
        </div>
      )}

      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm" onClick={closeModals}>
          <div
            className="grid max-h-[90vh] w-full max-w-5xl gap-6 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl lg:grid-cols-[260px_1fr]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Edit Habits</h2>
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:border-slate-400"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                {habits.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    No habits to edit yet.
                  </div>
                )}
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => handleSelectHabit(habit)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedHabitId === habit.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className="font-semibold">{habit.name}</div>
                    <div className="text-xs opacity-80">{formatLabel(habit.scheduleType)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              {selectedHabit ? (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Edit {selectedHabit.name}</h3>
                    <p className="text-sm text-slate-500">Update fields or delete the habit.</p>
                  </div>
                  <HabitFormFields
                    values={editValues}
                    onChange={handleEditChange}
                    onSubmit={handleUpdateHabit}
                    submitLabel="Save Changes"
                    isSubmitting={isSubmittingForm}
                    error={modalError}
                    secondaryAction={
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void handleDeleteHabit()}
                          disabled={isSubmittingForm}
                          className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700 hover:border-red-400 disabled:opacity-70"
                        >
                          Delete Habit
                        </button>
                        <button
                          type="button"
                          onClick={closeModals}
                          className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:border-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-300 p-8 text-slate-500">
                  Choose a habit to edit.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
