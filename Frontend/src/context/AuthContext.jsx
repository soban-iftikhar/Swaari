import { createContext, useContext, useState, useCallback, useMemo } from "react";
import api from "../lib/api";
import { disconnectSocket } from "../lib/socket";

/**
 * AuthContext — the single source of truth for authentication.
 *
 * Persists the access token, role, and user profile to localStorage so sessions
 * survive reloads, and exposes `login` / `logout` helpers. Ride and Socket
 * layers read the token from here (via localStorage) to authenticate.
 */
const AuthContext = createContext(null);

/** Read the initial auth state from localStorage (runs once on mount). */
function readStoredAuth() {
  try {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("user");
    return {
      token: token || null,
      role: role || null,
      user: user ? JSON.parse(user) : null,
    };
  } catch {
    return { token: null, role: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [{ token, role, user }, setAuth] = useState(readStoredAuth);

  /**
   * Persist a successful auth result and update state.
   * @param {{accessToken:string, role:string, entity:object}} payload
   *   (the shape returned by the login/register API)
   */
  const login = useCallback(({ accessToken, role: nextRole, entity }) => {
    const firstName =
      entity?.fullname?.firstname || entity?.fullName?.firstName || "";

    localStorage.setItem("token", accessToken);
    localStorage.setItem("role", nextRole);
    localStorage.setItem("user", JSON.stringify(entity || {}));
    if (firstName) localStorage.setItem("firstName", firstName);

    setAuth({ token: accessToken, role: nextRole, user: entity || null });
  }, []);

  /** Merge fields into the cached user (e.g. after a profile refresh). */
  const updateUser = useCallback((patch) => {
    setAuth((prev) => {
      const nextUser = { ...(prev.user || {}), ...patch };
      localStorage.setItem("user", JSON.stringify(nextUser));
      return { ...prev, user: nextUser };
    });
  }, []);

  /** Clear the session locally and best-effort notify the server. */
  const logout = useCallback(async () => {
    const currentRole = localStorage.getItem("role");
    const path = currentRole === "driver" ? "/api/drivers/logout" : "/api/riders/logout";
    try {
      await api.get(path);
    } catch {
      /* logout is best-effort; clear locally regardless */
    } finally {
      ["token", "role", "user", "firstName"].forEach((k) => localStorage.removeItem(k));
      disconnectSocket();
      setAuth({ token: null, role: null, user: null });
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      role,
      user,
      isAuthenticated: !!token,
      isRider: role === "rider",
      isDriver: role === "driver",
      login,
      logout,
      updateUser,
    }),
    [token, role, user, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export default AuthContext;
