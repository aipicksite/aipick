-- Reviews & ratings (Phase 1) — run this after 001_init_schema.sql

alter table tools
  add column if not exists rating_avg numeric(3,2) not null default 0,
  add column if not exists rating_count integer not null default 0;

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references tools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  ease_of_use smallint check (ease_of_use between 1 and 5),
  value_for_money smallint check (value_for_money between 1 and 5),
  would_recommend boolean,
  body text,
  helpful_count integer not null default 0,
  status text not null default 'published' check (status in ('published', 'flagged', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tool_id, user_id)
);

create index if not exists reviews_tool_id_idx on reviews(tool_id);

create table if not exists review_votes (
  review_id uuid not null references reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote_type text not null check (vote_type in ('helpful', 'not_helpful')),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

-- Keep tools.rating_avg / rating_count in sync automatically
create or replace function recalc_tool_rating() returns trigger as $$
declare
  target_tool_id uuid;
begin
  target_tool_id := coalesce(new.tool_id, old.tool_id);

  update tools set
    rating_avg = coalesce((
      select round(avg(rating)::numeric, 2) from reviews
      where tool_id = target_tool_id and status = 'published'
    ), 0),
    rating_count = (
      select count(*) from reviews
      where tool_id = target_tool_id and status = 'published'
    )
  where id = target_tool_id;

  return null;
end;
$$ language plpgsql;

drop trigger if exists reviews_recalc_rating on reviews;
create trigger reviews_recalc_rating
  after insert or update or delete on reviews
  for each row execute function recalc_tool_rating();

-- RLS
alter table reviews enable row level security;
alter table review_votes enable row level security;

drop policy if exists "Published reviews are public" on reviews;
create policy "Published reviews are public" on reviews
  for select using (status = 'published' or user_id = auth.uid());

drop policy if exists "Users manage their own review" on reviews;
create policy "Users manage their own review" on reviews
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update their own review" on reviews;
create policy "Users update their own review" on reviews
  for update using (auth.uid() = user_id);

drop policy if exists "Users delete their own review" on reviews;
create policy "Users delete their own review" on reviews
  for delete using (auth.uid() = user_id);

drop policy if exists "Review votes are public" on review_votes;
create policy "Review votes are public" on review_votes
  for select using (true);

drop policy if exists "Users manage their own review vote" on review_votes;
create policy "Users manage their own review vote" on review_votes
  for insert with check (auth.uid() = user_id);

-- Blog (content pages) — managed via Supabase Table Editor for now (admin UI is Phase 2)
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  cover_image_url text,
  body text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table blog_posts enable row level security;

drop policy if exists "Published posts are public" on blog_posts;
create policy "Published posts are public" on blog_posts
  for select using (published_at is not null and published_at <= now());
