
-- =====================================================================
-- A. RSVP integrity
-- =====================================================================

-- 1. Replace RSVP UPDATE policy: host-only (attendees use cancel_rsvp RPC)
DROP POLICY IF EXISTS "Users update their own RSVPs, hosts update any" ON public.rsvps;
CREATE POLICY "Only event hosts update RSVPs"
  ON public.rsvps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = rsvps.event_id
        AND (public.is_host_owner(e.host_id, auth.uid())
          OR public.is_host_member(e.host_id, auth.uid(), 'host'::host_member_role))
    )
  );

-- 2. Block direct RSVP inserts; force usage of create_rsvp RPC
DROP POLICY IF EXISTS "Users create their own RSVPs" ON public.rsvps;
CREATE POLICY "No direct RSVP inserts"
  ON public.rsvps FOR INSERT
  WITH CHECK (false);

-- 3. Unique RSVP per user per event (clean up dupes first if any)
DELETE FROM public.rsvps a USING public.rsvps b
  WHERE a.ctid < b.ctid AND a.event_id = b.event_id AND a.user_id = b.user_id;
ALTER TABLE public.rsvps
  ADD CONSTRAINT rsvps_unique_event_user UNIQUE (event_id, user_id);

-- 4. Unique ticket per RSVP
DELETE FROM public.tickets a USING public.tickets b
  WHERE a.ctid < b.ctid AND a.rsvp_id = b.rsvp_id;
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_unique_rsvp UNIQUE (rsvp_id);

-- 5. Block direct ticket inserts
DROP POLICY IF EXISTS "Ticket owners can insert via own RSVP" ON public.tickets;
CREATE POLICY "No direct ticket inserts"
  ON public.tickets FOR INSERT
  WITH CHECK (false);

-- =====================================================================
-- B. Host invite enumeration fix
-- =====================================================================

DROP POLICY IF EXISTS "Pending invites readable by token holder" ON public.host_members;

CREATE OR REPLACE FUNCTION public.get_invite_preview(_token text)
RETURNS TABLE(host_id uuid, host_name text, role host_member_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hm.host_id, h.name, hm.role
  FROM public.host_members hm
  JOIN public.hosts h ON h.id = hm.host_id
  WHERE hm.invite_token = _token AND hm.user_id IS NULL
  LIMIT 1;
$$;

-- =====================================================================
-- C. Profiles / email PII
-- =====================================================================

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Self
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Hosts/checkers can view profiles of users who RSVPed to their events
CREATE POLICY "Event hosts view attendee profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rsvps r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.user_id = profiles.id
        AND (public.is_host_owner(e.host_id, auth.uid())
          OR public.is_host_member(e.host_id, auth.uid()))
    )
  );

-- Host owners can view their team-member profiles
CREATE POLICY "Host owners view team profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.host_members hm
      JOIN public.hosts h ON h.id = hm.host_id
      WHERE hm.user_id = profiles.id
        AND h.owner_user_id = auth.uid()
    )
  );

-- =====================================================================
-- D. Event update integrity
-- =====================================================================

DROP POLICY IF EXISTS "Hosts can update events" ON public.events;
CREATE POLICY "Hosts can update events"
  ON public.events FOR UPDATE
  USING (
    public.is_host_owner(host_id, auth.uid())
    OR public.is_host_member(host_id, auth.uid(), 'host'::host_member_role)
  )
  WITH CHECK (
    public.is_host_owner(host_id, auth.uid())
    OR public.is_host_member(host_id, auth.uid(), 'host'::host_member_role)
  );

DROP POLICY IF EXISTS "Hosts can delete events" ON public.events;
CREATE POLICY "Hosts can delete events"
  ON public.events FOR DELETE
  USING (
    public.is_host_owner(host_id, auth.uid())
    OR public.is_host_member(host_id, auth.uid(), 'host'::host_member_role)
  );

ALTER TABLE public.events
  ADD CONSTRAINT events_capacity_positive CHECK (capacity > 0),
  ADD CONSTRAINT events_end_after_start CHECK (end_at > start_at);

-- =====================================================================
-- E. Feedback / Gallery / Reports hardening
-- =====================================================================

ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_rating_range CHECK (rating BETWEEN 1 AND 5);

CREATE OR REPLACE FUNCTION public.feedback_eligibility_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ended boolean; _confirmed boolean;
BEGIN
  SELECT (end_at < now()) INTO _ended FROM public.events WHERE id = NEW.event_id;
  IF _ended IS NULL THEN RAISE EXCEPTION 'Event not found'; END IF;
  IF NOT _ended THEN RAISE EXCEPTION 'Feedback only allowed after the event ends'; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.rsvps
    WHERE event_id = NEW.event_id AND user_id = NEW.user_id AND status = 'confirmed'
  ) INTO _confirmed;
  IF NOT _confirmed THEN RAISE EXCEPTION 'Only confirmed attendees may leave feedback'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS feedback_eligibility ON public.feedback;
CREATE TRIGGER feedback_eligibility
  BEFORE INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.feedback_eligibility_check();

-- Gallery: uploader can delete own pending photo
CREATE POLICY "Uploader deletes own pending photo"
  ON public.gallery_photos FOR DELETE
  USING (user_id = auth.uid() AND status = 'pending');

CREATE OR REPLACE FUNCTION public.gallery_eligibility_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.rsvps
    WHERE event_id = NEW.event_id AND user_id = NEW.user_id
      AND status IN ('confirmed','waitlisted')
  ) THEN
    RAISE EXCEPTION 'Only attendees may upload photos';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gallery_eligibility ON public.gallery_photos;
CREATE TRIGGER gallery_eligibility
  BEFORE INSERT ON public.gallery_photos
  FOR EACH ROW EXECUTE FUNCTION public.gallery_eligibility_check();

-- Reports: validate target exists
CREATE OR REPLACE FUNCTION public.reports_target_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reportable_type = 'event' THEN
    IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = NEW.reportable_id) THEN
      RAISE EXCEPTION 'Reported event does not exist';
    END IF;
  ELSIF NEW.reportable_type = 'photo' THEN
    IF NOT EXISTS (SELECT 1 FROM public.gallery_photos WHERE id = NEW.reportable_id) THEN
      RAISE EXCEPTION 'Reported photo does not exist';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reports_target ON public.reports;
CREATE TRIGGER reports_target
  BEFORE INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.reports_target_check();
