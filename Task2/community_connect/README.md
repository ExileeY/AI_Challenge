# Communa — Free Community Events

A lightweight platform for hosting and attending free community events. Hosts publish event pages, attendees RSVP and receive QR-code tickets, and checkers validate codes at the door.

**Live demo:** _add your published Lovable URL here after clicking Publish._

## Demo accounts

All demo accounts share the password **`demo1234`**.

| Role | Email |
|---|---|
| Host (Brooklyn Coffee Club) | `host@demo.com` |
| Attendee (confirmed + checked-in) | `alex@demo.com` |
| Attendee (confirmed) | `sam@demo.com` |
| Attendee (confirmed) | `jess@demo.com` |

Seeded:
- 1 upcoming published event ("Saturday Pour-Over Tasting", capacity 3 — already full, so further RSVPs go to waitlist)
- 1 past published event ("Latte Art Workshop") with feedback, an approved gallery photo, a pending photo, and an open report

## Main flows

### 1. Publish an event (Host)
1. Sign in as `host@demo.com`, or sign up and click **Become a host**.
2. Click **New event** in the dashboard.
3. Fill title, description, dates, location, capacity, cover image URL.
4. Toggle **Free** (Paid is shown but disabled — "Coming soon").
5. Click **Publish** (or **Save Draft** to keep it private).

### 2. RSVP to an event (Attendee)
1. Browse `/` and open an event.
2. Click **RSVP**. If signed out you'll be redirected to login and back.
3. If capacity is available you get a **Confirmed** ticket; otherwise a **Waitlist** spot.
4. Cancellations promote the first waitlisted attendee (FIFO).

### 3. View ticket
1. Open **Tickets** in the header.
2. Each confirmed RSVP shows a QR code, ticket code, and **Add to Calendar** (.ics download).

### 4. Check in attendees (Host / Checker)
1. From the dashboard, click the scan icon next to an event (or open `/events/:id/checkin`).
2. Type the attendee's ticket code and press **Check in**.
3. Live counters update (Going / Waitlist / Checked in / Remaining).
4. Duplicate codes are rejected. Invalid codes show an error. Use **Undo** to revert the last check-in.

## CSV export

From the host dashboard, **RSVPs** and **Attend** buttons download CSVs with columns:
`name, email, rsvp_status, check_in_time`. A sample is included at `report/sample-rsvps.csv`.

## Run locally

```bash
bun install
bun dev
```

The app uses Lovable Cloud (managed Postgres + Auth) — credentials are auto-provisioned in `.env`.

## Seeding demo data

Demo data was seeded via the project's database tooling when the app was built. To re-seed in another environment, re-run the SQL block in `supabase/migrations/` plus the seed insert in `report.md`.

## Tech stack

- TanStack Start v1 (React 19, file-based routing)
- Tailwind CSS v4 + shadcn/ui
- Lovable Cloud (Postgres + Auth + Row-Level Security)
- QR codes via `api.qrserver.com`; calendar files generated client-side as `.ics`
