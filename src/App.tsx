import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import { ExerciseCard } from './components/ExerciseCard';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Training } from './pages/Training';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Exercise } from './lib/supabase';

function HomePage({ exercises }: { exercises: Exercise[] }) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(exercises);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');

  useEffect(() => {
    let filtered = exercises;

    if (searchTerm) {
      filtered = filtered.filter(
        (ex) =>
          ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter((ex) => ex.exercise_type === filterType);
    }

    if (filterDifficulty) {
      filtered = filtered.filter((ex) => ex.difficulty === filterDifficulty);
    }

    setFilteredExercises(filtered);
  }, [searchTerm, filterType, filterDifficulty, exercises]);

  if (selectedExercise) {
    return (
      <Training
        key={selectedExercise.id}
        exercise={selectedExercise}
        onBack={() => setSelectedExercise(null)}
      />
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-[#8c52ff] to-[#00bf63] bg-clip-text text-transparent mb-4">
              Guitar HIIT
            </h1>
            <p className="text-xl text-gray-600">
              High-Intensity Interval Training for Guitar Mastery
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              >
                <option value="">All Types</option>
                <option value="strumming">Strumming</option>
                <option value="fingerpicking">Fingerpicking</option>
                <option value="transitions">Transitions</option>
                <option value="riffs">Riffs</option>
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c52ff] focus:border-transparent outline-none"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <p className="text-sm text-gray-600">
              Found {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onSelect={() => setSelectedExercise(exercise)}
              />
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No exercises found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase.from('exercises').select('*');
      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8c52ff] border-t-[#00bf63] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage exercises={exercises} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Header />
            <Admin />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
