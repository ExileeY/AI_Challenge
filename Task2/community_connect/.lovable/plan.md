## Deep audit — data consistency & security gaps (round 2)

Focused on flows you called out (event transfer between hosts) plus remaining gaps after the previous hardening pass.

---

### Direct answer to your scenario

1. User 1 creates `HOST_1` → owner.
2. User 1 creates `EVENT_1` under `HOST_1`.
3. User 1 invites User 2 as `host`-role member of `HOST_1`.
4. User 2 (who also owns/manages `HOST_2`) updates `events.host_id = HOST_2` for `EVENT_1`.

Today's RLS on `events` UPDATE:
- USING evaluates the **current** row → User 2 is host of `HOST_1` → passes.
- WITH CHECK evaluates the **new** row → User 2 owns/manages `HOST_2` → passes.

Result:
- **User 1 LOSES all access to `EVENT_1`** (RLS on every event-scoped table is keyed off `events.host_id`, which is now `HOST_2`).
- **User 1 does NOT gain any access to `HOST_2`** (host membership is unchanged).
- All `RSVPs`, `tickets`, `gallery_photos`, `feedback` for `EVENT_1` silently become readable/moderable by `HOST_2`'s entire team — attendee emails included via the "Event hosts view attendee profiles" policy. **Privacy + consent issue**: attendees agreed to share data with `HOST_1`, not `HOST_2`.
- No audit log, no notification, no UI even exposes this — it can only be done from the console, but it's reachable by any host-role member.

This is the most serious remaining gap.

---

### Other gaps found

**A. Host ownership hijack (CRITICAL)**
`hosts` UPDATE policy: `USING (auth.uid() = owner_user_id)` with **no WITH CHECK**. The owner can `update hosts set owner_user_id = '<anyone>'` and either lock themselves out or hand the host to a non-consenting user. Same shape bug as the events one we just fixed.

**B. Event transfer is unrestricted (CRITICAL — your scenario)**
Any host-role member can re-parent events to any other host they manage. No consent from the original host owner, no audit trail, no UI surfacing it.

**C. Checker role sees attendee PII (HIGH)**
`profiles` policy "Event hosts view attendee profiles" uses `is_host_member(host_id, auth.uid())` with **no role filter**, so `checker`-role members (intended for door scanning only) can `select email, name from profiles` for every attendee of every event under their host. Checkers should only see check-in-relevant fields via the existing `check_in_ticket` RPC.

**D. Storage bucket `event-gallery` is public (HIGH)**
Bucket is marked public and there are no storage RLS policies listed. The DB-level approval workflow on `gallery_photos` is moot if anyone can guess/share the raw object URL — pending/rejected photos are still publicly downloadable. Need either: private bucket + signed URLs, or storage RLS that mirrors approval status (harder), or accept that "approval" only gates *display in app*.

**E. `cancel_rsvp` post-event (MEDIUM)**
RPC doesn't check `events.end_at >= now()`. A user can cancel after the event ended, which then promotes a waitlisted user to "confirmed" for an event that's already over. Cosmetic but pollutes attendance reports.

**F. No `hosts` DELETE / archive (LOW)**
Owners can't remove or archive a host; orphan UX. Out of scope unless prioritized.

**G. `become-host` has no per-user cap (LOW)**
A signed-in user can spin up unlimited hosts. Spam vector. Out of scope unless prioritized.

**H. Audit log absent (MEDIUM)**
No record of: event host transfers, host-member role changes, owner changes, photo approvals, report resolutions. Recommended even minimally for the items above.

---

### Fix plan

**1. Lock down event transfers (gap B)**
Restrict `events.host_id` mutation to host **owners only** AND require the new host to also be owned by the same user. Implementation: replace the events UPDATE policy WITH CHECK with:

```
WITH CHECK (
  host_id = (SELECT host_id FROM events WHERE id = events.id)         -- no change
  OR is_host_owner(host_id, auth.uid())                                -- new host owned by me
)
USING (is_host_owner(host_id, auth.uid())                              -- current host owned by me
       OR is_host_member(host_id, auth.uid(), 'host'))
```

Cleaner: enforce in a `BEFORE UPDATE` trigger on `events`:
- if `OLD.host_id <> NEW.host_id` then require `is_host_owner(OLD.host_id, auth.uid()) AND is_host_owner(NEW.host_id, auth.uid())`.
- Otherwise allow normal host-member edits.

This means a host-role member can edit everything *except* re-parent the event. Re-parenting requires being owner of both sides.

Add an `event_transfers` audit table (`event_id, from_host_id, to_host_id, by_user_id, at`) populated by the trigger so the original owner can detect/dispute it.

**2. Plug host ownership hijack (gap A)**
Add `WITH CHECK (auth.uid() = owner_user_id)` to `hosts` UPDATE policy. To support legit ownership transfer later, add a SECURITY DEFINER `transfer_host_ownership(_host_id, _to_user_id)` RPC that requires the recipient to first accept (mirrors the invite pattern). Out of scope to build the UI; just close the policy hole.

**3. Restrict checker PII (gap C)**
Change the `profiles` "Event hosts view attendee profiles" policy to require `is_host_owner(...) OR is_host_member(..., 'host')` (drop checker access). Checkers continue to use `check_in_ticket` RPC which already returns the attendee name.

**4. Gallery storage hardening (gap D)**
Two acceptable fixes — pick one:
- **Private bucket + signed URLs**: flip `event-gallery` to private; serve approved photos via short-lived signed URLs generated server-side or via a `get_gallery_url(_photo_id)` RPC that checks the photo is approved+visible. Cleanest, but requires touching upload + render code.
- **Accept current model**: document that "approval" only controls in-app display; the underlying URL is shareable. Lower effort, weaker guarantee.

Recommend option 1.

**5. `cancel_rsvp` end-time guard (gap E)**
Add `if _ev.end_at < now() then raise exception 'Event has ended'` to the RPC, mirroring `create_rsvp`.

**6. Minimal audit log (gap H)**
Add `audit_log (id, actor_user_id, action, entity_type, entity_id, payload jsonb, at)` populated by triggers for: event transfers, host_member role changes, host owner changes, gallery moderation actions, report status changes. Hosts/owners SELECT scoped via RLS to their host's rows.

---

### Out of scope (call out, don't build now)
- Soft-delete / archive for hosts and events (gap F).
- Rate limit on host creation (gap G).
- Notifying the original host owner when an event is transferred (UI work; the audit log is the data side).

---

### Recommended sequencing
1. Gaps **A** + **B** + **C** in one migration (pure SQL, no UI).
2. Gap **E** in the same migration (one-line RPC change).
3. Gap **D** as a separate migration + minimal code change for upload/render.
4. Gap **H** last (audit log plumbing).

Risk if shipped as-is: scenario in your message is fully exploitable today by any host-role member; gap A is exploitable by any host owner via console.