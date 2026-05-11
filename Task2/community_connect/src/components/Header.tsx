import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { CalendarHeart, LogOut, Ticket, LayoutDashboard, User } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <CalendarHeart className="h-6 w-6 text-primary" />
          <span>Communa</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/" className="px-3 py-1.5 text-sm hover:text-primary">Explore</Link>
          {user && (
            <>
              <Link to="/tickets" className="px-3 py-1.5 text-sm hover:text-primary inline-flex items-center gap-1">
                <Ticket className="h-4 w-4" /> My Tickets
              </Link>
              <Link to="/my-events" className="px-3 py-1.5 text-sm hover:text-primary">My Events</Link>
              <Link to="/dashboard" className="px-3 py-1.5 text-sm hover:text-primary inline-flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            </>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm"><User className="h-4 w-4 mr-1" />Sign in</Button></Link>
              <Link to="/signup"><Button size="sm">Get started</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
