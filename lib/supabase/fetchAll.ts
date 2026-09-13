import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase/PostgREST caps any unbounded .select() at 1000 rows by default.
 * Several places in this codebase read entire tables (tool_categories,
 * page_views, etc.) to aggregate in JS, and as the data grew past 1000
 * rows those reads were silently truncated — e.g. the tool_categories
 * table now has 1000+ rows, so any plain `.select("tool_id, category_id")`
 * with no `.range()` only sees whichever 1000 rows Postgres happens to
 * return, which in practice skewed heavily toward old rows and made
 * newly-tagged categories look empty everywhere counts are computed from
 * that table (site-wide category browse page, homepage category cards,
 * admin categories page).
 *
 * This walks the table in pageSize-row pages until everything matching
 * the query is retrieved. Pass a `build` callback that applies whatever
 * filters/order you need on top of the base `.from(table).select(select)`
 * query; this function only adds the `.range()` pagination.
 */
export async function fetchAllRows<T>(
  supabase: SupabaseClient,
  table: string,
  select: string,
  build?: (q: any) => any,
  pageSize = 1000,
  maxPages = 200 // safety cap: 200k rows, well beyond realistic volume
): Promise<T[]> {
  let all: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const offset = page * pageSize;
    let query = supabase.from(table).select(select).range(offset, offset + pageSize - 1);
    if (build) query = build(query);
    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    all = all.concat(data as T[]);
    if (data.length < pageSize) break;
  }
  return all;
}
