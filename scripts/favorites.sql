-- Favorites (즐겨찾기) — run now in SQL Editor.

create table public.favorites (
  customer_id uuid not null references public.profiles(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, therapist_id)
);

alter table public.favorites enable row level security;
create policy "fav_all_own" on public.favorites for all
  using (customer_id = public.current_profile_id())
  with check (customer_id = public.current_profile_id());
