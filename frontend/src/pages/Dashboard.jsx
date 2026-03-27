import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api } from '../api.js';

const cardBorder   = { borderColor: 'rgba(139,0,0,0.30)' };
const dividerStyle = { borderColor: 'rgba(139,0,0,0.20)' };
const glowStyle    = { boxShadow: '0 0 0 1px rgba(139,0,0,0.9), 0 0 18px rgba(139,0,0,0.45)' };

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-surface p-4 border" style={cardBorder}>
      <p className="text-xs text-ash mb-1 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-brutal text-bone leading-none"
         style={{ textShadow: '0 0 12px rgba(204,0,0,0.4)' }}>
        {value}
      </p>
      {sub && <p className="text-xs text-ash/70 mt-1 font-brutal">{sub}</p>}
    </div>
  );
}

function fmtVol(n) {
  if (!n) return '0';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Arise, warrior';
  if (h < 18) return 'Forge on';
  return 'Train into darkness';
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
        <div className="border p-4 text-sm text-blood-bright"
             style={{ background: 'rgba(139,0,0,0.10)', borderColor: '#8b0000' }}>
          {error}
          <br />
          <span className="text-blood/70 text-xs">Is the backend running? (`npm run dev`)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-ash text-xs uppercase tracking-widest font-brutal">{greeting()}</p>
          <h1 className="font-display text-3xl text-bone leading-tight"
              style={{ textShadow: '0 0 20px rgba(139,0,0,0.5)' }}>
            Dashboard
          </h1>
        </div>
        <button
          onClick={() => navigate('/log')}
          className="bg-blood text-bone font-bold px-4 py-2 text-sm uppercase tracking-widest transition-colors active:bg-blood-bright"
          style={glowStyle}
        >
          + Log
        </button>
      </div>

      {/* Stats grid */}
      {data ? (
        <div className="grid grid-cols-2 gap-[1px] bg-blood/20">
          <StatCard
            label="Weekly Volume"
            value={`${fmtVol(data.weeklyVolume)} lbs`}
            sub="last 7 days"
          />
          <StatCard
            label="Total Workouts"
            value={data.totalWorkouts}
            sub="all time"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[1px] bg-blood/20">
          {[0, 1].map(i => (
            <div key={i} className="bg-surface p-4 h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Recent workouts */}
      <section>
        <h2 className="font-display text-lg text-blood-bright mb-3"
            style={{ textShadow: '0 0 10px rgba(204,0,0,0.4)', letterSpacing: '0.05em' }}>
          Recent Workouts
        </h2>
        {!data ? (
          <div className="space-y-[1px] bg-blood/20">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-surface h-16 animate-pulse" />
            ))}
          </div>
        ) : data.recentWorkouts.length === 0 ? (
          <div className="bg-surface p-6 text-center border" style={cardBorder}>
            <p className="text-ash text-sm mb-3">No workouts yet.</p>
            <button
              onClick={() => navigate('/log')}
              className="bg-blood text-bone text-sm font-bold px-4 py-2 uppercase tracking-widest active:bg-blood-bright"
              style={glowStyle}
            >
              Begin Your Journey
            </button>
          </div>
        ) : (
          <div className="space-y-[1px] bg-blood/20">
            {data.recentWorkouts.map(w => (
              <button
                key={w.id}
                onClick={() => navigate(`/log/${w.id}`)}
                className="w-full text-left bg-surface p-4 active:bg-surface-2 flex items-center justify-between gap-2 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs text-blood-bright font-brutal tracking-wider uppercase">
                    {format(new Date(w.date + 'T12:00:00'), 'EEE, MMM d')}
                  </p>
                  <p className="font-display text-bone text-lg leading-tight truncate">{w.name}</p>
                  <p className="text-xs text-ash font-brutal">
                    {w.exercise_count} exercises · {w.total_sets} sets
                    {w.total_volume > 0 && ` · ${fmtVol(w.total_volume)} lbs`}
                  </p>
                </div>
                <span className="text-blood/50 flex-shrink-0 font-brutal">›</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Personal Records */}
      {data?.personalRecords?.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-blood-bright mb-3"
              style={{ textShadow: '0 0 10px rgba(204,0,0,0.4)', letterSpacing: '0.05em' }}>
            Personal Records
          </h2>
          <div className="bg-surface border overflow-hidden" style={cardBorder}>
            {data.personalRecords.map((pr, i) => (
              <div
                key={pr.exercise}
                className="flex items-center justify-between px-4 py-3"
                style={i < data.personalRecords.length - 1 ? { borderBottom: '1px solid rgba(139,0,0,0.20)' } : {}}
              >
                <span className="text-sm text-bone/80 truncate flex-1 mr-4">{pr.exercise}</span>
                <div className="text-right flex-shrink-0 font-brutal">
                  <span className="text-sm font-bold text-bone"
                        style={{ textShadow: '0 0 8px rgba(204,0,0,0.3)' }}>
                    {pr.weight} lbs
                  </span>
                  <span className="text-xs text-ash ml-1">× {pr.reps}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
