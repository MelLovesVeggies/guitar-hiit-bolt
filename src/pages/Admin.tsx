import { useState } from 'react';
import { Plus, Save, Music } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Admin() {
  const [activeTab, setActiveTab] = useState<'exercises' | 'strumming'>('exercises');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    tablature_file_url: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    exercise_type: 'strumming' as 'strumming' | 'fingerpicking' | 'transitions' | 'riffs',
    bpm_min: 60,
    bpm_max: 120,
    time_signature: '4/4',
    tags: '',
  });

  const [strummingFormData, setStrummingFormData] = useState({
    name: '',
    description: '',
    pattern: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    bpm_range_min: 60,
    bpm_range_max: 200,
    time_signature: '4/4',
    genre: '',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);

      const { error } = await supabase.from('exercises').insert({
        title: formData.title,
        description: formData.description,
        video_url: formData.video_url,
        tablature_file_url: formData.tablature_file_url || null,
        difficulty: formData.difficulty,
        exercise_type: formData.exercise_type,
        bpm_min: formData.bpm_min,
        bpm_max: formData.bpm_max,
        time_signature: formData.time_signature,
        tags: tagsArray,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Exercise created successfully!' });
      setFormData({
        title: '',
        description: '',
        video_url: '',
        tablature_file_url: '',
        difficulty: 'beginner',
        exercise_type: 'strumming',
        bpm_min: 60,
        bpm_max: 120,
        time_signature: '4/4',
        tags: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create exercise' });
      console.error('Error creating exercise:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStrummingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('strumming_patterns').insert({
        name: strummingFormData.name,
        description: strummingFormData.description,
        pattern: strummingFormData.pattern,
        difficulty: strummingFormData.difficulty,
        bpm_range_min: strummingFormData.bpm_range_min,
        bpm_range_max: strummingFormData.bpm_range_max,
        time_signature: strummingFormData.time_signature,
        genre: strummingFormData.genre || null,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Strumming pattern created successfully!' });
      setStrummingFormData({
        name: '',
        description: '',
        pattern: '',
        difficulty: 'beginner',
        bpm_range_min: 60,
        bpm_range_max: 200,
        time_signature: '4/4',
        genre: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create strumming pattern' });
      console.error('Error creating pattern:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <Plus className="w-8 h-8 text-[#8c52ff]" />
            <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('exercises')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === 'exercises'
                  ? 'bg-[#8c52ff] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Add Exercise
            </button>
            <button
              onClick={() => setActiveTab('strumming')}
              className={`px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeTab === 'strumming'
                  ? 'bg-[#8c52ff] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Music className="w-4 h-4" />
              Strumming Patterns
            </button>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {activeTab === 'exercises' && (
          <form onSubmit={handleExerciseSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
              <input
                type="url"
                required
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tablature File URL (optional)
              </label>
              <input
                type="url"
                value={formData.tablature_file_url}
                onChange={(e) => setFormData({ ...formData, tablature_file_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Type</label>
                <select
                  value={formData.exercise_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exercise_type: e.target.value as typeof formData.exercise_type,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                >
                  <option value="strumming">Strumming</option>
                  <option value="fingerpicking">Fingerpicking</option>
                  <option value="transitions">Transitions</option>
                  <option value="riffs">Riffs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      difficulty: e.target.value as typeof formData.difficulty,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min BPM</label>
                <input
                  type="number"
                  required
                  min="30"
                  max="300"
                  value={formData.bpm_min}
                  onChange={(e) => setFormData({ ...formData, bpm_min: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max BPM</label>
                <input
                  type="number"
                  required
                  min="30"
                  max="300"
                  value={formData.bpm_max}
                  onChange={(e) => setFormData({ ...formData, bpm_max: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Signature</label>
                <input
                  type="text"
                  required
                  value={formData.time_signature}
                  onChange={(e) => setFormData({ ...formData, time_signature: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. beginner, rock, acoustic"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#8c52ff] to-[#00bf63] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Create Exercise'}</span>
            </button>
          </form>
          )}

          {activeTab === 'strumming' && (
          <form onSubmit={handleStrummingSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pattern Name</label>
              <input
                type="text"
                required
                value={strummingFormData.name}
                onChange={(e) => setStrummingFormData({ ...strummingFormData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows={3}
                value={strummingFormData.description}
                onChange={(e) => setStrummingFormData({ ...strummingFormData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strumming Pattern (space-separated: D=down, U=up, X=mute)
              </label>
              <input
                type="text"
                required
                value={strummingFormData.pattern}
                onChange={(e) => setStrummingFormData({ ...strummingFormData, pattern: e.target.value })}
                placeholder="e.g. D D U U D U D U"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={strummingFormData.difficulty}
                  onChange={(e) =>
                    setStrummingFormData({
                      ...strummingFormData,
                      difficulty: e.target.value as typeof strummingFormData.difficulty,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre/Style</label>
                <input
                  type="text"
                  value={strummingFormData.genre}
                  onChange={(e) => setStrummingFormData({ ...strummingFormData, genre: e.target.value })}
                  placeholder="e.g. Rock, Folk, Jazz"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min BPM</label>
                <input
                  type="number"
                  required
                  min="30"
                  max="300"
                  value={strummingFormData.bpm_range_min}
                  onChange={(e) => setStrummingFormData({ ...strummingFormData, bpm_range_min: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max BPM</label>
                <input
                  type="number"
                  required
                  min="30"
                  max="300"
                  value={strummingFormData.bpm_range_max}
                  onChange={(e) => setStrummingFormData({ ...strummingFormData, bpm_range_max: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Signature</label>
                <select
                  value={strummingFormData.time_signature}
                  onChange={(e) => setStrummingFormData({ ...strummingFormData, time_signature: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
                >
                  <option value="4/4">4/4</option>
                  <option value="3/4">3/4</option>
                  <option value="6/8">6/8</option>
                  <option value="2/4">2/4</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-[#8c52ff] to-[#00bf63] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Create Pattern'}</span>
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
