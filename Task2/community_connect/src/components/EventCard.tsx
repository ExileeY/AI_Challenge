import { Link } from "@tanstack/react-router";
import { fmtDate, isPast } from "@/lib/event-utils";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Users } from "lucide-react";

export interface EventCardData {
  id: string;
  title: string;
  cover_image_url: string | null;
  start_at: string;
  end_at: string;
  location_type: "physical" | "online";
  venue_address: string | null;
  online_link: string | null;
  capacity: number;
  visibility: "public" | "unlisted";
  status: "draft" | "published";
  hosts?: { name: string } | null;
  confirmed_count?: number;
}

export function EventCard({ ev }: { ev: EventCardData }) {
  const ended = isPast(ev.end_at);
  const full = (ev.confirmed_count ?? 0) >= ev.capacity;
  return (
    <Link to="/events/$id" params={{ id: ev.id }} className="group block">
      <article className="rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5">
        <div className="aspect-video bg-gradient-to-br from-accent to-secondary relative overflow-hidden">
          {ev.cover_image_url ? (
            <img src={ev.cover_image_url} alt={ev.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground/30">
              {ev.title.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {ended && <Badge variant="secondary">Ended</Badge>}
            {!ended && full && <Badge variant="secondary">Waitlist</Badge>}
            {ev.visibility === "unlisted" && <Badge variant="outline">Unlisted</Badge>}
          </div>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground">{fmtDate(ev.start_at)}</div>
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary">{ev.title}</h3>
          {ev.hosts?.name && <div className="text-sm text-muted-foreground">by {ev.hosts.name}</div>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              {ev.location_type === "online" ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              {ev.location_type === "online" ? "Online" : (ev.venue_address || "Venue").split(",")[0]}
            </span>
            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{ev.confirmed_count ?? 0}/{ev.capacity}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
