import { TrendingUp, Star } from "lucide-react";
import { TbCar, TbCoins } from "../../lib/icons";
import StatTile from "../ui/StatTile";
import { formatCurrency } from "../../lib/format";

/**
 * EarningsBar — a compact KPI row for the driver, fed from their profile stats.
 *
 * Surfaces lifetime trips, total earnings, and the aggregate rating. These come
 * from `user.stats` / `user.rating` on the cached auth profile and update as the
 * driver completes trips (the backend bumps them on settlement).
 *
 * @param {object} props
 * @param {object} props.user - the authenticated driver profile
 */
export default function EarningsBar({ user }) {
  const stats = user?.stats || {};
  const rating = user?.rating || {};
  const trips = stats.totalTrips ?? 0;
  const earnings = stats.totalEarnings ?? 0;
  const avg = rating.average ?? 5;
  const count = rating.count ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatTile label="Total trips" value={trips} icon={TbCar} tone="neutral" />
      <StatTile
        label="Earnings"
        value={formatCurrency(earnings)}
        icon={TbCoins}
        tone="emerald"
      />
      <StatTile
        label="Rating"
        value={avg.toFixed(1)}
        icon={Star}
        tone="amber"
        sub={count > 0 ? `${count} rating${count > 1 ? "s" : ""}` : "No ratings yet"}
      />
      <StatTile
        label="Avg / trip"
        value={trips > 0 ? formatCurrency(earnings / trips) : formatCurrency(0)}
        icon={TrendingUp}
        tone="neutral"
      />
    </div>
  );
}
