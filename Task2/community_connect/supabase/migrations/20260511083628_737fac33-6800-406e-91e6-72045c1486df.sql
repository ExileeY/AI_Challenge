-- Auto-fill invite_token for pending invites
ALTER TABLE public.host_members ALTER COLUMN invite_token SET DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Allow anyone signed-in to read a pending invite by its token (needed for /invite/$token page)
CREATE POLICY "Pending invites readable by token holder"
ON public.host_members FOR SELECT
USING (user_id IS NULL AND invite_token IS NOT NULL AND auth.uid() IS NOT NULL);

-- RPC for an authenticated invitee to claim a pending invite
CREATE OR REPLACE FUNCTION public.accept_host_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _row public.host_members%rowtype;
  _existing public.host_members%rowtype;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _row FROM public.host_members WHERE invite_token = _token AND user_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found or already claimed'; END IF;

  -- If user is already a member of this host, just delete the pending invite and return
  SELECT * INTO _existing FROM public.host_members WHERE host_id = _row.host_id AND user_id = _user;
  IF FOUND THEN
    DELETE FROM public.host_members WHERE id = _row.id;
    RETURN _row.host_id;
  END IF;

  UPDATE public.host_members
    SET user_id = _user, invite_token = NULL, invite_email = NULL
    WHERE id = _row.id;
  RETURN _row.host_id;
END;
$$;