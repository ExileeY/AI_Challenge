import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { fmtDate, isPast, downloadCsv } from "@/lib/event-utils";
import { toast } from "sonner";
import { Plus, Edit, Copy, Eye, EyeOff, Download, ScanLine, Image, Flag } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

interface HostRow { id: string; name: string }
interface EventStat {
  id: string; title: string; start_at: string; end_at: string; status: string; visibility: string; capacity: number; host_id: string;
  going: number; waitlist: number; checkedIn: number;
}

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [events, setEvents] = useState<EventStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingPhotos, setPendingPhotos] = useState<{ id: string; image_url: string; event_id: string }[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: owned }, { data: memberHosts }] = await Promise.all([
      supabase.from("hosts").select("id,name").eq("owner_user_id", user.id),
      supabase.from("host_members").select("host_id, hosts(id,name)")
        .eq("user_id", user.id).eq("role", "host"),
    ]);
    const map = new Map<string, HostRow>();
    owned?.forEach(h => map.set(h.id, h));
    memberHosts?.forEach((m: any) => { if (m.hosts && !map.has(m.host_id)) map.set(m.host_id, { id: m.host_id, name: m.hosts.name }); });
    const hs = Array.from(map.values());
    setHosts(hs);
    const hostIds = hs.map(h => h.id);
    if (!hostIds.length) { setLoading(false); return; }
    const { data: ev } = await supabase.from("events").select("*").in("host_id", hostIds).order("start_at", { ascending: false });
    const evIds = (ev || []).map(e => e.id);
    const stats: Record<string, { going: number; waitlist: number; checkedIn: number }> = {};
    if (evIds.length) {
      const { data: rs } = await supabase.from("rsvps").select("event_id,status,id").in("event_id", evIds);
      const rsvpIds: string[] = [];
      rs?.forEach(r => {
        stats[r.event_id] ||= { going: 0, waitlist: 0, checkedIn: 0 };
        if (r.status === "confirmed") stats[r.event_id].going++;
        if (r.status === "waitlisted") stats[r.event_id].waitlist++;
        rsvpIds.push(r.id);
      });
      if (rsvpIds.length) {
        const { data: ts } = await supabase.from("tickets").select("rsvp_id,checked_in_at").in("rsvp_id", rsvpIds).not("checked_in_at", "is", null);
        const rsvpMap = new Map(rs!.map(r => [r.id, r.event_id]));
        ts?.forEach(t => { const eid = rsvpMap.get(t.rsvp_id); if (eid) stats[eid].checkedIn++; });
      }
    }
    setEvents((ev || []).map((e: any) => ({ ...e, ...(stats[e.id] || { going: 0, waitlist: 0, checkedIn: 0 }) })));

    const { data: ph } = await supabase.from("gallery_photos").select("id,image_url,event_id").in("event_id", evIds).eq("status", "pending");
    setPendingPhotos(ph || []);
    const { data: rp } = await supabase.from("reports").select("*").eq("status", "open");
    setReports(rp || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/dashboard" } });
    else load();
  }, [authLoading, user, navigate, load]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverHost, setDragOverHost] = useState<string | null>(null);

  const moveEventToHost = async (eventId: string, targetHostId: string) => {
    const ev = events.find(e => e.id === eventId);
    if (!ev || ev.host_id === targetHostId) return;
    // optimistic update
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, host_id: targetHostId } : e));
    const { error } = await supabase.from("events").update({ host_id: targetHostId }).eq("id", eventId);
    if (error) {
      toast.error(error.message);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, host_id: ev.host_id } : e));
    } else {
      toast.success("Event moved");
    }
  };

  const togglePublish = async (id: string, status: string) => {
    const next = status === "published" ? "draft" : "published";
    const { error } = await supabase.from("events").update({ status: next }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(next === "published" ? "Published" : "Unpublished"); load(); }
  };

  const duplicate = async (id: string) => {
    const { data: e } = await supabase.from("events").select("*").eq("id", id).single();
    if (!e) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _c, ...rest } = e as any;
    const { error } = await supabase.from("events").insert({ ...rest, title: rest.title + " (copy)", status: "draft" });
    if (error) toast.error(error.message); else { toast.success("Duplicated"); load(); }
  };

  const exportRsvps = async (eventId: string, title: string) => {
    const { data: rs } = await supabase.from("rsvps").select("id,status,created_at,user_id").eq("event_id", eventId);
    if (!rs?.length) { downloadCsv(`${title}-rsvps.csv`, []); return; }
    const userIds = rs.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id,name,email").in("id", userIds);
    const pmap = new Map(profiles?.map(p => [p.id, p]));
    const { data: tickets } = await supabase.from("tickets").select("rsvp_id,checked_in_at").in("rsvp_id", rs.map(r => r.id));
    const tmap = new Map(tickets?.map(t => [t.rsvp_id, t]));
    const rows = rs.map(r => {
      const p = pmap.get(r.user_id);
      const t = tmap.get(r.id);
      return {
        name: p?.name || "",
        email: p?.email || "",
        rsvp_status: r.status,
        check_in_time: t?.checked_in_at || "",
      };
    });
    downloadCsv(`${title}-rsvps.csv`, rows);
  };

  const exportAttendance = async (eventId: string, title: string) => {
    const { data: rs } = await supabase.from("rsvps").select("id,status,user_id").eq("event_id", eventId).eq("status", "confirmed");
    if (!rs?.length) { downloadCsv(`${title}-attendance.csv`, []); return; }
    const userIds = rs.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id,name,email").in("id", userIds);
    const pmap = new Map(profiles?.map(p => [p.id, p]));
    const { data: tickets } = await supabase.from("tickets").select("rsvp_id,checked_in_at").in("rsvp_id", rs.map(r => r.id));
    const tmap = new Map(tickets?.map(t => [t.rsvp_id, t]));
    const rows = rs.map(r => {
      const p = pmap.get(r.user_id); const t = tmap.get(r.id);
      return { name: p?.name || "", email: p?.email || "", rsvp_status: r.status, check_in_time: t?.checked_in_at || "" };
    });
    downloadCsv(`${title}-attendance.csv`, rows);
  };

  const moderatePhoto = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("gallery_photos").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(status); load(); }
  };

  const handleReport = async (r: any, hide: boolean) => {
    if (hide) {
      if (r.reportable_type === "event") await supabase.from("events").update({ hidden: true }).eq("id", r.reportable_id);
      else await supabase.from("gallery_photos").update({ hidden: true }).eq("id", r.reportable_id);
    }
    await supabase.from("reports").update({ status: "reviewed" }).eq("id", r.id);
    toast.success("Updated"); load();
  };

  if (authLoading || loading) return <div><Header /><div className="p-8 max-w-6xl mx-auto">Loading…</div></div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Host Dashboard</h1>
            <p className="text-muted-foreground">Manage your host profiles and their events.</p>
          </div>
          {hosts.length === 0 ? (
            <Link to="/become-host"><Button>Become a host</Button></Link>
          ) : (
            <Link to="/become-host"><Button variant="outline"><Plus className="h-4 w-4 mr-1" />New host</Button></Link>
          )}
        </div>

        {hosts.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <p className="text-muted-foreground">You're not a host yet. Create your host profile to start publishing events.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {hosts.map(host => {
              const hostEvents = events.filter(e => e.host_id === host.id);
              return (
                <section
                  key={host.id}
                  onDragOver={(e) => { if (dragId) { e.preventDefault(); setDragOverHost(host.id); } }}
                  onDragLeave={() => setDragOverHost(prev => prev === host.id ? null : prev)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) moveEventToHost(dragId, host.id);
                    setDragId(null); setDragOverHost(null);
                  }}
                  className={dragOverHost === host.id ? "rounded-2xl ring-2 ring-primary/50 ring-offset-2 ring-offset-background transition" : "transition"}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Link to="/hosts/$id" params={{ id: host.id }} className="text-xl font-semibold hover:text-primary">{host.name}</Link>
                      <div className="text-xs text-muted-foreground">{hostEvents.length} event{hostEvents.length === 1 ? "" : "s"} · drag events to move them</div>
                    </div>
                    <Link to="/events/new" search={{ hostId: host.id }}>
                      <Button size="sm"><Plus className="h-4 w-4 mr-1" />New event</Button>
                    </Link>
                  </div>
                  <div className="min-h-[60px]">
                    {hostEvents.length === 0 ? (
                      <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
                        {dragId ? "Drop here to move event" : "No events yet for this host."}
                      </div>
                    ) : (() => {
                      const upcoming = hostEvents.filter(e => !isPast(e.end_at)).sort((a,b) => +new Date(a.start_at) - +new Date(b.start_at));
                      const past = hostEvents.filter(e => isPast(e.end_at)).sort((a,b) => +new Date(b.start_at) - +new Date(a.start_at));
                      const renderEvent = (ev: EventStat) => {
                        const ended = isPast(ev.end_at);
                        return (
                          <div
                            key={ev.id}
                            draggable
                            onDragStart={(e) => { setDragId(ev.id); e.dataTransfer.effectAllowed = "move"; }}
                            onDragEnd={() => { setDragId(null); setDragOverHost(null); }}
                            className={`rounded-2xl border bg-card p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 cursor-move ${dragId === ev.id ? "opacity-50" : ""}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge variant={ev.status === "published" ? "default" : "secondary"}>{ev.status}</Badge>
                                <Badge variant="outline">{ev.visibility}</Badge>
                                {ended && <Badge variant="secondary">Ended</Badge>}
                              </div>
                              <Link to="/events/$id" params={{ id: ev.id }} className="font-semibold hover:text-primary block truncate">{ev.title}</Link>
                              <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(ev.start_at)}</div>
                              <div className="flex gap-4 text-sm mt-2">
                                <span><span className="font-semibold">{ev.going}</span> <span className="text-muted-foreground">going</span></span>
                                <span><span className="font-semibold">{ev.waitlist}</span> <span className="text-muted-foreground">waitlist</span></span>
                                <span><span className="font-semibold">{ev.checkedIn}</span> <span className="text-muted-foreground">checked in</span></span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Link to="/events/$id/edit" params={{ id: ev.id }}><Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /></Button></Link>
                              <Button size="sm" variant="outline" onClick={() => togglePublish(ev.id, ev.status)}>
                                {ev.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => duplicate(ev.id)}><Copy className="h-3.5 w-3.5" /></Button>
                              <Link to="/events/$id/checkin" params={{ id: ev.id }}><Button size="sm" variant="outline"><ScanLine className="h-3.5 w-3.5" /></Button></Link>
                              <Button size="sm" variant="outline" onClick={() => exportRsvps(ev.id, ev.title)}><Download className="h-3.5 w-3.5 mr-1" />RSVPs</Button>
                              <Button size="sm" variant="outline" onClick={() => exportAttendance(ev.id, ev.title)}><Download className="h-3.5 w-3.5 mr-1" />Attend</Button>
                            </div>
                          </div>
                        );
                      };
                      return (
                        <Tabs defaultValue="upcoming" className="w-full">
                          <TabsList>
                            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
                            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
                          </TabsList>
                          <TabsContent value="upcoming" className="space-y-3 mt-3">
                            {upcoming.length === 0
                              ? <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">No upcoming events.</div>
                              : upcoming.map(renderEvent)}
                          </TabsContent>
                          <TabsContent value="past" className="space-y-3 mt-3">
                            {past.length === 0
                              ? <div className="rounded-2xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">No past events.</div>
                              : past.map(renderEvent)}
                          </TabsContent>
                        </Tabs>
                      );
                    })()}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Pending photos */}
        {pendingPhotos.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3 inline-flex items-center gap-2"><Image className="h-5 w-5" />Pending photo approvals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pendingPhotos.map(p => (
                <div key={p.id} className="rounded-lg border overflow-hidden bg-card">
                  <img src={p.image_url} alt="" className="aspect-square object-cover w-full" />
                  <div className="p-2 flex gap-1">
                    <Button size="sm" className="flex-1" onClick={() => moderatePhoto(p.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => moderatePhoto(p.id, "rejected")}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reports */}
        {reports.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3 inline-flex items-center gap-2"><Flag className="h-5 w-5" />Open reports</h2>
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="rounded-lg border bg-card p-3 flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{r.reportable_type} report</div>
                    <div className="text-muted-foreground">{r.reason || "(no reason)"}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleReport(r, true)}>Hide & resolve</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReport(r, false)}>Mark reviewed</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
