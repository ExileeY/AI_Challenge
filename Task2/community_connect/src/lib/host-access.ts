import { supabase } from "@/integrations/supabase/client";

export interface ManagedHost {
  id: string;
  name: string;
  isOwner: boolean;
  role: "owner" | "host";
}

/** Returns hosts the current user can manage (owner or host-role member). */
export async function getManagedHosts(userId: string): Promise<ManagedHost[]> {
  const [{ data: owned }, { data: members }] = await Promise.all([
    supabase.from("hosts").select("id,name").eq("owner_user_id", userId),
    supabase.from("host_members").select("host_id, role, hosts(id,name)")
      .eq("user_id", userId).eq("role", "host"),
  ]);
  const map = new Map<string, ManagedHost>();
  owned?.forEach(h => map.set(h.id, { id: h.id, name: h.name, isOwner: true, role: "owner" }));
  members?.forEach((m: any) => {
    if (m.hosts && !map.has(m.host_id)) {
      map.set(m.host_id, { id: m.host_id, name: m.hosts.name, isOwner: false, role: "host" });
    }
  });
  return Array.from(map.values());
}

export async function canManageHost(userId: string, hostId: string): Promise<boolean> {
  const { data: h } = await supabase.from("hosts").select("owner_user_id").eq("id", hostId).maybeSingle();
  if (h?.owner_user_id === userId) return true;
  const { data: m } = await supabase.from("host_members").select("id")
    .eq("host_id", hostId).eq("user_id", userId).eq("role", "host").maybeSingle();
  return !!m;
}
