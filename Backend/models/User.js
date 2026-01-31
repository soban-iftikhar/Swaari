import mongoose from "mongoose";
import authPlugin from "../utils/authPlugin.js";

const userSchema = new mongoose.Schema(
  {
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

    socketId: {
      type: String,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Apply auth plugin
userSchema.plugin(authPlugin);

const User = mongoose.model("User", userSchema);
export default User;
