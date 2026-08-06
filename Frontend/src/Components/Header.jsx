import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, User, IdCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fullNameOf } from "../lib/format";
import Brandmark from "../components/ui/Brandmark";

/**
 * Header — the fixed top bar for the rider/driver dashboards.
 *
 * Reads identity from AuthContext (no direct localStorage), shows a greeting,
 * and exposes a profile menu with logout. Solid design-system surface: paper
 * background, charcoal text, a single hairline border, no blur.
 *
 * @param {object} props
 * @param {string} [props.title] - overrides the default "Welcome, <name>" greeting
 */
export default function Header({ title }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const menuRef = useRef(null);

  // Close the menu on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const firstName = user?.fullname?.firstname || fullNameOf(user?.fullname)?.split(" ")[0];
  const fallback = role === "driver" ? "Driver" : "Rider";
  const resolvedTitle = title || `Welcome, ${firstName || fallback}`;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate(role === "driver" ? "/driver/login" : "/rider/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Brandmark />

        {/* Greeting (hidden on the smallest screens) */}
        <h3 className="hidden text-sm font-semibold text-slate-ink sm:block">{resolvedTitle}</h3>

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-paper transition hover:bg-charcoal-700"
            aria-label="Open profile menu"
            aria-expanded={open}
          >
            <User className="h-5 w-5" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-line bg-paper p-1.5 sw-animate-fade-in" style={{ boxShadow: "var(--shadow-pop)" }}>
              <div className="border-b border-line px-3 py-2">
                <p className="truncate text-sm font-bold text-charcoal">{fullNameOf(user?.fullname) || fallback}</p>
                <p className="text-xs capitalize text-slate-muted">{role || "account"}</p>
              </div>
              <MenuItem icon={IdCard} label="Profile" />
              <MenuItem icon={Settings} label="Settings" />
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger-050"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** A single (non-destructive) menu row. */
function MenuItem({ icon: Icon, label }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-ink transition hover:bg-cream"
    >
      <Icon className="h-4 w-4 text-slate-muted" />
      {label}
    </button>
  );
}
