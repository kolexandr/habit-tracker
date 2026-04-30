import HabitCard from '../components/UI/HabitCard'; // Assuming you saved the previous snippet

const Dashboard = () => {
  // Mock data - eventually this will come from your state/API
  const habits = [
    { id: 1, title: "Exercise for 45 minutes", streak: 21, isCompleted: false },
    { id: 2, title: "Write in journal", streak: 3, isCompleted: false },
    { id: 3, title: "Practice guitar", streak: 14, isCompleted: false },
    { id: 4, title: "Learn new vocabulary", streak: 9, isCompleted: true },
    { id: 5, title: "No screen time after 9pm", streak: 4, isCompleted: false },
  ];

  const completedCount = habits.filter(h => h.isCompleted).length;
  const progress = Math.round((completedCount / habits.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* 1. Progress Overview Section */}
      <section className="flex items-center gap-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Circular Progress SVG */}
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
            <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" 
              strokeDasharray="314" 
              strokeDashoffset={314 - (314 * progress) / 100} 
              className="text-indigo-600 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-2xl font-black text-slate-800">{progress}%</span>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Daily Progress</h2>
          <p className="text-slate-500 font-medium">
            {completedCount} of {habits.length} habits completed today
          </p>
        </div>
      </section>

      {/* 2. Habits List Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-bold text-slate-800">Your Habits</h3>
          <button className="text-indigo-600 text-sm font-semibold hover:underline">Edit List</button>
        </div>
        
        <div className="space-y-3">
          {habits.map((habit) => (
            <HabitCard 
              key={habit.id}
              title={habit.title}
              streak={habit.streak}
              isCompleted={habit.isCompleted}
            />
          ))}
        </div>
      </section>

      {/* 3. AI Habit Generator Input (The Footer Input) */}
      <section className="sticky bottom-0 pt-4 pb-2 bg-gray-50/80 backdrop-blur-sm">
        <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-lg border border-slate-200">
          <input 
            type="text" 
            placeholder="Describe your goal (e.g. 'I want to be more mindful')..." 
            className="flex-1 px-4 py-2 outline-none text-slate-700 placeholder:text-slate-400"
          />
          <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors">
            <span>✨</span>
            Generate Habits
          </button>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
