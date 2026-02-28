import User from "../models/User.js";
import authService from "./authService.js";

const userService = {
  // Register a new user
  async registerUser(data) {
    return await authService.register(User, data);
  },

  // Login user
  async loginUser(email, password) {
    return await authService.login(User, email, password);
  },

  // Get user profile
  async getUserProfile(user) {
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  // Logout user
  async logoutUser(token) {
    await authService.logout(token);
  },
};

export default userService;
