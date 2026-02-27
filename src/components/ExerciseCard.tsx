import { Play } from 'lucide-react';
import { Exercise } from '../lib/supabase';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onSelect }: ExerciseCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative h-48 bg-gradient-to-br from-[#8c52ff] to-[#00bf63] flex items-center justify-center">
        <div className="text-white text-6xl font-bold opacity-20">
          {exercise.exercise_type === 'strumming' && '🎸'}
          {exercise.exercise_type === 'fingerpicking' && '🎵'}
          {exercise.exercise_type === 'transitions' && '🔄'}
          {exercise.exercise_type === 'riffs' && '⚡'}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">{exercise.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(exercise.difficulty)}`}>
            {exercise.difficulty}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{exercise.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>BPM: {exercise.bpm_min}-{exercise.bpm_max}</span>
          <span className="capitalize">{exercise.exercise_type}</span>
        </div>

        {exercise.tags && exercise.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {exercise.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#8c52ff]/10 text-[#8c52ff] px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => onSelect(exercise)}
          className="w-full bg-gradient-to-r from-[#8c52ff] to-[#00bf63] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>Start Training</span>
        </button>
      </div>
    </div>
  );
}
