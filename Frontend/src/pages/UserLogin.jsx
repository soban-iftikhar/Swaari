import { useState, useContext } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import userDataContext from "../context/userDataContext";

const UserLogin = () => {
  const { setUser } = useContext(userDataContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/users/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.status === 200) {
        setServerError("");
        setUser(response.data);
        localStorage.setItem("token", response.data.accessToken);
        setShowSuccess(true);
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || "Login failed. Please try again.");
      setShowSuccess(false);
    }
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
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-6"
        style={{ backgroundImage: "url('/trafficLights.png')" }}
      >
        {/* Login form card */}
        <div className="w-full max-w-md bg-black/40 backdrop-blur-sm p-8 rounded-3xl shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">User Login</h2>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {serverError && (
              <div className="bg-red-500/30 border border-red-400 text-red-200 px-4 py-3 rounded-lg">
                {serverError}
              </div>
            )}
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
                className="px-4 text-white py-3 rounded-lg bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="px-4 py-3 text-white rounded-lg bg-white/10 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.password && <span className="text-red-400 text-sm">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="mt-4 px-8 py-3 bg-orange-600 text-white text-lg rounded-lg hover:bg-orange-700 transition font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Login
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-white mt-6">
            Don't have an account?{" "}
            <Link to="/user/signup" className="font-bold text-blue-300 hover:text-blue-200 underline">
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

      {/* Success Message Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/50 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/10 max-w-md w-full mx-6">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-green-500/30 p-4 rounded-full">
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Login Successful!</h3>
              <p className="text-white/80 mb-4">Welcome back!</p>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserLogin;
