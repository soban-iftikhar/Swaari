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
 * DriverLogin — email/password sign-in for drivers.
 *
 * Mirrors RiderLogin but posts to /api/drivers/login and routes to the driver
 * workspace. AuthContext.login() stores role='driver' from the API response.
 */
export default function DriverLogin() {
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
    setErrors((errs) => ({
      ...errs,
      [name]: name === "email" ? validateEmail(value) : validatePassword(value),
    }));
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
      const res = await api.post("/api/drivers/login", {
        email: formData.email,
        password: formData.password,
      });
      login(res.data); // { accessToken, role: 'driver', entity }
      toast.success(`Welcome back, ${res.data.entity?.fullname?.firstname || "driver"}!`);
      navigate("/driver/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Driver Login"
      subtitle="Log in to go online and start earning."
      accent="emerald"
      footer={
        <>
          New to driving with us?{" "}
          <Link to="/driver/signup" className="font-bold text-emerald-600 hover:underline">
            Create an account
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
        <Button type="submit" variant="go" size="lg" fullWidth loading={loading} className="mt-2">
          Log In
        </Button>
      </form>
    </AuthShell>
  );
}
