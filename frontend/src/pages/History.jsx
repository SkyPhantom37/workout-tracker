import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { api } from '../api.js';
import WorkoutCard from '../components/WorkoutCard.jsx';

export default function History() {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullyLoaded, setFullyLoaded] = useState(false);
  const PAGE = 20;

  const load = useCallback(async (offset = 0, replace = false) => {
    try {
      const rows = await api.listWorkouts(PAGE, offset);
      setWorkouts(prev => replace ? rows : [...prev, ...rows]);
      if (rows.length < PAGE) setFullyLoaded(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0, true); }, [load]);

  const handleDelete = async (workoutId) => {
    await api.deleteWorkout(workoutId);
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
  };

  // Group workouts by month
  const grouped = workouts.reduce((acc, w) => {
    let month;
    try { month = format(parseISO(w.date), 'MMMM yyyy'); }
    catch { month = w.date.slice(0, 7); }
    if (!acc[month]) acc[month] = [];
    acc[month].push(w);
    return acc;
  }, {});

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <button
          onClick={() => navigate('/log')}
          className="bg-violet-600 active:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl text-sm"
        >
          + Log
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800 rounded-2xl h-20 animate-pulse border border-gray-700" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-gray-300 font-semibold">No workouts yet</p>
          <p className="text-gray-500 text-sm mt-1">Start logging to see your history here.</p>
          <button
            onClick={() => navigate('/log')}
            className="mt-4 bg-violet-600 active:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
          >
            Log first workout
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthWorkouts]) => (
            <section key={month}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {month}
              </h2>
              <div className="space-y-2">
                {monthWorkouts.map(w => (
                  <WorkoutCard
                    key={w.id}
                    workout={w}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          ))}

          {!fullyLoaded && (
            <button
              onClick={() => load(workouts.length)}
              className="w-full py-3 rounded-2xl border border-gray-700 text-gray-400 text-sm font-medium active:bg-gray-800"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
