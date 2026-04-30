import { ArrowRight, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#ffffff_40%,_#e2e8f0_100%)] text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8 md:px-10">
        <header className="flex items-center justify-between py-4">
          <div className="text-xl font-black tracking-tight">HabitTracker</div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold hover:border-slate-900"
            >
              Log in
            </Link>
            <Link
              to="/auth"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="grid gap-10 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                Small habits, visible progress, a system you actually return to.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                HabitTracker helps you turn goals into repeatable routines, track streaks, and
                stay honest with yourself without making the process feel heavy.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition hover:bg-slate-700"
              >
                Start for free
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-900 hover:border-slate-900"
              >
                I already have an account
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">
                Today at a glance
              </p>
              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Consistency score</p>
                  <p className="mt-2 text-4xl font-black">82%</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-400/15 p-4">
                    <p className="text-sm text-emerald-200">Longest streak</p>
                    <p className="mt-2 text-2xl font-bold">17 days</p>
                  </div>
                  <div className="rounded-2xl bg-sky-400/15 p-4">
                    <p className="text-sm text-sky-200">Habits completed</p>
                    <p className="mt-2 text-2xl font-bold">48 this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 py-8 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
            <Target className="mb-4 text-rose-500" size={24} />
            <h2 className="text-xl font-bold">Clear daily focus</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Keep the important habits in one place so you always know what deserves attention
              today.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
            <ShieldCheck className="mb-4 text-emerald-500" size={24} />
            <h2 className="text-xl font-bold">Private account space</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Guests can explore the product, while your personal dashboard stays available only
              after sign-in.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
            <Sparkles className="mb-4 text-amber-500" size={24} />
            <h2 className="text-xl font-bold">Progress that feels rewarding</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Turn vague intentions into visible streaks, completion history, and momentum you can
              keep building on.
            </p>
          </article>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
