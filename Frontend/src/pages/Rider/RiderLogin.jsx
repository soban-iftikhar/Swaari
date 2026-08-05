import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import AuthShell from "../../components/auth/AuthShell";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RiderLogin — email/password sign-in for riders.
 *
 * Calls POST /api/riders/login via the api client, hands the result to
 * AuthContext.login() (persists token/role/user), then routes to the dashboard.
 */
export default function RiderLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    if (!EMAIL_REGEX.test(email)) return "Enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: validateField(name, value) }));
  };

  const validateField = (name, value) => {
    if (name === "email") return validateEmail(value);
    if (name === "password") return validatePassword(value);
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/riders/login", {
        email: formData.email,
        password: formData.password,
      });
      login(res.data); // { accessToken, role: 'rider', entity }
      toast.success(`Welcome back, ${res.data.entity?.fullname?.firstname || "rider"}!`);
      navigate("/rider/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Rider Login"
      subtitle="Log in to book your next ride."
      accent="amber"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/rider/signup" className="font-bold text-amber-600 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
          Log In
        </Button>
      </form>
    </AuthShell>
  );
}
