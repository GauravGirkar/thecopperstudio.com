import { useMemo, useState, useEffect } from "react";
import { apiGet, apiPost } from "../lib/api";
import { AuthContext, STORAGE_KEY } from "./authStore";

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function isNetworkError(err) {
  if (err?.isNetworkError) return true;
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("networkerror") ||
    msg.includes("backend unavailable")
  );
}

function makeDemoSession(role) {
  return {
    token: "demo-local-bypass-token",
    user: {
      id: "demo-" + role,
      name: role === "superadmin" ? "Super Admin" : role === "developer" ? "Developer" : "Client User",
      email: role === "superadmin" ? "admin@thecopperstudio.com" : role === "developer" ? "developer@thecopperstudio.com" : "client@thecopperstudio.com",
      phone: "",
      company: "The Copper Studio",
      jobTitle: role === "superadmin" ? "Super Admin" : role === "developer" ? "Developer" : "Client",
      role,
      status: "active",
      preferences: {},
      _isDemo: true,
    },
  };
}

function inferDemoRoleFromEmail(email) {
  const normalized = String(email || "").toLowerCase();
  if (!normalized) return "superadmin";
  if (normalized.includes("admin") || normalized.includes("superadmin")) return "superadmin";
  if (normalized.includes("developer")) return "developer";
  return "user";
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredAuth());

  const saveSession = (nextSession) => {
    setSession(nextSession);
    if (nextSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || "",
    isAuthenticated: Boolean(session?.token && session?.user),
    isDemo: Boolean(session?.user?._isDemo),
    async login(credentials) {
      try {
        const nextSession = await apiPost("/api/auth/login", credentials);
        saveSession(nextSession);
        return nextSession;
      } catch (err) {
        if (isNetworkError(err)) {
          const demoSession = makeDemoSession(inferDemoRoleFromEmail(credentials.email));
          saveSession(demoSession);
          return demoSession;
        }
        throw err;
      }
    },
    async setPassword(payload) {
      const nextSession = await apiPost("/api/auth/set-password", payload);
      saveSession(nextSession);
      return nextSession;
    },
    async resetPassword(payload) {
      const nextSession = await apiPost("/api/auth/reset-password", payload);
      saveSession(nextSession);
      return nextSession;
    },
    async forgotPassword(payload) {
      return apiPost("/api/auth/forgot-password", payload);
    },
    async refresh() {
      if (!session?.token) return null;
      if (session?.user?._isDemo) return session;
      try {
        const data = await apiGet("/api/auth/me", session.token);
        const nextSession = { ...session, user: data.user };
        saveSession(nextSession);
        return nextSession;
      } catch (err) {
        if (isNetworkError(err)) return session;
        throw err;
      }
    },
    updateUser(updatedUser) {
      const nextSession = { ...session, user: { ...session.user, ...updatedUser } };
      saveSession(nextSession);
    },
    logout() {
      // Revoke this session server-side (client portal only — there's no
      // equivalent endpoint for superadmin) so it actually drops off the
      // Active Sessions list instead of lingering until the token expires.
      // Fire-and-forget: local logout must succeed even if this fails.
      if (session?.token && session?.user?.role === "user" && !session.user._isDemo) {
        apiPost("/api/client/logout", {}, session.token).catch(() => {});
      }
      setSession(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
