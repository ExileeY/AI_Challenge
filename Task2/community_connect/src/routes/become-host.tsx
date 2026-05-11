import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/become-host")({ component: BecomeHostPage });

function BecomeHostPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");
  const [logo, setLogo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login", search: { redirect: "/become-host" } });
  }, [authLoading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("hosts").insert({
      owner_user_id: user.id, name, bio, contact_email: contact || user.email, logo_url: logo || null,
    }).select().single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("You're now a host!");
    navigate({ to: "/dashboard" });
    void data;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-xl mx-auto px-4 py-10 w-full">
        <h1 className="text-3xl font-bold">Become a host</h1>
        <p className="text-muted-foreground mt-1">Set up a public profile so people can discover your events.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div><Label>Host name</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Berlin Coffee Club" /></div>
          <div><Label>Logo URL (optional)</Label><Input value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://…" /></div>
          <div><Label>Short bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} /></div>
          <div><Label>Contact email</Label><Input type="email" value={contact} onChange={e => setContact(e.target.value)} placeholder={user?.email || ""} /></div>
          <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create host"}</Button>
        </form>
      </main>
    </div>
  );
}
