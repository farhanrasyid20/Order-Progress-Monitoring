"use client";

import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import { demoUsers } from "@/data/users";
import type { ManagedUser } from "@/app/users/components/user-table";
import { userRoles } from "@/app/users/components/user-table";

const initialUsers: ManagedUser[] = demoUsers;

const UsersContext = createContext<{ users: ManagedUser[]; ready: boolean; setUsers: Dispatch<SetStateAction<ManagedUser[]>> } | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Restore after hydration, before allowing authentication against stored users.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const saved: unknown = JSON.parse(window.localStorage.getItem("cots-users-v1") ?? "null");
      if (Array.isArray(saved) && saved.every(user => user &&
        typeof user.id === "string" && typeof user.name === "string" &&
        typeof user.email === "string" && typeof user.lastActive === "string" &&
        userRoles.includes(user.role) && ["Active", "Inactive"].includes(user.status))) {
        setUsers(saved);
      }
    } catch {
      // Fall back to the demo accounts if stored user data cannot be read.
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem("cots-users-v1", JSON.stringify(users)); }
    catch { /* Keep user changes available for this session when storage is unavailable. */ }
  }, [users, ready]);
  return <UsersContext.Provider value={{ users, ready, setUsers }}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) throw new Error("useUsers must be used within UsersProvider");
  return context;
}
