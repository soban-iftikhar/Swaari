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
const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;

/**
 * RiderSignup — account creation for riders.
 *
 * Registers via POST /api/riders/register, logs the new rider straight in
 * (the API returns tokens on register), and routes to the dashboard.
 */
export default function RiderSignup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validators = {
    firstName: (v) => (!v.trim() ? "First name is required" : !NAME_REGEX.test(v) ? "Letters only, min 2 characters" : ""),
    lastName: (v) => (!v.trim() ? "Last name is required" : !NAME_REGEX.test(v) ? "Letters only, min 2 characters" : ""),
    email: (v) => (!v.trim() ? "Email is required" : !EMAIL_REGEX.test(v) ? "Enter a valid email address" : ""),
    password: (v) => {
      if (!v) return "Password is required";
      if (v.length < 8) return "At least 8 characters";
      if (!/[A-Z]/.test(v)) return "Add an uppercase letter";
      if (!/[a-z]/.test(v)) return "Add a lowercase letter";
      if (!/[0-9]/.test(v)) return "Add a number";
      return "";
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: validators[name](value) }));
  };

  const validateAll = () => {
    const next = {};
    for (const key of Object.keys(validators)) next[key] = validators[key](formData[key]);
    setErrors(next);
    return Object.values(next).every((e) => !e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setLoading(true);
    try {
      const res = await api.post("/api/riders/register", {
        fullName: { firstName: formData.firstName, lastName: formData.lastName },
        email: formData.email,
        password: formData.password,
      });
      login(res.data); // register returns { accessToken, role, entity }
      toast.success("Account created — welcome to Swaari!");
      navigate("/rider/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up in seconds and start riding."
      accent="amber"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/rider/login" className="font-bold text-amber-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="firstName"
            label="First name"
            placeholder="John"
            icon={User}
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <Input
            name="lastName"
            label="Last name"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
        </div>
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          icon={Mail}
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          name="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          icon={Lock}
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          hint="8+ characters with upper, lower & a number"
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
          Sign Up
        </Button>
      </form>
    </AuthShell>
  );
}
