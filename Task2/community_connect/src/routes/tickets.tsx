import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { fmtDate, qrUrl, downloadIcs, isPast } from "@/lib/event-utils";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";

export const Route = createFileRoute("/tickets")({ component: TicketsPage });

function TicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rs } = await supabase.from("rsvps").select("id,status,event_id, events(*)")
      .eq("user_id", user.id).in("status", ["confirmed", "waitlisted"]);
    const upcoming = (rs || []).filter((r: any) => !isPast(r.events.end_at));
    const ids = upcoming.map((r: any) => r.id);
    let tmap = new Map<string, string>();
    if (ids.length) {
      const { data: ts } = await supabase.from("tickets").select("rsvp_id,ticket_code").in("rsvp_id", ids);
      tmap = new Map(ts?.map(t => [t.rsvp_id, t.ticket_code]));
    }
    setTickets(upcoming.map((r: any) => ({ ...r, code: tmap.get(r.id) })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/tickets" } });
    else load();
  }, [user, authLoading, navigate, load]);

  const cancel = async (rsvpId: string) => {
    const { error } = await supabase.rpc("cancel_rsvp", { _rsvp_id: rsvpId });
    if (error) toast.error(error.message); else { toast.success("Cancelled"); load(); }
  };

  if (loading) return <div><Header /><div className="p-8">Loading…</div></div>;

  return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-6">My Tickets</h1>
        {tickets.length === 0 ? (
          <div className="border rounded-2xl p-10 text-center text-muted-foreground">No upcoming tickets. <Link to="/" className="text-primary">Browse events</Link></div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="rounded-2xl border bg-card p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start">
                {t.code && t.status === "confirmed" && (
                  <img src={qrUrl(t.code, 130)} alt="QR" className="rounded-md border" />
                )}
                <div className="flex-1 min-w-0">
                  <Badge variant={t.status === "confirmed" ? "default" : "secondary"}>{t.status === "confirmed" ? "Confirmed" : "Waitlisted"}</Badge>
                  <Link to="/events/$id" params={{ id: t.event_id }} className="block font-semibold text-lg mt-1 hover:text-primary">{t.events.title}</Link>
                  <div className="text-sm text-muted-foreground">{fmtDate(t.events.start_at)}</div>
                  <div className="text-sm text-muted-foreground">{t.events.location_type === "online" ? "Online" : t.events.venue_address}</div>
                  {t.code && <div className="font-mono text-sm mt-2">Code: <span className="font-bold">{t.code}</span></div>}
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {t.status === "confirmed" && <Button size="sm" variant="outline" onClick={() => downloadIcs(t.events)}><CalendarPlus className="h-3.5 w-3.5 mr-1" />Add to Calendar</Button>}
                    <Button size="sm" variant="ghost" onClick={() => cancel(t.id)}>Cancel RSVP</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
