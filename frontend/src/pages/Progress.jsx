import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { api } from '../api.js';

const CHART_COLORS = {
  primary: '#7C3AED',
  volume: '#0EA5E9',
  grid: '#374151',
  axis: '#6B7280',
};

function fmtDate(str) {
  try { return format(parseISO(str), 'MMM d'); }
  catch { return str; }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-400 mb-1">{fmtDate(label)}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name === 'max_weight' ? `${p.value} lbs` : `${Math.round(p.value)} lbs vol`}
        </p>
      ))}
    </div>
  );
};

export default function Progress() {
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState('');
  const [chartData, setChartData] = useState([]);
  const [view, setView] = useState('weight'); // 'weight' | 'volume'
  const [loadingEx, setLoadingEx] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

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

  const maxVal = chartData.length > 0
    ? Math.max(...chartData.map(d => view === 'weight' ? d.max_weight : d.volume))
    : 0;

  const pr = chartData.length > 0
    ? Math.max(...chartData.map(d => d.max_weight))
    : null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white">Progress</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-2xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loadingEx ? (
        <div className="bg-gray-800 rounded-2xl h-12 animate-pulse border border-gray-700" />
      ) : exercises.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-gray-300 font-semibold">No data yet</p>
          <p className="text-gray-500 text-sm mt-1">Log workouts to track your progress.</p>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Exercise</label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-violet-500 appearance-none"
            >
              {exercises.map(ex => (
                <option key={ex.name} value={ex.name}>
                  {ex.name} ({ex.sessions} session{ex.sessions !== 1 ? 's' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* PR badge */}
          {pr !== null && (
            <div className="bg-violet-900/30 border border-violet-700/50 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-xs text-violet-400 font-medium">Personal Record</p>
                <p className="text-xl font-bold text-white">{pr} lbs</p>
              </div>
            </div>
          )}

          {/* View toggle */}
          <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700">
            {[['weight', 'Max Weight'], ['volume', 'Volume']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === v ? 'bg-violet-600 text-white' : 'text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            {loadingData ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              </div>
            ) : chartData.length < 2 ? (
              <div className="h-56 flex items-center justify-center text-sm text-gray-500">
                Need at least 2 sessions to draw a chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    stroke={CHART_COLORS.axis}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={CHART_COLORS.axis}
                    tick={{ fontSize: 10, fill: CHART_COLORS.axis }}
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
                      strokeOpacity={0.4}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey={view === 'weight' ? 'max_weight' : 'volume'}
                    stroke={view === 'weight' ? CHART_COLORS.primary : CHART_COLORS.volume}
                    strokeWidth={2.5}
                    dot={{ fill: view === 'weight' ? CHART_COLORS.primary : CHART_COLORS.volume, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Data table */}
          {chartData.length > 0 && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-3 px-4 py-2 border-b border-gray-700 text-xs text-gray-400 font-medium uppercase tracking-wide">
                <span>Date</span>
                <span className="text-center">Max Weight</span>
                <span className="text-center">Sets</span>
              </div>
              {[...chartData].reverse().slice(0, 10).map(row => (
                <div
                  key={row.date}
                  className="grid grid-cols-3 px-4 py-3 border-b border-gray-700/50 last:border-0 text-sm"
                >
                  <span className="text-gray-400">{fmtDate(row.date)}</span>
                  <span className="text-center font-semibold text-white">{row.max_weight} lbs</span>
                  <span className="text-center text-gray-400">{row.total_sets}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
