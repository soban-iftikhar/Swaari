import { useState } from "react";
import { Link } from "react-router-dom";

const UserSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[a-zA-Z\s]{2,}$/;

  const validateName = (name) => {
    if (!name.trim()) return "Name is required";
    if (!nameRegex.test(name)) return "Name must be at least 2 characters and contain only letters";
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
    if (name === "name") {
      error = validateName(value);
    } else if (name === "email") {
      error = validateEmail(value);
    } else if (name === "password") {
      error = validatePassword(value);
    }

    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (nameError || emailError || passwordError) {
      setErrors({
        name: nameError,
        email: emailError,
        password: passwordError,
      });
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
        {/* Signup form card */}
        <div className="w-full max-w-md bg-black/45 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">User Signup</h2>

          <form className="flex flex-col gap-3" action="/user/signup" method="POST" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-white font-semibold">
                Full Name:
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="px-4 text-white py-3 rounded-lg bg-white/10 border border-white/15 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.name && <span className="text-red-400 text-sm">{errors.name}</span>}
            </div>

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

    </>
  );
};

export default UserSignup;