import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { api } from '../api.js';
import WorkoutCard from '../components/WorkoutCard.jsx';

const cardBorder = { borderColor: 'rgba(139,0,0,0.30)' };
const glowStyle  = { boxShadow: '0 0 0 1px rgba(139,0,0,0.9), 0 0 18px rgba(139,0,0,0.45)' };

export default function History() {
  const navigate = useNavigate();
  const [workouts,     setWorkouts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [fullyLoaded,  setFullyLoaded]  = useState(false);
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
        <h1 className="font-display text-3xl text-bone"
            style={{ textShadow: '0 0 20px rgba(139,0,0,0.5)' }}>
          History
        </h1>
        <button
          onClick={() => navigate('/log')}
          className="bg-blood text-bone font-bold px-4 py-2 text-sm uppercase tracking-widest
                     active:bg-blood-bright transition-colors"
          style={glowStyle}
        >
          + Log
        </button>
      </div>

      {error && (
        <div className="border p-4 text-sm text-blood-bright"
             style={{ background: 'rgba(139,0,0,0.10)', borderColor: '#8b0000' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-[1px] bg-blood/20">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-surface h-20 animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-surface p-8 text-center border" style={cardBorder}>
          <p className="text-4xl mb-3">⚔️</p>
          <p className="text-bone font-semibold font-display text-xl">No battles fought yet</p>
          <p className="text-ash text-sm mt-1">Begin your conquest — log a workout.</p>
          <button
            onClick={() => navigate('/log')}
            className="mt-4 bg-blood text-bone text-sm font-bold px-5 py-2.5 uppercase
                       tracking-widest active:bg-blood-bright"
            style={glowStyle}
          >
            Log first workout
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthWorkouts]) => (
            <section key={month}>
              <h2 className="font-display text-base text-blood-bright mb-3"
                  style={{ textShadow: '0 0 8px rgba(204,0,0,0.4)', letterSpacing: '0.04em' }}>
                {month}
              </h2>
              <div className="space-y-[1px] bg-blood/15">
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
              className="w-full py-3 border border-blood/30 text-ash text-sm font-bold
                         uppercase tracking-widest active:bg-surface transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
