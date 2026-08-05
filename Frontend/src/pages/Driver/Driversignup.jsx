import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import AuthShell from "../../components/auth/AuthShell";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-Z\s]{3,}$/;

// Vehicle types map to service tiers on the backend (see VEHICLE_TIER_BY_TYPE).
const VEHICLE_TYPES = [
  { value: "bike", label: "Bike · Economy" },
  { value: "rickshaw", label: "Rickshaw · Economy" },
  { value: "mini", label: "Mini · Economy" },
  { value: "sedan", label: "Sedan · Comfort" },
  { value: "suv", label: "SUV · Executive" },
  { value: "van", label: "Van · Executive" },
];

/**
 * DriverSignup — driver account creation with vehicle details.
 *
 * Posts a nested { fullName, email, password, vehicle{...} } body to
 * /api/drivers/register, then logs the driver in and routes to the workspace.
 */
export default function DriverSignup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    vehicleColor: "",
    vehicleMake: "",
    vehicleYear: "",
    vehicleCapacity: "",
    vehicleLicensePlate: "",
    vehicleType: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const required = (label) => (v) => (String(v).trim() ? "" : `${label} is required`);
  const validators = {
    firstName: (v) => (!v.trim() ? "First name is required" : !NAME_REGEX.test(v) ? "Letters only, min 3 characters" : ""),
    lastName: (v) => (!v.trim() ? "Last name is required" : !NAME_REGEX.test(v) ? "Letters only, min 3 characters" : ""),
    email: (v) => (!v.trim() ? "Email is required" : !EMAIL_REGEX.test(v) ? "Enter a valid email address" : ""),
    password: (v) => {
      if (!v) return "Password is required";
      if (v.length < 8) return "At least 8 characters";
      if (!/[A-Z]/.test(v)) return "Add an uppercase letter";
      if (!/[a-z]/.test(v)) return "Add a lowercase letter";
      if (!/[0-9]/.test(v)) return "Add a number";
      return "";
    },
    vehicleColor: required("Color"),
    vehicleMake: required("Make"),
    vehicleYear: (v) => {
      if (!String(v).trim()) return "Year is required";
      const y = Number(v);
      if (!Number.isInteger(y) || y < 1990 || y > 2100) return "Enter a valid year";
      return "";
    },
    vehicleCapacity: (v) => {
      if (!String(v).trim()) return "Capacity is required";
      const c = Number(v);
      if (!Number.isInteger(c) || c < 1 || c > 20) return "Enter a valid capacity";
      return "";
    },
    vehicleLicensePlate: required("License plate"),
    vehicleType: required("Vehicle type"),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: validators[name]?.(value) ?? "" }));
  };

  const validateAll = () => {
    const next = {};
    for (const key of Object.keys(validators)) next[key] = validators[key](form[key]);
    setErrors(next);
    return Object.values(next).every((e) => !e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/drivers/register", {
        fullName: { firstName: form.firstName, lastName: form.lastName },
        email: form.email,
        password: form.password,
        vehicle: {
          color: form.vehicleColor,
          make: form.vehicleMake,
          year: parseInt(form.vehicleYear, 10),
          capacity: parseInt(form.vehicleCapacity, 10),
          licensePlate: form.vehicleLicensePlate,
          type: form.vehicleType,
        },
      });
      login(res.data); // { accessToken, role: 'driver', entity }
      toast.success("Driver account created — welcome aboard!");
      navigate("/driver/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Drive with Swaari"
      subtitle="Tell us about you and your vehicle to get started."
      accent="emerald"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/driver/login" className="font-bold text-emerald-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Personal */}
        <fieldset className="flex flex-col gap-4">
          <legend className="sw-kicker mb-1">Your details</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input name="firstName" label="First name" placeholder="John" icon={User} value={form.firstName} onChange={handleChange} error={errors.firstName} />
            <Input name="lastName" label="Last name" placeholder="Doe" value={form.lastName} onChange={handleChange} error={errors.lastName} />
          </div>
          <Input name="email" type="email" label="Email" placeholder="you@example.com" icon={Mail} autoComplete="email" value={form.email} onChange={handleChange} error={errors.email} />
          <Input name="password" type="password" label="Password" placeholder="••••••••" icon={Lock} autoComplete="new-password" value={form.password} onChange={handleChange} error={errors.password} hint="8+ characters with upper, lower & a number" />
        </fieldset>

        {/* Vehicle */}
        <fieldset className="flex flex-col gap-4 border-t border-line pt-5">
          <legend className="sw-kicker mb-1">Vehicle</legend>
          <div className="grid grid-cols-2 gap-3">
            <Input name="vehicleColor" label="Color" placeholder="White" value={form.vehicleColor} onChange={handleChange} error={errors.vehicleColor} />
            <Input name="vehicleMake" label="Make" placeholder="Toyota" value={form.vehicleMake} onChange={handleChange} error={errors.vehicleMake} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="vehicleYear" type="number" label="Year" placeholder="2022" value={form.vehicleYear} onChange={handleChange} error={errors.vehicleYear} />
            <Input name="vehicleCapacity" type="number" label="Seats" placeholder="4" value={form.vehicleCapacity} onChange={handleChange} error={errors.vehicleCapacity} />
          </div>
          <Input name="vehicleLicensePlate" label="License plate" placeholder="ABC-123" value={form.vehicleLicensePlate} onChange={handleChange} error={errors.vehicleLicensePlate} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehicleType" className="text-sm font-semibold text-charcoal">
              Vehicle type
            </label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={form.vehicleType}
              onChange={handleChange}
              className={`sw-input ${errors.vehicleType ? "sw-input-error" : ""}`}
            >
              <option value="" disabled>
                Select a vehicle type
              </option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.vehicleType && <span className="text-xs font-medium text-danger">{errors.vehicleType}</span>}
          </div>
        </fieldset>

        <Button type="submit" variant="go" size="lg" fullWidth loading={loading}>
          Create Driver Account
        </Button>
      </form>
    </AuthShell>
  );
}
