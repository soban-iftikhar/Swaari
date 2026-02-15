import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Driverlogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    if (!emailRegex.test(email)) return "Invalid email format";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "email") {
      setErrors({ ...errors, email: validateEmail(value) });
    } else if (name === "password") {
      setErrors({ ...errors, password: validatePassword(value) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    // Submit form
    e.target.submit();
  };

  return (
    <>
      {/* Logo */}
      <div className="absolute top-4 left-4 z-10">
        <h1
          className="text-4xl md:text-6xl font-black text-black"
          style={{ fontFamily: "'Inter', 'Inter ExtraBold', sans-serif" }}
        >
          Sawari
        </h1>
      </div>

      {/* Main container with background */}
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-start md:items-center justify-center px-6 pt-24 pb-16"
        style={{ backgroundImage: "url('/trafficLights.png')" }}
      >
        {/* Login form card */}
        <div className="w-full max-w-md bg-black/45 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Driver Login</h2>

          <form className="flex flex-col gap-4" action="/driver/login" method="POST" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-white font-semibold">
                Email:
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="abc@example.com"
                className="px-4 text-white py-3 rounded-lg bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.email && <span className="text-red-400 text-sm">{errors.email}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-white font-semibold">
                Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className="px-4 py-3 text-white rounded-lg bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.password && <span className="text-red-400 text-sm">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="mt-4 px-8 py-3 bg-orange-600 text-white text-lg rounded-lg hover:bg-orange-700 transition font-semibold shadow-lg"
            >
              Login
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-white mt-6">
            Don't have an account?{" "}
            <Link to="/driver/signup" className="font-bold text-blue-300 hover:text-blue-200 underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Back button */}
      <Link
        to="/get-started"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        title="Back"
      >
        <ChevronLeft className="h-6 w-6 text-black" />
      </Link>
    </>
  );
};

export default Driverlogin;