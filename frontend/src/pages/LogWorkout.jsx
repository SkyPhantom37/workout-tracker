import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

// ── Small helpers ──────────────────────────────────────────────────────────────

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function emptySet() {
  return { _id: uid(), reps: '', weight: '' };
}

function emptyExercise() {
  return { _id: uid(), name: '', sets: [emptySet()] };
}

// ── Input components ───────────────────────────────────────────────────────────

function TextInput({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-400 mb-1">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm"
      />
    </div>
  );
}

function NumInput({ value, onChange, placeholder, min = '0' }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm w-full text-center"
    />
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LogWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load existing workout when editing
  useEffect(() => {
    if (!isEditing) return;
    api.getWorkout(id)
      .then(w => {
        setName(w.name);
        setDate(w.date);
        setNotes(w.notes || '');
        setExercises(
          w.exercises.length > 0
            ? w.exercises.map(ex => ({
                _id: uid(),
                name: ex.name,
                sets: ex.sets.length > 0
                  ? ex.sets.map(s => ({ _id: uid(), reps: String(s.reps), weight: String(s.weight) }))
                  : [emptySet()],
              }))
            : [emptyExercise()]
        );
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  // ── Exercise / set mutations ─────────────────────────────────────────────────

  const addExercise = () =>
    setExercises(prev => [...prev, emptyExercise()]);

  const removeExercise = useCallback((exId) =>
    setExercises(prev => prev.filter(e => e._id !== exId)), []);

  const updateExerciseName = useCallback((exId, val) =>
    setExercises(prev => prev.map(e => e._id === exId ? { ...e, name: val } : e)), []);

  const addSet = useCallback((exId) =>
    setExercises(prev => prev.map(e =>
      e._id === exId ? { ...e, sets: [...e.sets, emptySet()] } : e
    )), []);

  const removeSet = useCallback((exId, setId) =>
    setExercises(prev => prev.map(e =>
      e._id === exId ? { ...e, sets: e.sets.filter(s => s._id !== setId) } : e
    )), []);

  const updateSet = useCallback((exId, setId, field, val) =>
    setExercises(prev => prev.map(e =>
      e._id === exId
        ? { ...e, sets: e.sets.map(s => s._id === setId ? { ...s, [field]: val } : s) }
        : e
    )), []);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      date,
      notes: notes.trim(),
      exercises: exercises
        .filter(ex => ex.name.trim())
        .map(ex => ({
          name: ex.name.trim(),
          sets: ex.sets
            .filter(s => s.reps !== '' || s.weight !== '')
            .map(s => ({
              reps: Number(s.reps) || 0,
              weight: Number(s.weight) || 0,
            })),
        })),
    };

    try {
      if (isEditing) {
        await api.updateWorkout(id, payload);
      } else {
        await api.createWorkout(payload);
      }
      navigate('/history');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-gray-800 rounded-2xl h-16 animate-pulse border border-gray-700" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 pt-6 pb-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="text-gray-400 active:text-white p-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">
          {isEditing ? 'Edit Workout' : 'Log Workout'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Workout meta */}
      <div className="space-y-3">
        <TextInput label="Workout name" value={name} onChange={setName} placeholder="e.g. Push Day" required />
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-violet-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="How did it feel?"
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((ex, exIdx) => (
          <div key={ex._id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700 space-y-3">
            {/* Exercise header */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ex.name}
                onChange={e => updateExerciseName(ex._id, e.target.value)}
                placeholder={`Exercise ${exIdx + 1}`}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm font-semibold"
              />
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(ex._id)}
                  className="text-red-500 active:text-red-400 p-1.5 rounded-lg"
                  aria-label="Remove exercise"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Set column headers */}
            <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-1.5 items-center text-xs text-gray-500 px-0.5">
              <span>Set</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Weight (lbs)</span>
              <span />
            </div>

            {/* Sets */}
            {ex.sets.map((s, si) => (
              <div key={s._id} className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-1.5 items-center">
                <span className="text-xs text-gray-500 text-center">{si + 1}</span>
                <NumInput
                  value={s.reps}
                  onChange={v => updateSet(ex._id, s._id, 'reps', v)}
                  placeholder="0"
                />
                <NumInput
                  value={s.weight}
                  onChange={v => updateSet(ex._id, s._id, 'weight', v)}
                  placeholder="0"
                />
                {ex.sets.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSet(ex._id, s._id)}
                    className="text-gray-600 active:text-red-400 flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </button>
                ) : <span />}
              </div>
            ))}

            {/* Add set */}
            <button
              type="button"
              onClick={() => addSet(ex._id)}
              className="w-full py-2 rounded-xl border border-dashed border-gray-600 text-sm text-gray-400 active:bg-gray-700"
            >
              + Add set
            </button>
          </div>
        ))}

        {/* Add exercise */}
        <button
          type="button"
          onClick={addExercise}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-700 text-gray-400 font-medium active:bg-gray-800"
        >
          + Add exercise
        </button>
      </div>

      {/* Save */}
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="w-full py-4 rounded-2xl bg-violet-600 active:bg-violet-700 disabled:opacity-40 text-white font-bold text-base"
      >
        {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Workout'}
      </button>
    </form>
  );
}
