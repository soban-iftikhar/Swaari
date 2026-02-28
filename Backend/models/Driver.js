const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  fullname: {
    firstname: {
      type: String,
      required: true,
      minlength: [3, "Fisrt name must be atleast 3 characters long"],
    },
    lastname: {
      type: String,
      required: true,
      minlength: [3, "Last name must be atleast 3 characters long"],
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    minlength: [5, "Email name must be atleast 5 characters long"],
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: [8, "Password must be atleast 8 characters long"],
  },

  status: {
    type: String,
    enum: ["available", "unavailable"],
    default: "available",
  },

  vehicle: {
    color: {
      type: String,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
    },
    model: {
      type: String,
      required: true,
    },

    make: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["bike", "rickshaw", "mini", "sedan", "suv", "van"],
      required: true,
    },
  },
  location: {
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
  },
  socketId: {
    type: String,
  },
});

module.exports = mongoose.model("Driver", driverSchema);
