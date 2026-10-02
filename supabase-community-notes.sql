-- Campus Roadmap: community notes
-- Run this once in Supabase SQL Editor after the existing
-- `contributions` table and private `notes` bucket are already created.

-- 1) Add unit/chapter information to each contribution.
alter table public.contributions
  add column if not exists unit text;

-- 2) Public-safe table containing ONLY approved notes.
create table if not exists public.published_notes (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid unique not null
    references public.contributions(id) on delete cascade,
  subject text not null,
  unit text,
  file_name text not null,
  file_path text not null,
  contributor_name text not null,
  year text,
  approved_at timestamptz not null default now()
);

alter table public.published_notes enable row level security;

grant select on table public.published_notes to anon, authenticated;

drop policy if exists "Public can view published notes" on public.published_notes;

create policy "Public can view published notes"
on public.published_notes
for select
to anon, authenticated
using (true);

-- 3) Keep published_notes automatically synced with contribution approval.
create or replace function public.sync_published_note()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.published_notes
    where contribution_id = old.id;
    return old;
  end if;

  if new.status = 'approved' then
    insert into public.published_notes (
      contribution_id,
      subject,
      unit,
      file_name,
      file_path,
      contributor_name,
      year,
      approved_at
    )
    values (
      new.id,
      new.subject,
      nullif(new.unit, ''),
      new.file_name,
      new.file_path,
      new.name,
      new.year,
      now()
    )
    on conflict (contribution_id) do update set
      subject = excluded.subject,
      unit = excluded.unit,
      file_name = excluded.file_name,
      file_path = excluded.file_path,
      contributor_name = excluded.contributor_name,
      year = excluded.year,
      approved_at = excluded.approved_at;
  else
    delete from public.published_notes
    where contribution_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_published_note_trigger
on public.contributions;

create trigger sync_published_note_trigger
after insert or update of status, subject, unit, file_name, file_path, name, year or delete
on public.contributions
for each row
execute function public.sync_published_note();

-- 4) Allow visitors to obtain signed download URLs ONLY for approved files.
-- The bucket remains private.
drop policy if exists "Approved note files are viewable" on storage.objects;

create policy "Approved note files are viewable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'notes'
  and exists (
    select 1
    from public.published_notes p
    where p.file_path = name
  )
);

-- Recommended API exposure:
-- Expose `published_notes` in Supabase Data API settings.
-- Keep `contributions` unexposed if you do not need browser access to it.
