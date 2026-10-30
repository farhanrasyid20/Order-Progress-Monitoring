"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { useUsers } from "@/components/users/users-provider";
import { authenticateUser } from "@/lib/auth";
import type { ManagedUser } from "@/app/users/components/user-table";

const sessionKey = "cots:demo-session";
const sessionEvent = "cots:session-change";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(sessionEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(sessionEvent, callback);
  };
}
function readSession() {
  try { return window.localStorage.getItem(sessionKey) ?? window.sessionStorage.getItem(sessionKey) ?? ""; }
  catch { return ""; }
}
const AuthContext = createContext<{
  user: ManagedUser | null;
  ready: boolean;
  login: (identity: string, password: string, remember: boolean) => boolean;
  logout: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { users, ready: usersReady } = useUsers();
  const session = useSyncExternalStore(subscribe, readSession, () => null);
  const user = users.find(user => user.id === session && user.status === "Active") ?? null;
  const logout = () => {
    window.localStorage.removeItem(sessionKey);
    window.sessionStorage.removeItem(sessionKey);
    window.dispatchEvent(new Event(sessionEvent));
  };
  const login = (identity: string, password: string, remember: boolean) => {
    if (!usersReady) return false;
    const account = authenticateUser(users, identity, password);
    if (!account) return false;
    window.localStorage.removeItem(sessionKey);
    window.sessionStorage.removeItem(sessionKey);
    (remember ? window.localStorage : window.sessionStorage).setItem(sessionKey, account.id);
    window.dispatchEvent(new Event(sessionEvent));
    return true;
  };
  return <AuthContext.Provider value={{ user, ready: session !== null && usersReady, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
