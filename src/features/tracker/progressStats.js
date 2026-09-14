// Numbers derived from logged sets and body-weight readings.
// Pure functions with no React or Firebase, so they can be unit tested directly.

const num = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const plainName = entry => String(entry?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const key = entry => entry?.slug || plainName(entry);
/** The same exercise may be stored with a slug in one session and only a name in another. */
const sameExercise = (a, b) =>
  (a?.slug && a.slug === b?.slug) || (!!plainName(a) && plainName(a) === plainName(b)) || key(a) === key(b);

/** A set counts once it has repetitions. Weight stays optional for bodyweight work. */
export const isLoggedSet = set => num(set?.reps) > 0;
export const setVolume = set => (isLoggedSet(set) ? num(set.weight) * num(set.reps) : 0);
export const entryVolume = entry => (entry?.sets || []).reduce((total, set) => total + setVolume(set), 0);
export const sessionVolume = session => (session?.entries || []).reduce((total, entry) => total + entryVolume(entry), 0);
export const sessionSets = session =>
  (session?.entries || []).reduce((total, entry) => total + (entry.sets || []).filter(isLoggedSet).length, 0);

/** The heaviest set, breaking ties on repetitions. Null when nothing was logged. */
export function bestSet(sets = []) {
  return sets.filter(isLoggedSet).reduce((best, set) => {
    if (!best) return set;
    if (num(set.weight) !== num(best.weight)) return num(set.weight) > num(best.weight) ? set : best;
    return num(set.reps) > num(best.reps) ? set : best;
  }, null);
}

const heavier = (a, b) =>
  num(a.weight) !== num(b.weight) ? num(a.weight) > num(b.weight) : num(a.reps) > num(b.reps);

/**
 * One row per exercise that has ever been logged with sets, newest session first
 * within each row. Sessions without a usable date are ignored.
 */
export function exerciseLog(sessions = []) {
  const log = new Map();
  for (const session of sessions) {
    if (!isDate(session?.date)) continue;
    for (const entry of session.entries || []) {
      const sets = (entry.sets || []).filter(isLoggedSet);
      if (!sets.length) continue;
      const id = key(entry);
      if (!id) continue;
      const row = log.get(id) || [...log.values()].find(item => sameExercise(item, entry))
        || { key: id, slug: entry.slug || null, name: entry.name || id, sessions: [] };
      row.slug = row.slug || entry.slug || null;
      const best = bestSet(sets);
      row.sessions.push({
        date: session.date,
        sets: sets.length,
        volume: sets.reduce((total, set) => total + setVolume(set), 0),
        best: { weight: num(best.weight), reps: num(best.reps) },
      });
      log.set(row.key, row);
    }
  }
  return [...log.values()].map(row => {
    const ordered = row.sessions.sort((a, b) => b.date.localeCompare(a.date));
    const record = ordered.reduce((best, item) =>
      !best || heavier(item.best, best.best) ? item : best, null);
    return {
      ...row,
      sessions: ordered,
      totalSets: ordered.reduce((total, item) => total + item.sets, 0),
      best: { ...record.best, date: record.date },
      latest: ordered[0],
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

/** Best set per exercise, heaviest first, for the personal records table. */
export function personalRecords(sessions = []) {
  return exerciseLog(sessions)
    .map(row => ({ key: row.key, slug: row.slug, name: row.name, totalSets: row.totalSets, ...row.best }))
    .sort((a, b) => b.weight - a.weight || b.reps - a.reps || a.name.localeCompare(b.name));
}

/** The sets recorded the last time this exercise was done, for a repeat prompt. */
export function lastSetsFor(sessions = [], exercise) {
  if (!key(exercise)) return [];
  const dated = sessions.filter(session => isDate(session?.date)).sort((a, b) => b.date.localeCompare(a.date));
  for (const session of dated) {
    const entry = (session.entries || []).find(item => sameExercise(item, exercise));
    const sets = (entry?.sets || []).filter(isLoggedSet);
    if (sets.length) return sets.map(set => ({ weight: num(set.weight), reps: num(set.reps) }));
  }
  return [];
}

// ---------------------------------------------------------------- body weight

/** Readings oldest first, one per day, with the latest entry for a day winning. */
export function weightSeries(measurements = []) {
  const byDate = new Map();
  const timestamps = new Map();
  for (const item of measurements) {
    if (!isDate(item?.date) || num(item.weight) <= 0) continue;
    const raw = item.updatedAt || item.createdAt;
    const timestamp = raw?.toMillis?.() ?? (raw?.seconds != null ? raw.seconds * 1000 : Date.parse(raw));
    const rank = Number.isFinite(timestamp) ? timestamp : 0;
    // Timestamped readings win regardless of local prepend or Firestore document order.
    // Legacy readings have no known creation time: preserve their existing fallback.
    if (byDate.has(item.date) && rank < timestamps.get(item.date)) continue;
    timestamps.set(item.date, rank);
    byDate.set(item.date, { date: item.date, weight: num(item.weight) });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export const latestWeight = measurements => weightSeries(measurements).slice(-1)[0] || null;

/**
 * Change between the most recent reading and the earliest one still inside the
 * window. Null until there are two readings far enough apart to compare.
 */
export function weightChange(measurements = [], days = 30) {
  const series = weightSeries(measurements);
  if (series.length < 2) return null;
  const latest = series[series.length - 1];
  const cutoff = new Date(`${latest.date}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const from = cutoff.toISOString().slice(0, 10);
  const earlier = series.filter(item => item.date >= from && item.date < latest.date)[0];
  if (!earlier) return null;
  return { from: earlier, to: latest, difference: Number((latest.weight - earlier.weight).toFixed(1)) };
}
