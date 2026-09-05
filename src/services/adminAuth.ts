import { useState, useEffect } from "react";

export interface AdminSession {
  token: string;
  role: string;
  fullName: string;
  email: string;
}

const SESSION_KEY = "vb_admin_session";

export function getAuthSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch (err) {
    console.error("Error reading admin session from localStorage", err);
    return null;
  }
}

export function getAuthToken(): string | null {
  const session = getAuthSession();
  return session ? session.token : null;
}

export function setAuthSession(session: AdminSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("vb-auth-updated"));
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminSession | null>(getAuthSession());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const currentSession = getAuthSession();
      setUser(currentSession);
      // Both ADMIN and STAFF are considered "admin" for dashboard access
      setIsAdmin(currentSession !== null && (currentSession.role === "ADMIN" || currentSession.role === "STAFF"));
      setLoading(false);
    };

    checkAuth();

    // Listen to our custom event for auth changes across tabs/components
    window.addEventListener("vb-auth-updated", checkAuth);
    return () => {
      window.removeEventListener("vb-auth-updated", checkAuth);
    };
  }, []);

  return { user, isAdmin, loading };
}

export async function logout(): Promise<void> {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("vb-auth-updated"));
}
