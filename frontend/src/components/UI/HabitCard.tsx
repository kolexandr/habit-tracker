interface HabitCardProps {
  id: string;
  title: string;
  streak: number;
  isCompleted: boolean;
  onToggle: (habitId: string, isCompleted: boolean) => void;
  isToggling?: boolean;
}

const HabitCard = ({ id, title, streak, isCompleted, onToggle, isToggling = false }: HabitCardProps) => {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${isCompleted ? 'opacity-70' : ''}`}>
      <div className="flex flex-col min-w-0">
        <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through' : ''}`}>
          {title}
        </h3>
      </div>
      
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
          <span>🔥</span>
          <span className="font-bold">{streak}</span>
        </div>
        
        <button 
          type="button"
          disabled={isToggling}
          onClick={() => onToggle(id, isCompleted)}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
            ${isCompleted ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-black'}
            ${isToggling ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {isToggling ? <span className="text-xs">...</span> : isCompleted ? <span>✓</span> : null}
        </button>
      </div>
    </div>
  );
};

export default HabitCard;
