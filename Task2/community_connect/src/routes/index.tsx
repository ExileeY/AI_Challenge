import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { EventCard, type EventCardData } from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Explore events — Communa" },
      { name: "description", content: "Browse upcoming free community events near you." },
      { property: "og:title", content: "Explore events — Communa" },
      { property: "og:description", content: "Browse upcoming free community events near you." },
    ],
  }),
  component: ExplorePage,
});

interface Row extends EventCardData { host_id: string }

function ExplorePage() {
  const [events, setEvents] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [includePast, setIncludePast] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: ev } = await supabase
        .from("events")
        .select("id, title, cover_image_url, start_at, end_at, location_type, venue_address, online_link, capacity, visibility, status, host_id, hosts(name)")
        .eq("status", "published").eq("visibility", "public").eq("hidden", false)
        .order("start_at", { ascending: true });
      const ids = (ev || []).map(e => e.id);
      const counts: Record<string, number> = {};
      if (ids.length) {
        const { data: rs } = await supabase.from("rsvps").select("event_id, status").in("event_id", ids).eq("status", "confirmed");
        rs?.forEach(r => { counts[r.event_id] = (counts[r.event_id] || 0) + 1; });
      }
      setEvents((ev || []).map((e: any) => ({ ...e, confirmed_count: counts[e.id] || 0 })));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter(e => {
      const ended = new Date(e.end_at).getTime() < now;
      if (!includePast && ended) return false;
      if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (location) {
        const loc = (e.venue_address || "").toLowerCase();
        if (e.location_type === "online" || !loc.includes(location.toLowerCase())) return false;
      }
      if (from && new Date(e.start_at) < new Date(from)) return false;
      if (to && new Date(e.start_at) > new Date(to)) return false;
      return true;
    });
  }, [events, q, location, includePast, from, to]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-accent/40 via-background to-background border-b">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Free community events
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl">Find your next gathering.</h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl">Browse and RSVP to events from local hosts. Get a digital ticket instantly.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/become-host"><Button size="lg">Host an event</Button></Link>
              <a href="#explore"><Button size="lg" variant="outline">Browse events</Button></a>
            </div>
          </div>
        </section>

        <section id="explore" className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-wrap gap-3 items-end mb-6">
            <div className="flex-1 min-w-48">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Event title…" className="pl-9" />
              </div>
            </div>
            <div className="w-40">
              <Label className="text-xs">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="City…" />
            </div>
            <div className="w-40">
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="w-40">
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch id="past" checked={includePast} onCheckedChange={setIncludePast} />
              <Label htmlFor="past" className="text-sm">Include past</Label>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border h-72 bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border rounded-2xl bg-card">
              <h3 className="font-semibold text-lg">No events match your filters</h3>
              <p className="text-muted-foreground text-sm mt-1">Try clearing filters or toggling "Include past".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          )}
        </section>
      </main>
      <footer className="border-t mt-10 py-8 text-center text-sm text-muted-foreground">
        Communa — built with Lovable.
      </footer>
    </div>
  );
}
