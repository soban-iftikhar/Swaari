import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import DataContext from "../context/DataContext";

const Driversignup = () => {

  const { setDriver } = useContext(DataContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    vehicleColor: "",
    vehicleLicensePlate: "",
    vehicleMake: "",
    vehicleYear: "",
    vehicleCapacity: "",
    vehicleType: "",
  });
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    vehicleColor: "",
    vehicleLicensePlate: "",
    vehicleMake: "",
    vehicleYear: "",
    vehicleCapacity: "",
    vehicleType: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

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

  const validateVehicleField = (value, label) => {
    if (!value.trim()) return `${label} is required`;
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    let error = "";
    if (name === "firstName") {
      error = validateName(value, "First name");
    } else if (name.startsWith("vehicle")) {
      error = validateVehicleField(value, name.replace("vehicle", ""));
    }

    setErrors({ ...errors, [name]: error });
  };

  const checkErrors = () => {
    const firstNameError = validateName(formData.firstName, "First name");
    const lastNameError = validateName(formData.lastName, "Last name");
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const colorError = validateVehicleField(formData.vehicleColor, "Vehicle color");
    const licensePlateError = validateVehicleField(formData.vehicleLicensePlate, "License plate");
    const makeError = validateVehicleField(formData.vehicleMake, "Vehicle make");
    const yearError = validateVehicleField(formData.vehicleYear, "Vehicle year");
    const capacityError = validateVehicleField(formData.vehicleCapacity, "Capacity");
    const typeError = validateVehicleField(formData.vehicleType, "Vehicle type");

    if (firstNameError || lastNameError || emailError || passwordError || colorError || licensePlateError || makeError || yearError || capacityError || typeError) {
      setErrors({
        firstName: firstNameError,
        lastName: lastNameError,
        email: emailError,
        password: passwordError,
        vehicleColor: colorError,
        vehicleLicensePlate: licensePlateError,
        vehicleMake: makeError,
        vehicleYear: yearError,
        vehicleCapacity: capacityError,
        vehicleType: typeError,
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

    try {
      const newDriver = {
        fullName: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        email: formData.email,
        password: formData.password,
        vehicle: {
          color: formData.vehicleColor,
          licensePlate: formData.vehicleLicensePlate,
          make: formData.vehicleMake,
          year: parseInt(formData.vehicleYear),
          capacity: parseInt(formData.vehicleCapacity),
          type: formData.vehicleType,
        },
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/drivers/register`,
        newDriver
      );

      if (response.status === 201) {
        setServerError("");
        setDriver(response.data);
        localStorage.setItem("token", response.data.accessToken);
        setShowSuccess(true);
        setTimeout(() => {
          navigate("/driver/login");
        }, 2000);
      }
    } catch (error) {
      setServerError(error.response?.data?.message || "Registration failed. Please try again.");
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
        className="min-h-screen bg-cover bg-center bg-no-repeat flex items-start md:items-center justify-center px-0 pt-24 pb-16"
        style={{ backgroundImage: "url('/trafficLights.png')" }}
      >
        {/* Signup form card */}
        <div className="w-screen max-w-none sm:w-[calc(100vw-1rem)] sm:max-w-6xl bg-black/45 backdrop-blur-sm p-8 rounded-none sm:rounded-3xl shadow-2xl border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-2 text-center">Driver Signup</h2>
          <div className="mx-auto mb-6 h-1 w-28 rounded-full bg-orange-500 shadow-[0_0_18px_rgba(249,115,22,0.9)]" />

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {serverError && (
              <div className="bg-red-500/30 border border-red-400 text-red-200 px-4 py-3 rounded-lg">
                {serverError}
              </div>
            )}

            {/* Personal Information Section */}
            <div className="border-b border-white/20 pb-4">
              <h3 className="text-lg font-semibold text-white mb-3">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <label htmlFor="firstName" className="text-white font-semibold">
                  First Name:
                </label>
                <label htmlFor="lastName" className="text-white font-semibold">
                  Last Name:
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
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
              {(errors.firstName || errors.lastName) && (
                <span className="text-red-400 text-sm">{errors.firstName || errors.lastName}</span>
              )}

              <div className="flex flex-col gap-1 mt-3">
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
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
                {errors.email && <span className="text-red-400 text-sm">{errors.email}</span>}
              </div>

              <div className="flex flex-col gap-1 mt-3">
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
                  className={`px-4 py-2.5 text-white rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
                {errors.password && <span className="text-red-400 text-sm">{errors.password}</span>}
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Vehicle Information</h3>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <label htmlFor="vehicleColor" className="text-white font-semibold">
                  Color:
                </label>
                <label htmlFor="vehicleMake" className="text-white font-semibold">
                  Make:
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  id="vehicleColor"
                  name="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={handleChange}
                  placeholder="Black"
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.vehicleColor
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
                <input
                  type="text"
                  id="vehicleMake"
                  name="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={handleChange}
                  placeholder="Toyota"
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.vehicleMake
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <label htmlFor="vehicleYear" className="text-white font-semibold">
                  Year:
                </label>
                <label htmlFor="vehicleCapacity" className="text-white font-semibold">
                  Capacity:
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="number"
                  id="vehicleYear"
                  name="vehicleYear"
                  value={formData.vehicleYear}
                  onChange={handleChange}
                  placeholder="2023"
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.vehicleYear
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
                <input
                  type="number"
                  id="vehicleCapacity"
                  name="vehicleCapacity"
                  value={formData.vehicleCapacity}
                  onChange={handleChange}
                  placeholder="5"
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.vehicleCapacity
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <label htmlFor="vehicleLicensePlate" className="text-white font-semibold">
                  License Plate:
                </label>
                <label htmlFor="vehicleType" className="text-white font-semibold">
                  Vehicle Type:
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  id="vehicleLicensePlate"
                  name="vehicleLicensePlate"
                  value={formData.vehicleLicensePlate}
                  onChange={handleChange}
                  placeholder="ABC-1234"
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.vehicleLicensePlate
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                />
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className={`px-4 text-white py-2.5 rounded-lg bg-white/10 border focus:outline-none focus:ring-2 ${
                    errors.vehicleType
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/15 focus:ring-orange-500"
                  }`}
                >
                  <option value="" disabled>Select Type</option>
                  <option value="bike">Bike</option>
                  <option value="rickshaw">Rickshaw</option>
                  <option value="mini">Mini</option>
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                </select>
              </div>
              {(errors.vehicleColor || errors.vehicleMake || errors.vehicleYear || errors.vehicleCapacity || errors.vehicleLicensePlate || errors.vehicleType) && (
                <span className="text-red-400 text-sm">Please fill in all vehicle fields</span>
              )}
            </div>

            <button
              type="submit"
              className="mt-6 px-8 py-3 bg-orange-600 text-white text-lg rounded-lg hover:bg-orange-700 transition font-semibold shadow-lg"
            >
              Sign Up
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-white mt-4">
            Already have an account?{" "}
            <Link to="/driver/login" className="font-bold text-blue-300 hover:text-blue-200 underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Success Message Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-black/50 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/10 max-w-6xl w-full mx-6">
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

export default Driversignup;