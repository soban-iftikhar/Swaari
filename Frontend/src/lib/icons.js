/**
 * icons.js — the single place icon choices live.
 *
 * Two families, on purpose:
 *  - **lucide-react** for utilitarian chrome (close, chevrons, spinners, form
 *    affordances) — light, consistent line icons.
 *  - **react-icons** for brand + distinctive product accents (the car, route,
 *    steering, coins, star) so Swaari stops looking like stock-lucide-everywhere.
 *
 * Everything is re-exported here so a glyph can be swapped app-wide in one file
 * rather than hunting imports across dozens of components.
 */

// ── Brand / product accents (react-icons) ──────────────────────
export {
  TbSteeringWheel, // driver identity / go-online
  TbRoute, // trip route / distance
  TbCar, // vehicle / driver marker
  TbMapPinFilled, // solid location pin
  TbCurrentLocation, // "use my location"
  TbClockHour4, // ETA / duration
  TbCoins, // fare / earnings
  TbShieldCheck, // OTP / verified pickup
} from "react-icons/tb";

export {
  PiMotorcycleFill, // bike tier
  PiCarProfileFill, // sedan / comfort tier
  PiVanFill, // van / executive tier
  PiStarFill, // rating (filled)
  PiSteeringWheelFill,
} from "react-icons/pi";

export {
  RiEBike2Fill, // rickshaw / mini
  RiTaxiFill, // taxi accent
} from "react-icons/ri";

// ── Utilitarian UI (lucide-react) ──────────────────────────────
export {
  MapPin,
  Navigation,
  LocateFixed,
  Loader2,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Search,
  Phone,
  MessageCircle,
  Send,
  Star,
  Clock,
  Wallet,
  Banknote,
  CreditCard,
  User,
  Users,
  LogOut,
  Settings,
  IdCard,
  History,
  House,
  Power,
  TrendingUp,
  CircleDot,
} from "lucide-react";

/**
 * Vehicle-tier → distinctive glyph, used by the tier selector and vehicle chips.
 * Keeps the "which icon for which tier" decision in one spot.
 */
import { PiMotorcycleFill, PiCarProfileFill, PiVanFill } from "react-icons/pi";

export const TIER_ICON = {
  economy: PiMotorcycleFill,
  comfort: PiCarProfileFill,
  executive: PiVanFill,
};
