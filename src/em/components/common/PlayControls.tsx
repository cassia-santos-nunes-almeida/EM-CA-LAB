import { Play, Pause, RotateCcw } from 'lucide-react';

interface PlayControlsProps {
  isPlaying: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export function PlayControls({ isPlaying, onToggle, onReset }: PlayControlsProps) {
  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={onToggle}
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        onClick={onReset}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        aria-label="Reset simulation"
      >
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  );
}
