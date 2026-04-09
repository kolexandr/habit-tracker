interface HabitCardProps {
  title: string;
  streak: number;
  isCompleted: boolean;
}

const HabitCard = ({ title, streak, isCompleted }: HabitCardProps) => {
  return (
    <div className={`flex items-center justify-between p-4 mb-3 border rounded-lg bg-white shadow-sm ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="flex flex-col">
        <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through' : ''}`}>
          {title}
        </h3>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Streak Badge */}
        <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
          <span>🔥</span>
          <span className="font-bold">{streak}</span>
        </div>
        
        {/* Completion Toggle */}
        <button 
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
            ${isCompleted ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-black'}`}
        >
          {isCompleted && <span>✓</span>}
        </button>
      </div>
    </div>
  );
};

export default HabitCard;