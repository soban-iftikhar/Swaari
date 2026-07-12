import Driver from "../models/Driver.js";
import Ride, { RIDE_STATUS } from "../models/Ride.js";
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

  /**
   * Toggle the driver's online/offline availability (the workspace toggle).
   * Going online optionally seeds the current location for matching.
   * @param {string} driverId
   * @param {boolean} isOnline
   * @param {{lat:number, lng:number}} [coords]
   * @returns {Promise<object>}
   */
  async setOnlineStatus(driverId, isOnline, coords) {
    const update = {
      isOnline,
      status: isOnline ? "available" : "unavailable",
    };
    if (isOnline && coords?.lat != null && coords?.lng != null) {
      update.location = {
        type: "Point",
        coordinates: [coords.lng, coords.lat],
        updatedAt: new Date(),
      };
    }
    const driver = await Driver.findByIdAndUpdate(driverId, update, { new: true });
    return driver;
  },

  /**
   * Persist the driver's latest position (GeoJSON [lng, lat]).
   * @param {string} driverId
   * @param {{lat:number, lng:number}} coords
   */
  async updateLocation(driverId, coords) {
    if (coords?.lat == null || coords?.lng == null) {
      throw new Error("lat and lng are required");
    }
    return Driver.findByIdAndUpdate(
      driverId,
      { location: { type: "Point", coordinates: [coords.lng, coords.lat], updatedAt: new Date() } },
      { new: true },
    );
  },

  /**
   * Aggregate the driver analytics dashboard: lifetime stats, rating, and a
   * 7-day earnings/trip breakdown from completed rides.
   * @param {string} driverId
   * @returns {Promise<object>}
   */
  async getDashboardStats(driverId) {
    const driver = await Driver.findById(driverId).select("stats rating");

    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const completed = await Ride.find({
      driver: driverId,
      status: RIDE_STATUS.COMPLETED,
      "timeline.completedAt": { $gte: since },
    }).select("fare fareEstimate timeline.completedAt");

    // Bucket earnings/trips by day-of-week for the weekly chart.
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      return { label: days[d.getDay()], date: d.toISOString().slice(0, 10), earnings: 0, trips: 0 };
    });
    const indexByDate = new Map(weekly.map((w, i) => [w.date, i]));

    for (const ride of completed) {
      const key = ride.timeline?.completedAt?.toISOString().slice(0, 10);
      const idx = indexByDate.get(key);
      if (idx != null) {
        weekly[idx].earnings += ride.fare ?? ride.fareEstimate ?? 0;
        weekly[idx].trips += 1;
      }
    }

    return {
      stats: driver?.stats || { totalTrips: 0, totalEarnings: 0 },
      rating: driver?.rating || { average: 5, count: 0 },
      weekly,
      weekEarnings: weekly.reduce((s, w) => s + w.earnings, 0),
      weekTrips: weekly.reduce((s, w) => s + w.trips, 0),
    };
  },
};

export default driverService;

