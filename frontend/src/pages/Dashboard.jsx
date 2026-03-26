import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../api.js';

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function fmtVol(n) {
  if (!n) return '0';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4 text-sm text-red-400">
          {error}
          <br />
          <span className="text-red-500 text-xs">Is the backend running? (`npm run dev`)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{greeting()}</p>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        <button
          onClick={() => navigate('/log')}
          className="bg-violet-600 active:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl text-sm"
        >
          + Log
        </button>
      </div>

      {/* Stats grid */}
      {data ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="This week's volume"
            value={`${fmtVol(data.weeklyVolume)} lbs`}
            sub="last 7 days"
          />
          <StatCard
            label="Total workouts"
            value={data.totalWorkouts}
            sub="all time"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="bg-gray-800 rounded-2xl p-4 border border-gray-700 animate-pulse h-20" />
          ))}
        </div>
      )}

      {/* Recent workouts */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent Workouts
        </h2>
        {!data ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-gray-800 rounded-2xl p-4 h-16 animate-pulse border border-gray-700" />
            ))}
          </div>
        ) : data.recentWorkouts.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700">
            <p className="text-gray-400 text-sm">No workouts yet.</p>
            <button
              onClick={() => navigate('/log')}
              className="mt-3 bg-violet-600 active:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              Log your first workout
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentWorkouts.map(w => (
              <button
                key={w.id}
                onClick={() => navigate(`/log/${w.id}`)}
                className="w-full text-left bg-gray-800 rounded-2xl p-4 border border-gray-700 active:bg-gray-700 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-violet-400 font-medium">
                    {format(new Date(w.date + 'T12:00:00'), 'EEE, MMM d')}
                  </p>
                  <p className="font-semibold text-white truncate">{w.name}</p>
                  <p className="text-xs text-gray-400">
                    {w.exercise_count} exercises · {w.total_sets} sets
                    {w.total_volume > 0 && ` · ${fmtVol(w.total_volume)} lbs`}
                  </p>
                </div>
                <span className="text-gray-600">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Personal Records */}
      {data?.personalRecords?.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Personal Records
          </h2>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            {data.personalRecords.map((pr, i) => (
              <div
                key={pr.exercise}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < data.personalRecords.length - 1 ? 'border-b border-gray-700' : ''
                }`}
              >
                <span className="text-sm text-gray-300 truncate flex-1 mr-4">{pr.exercise}</span>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold text-white">{pr.weight} lbs</span>
                  <span className="text-xs text-gray-500 ml-1">× {pr.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
