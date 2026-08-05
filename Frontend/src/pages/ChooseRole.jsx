import { Link } from "react-router-dom";
import { ArrowLeft, User, Car, ArrowRight } from "lucide-react";

/**
 * ChooseRole — the fork after "Get Started": ride or drive.
 *
 * Two solid cards (rider = amber, driver = emerald) that route into the
 * respective login screens. No gradients or blur — design tokens only.
 */
export default function ChooseRole() {
  return (
    <div className="min-h-screen bg-cream px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-muted transition hover:text-charcoal"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <span className="text-xl font-black tracking-tight text-charcoal">Swaari</span>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h1 className="text-4xl font-black text-charcoal sm:text-5xl">How do you want to move?</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-slate-muted">
            Book rides at fares you control, or earn on your own schedule. Pick a path to continue.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <RoleCard
            to="/rider/login"
            icon={User}
            tone="amber"
            title="I want to ride"
            desc="Request a ride, compare driver offers, and pay the fare that works for you."
            cta="Continue as Rider"
          />
          <RoleCard
            to="/driver/login"
            icon={Car}
            tone="emerald"
            title="I want to drive"
            desc="Go online, bid on nearby trips, and keep more of every fare you earn."
            cta="Continue as Driver"
          />
        </div>
      </div>
    </div>
  );
}

const TONE = {
  amber: { chip: "bg-amber-050 text-amber-600", cta: "text-amber-600" },
  emerald: { chip: "bg-emerald-050 text-emerald-600", cta: "text-emerald-600" },
};

/** A single role choice card. */
function RoleCard({ to, icon: Icon, tone, title, desc, cta }) {
  const t = TONE[tone];
  return (
    <Link
      to={to}
      className="sw-card group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-pop"
      style={{ transitionProperty: "transform, box-shadow" }}
    >
      <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${t.chip}`}>
        <Icon className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-2xl font-bold text-charcoal">{title}</h2>
      <p className="mt-2 flex-1 text-slate-muted">{desc}</p>
      <span className={`mt-6 inline-flex items-center gap-1.5 font-bold ${t.cta}`}>
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
