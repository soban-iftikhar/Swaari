import Driver from "../models/Driver.js";
import authService from "./authService.js";

const driverService = {
  // Register a new driver
  async registerDriver(data) {
    return await authService.register(Driver, data);
  },

  // Login driver
  async loginDriver(email, password) {
    return await authService.login(Driver, email, password);
  },

  // Get driver profile
  async getDriverProfile(driver) {
    if (!driver) {
      throw new Error("Driver not found");
    }
    return driver;
  },

  // Logout driver
  async logoutDriver(token) {
    await authService.logout(token);
  },
};

export default driverService;
