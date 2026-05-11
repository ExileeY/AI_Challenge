import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Undo2, Radio } from "lucide-react";

export const Route = createFileRoute("/events_/$id/checkin")({ component: CheckIn });

interface RecentItem { ticketId: string; name: string; at: string }

function CheckIn() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [code, setCode] = useState("");
  const [going, setGoing] = useState(0);
  const [waitlist, setWaitlist] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [lastTicketId, setLastTicketId] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const rsvpIdsRef = useRef<Set<string>>(new Set());
  const lastTicketKey = `checkin:lastTicket:${id}`;

  const refreshCounts = useCallback(async () => {
    const { data: rs } = await supabase.from("rsvps").select("id,status").eq("event_id", id);
    setGoing(rs?.filter(r => r.status === "confirmed").length || 0);
    setWaitlist(rs?.filter(r => r.status === "waitlisted").length || 0);
    const ids = rs?.map(r => r.id) || [];
    rsvpIdsRef.current = new Set(ids);
    if (ids.length) {
      const { count } = await supabase.from("tickets").select("id", { count: "exact", head: true })
        .in("rsvp_id", ids).not("checked_in_at", "is", null);
      setCheckedIn(count || 0);
    } else {
      setCheckedIn(0);
    }
  }, [id]);

  const refreshRecent = useCallback(async () => {
    const { data: rs } = await supabase.from("rsvps").select("id,user_id").eq("event_id", id);
    const ids = rs?.map(r => r.id) || [];
    if (!ids.length) { setRecent([]); return; }
    const { data: ts } = await supabase.from("tickets")
      .select("id,rsvp_id,checked_in_at")
      .in("rsvp_id", ids)
      .not("checked_in_at", "is", null)
      .order("checked_in_at", { ascending: false })
      .limit(10);
    if (!ts?.length) { setRecent([]); return; }
    const userIds = ts.map(t => rs!.find(r => r.id === t.rsvp_id)?.user_id).filter(Boolean) as string[];
    const { data: profs } = await supabase.from("profiles").select("id,name").in("id", userIds);
    const pmap = new Map(profs?.map(p => [p.id, p.name]));
    const rmap = new Map(rs!.map(r => [r.id, r.user_id]));
    setRecent(ts.map(t => ({
      ticketId: t.id,
      name: pmap.get(rmap.get(t.rsvp_id) || "") || "—",
      at: t.checked_in_at!,
    })));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: e } = await supabase.from("events").select("*").eq("id", id).single();
      if (!e || cancelled) return;
      const { data: h } = await supabase.from("hosts").select("owner_user_id").eq("id", e.host_id).maybeSingle();
      let ok = h?.owner_user_id === user.id;
      if (!ok) {
        const { data: m } = await supabase.from("host_members").select("id").eq("host_id", e.host_id).eq("user_id", user.id).maybeSingle();
        ok = !!m;
      }
      if (!ok) { toast.error("Not authorized"); return; }
      setEvent(e);
      await refreshCounts();
      await refreshRecent();
      // Restore last ticket id from session
      const saved = sessionStorage.getItem(lastTicketKey);
      if (saved) setLastTicketId(saved);
    })();
    return () => { cancelled = true; };
  }, [id, refreshCounts, refreshRecent, user, lastTicketKey]);

  // Realtime subscriptions
  useEffect(() => {
    if (!event) return;
    const ch = supabase
      .channel(`checkin-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps", filter: `event_id=eq.${id}` }, () => {
        refreshCounts();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tickets" }, (payload: any) => {
        const rsvpId = payload.new?.rsvp_id;
        if (!rsvpId || !rsvpIdsRef.current.has(rsvpId)) return;
        refreshCounts();
        refreshRecent();
      })
      .subscribe((status) => {
        setLiveConnected(status === "SUBSCRIBED");
      });
    return () => { supabase.removeChannel(ch); };
  }, [event, id, refreshCounts, refreshRecent]);

  const persistLastTicket = (tid: string | null) => {
    setLastTicketId(tid);
    if (tid) sessionStorage.setItem(lastTicketKey, tid);
    else sessionStorage.removeItem(lastTicketKey);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const { data, error } = await supabase.rpc("check_in_ticket", { _event_id: id, _code: code.trim() });
    if (error) { toast.error(error.message); return; }
    const row = Array.isArray(data) ? data[0] : data;
    if (row.status === "ok") {
      toast.success(`Checked in: ${row.attendee_name || "—"}`, { icon: <CheckCircle2 className="h-4 w-4" /> });
      persistLastTicket(row.ticket_id);
      refreshCounts();
      refreshRecent();
    } else if (row.status === "already") {
      toast.warning(row.message);
    } else if (row.status === "invalid") {
      toast.error(row.message, { icon: <XCircle className="h-4 w-4" /> });
    } else {
      toast.error(row.message);
    }
    setCode("");
  };

  const undo = async () => {
    if (!lastTicketId) return;
    const { error } = await supabase.rpc("undo_check_in", { _ticket_id: lastTicketId });
    if (error) toast.error(error.message);
    else {
      toast.success("Last check-in undone", { icon: <Undo2 className="h-4 w-4" /> });
      persistLastTicket(null);
      refreshCounts();
      refreshRecent();
    }
  };

  if (!user) return <div><Header /><div className="p-8 max-w-md mx-auto text-center">Sign in required.</div></div>;
  if (!event) return <div><Header /><div className="p-8">Loading…</div></div>;
  const remaining = going - checkedIn;

  return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <Link to="/events/$id" params={{ id }} className="text-sm text-muted-foreground hover:text-primary">← {event.title}</Link>
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-3xl font-bold">Check-in</h1>
          <Badge variant={liveConnected ? "default" : "secondary"} className="gap-1">
            <Radio className={`h-3 w-3 ${liveConnected ? "animate-pulse" : ""}`} />
            {liveConnected ? "Live" : "Offline"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <Stat label="Going" value={going} />
          <Stat label="Waitlist" value={waitlist} />
          <Stat label="Checked in" value={checkedIn} highlight />
          <Stat label="Remaining" value={remaining} />
        </div>

        <form onSubmit={submit} className="mt-8 flex gap-2">
          <Input autoFocus className="font-mono text-lg uppercase" placeholder="Ticket code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
          <Button type="submit">Check in</Button>
          {lastTicketId && <Button type="button" variant="outline" onClick={undo}><Undo2 className="h-4 w-4 mr-1" />Undo</Button>}
        </form>

        <section className="mt-8">
          <h2 className="font-semibold mb-2">Recent check-ins</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.ticketId} className="rounded-lg border p-3 flex items-center justify-between bg-card">
                  <span className="font-medium">{r.name}</span>
                  <Badge variant="secondary">{new Date(r.at).toLocaleTimeString()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className="mt-6 text-xs text-muted-foreground inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Manual code entry only — no camera scanning required.</p>
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-primary/10 border-primary/30" : "bg-card"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
