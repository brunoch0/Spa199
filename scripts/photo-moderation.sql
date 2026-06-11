-- Photo moderation: therapist photos (avatar/gallery/menu) require admin approval before going live.
-- Run in Supabase SQL Editor.

create table public.media_reviews (
  id uuid primary key default gen_random_uuid(),
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  url text not null,
  kind text not null check (kind in ('avatar','gallery','service')),
  service_id uuid references public.therapist_services(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.media_reviews enable row level security;
create policy "mr_insert_own" on public.media_reviews for insert
  with check (therapist_id = public.current_profile_id());
create policy "mr_select_own" on public.media_reviews for select
  using (therapist_id = public.current_profile_id() or public.is_admin());
create policy "mr_update_admin" on public.media_reviews for update
  using (public.is_admin());
create policy "mr_delete_own" on public.media_reviews for delete
  using ((therapist_id = public.current_profile_id() and status = 'pending') or public.is_admin());

create index idx_media_reviews_status on public.media_reviews(status, created_at);

-- notify the therapist when a photo is approved/rejected
create or replace function public.notify_media_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    insert into public.notifications (profile_id, title, body, link)
    values (new.therapist_id, 'Photo approved ✓',
            'Your ' || new.kind || ' photo is now live on your profile.', '/therapist/profile');
  elsif new.status = 'rejected' and old.status = 'pending' then
    insert into public.notifications (profile_id, title, body, link)
    values (new.therapist_id, 'Photo not approved',
            'Your ' || new.kind || ' photo did not meet our photo guidelines. Please upload a treatment/professional photo instead.', '/therapist/profile');
  end if;
  return new;
end;
$$;
create trigger on_media_review_change after update on public.media_reviews
  for each row execute function public.notify_media_review();
