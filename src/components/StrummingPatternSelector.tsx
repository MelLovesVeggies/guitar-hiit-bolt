import { useState, useEffect } from 'react';
import { supabase, StrummingPattern } from '../lib/supabase';
import { Strumming } from './Strumming';
import { Music } from 'lucide-react';

interface StrummingPatternSelectorProps {
  currentBPM: number;
  isActive: boolean;
}

export function StrummingPatternSelector({ currentBPM, isActive }: StrummingPatternSelectorProps) {
  const [patterns, setPatterns] = useState<StrummingPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<StrummingPattern | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterGenre, setFilterGenre] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const { data, error } = await supabase
        .from('strumming_patterns')
        .select('*')
        .order('difficulty', { ascending: true });

      if (error) throw error;
      setPatterns(data || []);
      if (data && data.length > 0) {
        setSelectedPattern(data[0]);
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const genres = Array.from(new Set(patterns.map(p => p.genre).filter(Boolean)));
  const difficulties = Array.from(new Set(patterns.map(p => p.difficulty)));

  const filteredPatterns = patterns.filter(p => {
    if (filterDifficulty && p.difficulty !== filterDifficulty) return false;
    if (filterGenre && p.genre !== filterGenre) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-600">Loading strumming patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Music className="w-6 h-6 text-[#8c52ff]" />
          <h2 className="text-2xl font-bold text-gray-900">Strumming Patterns</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
            >
              <option value="">All Levels</option>
              {difficulties.map(diff => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Genre/Style</label>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Pattern</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {filteredPatterns.map(pattern => (
              <button
                key={pattern.id}
                onClick={() => setSelectedPattern(pattern)}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  selectedPattern?.id === pattern.id
                    ? 'border-[#8c52ff] bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{pattern.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {pattern.genre} • {pattern.difficulty}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedPattern && (
        <Strumming pattern={selectedPattern} isActive={isActive} currentBPM={currentBPM} />
      )}
    </div>
  );
}
