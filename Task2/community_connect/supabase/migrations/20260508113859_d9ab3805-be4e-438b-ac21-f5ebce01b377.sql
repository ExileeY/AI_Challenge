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

  select * into _existing from public.rsvps r where r.event_id = _event_id and r.user_id = _user;
  if found and _existing.status in ('confirmed','waitlisted') then
    select t.ticket_code into _code from public.tickets t where t.rsvp_id = _existing.id;
    return query select _existing.id, _existing.status, _code, _existing.waitlist_position;
    return;
  end if;

  select count(*) into _confirmed_count from public.rsvps r where r.event_id = _event_id and r.status='confirmed';
  if _confirmed_count < _ev.capacity then
    _new_status := 'confirmed'; _waitpos := null;
  else
    _new_status := 'waitlisted';
    select coalesce(max(r.waitlist_position),0)+1 into _waitpos from public.rsvps r where r.event_id = _event_id and r.status='waitlisted';
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
    returning tickets.ticket_code into _code;
  if _code is null then
    select t.ticket_code into _code from public.tickets t where t.rsvp_id = _rsvp_id;
  end if;

  return query select _rsvp_id, _new_status, _code, _waitpos;
end; $$;