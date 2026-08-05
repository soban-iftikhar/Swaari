import { History, House, Phone } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Navbar — the fixed bottom tab bar on mobile dashboards.
 *
 * Role comes from AuthContext (not localStorage). Solid design-system surface:
 * paper background, top hairline, amber active state. Hidden on desktop where
 * navigation lives elsewhere.
 *
 * @param {object} props
 * @param {Array<{label:string,to:string}>} [props.items] - overrides default tabs
 */
const ICON_BY_LABEL = {
  home: House,
  history: History,
  contact: Phone,
};

export default function Navbar({ items }) {
  const { role } = useAuth();
  const base = role === "driver" ? "/driver" : "/rider";

  const navItems = items || [
    { label: "Home", to: `${base}/dashboard` },
    { label: "History", to: `${base}/history` },
    { label: "Contact", to: `${base}/contact` },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1 sm:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {navItems.map((item) => {
          const Icon = ICON_BY_LABEL[item.label.toLowerCase()] || House;
          return (
            <li key={item.label}>
              <NavLink to={item.to} aria-label={item.label} end>
                {({ isActive }) => (
                  <span className="flex flex-col items-center justify-center gap-1 py-2">
                    <Icon
                      className={isActive ? "h-5 w-5 text-charcoal" : "h-5 w-5 text-slate-faint"}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    <span
                      className={
                        isActive
                          ? "text-xs font-bold leading-none text-charcoal"
                          : "text-xs font-medium leading-none text-slate-muted"
                      }
                    >
                      {item.label}
                    </span>
                  </span>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
