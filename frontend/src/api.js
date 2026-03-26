const BASE = import.meta.env.VITE_API_URL || '';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(msg.error || `${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Workouts
  listWorkouts: (limit = 100, offset = 0) =>
    req(`/api/workouts?limit=${limit}&offset=${offset}`),
  getWorkout: (id) => req(`/api/workouts/${id}`),
  createWorkout: (data) => req('/api/workouts', { method: 'POST', body: data }),
  updateWorkout: (id, data) => req(`/api/workouts/${id}`, { method: 'PUT', body: data }),
  deleteWorkout: (id) => req(`/api/workouts/${id}`, { method: 'DELETE' }),

  // Stats
  getDashboard: () => req('/api/stats/dashboard'),
  getProgressExercises: () => req('/api/stats/progress'),
  getProgressData: (exercise) =>
    req(`/api/stats/progress?exercise=${encodeURIComponent(exercise)}`),
};
