import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { fmtDate } from "@/lib/event-utils";
import { Plus, Edit, Copy, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hosts/$id")({
  head: () => ({
    meta: [
      { title: "Host — Communa" },
      { property: "og:title", content: "Host on Communa" },
      { property: "og:description", content: "Public host profile and upcoming events." },
    ],
  }),
  component: HostPage,
});

interface MemberRow {
  id: string;
  user_id: string | null;
  role: "host" | "checker";
  invite_token: string | null;
  invite_email: string | null;
  profiles: { name: string | null; email: string | null } | null;
}

function HostPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [host, setHost] = useState<any>(null);
  const [publicEvents, setPublicEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isMemberHost, setIsMemberHost] = useState(false);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [inviteRole, setInviteRole] = useState<"host" | "checker">("checker");
  const [inviteBusy, setInviteBusy] = useState(false);

  const isOwner = !!user && !!host && host.owner_user_id === user.id;
  const canManage = isOwner || isMemberHost;

  useEffect(() => {
    supabase.from("hosts").select("*").eq("id", id).maybeSingle().then(({ data }) => setHost(data));
    supabase.from("events").select("*").eq("host_id", id).eq("status", "published").eq("visibility", "public").eq("hidden", false)
      .order("start_at", { ascending: true }).then(({ data }) => setPublicEvents(data || []));
  }, [id]);

  useEffect(() => {
    if (!user) { setIsMemberHost(false); return; }
    supabase.from("host_members").select("id,role").eq("host_id", id).eq("user_id", user.id).eq("role", "host").maybeSingle()
      .then(({ data }) => setIsMemberHost(!!data));
  }, [user, id]);

  useEffect(() => {
    if (canManage) {
      supabase.from("events").select("*").eq("host_id", id).order("start_at", { ascending: false })
        .then(({ data }) => setAllEvents(data || []));
    }
  }, [canManage, id]);

  const loadMembers = useCallback(async () => {
    if (!isOwner) return;
    const { data } = await supabase.from("host_members")
      .select("id,user_id,role,invite_token,invite_email")
      .eq("host_id", id);
    const rows = (data as any[]) || [];
    const userIds = rows.map(r => r.user_id).filter(Boolean) as string[];
    let profMap = new Map<string, { name: string | null; email: string | null }>();
    if (userIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name,email").in("id", userIds);
      profMap = new Map((profs || []).map(p => [p.id, { name: p.name, email: p.email }]));
    }
    setMembers(rows.map(r => ({ ...r, profiles: r.user_id ? profMap.get(r.user_id) || null : null })));
  }, [isOwner, id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const createInvite = async () => {
    setInviteBusy(true);
    const { error } = await supabase.from("host_members").insert({ host_id: id, role: inviteRole });
    setInviteBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Invite link created");
    loadMembers();
  };

  const removeMember = async (mid: string) => {
    const { error } = await supabase.from("host_members").delete().eq("id", mid);
    if (error) toast.error(error.message); else { toast.success("Removed"); loadMembers(); }
  };

  const copyInvite = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  if (!host) return <div><Header /><div className="p-8">Loading…</div></div>;

  return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {host.logo_url ? (
              <img src={host.logo_url} className="h-20 w-20 rounded-full object-cover border" alt="" />
            ) : (
              <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center text-2xl font-bold">{host.name[0]}</div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{host.name}</h1>
              {host.bio && <p className="text-muted-foreground mt-1 max-w-xl">{host.bio}</p>}
              {host.contact_email && <a href={`mailto:${host.contact_email}`} className="text-primary text-sm">{host.contact_email}</a>}
            </div>
          </div>
          {canManage && (
            <Link to="/events/new" search={{ hostId: host.id }}>
              <Button><Plus className="h-4 w-4 mr-1" />New event</Button>
            </Link>
          )}
        </div>

        {canManage && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3">Manage events</h2>
            {allEvents.length === 0 ? (
              <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
                No events yet.{" "}
                <Link to="/events/new" search={{ hostId: host.id }} className="text-primary font-medium">Create your first one</Link>.
              </div>
            ) : (
              <div className="space-y-2">
                {allEvents.map(ev => (
                  <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant={ev.status === "published" ? "default" : "secondary"}>{ev.status}</Badge>
                        <Badge variant="outline">{ev.visibility}</Badge>
                      </div>
                      <Link to="/events/$id" params={{ id: ev.id }} className="font-medium hover:text-primary block truncate">{ev.title}</Link>
                      <div className="text-xs text-muted-foreground">{fmtDate(ev.start_at)}</div>
                    </div>
                    <Link to="/events/$id/edit" params={{ id: ev.id }}>
                      <Button size="sm" variant="outline"><Edit className="h-3.5 w-3.5" /></Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {isOwner && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><UserPlus className="h-5 w-5" /> Team</h2>
            <div className="rounded-2xl border bg-card p-4 space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs text-muted-foreground">Invite role</label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="host">Host (full management)</SelectItem>
                      <SelectItem value="checker">Checker (check-in only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createInvite} disabled={inviteBusy}>Generate invite link</Button>
              </div>

              <div className="space-y-2">
                {members.length === 0 && <div className="text-sm text-muted-foreground">No team members yet.</div>}
                {members.map(m => {
                  const pending = !m.user_id;
                  const inviteUrl = m.invite_token ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${m.invite_token}` : "";
                  return (
                    <div key={m.id} className="rounded-xl border p-3 flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="capitalize">{m.role}</Badge>
                      <div className="flex-1 min-w-0">
                        {pending ? (
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Pending invite</div>
                            {m.invite_token && (
                              <Input readOnly value={inviteUrl} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium text-sm">{m.profiles?.name || "Member"}</div>
                            <div className="text-xs text-muted-foreground">{m.profiles?.email}</div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {pending && m.invite_token && (
                          <Button size="sm" variant="outline" onClick={() => copyInvite(m.invite_token!)}>
                            <Copy className="h-3.5 w-3.5 mr-1" />Copy
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <h2 className="text-xl font-semibold mt-10 mb-4">Upcoming public events</h2>
        {publicEvents.length === 0 ? (
          <p className="text-muted-foreground">No public events yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {publicEvents.map(ev => <EventCard key={ev.id} ev={{ ...ev, hosts: { name: host.name } }} />)}
          </div>
        )}
      </main>
    </div>
  );
}
