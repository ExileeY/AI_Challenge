
-- =========== ENUMS ===========
create type public.host_member_role as enum ('host','checker');
create type public.event_visibility as enum ('public','unlisted');
create type public.event_status as enum ('draft','published');
create type public.location_type as enum ('physical','online');
create type public.rsvp_status as enum ('confirmed','waitlisted','cancelled');
create type public.gallery_status as enum ('pending','approved','rejected');
create type public.report_status as enum ('open','reviewed');
create type public.reportable_type as enum ('event','photo');

-- =========== PROFILES ===========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- =========== HOSTS ===========
create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  logo_url text,
  bio text,
  contact_email text,
  created_at timestamptz not null default now()
);
alter table public.hosts enable row level security;
create policy "Hosts are public" on public.hosts for select using (true);
create policy "Users can create hosts" on public.hosts for insert with check (auth.uid() = owner_user_id);
create policy "Owners can update their host" on public.hosts for update using (auth.uid() = owner_user_id);

-- =========== HOST MEMBERS ===========
create table public.host_members (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role public.host_member_role not null,
  invite_token text unique,
  invite_email text,
  created_at timestamptz not null default now(),
  unique (host_id, user_id, role)
);
alter table public.host_members enable row level security;

-- Security definer to check membership without recursion
create or replace function public.is_host_member(_host_id uuid, _user_id uuid, _role public.host_member_role default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.host_members
    where host_id = _host_id and user_id = _user_id
      and (_role is null or role = _role)
  );
$$;

create or replace function public.is_host_owner(_host_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.hosts where id = _host_id and owner_user_id = _user_id);
$$;

create policy "Members visible to host members" on public.host_members for select
  using (public.is_host_owner(host_id, auth.uid()) or user_id = auth.uid());
create policy "Host owners manage members" on public.host_members for all
  using (public.is_host_owner(host_id, auth.uid()))
  with check (public.is_host_owner(host_id, auth.uid()));
-- Allow user to claim invite (insert their own member row via RPC will use definer) - keep simple for now

-- =========== EVENTS ===========
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'UTC',
  location_type public.location_type not null default 'physical',
  venue_address text,
  online_link text,
  capacity integer not null default 50,
  cover_image_url text,
  visibility public.event_visibility not null default 'public',
  status public.event_status not null default 'draft',
  pricing_type text not null default 'free',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
create index on public.events (status, start_at);
create index on public.events (host_id);

create policy "Public can see published non-hidden events" on public.events for select
  using ((status = 'published' and not hidden) or public.is_host_owner(host_id, auth.uid()) or public.is_host_member(host_id, auth.uid()));
create policy "Hosts can insert events" on public.events for insert
  with check (public.is_host_owner(host_id, auth.uid()) or public.is_host_member(host_id, auth.uid(), 'host'));
create policy "Hosts can update events" on public.events for update
  using (public.is_host_owner(host_id, auth.uid()) or public.is_host_member(host_id, auth.uid(), 'host'));
create policy "Hosts can delete events" on public.events for delete
  using (public.is_host_owner(host_id, auth.uid()));

-- =========== RSVPs ===========
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.rsvp_status not null,
  waitlist_position integer,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (event_id, user_id)
);
alter table public.rsvps enable row level security;
create index on public.rsvps (event_id, status);

create policy "Users see their RSVPs and host sees event RSVPs" on public.rsvps for select
  using (
    user_id = auth.uid()
    or exists(select 1 from public.events e where e.id = event_id
              and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid())))
  );
create policy "Users create their own RSVPs" on public.rsvps for insert
  with check (user_id = auth.uid());
create policy "Users update their own RSVPs, hosts update any" on public.rsvps for update
  using (
    user_id = auth.uid()
    or exists(select 1 from public.events e where e.id = event_id and public.is_host_owner(e.host_id, auth.uid()))
  );

-- =========== TICKETS ===========
create or replace function public.gen_ticket_code()
returns text language sql as $$
  select upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
$$;

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  rsvp_id uuid not null unique references public.rsvps(id) on delete cascade,
  ticket_code text not null unique default public.gen_ticket_code(),
  checked_in_at timestamptz,
  checked_in_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.tickets enable row level security;

create policy "Owners and event hosts/checkers can read tickets" on public.tickets for select
  using (
    exists(
      select 1 from public.rsvps r join public.events e on e.id = r.event_id
      where r.id = rsvp_id
        and (r.user_id = auth.uid()
             or public.is_host_owner(e.host_id, auth.uid())
             or public.is_host_member(e.host_id, auth.uid()))
    )
  );
create policy "Ticket owners can insert via own RSVP" on public.tickets for insert
  with check (
    exists(select 1 from public.rsvps r where r.id = rsvp_id and r.user_id = auth.uid())
  );
create policy "Hosts/checkers can update tickets (checkin)" on public.tickets for update
  using (
    exists(
      select 1 from public.rsvps r join public.events e on e.id = r.event_id
      where r.id = rsvp_id
        and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid()))
    )
  );

-- =========== FEEDBACK ===========
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
alter table public.feedback enable row level security;
create policy "Feedback is public-readable for published events" on public.feedback for select using (true);
create policy "Users insert their own feedback" on public.feedback for insert with check (user_id = auth.uid());

-- =========== GALLERY PHOTOS ===========
create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  status public.gallery_status not null default 'pending',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.gallery_photos enable row level security;

create policy "Approved non-hidden photos public, hosts/owners see all" on public.gallery_photos for select
  using (
    (status='approved' and not hidden)
    or user_id = auth.uid()
    or exists(select 1 from public.events e where e.id = event_id
              and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid(), 'host')))
  );
create policy "Authenticated users can upload" on public.gallery_photos for insert with check (user_id = auth.uid());
create policy "Hosts moderate photos" on public.gallery_photos for update
  using (
    exists(select 1 from public.events e where e.id = event_id
           and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid(), 'host')))
  );

-- =========== REPORTS ===========
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reportable_type public.reportable_type not null,
  reportable_id uuid not null,
  reason text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "Reporters see own; hosts see reports for their content" on public.reports for select
  using (
    reporter_user_id = auth.uid()
    or (reportable_type='event' and exists(select 1 from public.events e where e.id = reportable_id
        and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid(), 'host'))))
    or (reportable_type='photo' and exists(select 1 from public.gallery_photos p join public.events e on e.id=p.event_id
        where p.id=reportable_id
          and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid(), 'host'))))
  );
create policy "Users can report" on public.reports for insert with check (reporter_user_id = auth.uid());
create policy "Hosts can mark reviewed" on public.reports for update
  using (
    (reportable_type='event' and exists(select 1 from public.events e where e.id = reportable_id
        and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid(), 'host'))))
    or (reportable_type='photo' and exists(select 1 from public.gallery_photos p join public.events e on e.id=p.event_id
        where p.id=reportable_id
          and (public.is_host_owner(e.host_id, auth.uid()) or public.is_host_member(e.host_id, auth.uid(), 'host'))))
  );

-- =========== RPC: RSVP create with capacity logic ===========
create or replace function public.create_rsvp(_event_id uuid)
returns table (rsvp_id uuid, status public.rsvp_status, ticket_code text, waitlist_position integer)
language plpgsql security definer set search_path = public as $$
declare
  _user uuid := auth.uid();
  _ev public.events%rowtype;
  _confirmed_count int;
  _existing public.rsvps%rowtype;
  _new_status public.rsvp_status;
  _waitpos int;
  _rsvp_id uuid;
  _code text;
begin
  if _user is null then raise exception 'Not authenticated'; end if;
  select * into _ev from public.events where id = _event_id;
  if not found then raise exception 'Event not found'; end if;
  if _ev.status <> 'published' then raise exception 'Event not published'; end if;
  if _ev.end_at < now() then raise exception 'Event has ended'; end if;

  select * into _existing from public.rsvps where event_id = _event_id and user_id = _user;
  if found and _existing.status in ('confirmed','waitlisted') then
    -- return existing
    select t.ticket_code into _code from public.tickets t where t.rsvp_id = _existing.id;
    return query select _existing.id, _existing.status, _code, _existing.waitlist_position;
    return;
  end if;

  select count(*) into _confirmed_count from public.rsvps where event_id = _event_id and status='confirmed';
  if _confirmed_count < _ev.capacity then
    _new_status := 'confirmed'; _waitpos := null;
  else
    _new_status := 'waitlisted';
    select coalesce(max(waitlist_position),0)+1 into _waitpos from public.rsvps where event_id = _event_id and status='waitlisted';
  end if;

  if found then
    update public.rsvps set status=_new_status, waitlist_position=_waitpos, cancelled_at=null
      where id = _existing.id returning id into _rsvp_id;
  else
    insert into public.rsvps (event_id, user_id, status, waitlist_position)
      values (_event_id, _user, _new_status, _waitpos) returning id into _rsvp_id;
  end if;

  insert into public.tickets (rsvp_id) values (_rsvp_id)
    on conflict (rsvp_id) do nothing
    returning ticket_code into _code;
  if _code is null then
    select t.ticket_code into _code from public.tickets t where t.rsvp_id = _rsvp_id;
  end if;

  return query select _rsvp_id, _new_status, _code, _waitpos;
end; $$;
grant execute on function public.create_rsvp(uuid) to authenticated;

-- =========== RPC: cancel RSVP & promote ===========
create or replace function public.cancel_rsvp(_rsvp_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  _user uuid := auth.uid();
  _r public.rsvps%rowtype;
  _promote public.rsvps%rowtype;
begin
  if _user is null then raise exception 'Not authenticated'; end if;
  select * into _r from public.rsvps where id = _rsvp_id;
  if not found then raise exception 'RSVP not found'; end if;
  if _r.user_id <> _user then raise exception 'Not your RSVP'; end if;

  update public.rsvps set status='cancelled', cancelled_at=now() where id=_rsvp_id;

  if _r.status = 'confirmed' then
    -- promote first waitlisted (FIFO)
    select * into _promote from public.rsvps
      where event_id=_r.event_id and status='waitlisted'
      order by waitlist_position asc nulls last, created_at asc limit 1;
    if found then
      update public.rsvps set status='confirmed', waitlist_position=null where id=_promote.id;
    end if;
  end if;
end; $$;
grant execute on function public.cancel_rsvp(uuid) to authenticated;

-- =========== RPC: check-in by code ===========
create or replace function public.check_in_ticket(_event_id uuid, _code text)
returns table (ticket_id uuid, attendee_name text, status text, message text)
language plpgsql security definer set search_path = public as $$
declare
  _user uuid := auth.uid();
  _ev public.events%rowtype;
  _t public.tickets%rowtype;
  _r public.rsvps%rowtype;
  _name text;
begin
  if _user is null then raise exception 'Not authenticated'; end if;
  select * into _ev from public.events where id=_event_id;
  if not found then raise exception 'Event not found'; end if;
  if not (public.is_host_owner(_ev.host_id, _user) or public.is_host_member(_ev.host_id, _user)) then
    raise exception 'Not authorized';
  end if;
  select * into _t from public.tickets where ticket_code = upper(trim(_code));
  if not found then
    return query select null::uuid, null::text, 'invalid'::text, 'Invalid ticket code';
    return;
  end if;
  select * into _r from public.rsvps where id=_t.rsvp_id;
  if _r.event_id <> _event_id then
    return query select _t.id, null::text, 'invalid'::text, 'Ticket is for a different event';
    return;
  end if;
  if _r.status <> 'confirmed' then
    return query select _t.id, null::text, 'not_eligible'::text, 'Ticket not eligible (status: '||_r.status||')';
    return;
  end if;
  select p.name into _name from public.profiles p where p.id = _r.user_id;
  if _t.checked_in_at is not null then
    return query select _t.id, _name, 'already'::text, 'Already checked in';
    return;
  end if;
  update public.tickets set checked_in_at=now(), checked_in_by_user_id=_user where id=_t.id;
  return query select _t.id, _name, 'ok'::text, 'Checked in';
end; $$;
grant execute on function public.check_in_ticket(uuid, text) to authenticated;

create or replace function public.undo_check_in(_ticket_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _user uuid := auth.uid(); _ev_id uuid; _host_id uuid;
begin
  if _user is null then raise exception 'Not authenticated'; end if;
  select e.id, e.host_id into _ev_id, _host_id
    from public.tickets t join public.rsvps r on r.id=t.rsvp_id join public.events e on e.id=r.event_id
    where t.id=_ticket_id;
  if not found then raise exception 'Ticket not found'; end if;
  if not (public.is_host_owner(_host_id,_user) or public.is_host_member(_host_id,_user)) then
    raise exception 'Not authorized';
  end if;
  update public.tickets set checked_in_at=null, checked_in_by_user_id=null where id=_ticket_id;
end; $$;
grant execute on function public.undo_check_in(uuid) to authenticated;

-- =========== Trigger: promote waitlist when capacity grows ===========
create or replace function public.on_capacity_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare _confirmed int; _slots int; _r record;
begin
  if NEW.capacity > OLD.capacity then
    select count(*) into _confirmed from public.rsvps where event_id=NEW.id and status='confirmed';
    _slots := NEW.capacity - _confirmed;
    if _slots > 0 then
      for _r in
        select id from public.rsvps where event_id=NEW.id and status='waitlisted'
        order by waitlist_position asc nulls last, created_at asc limit _slots
      loop
        update public.rsvps set status='confirmed', waitlist_position=null where id=_r.id;
      end loop;
    end if;
  end if;
  return NEW;
end; $$;
create trigger trg_capacity_change after update of capacity on public.events
  for each row execute function public.on_capacity_change();
