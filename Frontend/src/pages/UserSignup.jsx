import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import DataContext from "../context/DataContext";

const UserSignup = () => {
  const { setUser } = useContext(DataContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[a-zA-Z\s]{2,}$/;

  const validateName = (name, label) => {
    if (!name.trim()) return `${label} is required`;
    if (!nameRegex.test(name)) return `${label} must be at least 2 characters and contain only letters`;
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) return "Email is required";
    if (!emailRegex.test(email)) return "Invalid email format";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let error = "";
    if (name === "firstName") {
      error = validateName(value, "First name");
    } else if (name === "lastName") {
      error = validateName(value, "Last name");
    } else if (name === "email") {
      error = validateEmail(value);
    } else if (name === "password") {
      error = validatePassword(value);
    }

    setErrors({ ...errors, [name]: error });
  };

  const checkErrors = () => {
    const firstNameError = validateName(formData.firstName, "First name");
    const lastNameError = validateName(formData.lastName, "Last name");
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (firstNameError || lastNameError || emailError || passwordError) {
      setErrors({
        firstName: firstNameError,
        lastName: lastNameError,
        email: emailError,
        password: passwordError,
      });
      return true;
    }

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkErrors()) {
      return;
    }

    const newUser = {
      fullName: {
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
      email: formData.email,
      password: formData.password,
    }
    
    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/users/register`, newUser);
    if (response.status === 201) {
      const data = response.data;
      setUser(data);
      setShowSuccess(true);
      localStorage.setItem("token", data.accessToken);
      setTimeout(() => {
        navigate("/user/login");
      }, 2000);
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
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-start md:items-center justify-center px-0 pt-24 pb-16"
        style={{ backgroundImage: "url('/trafficLights.png')" }}
      >
        {/* Signup form card */}
        <div className="w-screen max-w-none sm:w-[calc(100vw-1rem)] sm:max-w-5xl bg-black/45 backdrop-blur-sm p-6 sm:p-8 rounded-none sm:rounded-3xl shadow-2xl border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">User Signup</h2>
          <div className="mx-auto mb-4 h-1 w-28 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.9)]" />

          <form className="flex flex-col gap-2" action="/user/signup" method="POST" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3 mb-1">
              <label htmlFor="firstName" className="text-white font-semibold">
                First Name:
              </label>
              <label htmlFor="lastName" className="text-white font-semibold">
                Last Name:
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-1">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.firstName
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.lastName
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
              </div>

            <div className="flex flex-col gap-1 mt-0">
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

            <input type="hidden" name="fullName.firstName" value={formData.firstName} />
            <input type="hidden" name="fullName.lastName" value={formData.lastName} />

            <button
              type="submit"
              className="mt-4 px-8 py-3 bg-orange-600 text-white text-lg rounded-lg hover:bg-orange-700 transition font-semibold shadow-lg"
            >
              Sign Up
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-white mt-6">
            Already have an account?{" "}
            <Link to="/user/login" className="font-bold text-blue-300 hover:text-blue-200 underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Success Message Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/50 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/10 max-w-5xl w-full mx-6">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="bg-green-500/30 p-4 rounded-full">
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Account Created!</h3>
              <p className="text-white/80 mb-4">Redirecting to login...</p>
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

export default UserSignup;