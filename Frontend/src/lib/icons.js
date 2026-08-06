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
  TbCarSuv, // suv vehicle glyph
} from "react-icons/tb";

export {
  PiMotorcycleFill, // bike
  PiCarProfileFill, // sedan / car
  PiVanFill, // van
  PiStarFill, // rating (filled)
  PiSteeringWheelFill,
} from "react-icons/pi";

export {
  RiEBike2Fill, // e-bike accent
  RiTaxiFill, // rickshaw / tuk-tuk
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
 * Vehicle-type → distinctive glyph, used by the vehicle selector and vehicle
 * chips. Keeps the "which icon for which vehicle" decision in one spot; the keys
 * mirror the backend VEHICLE_PRICING types.
 */
import { PiMotorcycleFill, PiCarProfileFill, PiVanFill } from "react-icons/pi";
import { TbCar, TbCarSuv } from "react-icons/tb";
import { RiTaxiFill } from "react-icons/ri";

export const VEHICLE_ICON = {
  bike: PiMotorcycleFill,
  rickshaw: RiTaxiFill,
  mini: TbCar,
  sedan: PiCarProfileFill,
  suv: TbCarSuv,
  van: PiVanFill,
};
