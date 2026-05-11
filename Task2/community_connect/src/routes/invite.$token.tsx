import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({ component: InvitePage });

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<{ host_id: string; role: string; hosts: { name: string } | null } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "done">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login", search: { redirect: `/invite/${token}` } }); return; }
    (async () => {
      const { data } = await supabase.rpc("get_invite_preview", { _token: token });
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) { setStatus("missing"); return; }
      setInvite({ host_id: row.host_id, role: row.role, hosts: { name: row.host_name } });
      setStatus("ready");
    })();
  }, [user, authLoading, token, navigate]);

  const accept = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("accept_host_invite", { _token: token });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Invite accepted");
    setStatus("done");
    navigate({ to: "/hosts/$id", params: { id: data as string } });
  };

  return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 max-w-md mx-auto px-4 py-12 w-full">
        <div className="rounded-2xl border bg-card p-8">
          <h1 className="text-2xl font-bold mb-2">Host invite</h1>
          {status === "loading" && <p className="text-muted-foreground">Loading…</p>}
          {status === "missing" && (
            <>
              <p className="text-muted-foreground">This invite is invalid or has already been claimed.</p>
              <Link to="/" className="inline-block mt-4 text-primary">Back to home</Link>
            </>
          )}
          {status === "ready" && invite && (
            <>
              <p className="text-muted-foreground mb-4">
                You've been invited to join <span className="font-medium text-foreground">{invite.hosts?.name}</span> as a
              </p>
              <Badge className="text-sm py-1 px-3 capitalize">{invite.role}</Badge>
              <div className="mt-6 flex gap-2">
                <Button onClick={accept} disabled={busy}>Accept invite</Button>
                <Link to="/"><Button variant="ghost">Decline</Button></Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
