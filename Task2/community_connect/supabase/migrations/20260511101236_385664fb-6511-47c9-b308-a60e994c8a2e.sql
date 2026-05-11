
-- Gap A: Plug host ownership hijack
DROP POLICY IF EXISTS "Owners can update their host" ON public.hosts;
CREATE POLICY "Owners can update their host" ON public.hosts
  FOR UPDATE USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Gap B: Lock down event transfers + audit table
CREATE TABLE IF NOT EXISTS public.event_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  from_host_id uuid NOT NULL,
  to_host_id uuid NOT NULL,
  by_user_id uuid NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.event_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host owners/members can view transfers for their hosts"
  ON public.event_transfers FOR SELECT
  USING (
    public.is_host_owner(from_host_id, auth.uid())
    OR public.is_host_owner(to_host_id, auth.uid())
    OR public.is_host_member(from_host_id, auth.uid(), 'host')
    OR public.is_host_member(to_host_id, auth.uid(), 'host')
  );

CREATE OR REPLACE FUNCTION public.events_guard_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _u uuid := auth.uid();
BEGIN
  IF NEW.host_id IS DISTINCT FROM OLD.host_id THEN
    IF _u IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF NOT public.is_host_owner(OLD.host_id, _u) THEN
      RAISE EXCEPTION 'Only the owner of the current host can transfer this event';
    END IF;
    IF NOT public.is_host_owner(NEW.host_id, _u) THEN
      RAISE EXCEPTION 'You must own the destination host to transfer this event';
    END IF;
    INSERT INTO public.event_transfers (event_id, from_host_id, to_host_id, by_user_id)
      VALUES (NEW.id, OLD.host_id, NEW.host_id, _u);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_guard_transfer ON public.events;
CREATE TRIGGER trg_events_guard_transfer
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.events_guard_transfer();

-- Gap C: Restrict checker role from reading attendee profiles
DROP POLICY IF EXISTS "Event hosts view attendee profiles" ON public.profiles;
CREATE POLICY "Event hosts view attendee profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rsvps r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.user_id = profiles.id
        AND (
          public.is_host_owner(e.host_id, auth.uid())
          OR public.is_host_member(e.host_id, auth.uid(), 'host')
        )
    )
  );

-- Gap E: cancel_rsvp should refuse after event end
CREATE OR REPLACE FUNCTION public.cancel_rsvp(_rsvp_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _r public.rsvps%rowtype;
  _ev public.events%rowtype;
  _promote public.rsvps%rowtype;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _r FROM public.rsvps WHERE id = _rsvp_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'RSVP not found'; END IF;
  IF _r.user_id <> _user THEN RAISE EXCEPTION 'Not your RSVP'; END IF;

  SELECT * INTO _ev FROM public.events WHERE id = _r.event_id;
  IF _ev.end_at < now() THEN RAISE EXCEPTION 'Event has already ended'; END IF;

  UPDATE public.rsvps SET status='cancelled', cancelled_at=now() WHERE id=_rsvp_id;

  IF _r.status = 'confirmed' THEN
    SELECT * INTO _promote FROM public.rsvps
      WHERE event_id=_r.event_id AND status='waitlisted'
      ORDER BY waitlist_position ASC NULLS LAST, created_at ASC LIMIT 1;
    IF FOUND THEN
      UPDATE public.rsvps SET status='confirmed', waitlist_position=null WHERE id=_promote.id;
    END IF;
  END IF;
END;
$$;
