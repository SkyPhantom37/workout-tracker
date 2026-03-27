import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { api } from '../api.js';

const CHART_COLORS = {
  primary:  '#8b0000',  // blood red for max weight line
  volume:   '#cc0000',  // brighter red for volume line
  grid:     '#1e1e1e',  // very dark grey grid lines
  axis:     '#555555',  // ash grey axis labels
  dot:      '#cc0000',
};

const cardBorder = { borderColor: 'rgba(139,0,0,0.30)' };
const glowStyle  = { boxShadow: '0 0 0 1px rgba(139,0,0,0.9), 0 0 18px rgba(139,0,0,0.45)' };

function fmtDate(str) {
  try { return format(parseISO(str), 'MMM d'); }
  catch { return str; }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111111] border px-3 py-2 text-xs shadow-lg"
         style={{ borderColor: 'rgba(139,0,0,0.6)' }}>
      <p className="text-ash mb-1 font-brutal">{fmtDate(label)}</p>
      {payload.map(p => (
        <p key={p.name} className="font-brutal font-semibold"
           style={{ color: p.color, textShadow: '0 0 8px currentColor' }}>
          {p.name === 'max_weight' ? `${p.value} lbs` : `${Math.round(p.value)} lbs vol`}
        </p>
      ))}
    </div>
  );
};

export default function Progress() {
  const [exercises,    setExercises]    = useState([]);
  const [selected,     setSelected]     = useState('');
  const [chartData,    setChartData]    = useState([]);
  const [view,         setView]         = useState('weight');
  const [loadingEx,    setLoadingEx]    = useState(true);
  const [loadingData,  setLoadingData]  = useState(false);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    api.getProgressExercises()
      .then(list => {
        setExercises(list);
        if (list.length > 0) setSelected(list[0].name);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingEx(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingData(true);
    api.getProgressData(selected)
      .then(setChartData)
      .catch(e => setError(e.message))
      .finally(() => setLoadingData(false));
  }, [selected]);

  const pr = chartData.length > 0
    ? Math.max(...chartData.map(d => d.max_weight))
    : null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      <h1 className="font-display text-3xl text-bone"
          style={{ textShadow: '0 0 20px rgba(139,0,0,0.5)' }}>
        Progress
      </h1>

      {error && (
        <div className="border p-4 text-sm text-blood-bright"
             style={{ background: 'rgba(139,0,0,0.10)', borderColor: '#8b0000' }}>
          {error}
        </div>
      )}

      {loadingEx ? (
        <div className="bg-surface h-12 animate-pulse border" style={cardBorder} />
      ) : exercises.length === 0 ? (
        <div className="bg-surface p-8 text-center border" style={cardBorder}>
          <p className="text-4xl mb-3">📈</p>
          <p className="text-bone font-display text-xl">No data yet</p>
          <p className="text-ash text-sm mt-1">Log workouts to track your progress.</p>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div>
            <label className="block text-xs text-ash mb-1 uppercase tracking-widest font-brutal">
              Exercise
            </label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full bg-surface-2 border border-blood/30 px-3 py-3 text-bone text-sm
                         focus:outline-none focus:border-blood appearance-none font-brutal transition-colors"
            >
              {exercises.map(ex => (
                <option key={ex.name} value={ex.name} style={{ background: '#111111' }}>
                  {ex.name} ({ex.sessions} session{ex.sessions !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* PR badge */}
          {pr !== null && (
            <div className="border p-4 flex items-center gap-3"
                 style={{ background: 'rgba(139,0,0,0.12)', borderColor: 'rgba(139,0,0,0.5)' }}>
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-blood-bright font-brutal uppercase tracking-widest">
                  Personal Record
                </p>
                <p className="text-2xl font-brutal font-bold text-bone"
                   style={{ textShadow: '0 0 12px rgba(204,0,0,0.5)' }}>
                  {pr} lbs
                </p>
              </div>
            </div>
          )}

          {/* View toggle */}
          <div className="flex bg-surface border border-blood/30">
            {[['weight', 'Max Weight'], ['volume', 'Volume']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                  view === v
                    ? 'bg-blood text-bone'
                    : 'text-ash hover:text-bone'
                }`}
                style={view === v ? glowStyle : {}}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-surface p-4 border" style={cardBorder}>
            {loadingData ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blood border-t-transparent animate-spin" />
              </div>
            ) : chartData.length < 2 ? (
              <div className="h-56 flex items-center justify-center text-sm text-ash font-brutal">
                Need at least 2 sessions to render chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis, fontFamily: '"Share Tech Mono"' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={CHART_COLORS.axis}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis, fontFamily: '"Share Tech Mono"' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => view === 'weight' ? `${v}` : `${Math.round(v / 100) * 100}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {view === 'weight' && pr && (
                    <ReferenceLine
                      y={pr}
                      stroke={CHART_COLORS.primary}
                      strokeDasharray="4 2"
                      strokeOpacity={0.5}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey={view === 'weight' ? 'max_weight' : 'volume'}
                    stroke={view === 'weight' ? CHART_COLORS.primary : CHART_COLORS.volume}
                    strokeWidth={2.5}
                    dot={{
                      fill: view === 'weight' ? CHART_COLORS.primary : CHART_COLORS.volume,
                      r: 4,
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 0,
                      style: { filter: 'drop-shadow(0 0 6px #cc0000)' },
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Data table */}
          {chartData.length > 0 && (
            <div className="bg-surface border overflow-hidden" style={cardBorder}>
              <div className="grid grid-cols-3 px-4 py-2 text-xs text-ash font-brutal uppercase tracking-widest"
                   style={{ borderBottom: '1px solid rgba(139,0,0,0.25)' }}>
                <span>Date</span>
                <span className="text-center">Max Weight</span>
                <span className="text-center">Sets</span>
              </div>
              {[...chartData].reverse().slice(0, 10).map(row => (
                <div
                  key={row.date}
                  className="grid grid-cols-3 px-4 py-3 text-sm"
                  style={{ borderBottom: '1px solid rgba(139,0,0,0.15)' }}
                >
                  <span className="text-ash font-brutal">{fmtDate(row.date)}</span>
                  <span className="text-center font-brutal font-bold text-bone"
                        style={{ textShadow: '0 0 6px rgba(204,0,0,0.3)' }}>
                    {row.max_weight} lbs
                  </span>
                  <span className="text-center text-ash font-brutal">{row.total_sets}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
