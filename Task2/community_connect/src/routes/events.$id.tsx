import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { fmtDate, isPast, qrUrl, downloadIcs } from "@/lib/event-utils";
import { Calendar, MapPin, Globe, Users, Flag, CalendarPlus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$id")({
  component: EventDetails,
});

interface EventRow {
  id: string; title: string; description: string | null;
  start_at: string; end_at: string; timezone: string;
  location_type: "physical" | "online"; venue_address: string | null; online_link: string | null;
  capacity: number; cover_image_url: string | null;
  visibility: "public" | "unlisted"; status: string; hidden: boolean;
  host_id: string; hosts: { id: string; name: string; logo_url: string | null; bio: string | null; owner_user_id: string } | null;
}

function EventDetails() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ev, setEv] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(0);
  const [myRsvp, setMyRsvp] = useState<{ id: string; status: string; ticket_code?: string } | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [photos, setPhotos] = useState<{ id: string; image_url: string }[]>([]);
  const [feedback, setFeedback] = useState<{ rating: number; comment: string | null }[]>([]);
  const [myFeedback, setMyFeedback] = useState<{ rating: number; comment: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: e } = await supabase.from("events").select("*, hosts(id,name,logo_url,bio,owner_user_id)").eq("id", id).maybeSingle();
    setEv(e as any);
    if (user && e) {
      const evRow = e as any;
      if (evRow.hosts?.owner_user_id === user.id) {
        setIsHost(true);
      } else {
        const { data: hm } = await supabase.from("host_members").select("id").eq("host_id", evRow.host_id).eq("user_id", user.id).maybeSingle();
        setIsHost(!!hm);
      }
    } else {
      setIsHost(false);
    }
    const { count } = await supabase.from("rsvps").select("id", { count: "exact", head: true })
      .eq("event_id", id).eq("status", "confirmed");
    setConfirmed(count || 0);
    if (user) {
      const { data: r } = await supabase.from("rsvps").select("id,status").eq("event_id", id).eq("user_id", user.id)
        .in("status", ["confirmed", "waitlisted"]).maybeSingle();
      if (r) {
        const { data: t } = await supabase.from("tickets").select("ticket_code").eq("rsvp_id", r.id).maybeSingle();
        setMyRsvp({ id: r.id, status: r.status, ticket_code: t?.ticket_code });
      } else setMyRsvp(null);
    }
    const { data: ph } = await supabase.from("gallery_photos").select("id,image_url").eq("event_id", id).eq("status", "approved").eq("hidden", false);
    setPhotos(ph || []);
    const { data: fb } = await supabase.from("feedback").select("rating,comment,user_id").eq("event_id", id);
    setFeedback((fb || []).map((f: any) => ({ rating: f.rating, comment: f.comment })));
    if (user) {
      const mine = (fb || []).find((f: any) => f.user_id === user.id);
      setMyFeedback(mine ? { rating: mine.rating, comment: mine.comment } : null);
    } else setMyFeedback(null);
    setLoading(false);
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const rsvp = async () => {
    if (!user) { navigate({ to: "/login", search: { redirect: `/events/${id}` } }); return; }
    setRsvpBusy(true);
    const { data, error } = await supabase.rpc("create_rsvp", { _event_id: id });
    setRsvpBusy(false);
    if (error) { toast.error(error.message); return; }
    const row = Array.isArray(data) ? data[0] : data;
    toast.success(row.status === "confirmed" ? "You're going!" : "Added to waitlist");
    load();
  };

  const cancel = async () => {
    if (!myRsvp) return;
    setRsvpBusy(true);
    const { error } = await supabase.rpc("cancel_rsvp", { _rsvp_id: myRsvp.id });
    setRsvpBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("RSVP cancelled");
    load();
  };

  const report = async () => {
    if (!user) { toast.error("Sign in to report"); return; }
    const reason = prompt("Reason for reporting?");
    if (!reason) return;
    const { error } = await supabase.from("reports").insert({ reporter_user_id: user.id, reportable_type: "event", reportable_id: id, reason });
    if (error) toast.error(error.message); else toast.success("Reported. Thanks.");
  };

  const submitFeedback = async () => {
    if (!user) return;
    const { error } = await supabase.from("feedback").insert({ event_id: id, user_id: user.id, rating, comment });
    if (error) toast.error(error.message); else { toast.success("Feedback submitted"); setComment(""); load(); }
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Image files only"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-gallery").upload(path, file, { contentType: file.type });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from("event-gallery").getPublicUrl(path);
    const { error } = await supabase.from("gallery_photos").insert({ event_id: id, user_id: user.id, image_url: pub.publicUrl });
    setUploading(false);
    if (error) toast.error(error.message); else toast.success("Photo submitted for approval");
  };

  const reportPhoto = async (photoId: string) => {
    if (!user) { toast.error("Sign in to report"); return; }
    const reason = prompt("Reason for reporting this photo?");
    if (!reason) return;
    const { error } = await supabase.from("reports").insert({ reporter_user_id: user.id, reportable_type: "photo", reportable_id: photoId, reason });
    if (error) toast.error(error.message); else toast.success("Reported. Thanks.");
  };

  if (loading) return (<div><Header /><div className="max-w-4xl mx-auto p-8">Loading…</div></div>);
  if (!ev) return (<div><Header /><div className="max-w-4xl mx-auto p-8">Event not found.</div></div>);

  const ended = isPast(ev.end_at);
  const full = confirmed >= ev.capacity;
  const avgRating = feedback.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-2xl overflow-hidden border bg-card">
            <div className="aspect-[2.4/1] bg-gradient-to-br from-accent to-secondary">
              {ev.cover_image_url && <img src={ev.cover_image_url} alt={ev.title} className="w-full h-full object-cover" />}
            </div>
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {ended && <Badge variant="secondary">Ended</Badge>}
                {!ended && full && <Badge variant="secondary">Waitlist</Badge>}
                {ev.visibility === "unlisted" && <Badge variant="outline">Unlisted</Badge>}
                <Badge variant="outline">Free</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{ev.title}</h1>
              {ev.hosts && (
                <Link to="/hosts/$id" params={{ id: ev.hosts.id }} className="inline-flex items-center gap-2 mt-2 text-muted-foreground hover:text-primary">
                  <span>by {ev.hosts.name}</span>
                </Link>
              )}

              <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm">
                <div className="flex items-start gap-3"><Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div><div className="font-medium">{fmtDate(ev.start_at)}</div><div className="text-muted-foreground">to {fmtDate(ev.end_at)} ({ev.timezone})</div></div>
                </div>
                <div className="flex items-start gap-3">
                  {ev.location_type === "online" ? <Globe className="h-5 w-5 text-primary mt-0.5" /> : <MapPin className="h-5 w-5 text-primary mt-0.5" />}
                  <div>
                    <div className="font-medium">{ev.location_type === "online" ? "Online" : "In person"}</div>
                    <div className="text-muted-foreground">{ev.location_type === "online" ? (myRsvp?.status === "confirmed" ? ev.online_link : "Link revealed after RSVP") : ev.venue_address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3"><Users className="h-5 w-5 text-primary mt-0.5" />
                  <div><div className="font-medium">{confirmed} / {ev.capacity} going</div><div className="text-muted-foreground">{full ? "Capacity reached — waitlist open" : `${ev.capacity - confirmed} spots left`}</div></div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {isHost && (
                  <Badge variant="secondary" className="text-sm py-1.5 px-3">You're hosting this event</Badge>
                )}
                {!ended && !myRsvp && !isHost && (
                  <Button size="lg" onClick={rsvp} disabled={rsvpBusy}>{full ? "Join waitlist" : "RSVP"}</Button>
                )}
                {!ended && myRsvp && !isHost && (
                  <>
                    <Badge className="text-sm py-1.5 px-3">{myRsvp.status === "confirmed" ? "✓ You're going" : "On waitlist"}</Badge>
                    <Button variant="outline" onClick={cancel} disabled={rsvpBusy}>Cancel RSVP</Button>
                    {myRsvp.status === "confirmed" && (
                      <Button variant="outline" onClick={() => downloadIcs(ev as any)}><CalendarPlus className="h-4 w-4 mr-1" />Add to Calendar</Button>
                    )}
                  </>
                )}
                {!isHost && <Button variant="ghost" size="sm" onClick={report}><Flag className="h-4 w-4 mr-1" />Report</Button>}
              </div>

              {myRsvp?.status === "confirmed" && myRsvp.ticket_code && (
                <div className="mt-6 p-4 rounded-xl bg-accent/40 flex items-center gap-4">
                  <img src={qrUrl(myRsvp.ticket_code, 100)} alt="QR" className="rounded" />
                  <div><div className="text-xs text-muted-foreground">Your ticket code</div><div className="font-mono text-lg font-semibold">{myRsvp.ticket_code}</div></div>
                </div>
              )}

              {ev.description && (
                <div className="mt-8 prose prose-sm max-w-none whitespace-pre-wrap">{ev.description}</div>
              )}
            </div>
          </div>

          {/* Gallery */}
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Gallery</h2>
            {photos.length === 0 ? (
              <p className="text-muted-foreground text-sm">No approved photos yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photos.map(p => (
                  <div key={p.id} className="relative group">
                    <img src={p.image_url} alt="" className="aspect-square object-cover rounded-lg border w-full" />
                    {user && (
                      <button
                        type="button"
                        onClick={() => reportPhoto(p.id)}
                        title="Report photo"
                        className="absolute top-1 right-1 p-1.5 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition hover:bg-background"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {user && (
              <div className="mt-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { uploadPhoto(f); e.target.value = ""; } }}
                    className="block text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-1">{uploading ? "Uploading…" : "Photos require host approval before appearing publicly. Max 5MB."}</p>
              </div>
            )}
          </section>

          {/* Feedback */}
          {ended && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold mb-4">Feedback {avgRating && <span className="text-muted-foreground text-sm">— {avgRating}★ ({feedback.length})</span>}</h2>
              <div className="space-y-2">
                {feedback.map((f, i) => (
                  <div key={i} className="rounded-lg border p-3 text-sm">
                    <div className="font-medium">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</div>
                    {f.comment && <div className="text-muted-foreground mt-1">{f.comment}</div>}
                  </div>
                ))}
              </div>
              {user && myFeedback ? (
                <div className="mt-4 p-4 rounded-xl border bg-accent/30 text-sm">
                  <div className="font-medium">Your feedback</div>
                  <div className="mt-1">{"★".repeat(myFeedback.rating)}{"☆".repeat(5 - myFeedback.rating)}</div>
                  {myFeedback.comment && <div className="text-muted-foreground mt-1">{myFeedback.comment}</div>}
                </div>
              ) : user && myRsvp?.status === "confirmed" ? (
                <div className="mt-4 p-4 rounded-xl border space-y-3">
                  <div className="font-medium">Leave feedback</div>
                  <div className="flex gap-1">{[1, 2, 3, 4, 5].map(n =>
                    <button key={n} onClick={() => setRating(n)} className="text-2xl">{n <= rating ? "★" : "☆"}</button>)}
                  </div>
                  <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional comment" />
                  <Button onClick={submitFeedback}>Submit</Button>
                </div>
              ) : user && myRsvp ? (
                <p className="text-sm text-muted-foreground mt-4">Feedback is open to confirmed attendees.</p>
              ) : null}
            </section>
          )}

          {ev.status !== "published" && (
            <div className="mt-6 p-4 rounded-xl bg-warning/20 text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Draft preview — not yet visible to the public.</div>
          )}
        </div>
      </main>
    </div>
  );
}
