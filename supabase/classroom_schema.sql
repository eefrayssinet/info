create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.classroom_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  track_id text not null,
  model_id text not null,
  hole_ids jsonb not null default '[]'::jsonb,
  time_limit_seconds integer not null default 300,
  reveal_mode text not null default 'hole',
  phase text not null default 'setup',
  active_hole_index integer not null default 0,
  hole_started_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classroom_teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.classroom_sessions (id) on delete cascade,
  name text not null,
  members jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classroom_team_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.classroom_sessions (id) on delete cascade,
  team_id uuid not null references public.classroom_teams (id) on delete cascade,
  hole_id text not null,
  model_id text not null,
  prompt_seed text,
  status text not null default 'pending',
  prompts_used integer not null default 0,
  completion integer not null default 0,
  score_vs_par integer,
  score_display text,
  score_label text,
  finish_reason text,
  locked_at timestamptz,
  last_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, team_id, hole_id)
);

create table if not exists public.classroom_prompt_turns (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.classroom_team_runs (id) on delete cascade,
  session_id uuid not null references public.classroom_sessions (id) on delete cascade,
  team_id uuid not null references public.classroom_teams (id) on delete cascade,
  prompt_count integer not null,
  prompt text not null,
  output text not null,
  evaluation jsonb not null default '{}'::jsonb,
  telemetry jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, prompt_count)
);

create index if not exists classroom_sessions_created_at_idx
  on public.classroom_sessions (created_at desc);

create index if not exists classroom_teams_session_id_idx
  on public.classroom_teams (session_id);

create index if not exists classroom_team_runs_session_team_idx
  on public.classroom_team_runs (session_id, team_id);

create index if not exists classroom_team_runs_hole_idx
  on public.classroom_team_runs (hole_id);

create index if not exists classroom_prompt_turns_run_prompt_idx
  on public.classroom_prompt_turns (run_id, prompt_count);

drop trigger if exists classroom_sessions_set_updated_at on public.classroom_sessions;
create trigger classroom_sessions_set_updated_at
before update on public.classroom_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists classroom_teams_set_updated_at on public.classroom_teams;
create trigger classroom_teams_set_updated_at
before update on public.classroom_teams
for each row
execute function public.set_updated_at();

drop trigger if exists classroom_team_runs_set_updated_at on public.classroom_team_runs;
create trigger classroom_team_runs_set_updated_at
before update on public.classroom_team_runs
for each row
execute function public.set_updated_at();

drop trigger if exists classroom_prompt_turns_set_updated_at on public.classroom_prompt_turns;
create trigger classroom_prompt_turns_set_updated_at
before update on public.classroom_prompt_turns
for each row
execute function public.set_updated_at();

alter table public.classroom_sessions enable row level security;
alter table public.classroom_teams enable row level security;
alter table public.classroom_team_runs enable row level security;
alter table public.classroom_prompt_turns enable row level security;

drop policy if exists "authenticated read sessions" on public.classroom_sessions;
create policy "authenticated read sessions"
on public.classroom_sessions
for select
to authenticated
using (true);

drop policy if exists "authenticated write sessions" on public.classroom_sessions;
create policy "authenticated write sessions"
on public.classroom_sessions
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read teams" on public.classroom_teams;
create policy "authenticated read teams"
on public.classroom_teams
for select
to authenticated
using (true);

drop policy if exists "authenticated write teams" on public.classroom_teams;
create policy "authenticated write teams"
on public.classroom_teams
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read team runs" on public.classroom_team_runs;
create policy "authenticated read team runs"
on public.classroom_team_runs
for select
to authenticated
using (true);

drop policy if exists "authenticated write team runs" on public.classroom_team_runs;
create policy "authenticated write team runs"
on public.classroom_team_runs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated read prompt turns" on public.classroom_prompt_turns;
create policy "authenticated read prompt turns"
on public.classroom_prompt_turns
for select
to authenticated
using (true);

drop policy if exists "authenticated write prompt turns" on public.classroom_prompt_turns;
create policy "authenticated write prompt turns"
on public.classroom_prompt_turns
for all
to authenticated
using (true)
with check (true);

alter publication supabase_realtime add table public.classroom_sessions;
alter publication supabase_realtime add table public.classroom_teams;
alter publication supabase_realtime add table public.classroom_team_runs;
alter publication supabase_realtime add table public.classroom_prompt_turns;
