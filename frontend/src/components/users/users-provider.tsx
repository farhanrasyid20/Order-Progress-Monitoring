"use client";

import { createContext, useContext, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import type { ManagedUser } from "@/app/users/components/user-table";

const initialUsers: ManagedUser[] = [
  {
    id: "user-1",
    name: "Siti Rahma",
    email: "siti.rahma@cots.id",
    role: "Administrator",
    status: "Active",
    lastActive: "Just now",
  },
  {
    id: "user-2",
    name: "Andi Pratama",
    email: "andi.pratama@cots.id",
    role: "Project Manager",
    status: "Active",
    lastActive: "12 minutes ago",
  },
  {
    id: "user-3",
    name: "Nadia Putri",
    email: "nadia.putri@cots.id",
    role: "Designer",
    status: "Active",
    lastActive: "1 hour ago",
  },
  {
    id: "user-4",
    name: "Bima Saputra",
    email: "bima.saputra@cots.id",
    role: "Quality Control",
    status: "Active",
    lastActive: "Yesterday",
  },
  {
    id: "user-5",
    name: "Maya Lestari",
    email: "maya.lestari@cots.id",
    role: "Viewer",
    status: "Inactive",
    lastActive: "4 days ago",
  },
];


const UsersContext = createContext<{ users: ManagedUser[]; setUsers: Dispatch<SetStateAction<ManagedUser[]>> } | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  return <UsersContext.Provider value={{ users, setUsers }}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) throw new Error("useUsers must be used within UsersProvider");
  return context;
}
