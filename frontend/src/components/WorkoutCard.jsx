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

const cardBorder = { borderColor: 'rgba(139,0,0,0.30)' };
const dividerStyle = { borderColor: 'rgba(139,0,0,0.25)' };

export default function WorkoutCard({ workout, onDelete, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${workout.name}"? This can't be undone.`)) return;
    await onDelete(workout.id);
  };

  return (
    <div className="bg-surface overflow-hidden border" style={cardBorder}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-4 flex items-start justify-between gap-3 active:bg-surface-2"
      >
        <div className="min-w-0">
          <p className="text-xs text-blood-bright font-medium font-brutal mb-0.5 tracking-wider">
            {fmtDate(workout.date)}
          </p>
          <h3 className="font-display text-bone text-lg leading-tight truncate">
            {workout.name}
          </h3>
          <p className="text-xs text-ash mt-1 font-brutal">
            {workout.exercise_count ?? 0} exercise{workout.exercise_count !== 1 ? 's' : ''}
            {' · '}
            {workout.total_sets ?? 0} sets
            {workout.total_volume > 0 && (
              <> · <span className="text-bone/70">{fmtVol(workout.total_volume)} lbs</span></>
            )}
          </p>
        </div>
        <span className="text-blood/60 text-sm flex-shrink-0 mt-1 font-brutal">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3" style={dividerStyle}>
          {workout.exercises?.length > 0 ? (
            workout.exercises.map((ex) => (
              <div key={ex.id}>
                <p className="text-sm font-semibold text-bone mb-1 tracking-wide">{ex.name}</p>
                <div className="space-y-0.5">
                  {ex.sets?.map((s) => (
                    <div key={s.id} className="flex gap-4 text-sm text-ash font-brutal">
                      <span className="text-blood/50 w-8">#{s.set_number}</span>
                      <span>{s.reps} reps</span>
                      <span>@ {s.weight} lbs</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-ash italic">No exercises logged.</p>
          )}

          {workout.notes && (
            <p className="text-sm text-ash italic border-t pt-2" style={dividerStyle}>
              {workout.notes}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => navigate(`/log/${workout.id}`)}
              className="flex-1 py-2 bg-surface-2 text-sm font-medium text-bone border active:bg-[#222222] transition-colors"
              style={{ borderColor: 'rgba(139,0,0,0.35)' }}
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2 text-sm font-medium text-blood-bright border border-blood/30 active:bg-blood/20 transition-colors"
              style={{ background: 'rgba(139,0,0,0.12)' }}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
