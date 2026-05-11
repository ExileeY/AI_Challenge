import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth-context";
import { canManageHost } from "@/lib/host-access";
import { toast } from "sonner";

export const Route = createFileRoute("/events_/$id/edit")({ component: EditEvent });

function EditEvent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [ev, setEv] = useState<any>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login", search: { redirect: `/events/${id}/edit` } }); return; }
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("id", id).single();
      if (!data) { setAllowed(false); return; }
      const ok = await canManageHost(user.id, data.host_id);
      if (!ok) { toast.error("You don't have permission to edit this event"); navigate({ to: "/events/$id", params: { id } }); return; }
      setEv(data);
      setAllowed(true);
    })();
  }, [id, user, authLoading, navigate]);

  if (allowed === null || !ev) return <div><Header /><div className="p-8">Loading…</div></div>;

  const set = (k: string, v: any) => setEv({ ...ev, [k]: v });

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("events").update({
      title: ev.title, description: ev.description,
      start_at: new Date(ev.start_at).toISOString(), end_at: new Date(ev.end_at).toISOString(),
      timezone: ev.timezone, location_type: ev.location_type, venue_address: ev.venue_address, online_link: ev.online_link,
      capacity: ev.capacity, cover_image_url: ev.cover_image_url, visibility: ev.visibility, status: ev.status,
    }).eq("id", id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); navigate({ to: "/events/$id", params: { id } }); }
  };

  const toLocal = (iso: string) => new Date(iso).toISOString().slice(0, 16);

  return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-6">Edit event</h1>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={ev.title} onChange={e => set("title", e.target.value)} /></div>
          <div><Label>Description</Label><Textarea rows={5} value={ev.description || ""} onChange={e => set("description", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start</Label><Input type="datetime-local" value={toLocal(ev.start_at)} onChange={e => set("start_at", e.target.value)} /></div>
            <div><Label>End</Label><Input type="datetime-local" value={toLocal(ev.end_at)} onChange={e => set("end_at", e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={ev.location_type === "online"} onCheckedChange={c => set("location_type", c ? "online" : "physical")} />
            <Label>Online</Label>
          </div>
          {ev.location_type === "physical"
            ? <div><Label>Venue</Label><Input value={ev.venue_address || ""} onChange={e => set("venue_address", e.target.value)} /></div>
            : <div><Label>Link</Label><Input value={ev.online_link || ""} onChange={e => set("online_link", e.target.value)} /></div>}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Capacity</Label><Input type="number" value={ev.capacity} onChange={e => set("capacity", parseInt(e.target.value || "1"))} /></div>
            <div><Label>Cover URL</Label><Input value={ev.cover_image_url || ""} onChange={e => set("cover_image_url", e.target.value)} /></div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2"><Switch checked={ev.visibility === "unlisted"} onCheckedChange={c => set("visibility", c ? "unlisted" : "public")} /><Label>Unlisted</Label></div>
            <div className="flex items-center gap-2"><Switch checked={ev.status === "published"} onCheckedChange={c => set("status", c ? "published" : "draft")} /><Label>Published</Label></div>
          </div>
          <div className="pt-4 flex gap-2">
            <Button onClick={save} disabled={busy}>Save</Button>
            <Button variant="outline" onClick={() => navigate({ to: "/events/$id", params: { id } })}>Cancel</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
