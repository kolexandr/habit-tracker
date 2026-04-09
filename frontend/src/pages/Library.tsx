const Library = () => {
  const categories = ['All', 'Health', 'Productivity', 'Mindfulness', 'Fitness', 'Learning'];
  
  const habits = [
    { title: "Morning Meditation", desc: "Start your day with 10 minutes of mindfulness...", users: "12,458" },
    { title: "Daily Reading", desc: "Read for 30 minutes every day to expand your...", users: "8,934" },
    // ... add more as needed
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Habit Library</h1>
      
      <input 
        type="text" 
        placeholder="Search habits..." 
        className="w-full border p-3 rounded-md mb-6"
      />

      <div className="flex gap-6 border-b mb-8 overflow-x-auto">
        {categories.map(cat => (
          <button key={cat} className={`pb-2 px-1 ${cat === 'All' ? 'border-b-2 border-black font-bold' : 'text-gray-500'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit, i) => (
          <div key={i} className="border p-6 rounded-lg bg-white shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-lg mb-2">{habit.title}</h3>
            <p className="text-gray-500 text-sm mb-4 flex-1">{habit.desc}</p>
            <div className="text-xs text-gray-400 mb-4 flex items-center justify-between">
              <span>by Platform</span>
              <span>👥 {habit.users}</span>
            </div>
            <button className="w-full border-2 border-gray-800 py-2 font-bold rounded hover:bg-gray-800 hover:text-white transition">
              Add to My Habits
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Library;