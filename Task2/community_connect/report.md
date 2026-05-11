# Build report — Communa

## Tools & techniques

- **Frontend:** TanStack Start v1 (React 19) with file-based routing, Tailwind v4, shadcn/ui components, sonner for toasts, lucide-react icons.
- **Backend:** Lovable Cloud (Supabase under the hood) — Postgres with Row-Level Security policies, auth via email/password, Postgres functions (`SECURITY DEFINER`) for transactional logic.
- **Business logic in the database:** RSVP creation, cancellation with FIFO waitlist promotion, capacity-grow promotion (trigger on `events.capacity` update), and ticket check-in/undo are all RPC functions. This keeps capacity and waitlist invariants safe even if multiple clients race.
- **QR codes:** generated on the fly from `api.qrserver.com` so no client dependency or storage is needed.
- **Calendar:** `.ics` files are assembled client-side and downloaded as a Blob.
- **CSV export:** generated client-side with proper quoting + UTF-8 BOM so Excel/Sheets open correctly.

## What worked well

- Putting RSVP/cancel/check-in into Postgres functions made the React side trivial — pages just call `supabase.rpc(...)` and re-fetch.
- The flat dot-named TanStack route convention (`events.$id.checkin.tsx`) kept the route tree compact.
- shadcn primitives + a single warm-coral design token gave a polished look quickly.

## Simplifications / limitations

- **Photos and logos use external URLs** rather than file uploads. A storage bucket + signed-upload flow would be the next step.
- **Host invites:** the schema supports `host_members` with `invite_token`, and "My Events" aggregates by membership, but the in-app invite-link UI (generate / copy / accept) is not built. New checkers must currently be added via the database.
- **No email verification / password reset UI.** Auto-confirm is enabled for the demo to make sign-up frictionless.
- **Reports** are simple — any signed-in user can report; the host queue allows hide + mark-reviewed but no audit log.
- **Realtime updates** on the check-in counters are not wired (page state is recomputed after each scan instead).
- **Paid events** are intentionally disabled with a "Coming soon" tooltip per the brief.

## Notable decisions

- Used `SECURITY DEFINER` Postgres functions for any operation that touches multiple rows or needs to enforce capacity/waitlist invariants. RLS policies cover the simple read paths.
- Public events are queried with a joined RSVP-count aggregation in JS rather than a materialized view, since the volumes are small and counts change often.
- The Explore page shows upcoming public events by default with an "Include past" toggle — past events render with a clear "Ended" badge and the RSVP button is hidden.

## Sample CSV

See [`report/sample-rsvps.csv`](./report/sample-rsvps.csv) for an example of the RSVP export schema.
