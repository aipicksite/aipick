// Computes a fair FIFO schedule for a limited number of concurrent
// "featured" slots on the homepage. Each tool that has been marked
// featured (tools.featured_requested_at) gets exactly `durationDays` of
// visible time once a slot actually opens up for it — not from whenever it
// happened to be marked. This means:
//   - The first `slots` tools (by request order) start immediately.
//   - Any tool beyond that waits in a queue until an earlier tool's window
//     ends, then gets its own full fresh window starting at that moment.
// No cron job is needed — this is recomputed from scratch on every read,
// so it's always correct even if nothing has "ticked" in a while.

export type FeaturedCandidate = {
  id: string;
  featured_requested_at: string;
};

export type FeaturedWindow = {
  id: string;
  startMs: number;
  endMs: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param candidates Tools with featured_requested_at set, in ANY order —
 *   this function sorts them ascending (oldest request first) itself.
 * @param slots Max number of tools visible at the same time (default 15).
 * @param durationDays How many days each tool gets once its turn starts.
 * @param now Reference time (ms since epoch) — defaults to Date.now().
 */
export function computeFeaturedSchedule(
  candidates: FeaturedCandidate[],
  slots = 15,
  durationDays = 7,
  now: number = Date.now()
): FeaturedWindow[] {
  const durationMs = durationDays * DAY_MS;
  const sorted = [...candidates].sort(
    (a, b) => new Date(a.featured_requested_at).getTime() - new Date(b.featured_requested_at).getTime()
  );

  // slotFreeAt[i] = the time slot i becomes free again. Starts at -Infinity
  // (i.e. immediately available) for every slot.
  const slotFreeAt: number[] = new Array(slots).fill(-Infinity);
  const windows: FeaturedWindow[] = [];

  for (const c of sorted) {
    const requestedAt = new Date(c.featured_requested_at).getTime();

    // Pick whichever slot frees up soonest — that's the fair "next in line" slot.
    let bestIdx = 0;
    for (let i = 1; i < slots; i++) {
      if (slotFreeAt[i] < slotFreeAt[bestIdx]) bestIdx = i;
    }

    const start = Math.max(requestedAt, slotFreeAt[bestIdx]);
    const end = start + durationMs;
    slotFreeAt[bestIdx] = end;
    windows.push({ id: c.id, startMs: start, endMs: end });
  }

  return windows;
}

/** Convenience: just the ids currently visible right now, oldest-turn first. */
export function currentlyFeaturedIds(
  candidates: FeaturedCandidate[],
  slots = 15,
  durationDays = 7,
  now: number = Date.now()
): string[] {
  return computeFeaturedSchedule(candidates, slots, durationDays, now)
    .filter((w) => w.startMs <= now && w.endMs > now)
    .sort((a, b) => a.startMs - b.startMs)
    .map((w) => w.id);
}
