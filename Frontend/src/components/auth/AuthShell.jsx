import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";

/**
 * AuthShell — the shared two-column layout for every login/signup screen.
 *
 * Left: a solid charcoal brand panel (wordmark, tagline, trust points) shown on
 * large screens. Right: the form area on a cream background. No gradients or
 * blur — solid surfaces and the design tokens only.
 *
 * @param {object} props
 * @param {string} props.title - form heading (e.g. "Rider Login")
 * @param {string} props.subtitle - short line under the heading
 * @param {'amber'|'emerald'} [props.accent='amber'] - brand accent (riders=amber, drivers=emerald)
 * @param {React.ReactNode} props.children - the form
 * @param {React.ReactNode} [props.footer] - below-card content (e.g. the switch link)
 */
export default function AuthShell({ title, subtitle, accent = "amber", children, footer }) {
  const panelPoints =
    accent === "emerald"
      ? ["Set your own hours", "Bid your fare, keep more", "Get paid fast"]
      : ["Transparent, competitive fares", "Track your driver live", "Rate every trip"];

  const accentText = accent === "emerald" ? "text-emerald" : "text-amber";
  const accentDot = accent === "emerald" ? "text-emerald-600" : "text-amber-600";

  return (
    <div className="min-h-screen bg-cream lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden flex-col justify-between bg-charcoal px-10 py-12 text-paper lg:flex">
        <Link to="/" className="text-3xl font-black tracking-tight">
          Swaari
        </Link>
        <div>
          <h2 className="text-4xl font-black leading-tight">
            Your ride,
            <br />
            <span className={accentText}>your fare.</span>
          </h2>
          <ul className="mt-8 space-y-3">
            {panelPoints.map((p) => (
              <li key={p} className="flex items-center gap-3 text-slate-faint">
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-paper/10 ${accentDot}`}>
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-slate-faint">
          © {new Date().getFullYear()} Swaari. Built with transparency.
        </p>
      </aside>

      {/* Form area */}
      <main className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:min-h-0">
        <div className="flex items-center justify-between">
          <Link
            to="/get-started"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-muted transition hover:text-charcoal"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Link to="/" className="text-xl font-black tracking-tight text-charcoal lg:hidden">
            Swaari
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mx-auto w-full max-w-md">
            <h1 className="text-3xl font-bold text-charcoal">{title}</h1>
            <p className="mt-2 text-slate-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-slate-muted">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
