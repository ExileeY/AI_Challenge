import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fmtDate, isPast } from "@/lib/event-utils";

export const Route = createFileRoute("/my-events")({ component: MyEvents });

function MyEvents() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<{ ev: any; role: string; hostId: string; hostName: string }[]>([]);
  const [q, setQ] = useState("");
  const [hostFilter, setHostFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [when, setWhen] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/my-events" } });
    if (!user) return;
    (async () => {
      const { data: ownedHosts } = await supabase.from("hosts").select("id,name").eq("owner_user_id", user.id);
      const { data: memberRows } = await supabase.from("host_members").select("host_id,role,hosts(name)").eq("user_id", user.id);
      const map = new Map<string, { name: string; role: string }>();
      ownedHosts?.forEach(h => map.set(h.id, { name: h.name, role: "host" }));
      memberRows?.forEach((m: any) => { if (!map.has(m.host_id)) map.set(m.host_id, { name: m.hosts?.name || "", role: m.role }); });
      const hostIds = Array.from(map.keys());
      if (!hostIds.length) { setRows([]); return; }
      const { data: ev } = await supabase.from("events").select("*").in("host_id", hostIds).order("start_at", { ascending: false });
      setRows((ev || []).map(e => ({ ev: e, role: map.get(e.host_id)!.role, hostId: e.host_id, hostName: map.get(e.host_id)!.name })));
    })();
  }, [user, authLoading, navigate]);

  const hostOptions = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach(r => m.set(r.hostId, r.hostName));
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (q && !r.ev.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (hostFilter !== "all" && r.hostId !== hostFilter) return false;
    const start = new Date(r.ev.start_at).getTime();
    if (from && start < new Date(from).getTime()) return false;
    if (to && start > new Date(to).getTime() + 86400000) return false;
    if (when === "upcoming" && isPast(r.ev.end_at)) return false;
    if (when === "past" && !isPast(r.ev.end_at)) return false;
    return true;
  }), [rows, q, hostFilter, from, to, when]);

  const clearFilters = () => { setQ(""); setHostFilter("all"); setFrom(""); setTo(""); setWhen("upcoming"); };

  return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-2">My Events</h1>
        <p className="text-muted-foreground">Events where you have a host or checker role.</p>

        <div className="mt-6 rounded-xl border bg-card p-4 grid gap-3 md:grid-cols-[1fr_200px_160px_160px_auto]">
          <div>
            <Label className="text-xs">Search</Label>
            <Input placeholder="Search events…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Host</Label>
            <Select value={hostFilter} onValueChange={setHostFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hosts</SelectItem>
                {hostOptions.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </div>

        <div className="mt-4">
          <Tabs value={when} onValueChange={(v) => setWhen(v as "upcoming" | "past" | "all")}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-6 space-y-2">
          {filtered.length === 0 && <div className="text-muted-foreground">No events match your filters.</div>}
          {filtered.map(({ ev, role, hostName }) => (
            <div key={ev.id} className="rounded-xl border bg-card p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 mb-1">
                  <Badge variant="outline">{role}</Badge>
                  {isPast(ev.end_at) && <Badge variant="secondary">Ended</Badge>}
                  <Badge variant={ev.status === "published" ? "default" : "secondary"}>{ev.status}</Badge>
                </div>
                <Link to="/events/$id" params={{ id: ev.id }} className="font-medium hover:text-primary">{ev.title}</Link>
                <div className="text-xs text-muted-foreground">{hostName} · {fmtDate(ev.start_at)}</div>
              </div>
              <div className="flex gap-2">
                <Link to="/events/$id/checkin" params={{ id: ev.id }}><Button size="sm" variant="outline">Check-in</Button></Link>
                {role === "host" && (
                  <Link to="/events/$id/edit" params={{ id: ev.id }}><Button size="sm" variant="outline">Edit</Button></Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
