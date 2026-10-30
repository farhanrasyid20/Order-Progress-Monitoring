import type { ManagedUser } from "@/app/users/components/user-table";

/** Frontend demo accounts; each account uses the password "password". */
export const demoUsers: ManagedUser[] = [
  { id: "user-farhan", name: "Farhan", email: "farhan@cots.id", role: "Superadmin", status: "Active", lastActive: "Just now" },
  { id: "user-andre", name: "Andre", email: "andre@cots.id", role: "Superadmin", status: "Active", lastActive: "Just now" },
  { id: "user-anantha", name: "Anantha", email: "anantha@cots.id", role: "Designer", status: "Active", lastActive: "Just now" },
  { id: "user-anisa", name: "Anisa", email: "anisa@cots.id", role: "QC", status: "Active", lastActive: "Just now" },
  { id: "user-jose", name: "Jose", email: "jose@cots.id", role: "Intern", status: "Active", lastActive: "Just now" },
];
