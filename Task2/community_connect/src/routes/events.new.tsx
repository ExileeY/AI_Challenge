import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const searchSchema = z.object({ hostId: z.string().optional() });

export const Route = createFileRoute("/events/new")({
  component: NewEvent,
  validateSearch: searchSchema,
});

function NewEvent() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { hostId: hostIdParam } = Route.useSearch();
  const [hosts, setHosts] = useState<{ id: string; name: string }[]>([]);
  const [hostId, setHostId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [locationType, setLocationType] = useState<"physical" | "online">("physical");
  const [venue, setVenue] = useState("");
  const [link, setLink] = useState("");
  const [capacity, setCapacity] = useState(50);
  const [cover, setCover] = useState("");
  const [unlisted, setUnlisted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/events/new" } });
    if (user) {
      (async () => {
        const [{ data: owned }, { data: memberHosts }] = await Promise.all([
          supabase.from("hosts").select("id,name").eq("owner_user_id", user.id),
          supabase.from("host_members").select("host_id, hosts(id,name)")
            .eq("user_id", user.id).eq("role", "host"),
        ]);
        const map = new Map<string, { id: string; name: string }>();
        owned?.forEach(h => map.set(h.id, h));
        memberHosts?.forEach((m: any) => { if (m.hosts && !map.has(m.host_id)) map.set(m.host_id, { id: m.host_id, name: m.hosts.name }); });
        const list = Array.from(map.values());
        setHosts(list);
        if (hostIdParam && list.some(h => h.id === hostIdParam)) setHostId(hostIdParam);
        else setHostId(list[0]?.id || "");
      })();
    }
  }, [user, authLoading, navigate, hostIdParam]);

  const save = async (status: "draft" | "published") => {
    if (!hostId) { toast.error("Create a host first"); return; }
    setBusy(true);
    const { data, error } = await supabase.from("events").insert({
      host_id: hostId, title, description, start_at: new Date(startAt).toISOString(), end_at: new Date(endAt).toISOString(),
      timezone: tz, location_type: locationType, venue_address: locationType === "physical" ? venue : null,
      online_link: locationType === "online" ? link : null, capacity, cover_image_url: cover || null,
      visibility: unlisted ? "unlisted" : "public", status,
    }).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "published" ? "Published!" : "Saved as draft");
    navigate({ to: "/events/$id", params: { id: data.id } });
  };

  if (hosts.length === 0 && !authLoading) {
    return (
      <div><Header /><div className="max-w-xl mx-auto p-8 text-center">
        <p className="mb-4">You need a host profile first.</p>
        <Button onClick={() => navigate({ to: "/become-host" })}>Become a host</Button>
      </div></div>
    );
  }

  const currentHost = hosts.find(h => h.id === hostId);
  const hostLocked = !!hostIdParam && hosts.some(h => h.id === hostIdParam);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-1">Create event</h1>
        {currentHost && (
          <p className="text-muted-foreground mb-6">
            Hosting as <Link to="/hosts/$id" params={{ id: currentHost.id }} className="text-primary font-medium">{currentHost.name}</Link>
          </p>
        )}
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); save("published"); }}>
          {!hostLocked && hosts.length > 1 && (
            <div>
              <Label>Host</Label>
              <Select value={hostId} onValueChange={setHostId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {hosts.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Title</Label><Input required value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={5} value={description} onChange={e => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start</Label><Input type="datetime-local" required value={startAt} onChange={e => setStartAt(e.target.value)} /></div>
            <div><Label>End</Label><Input type="datetime-local" required value={endAt} onChange={e => setEndAt(e.target.value)} /></div>
          </div>
          <div><Label>Time zone</Label><Input value={tz} onChange={e => setTz(e.target.value)} /></div>
          <div className="flex items-center gap-3">
            <Switch checked={locationType === "online"} onCheckedChange={c => setLocationType(c ? "online" : "physical")} />
            <Label>Online event</Label>
          </div>
          {locationType === "physical" ? (
            <div><Label>Venue address</Label><Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="123 Main St, City" /></div>
          ) : (
            <div><Label>Online link</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet…" /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Capacity</Label><Input type="number" min={1} value={capacity} onChange={e => setCapacity(parseInt(e.target.value || "1"))} /></div>
            <div><Label>Cover image URL</Label><Input value={cover} onChange={e => setCover(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={unlisted} onCheckedChange={setUnlisted} />
            <Label>Unlisted (only people with link)</Label>
          </div>

          <div className="rounded-lg border p-3 bg-muted/40">
            <div className="text-sm font-medium mb-2">Pricing</div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="default">Free</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span><Button type="button" size="sm" variant="outline" disabled>Paid</Button></span>
                  </TooltipTrigger>
                  <TooltipContent>Coming soon</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" disabled={busy} onClick={() => save("draft")}>Save Draft</Button>
            <Button type="submit" disabled={busy}>Publish</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
