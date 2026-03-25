import Rider from "../models/Rider.js";
import authService from "./authService.js";

const riderService = {
  // Register a new rider
  async registerRider(data) {
    return await authService.register(Rider, data);
  },

  // Login rider
  async loginRider(email, password) {
    return await authService.login(Rider, email, password);
  },

  // Get rider profile
  async getRiderProfile(rider) {
    if (!rider) {
      throw new Error("Rider not found");
    }
    return rider;
  },

  // Logout rider
  async logoutRider(token) {
    await authService.logout(token);
  },
};

export default riderService;
