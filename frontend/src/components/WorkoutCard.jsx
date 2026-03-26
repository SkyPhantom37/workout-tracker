import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

function fmtDate(dateStr) {
  try { return format(parseISO(dateStr), 'EEE, MMM d, yyyy'); }
  catch { return dateStr; }
}

function fmtVol(vol) {
  if (!vol) return '—';
  return vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : `${Math.round(vol)}`;
}

export default function WorkoutCard({ workout, onDelete, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${workout.name}"? This can't be undone.`)) return;
    await onDelete(workout.id);
  };

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-xs text-violet-400 font-medium mb-0.5">{fmtDate(workout.date)}</p>
          <h3 className="font-bold text-white text-base leading-tight truncate">{workout.name}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {workout.exercise_count ?? 0} exercise{workout.exercise_count !== 1 ? 's' : ''}
            {' · '}
            {workout.total_sets ?? 0} sets
            {workout.total_volume > 0 && (
              <> · <span className="text-gray-300">{fmtVol(workout.total_volume)} lbs total</span></>
            )}
          </p>
        </div>
        <span className="text-gray-500 text-lg flex-shrink-0 mt-1">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-700 pt-3">
          {workout.exercises?.length > 0 ? (
            workout.exercises.map((ex) => (
              <div key={ex.id}>
                <p className="text-sm font-semibold text-gray-200 mb-1">{ex.name}</p>
                <div className="space-y-0.5">
                  {ex.sets?.map((s) => (
                    <div key={s.id} className="flex gap-4 text-sm text-gray-400">
                      <span className="text-gray-600 w-8">#{s.set_number}</span>
                      <span>{s.reps} reps</span>
                      <span>@ {s.weight} lbs</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No exercises logged.</p>
          )}

          {workout.notes && (
            <p className="text-sm text-gray-400 italic border-t border-gray-700 pt-2">
              {workout.notes}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => navigate(`/log/${workout.id}`)}
              className="flex-1 py-2 rounded-xl bg-gray-700 text-sm font-medium text-gray-200 active:bg-gray-600"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 rounded-xl bg-red-900/40 text-sm font-medium text-red-400 active:bg-red-900/60"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
