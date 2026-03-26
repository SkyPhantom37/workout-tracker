const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'workout.db');

// ─── Database setup ─────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS workouts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    notes      TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id     INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    name           TEXT    NOT NULL,
    exercise_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sets (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id  INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number   INTEGER NOT NULL,
    reps         INTEGER NOT NULL DEFAULT 0,
    weight       REAL    NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_workouts_date      ON workouts(date DESC);
  CREATE INDEX IF NOT EXISTS idx_exercises_workout  ON exercises(workout_id);
  CREATE INDEX IF NOT EXISTS idx_sets_exercise      ON sets(exercise_id);
`);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const stmts = {
  getWorkout: db.prepare('SELECT * FROM workouts WHERE id = ?'),
  getExercises: db.prepare('SELECT * FROM exercises WHERE workout_id = ? ORDER BY exercise_order'),
  getSets: db.prepare('SELECT * FROM sets WHERE exercise_id = ? ORDER BY set_number'),
};

function getFullWorkout(id) {
  const workout = stmts.getWorkout.get(id);
  if (!workout) return null;
  workout.exercises = stmts.getExercises.all(id).map(ex => ({
    ...ex,
    sets: stmts.getSets.all(ex.id),
  }));
  return workout;
}

const insertExercisesAndSets = db.transaction((workoutId, exercises) => {
  const insExercise = db.prepare(
    'INSERT INTO exercises (workout_id, name, exercise_order) VALUES (?, ?, ?)'
  );
  const insSet = db.prepare(
    'INSERT INTO sets (exercise_id, set_number, reps, weight) VALUES (?, ?, ?, ?)'
  );
  for (const [idx, ex] of (exercises || []).entries()) {
    const { lastInsertRowid: exId } = insExercise.run(workoutId, ex.name || 'Exercise', idx);
    for (const [si, s] of (ex.sets || []).entries()) {
      insSet.run(exId, si + 1, Number(s.reps) || 0, Number(s.weight) || 0);
    }
  }
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Routes: Workouts ─────────────────────────────────────────────────────────

// List workouts (summary with counts + volume)
app.get('/api/workouts', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const rows = db.prepare(`
    SELECT w.id, w.name, w.date, w.notes, w.created_at,
      COUNT(DISTINCT e.id)                 AS exercise_count,
      COUNT(s.id)                          AS total_sets,
      COALESCE(SUM(s.weight * s.reps), 0)  AS total_volume
    FROM workouts w
    LEFT JOIN exercises e ON e.workout_id = w.id
    LEFT JOIN sets      s ON s.exercise_id = e.id
    GROUP BY w.id
    ORDER BY w.date DESC, w.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json(rows);
});

// Get single workout with full exercises/sets
app.get('/api/workouts/:id', (req, res) => {
  const w = getFullWorkout(req.params.id);
  if (!w) return res.status(404).json({ error: 'Workout not found' });
  res.json(w);
});

// Create workout (optionally with exercises + sets in one shot)
app.post('/api/workouts', (req, res) => {
  const { name, date, notes, exercises } = req.body;
  if (!name || !date) return res.status(400).json({ error: 'name and date are required' });

  const createWorkout = db.transaction(() => {
    const { lastInsertRowid } = db
      .prepare('INSERT INTO workouts (name, date, notes) VALUES (?, ?, ?)')
      .run(name, date, notes || '');
    insertExercisesAndSets(lastInsertRowid, exercises);
    return lastInsertRowid;
  });

  try {
    const id = createWorkout();
    res.status(201).json(getFullWorkout(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update workout (replaces all exercises/sets)
app.put('/api/workouts/:id', (req, res) => {
  const { name, date, notes, exercises } = req.body;
  const { id } = req.params;

  if (!stmts.getWorkout.get(id)) return res.status(404).json({ error: 'Workout not found' });

  const updateWorkout = db.transaction(() => {
    db.prepare('UPDATE workouts SET name=?, date=?, notes=? WHERE id=?').run(name, date, notes || '', id);
    db.prepare('DELETE FROM exercises WHERE workout_id=?').run(id);
    insertExercisesAndSets(id, exercises);
  });

  try {
    updateWorkout();
    res.json(getFullWorkout(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete workout
app.delete('/api/workouts/:id', (req, res) => {
  const result = db.prepare('DELETE FROM workouts WHERE id=?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Workout not found' });
  res.json({ success: true });
});

// ─── Routes: Stats ────────────────────────────────────────────────────────────

// Dashboard stats: recent workouts, weekly volume, personal records
app.get('/api/stats/dashboard', (req, res) => {
  const recentWorkouts = db.prepare(`
    SELECT w.id, w.name, w.date, w.notes,
      COUNT(DISTINCT e.id)                 AS exercise_count,
      COUNT(s.id)                          AS total_sets,
      COALESCE(SUM(s.weight * s.reps), 0)  AS total_volume
    FROM workouts w
    LEFT JOIN exercises e ON e.workout_id = w.id
    LEFT JOIN sets      s ON s.exercise_id = e.id
    GROUP BY w.id
    ORDER BY w.date DESC, w.created_at DESC
    LIMIT 5
  `).all();

  const { volume: weeklyVolume } = db.prepare(`
    SELECT COALESCE(SUM(s.weight * s.reps), 0) AS volume
    FROM sets s
    JOIN exercises e ON e.id = s.exercise_id
    JOIN workouts  w ON w.id = e.workout_id
    WHERE w.date >= date('now', '-6 days')
  `).get();

  const { count: totalWorkouts } = db.prepare(
    'SELECT COUNT(*) AS count FROM workouts'
  ).get();

  // Best set per exercise (highest weight, then most reps as tiebreak)
  const personalRecords = db.prepare(`
    SELECT e.name AS exercise,
      s.weight,
      s.reps,
      w.date
    FROM sets s
    JOIN exercises e ON e.id = s.exercise_id
    JOIN workouts  w ON w.id = e.workout_id
    WHERE s.rowid IN (
      SELECT s2.rowid
      FROM sets s2
      JOIN exercises e2 ON e2.id = s2.exercise_id
      WHERE e2.name = e.name
      ORDER BY s2.weight DESC, s2.reps DESC
      LIMIT 1
    )
    GROUP BY e.name
    ORDER BY s.weight DESC
    LIMIT 10
  `).all();

  res.json({ recentWorkouts, weeklyVolume, totalWorkouts, personalRecords });
});

// Progress data for a specific exercise, or list of all tracked exercises
app.get('/api/stats/progress', (req, res) => {
  const { exercise } = req.query;

  if (exercise) {
    const data = db.prepare(`
      SELECT w.date,
        MAX(s.weight)                       AS max_weight,
        SUM(s.weight * s.reps)              AS volume,
        COUNT(s.id)                         AS total_sets
      FROM sets s
      JOIN exercises e ON e.id = s.exercise_id
      JOIN workouts  w ON w.id = e.workout_id
      WHERE LOWER(e.name) = LOWER(?)
      GROUP BY w.date
      ORDER BY w.date ASC
    `).all(exercise);
    return res.json(data);
  }

  const exercises = db.prepare(`
    SELECT e.name, COUNT(DISTINCT w.id) AS sessions
    FROM exercises e
    JOIN workouts w ON w.id = e.workout_id
    GROUP BY LOWER(e.name)
    ORDER BY sessions DESC, e.name ASC
  `).all();

  res.json(exercises);
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', db: DB_PATH }));

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  Workout Tracker API  →  http://localhost:${PORT}/api/health\n`);
});
