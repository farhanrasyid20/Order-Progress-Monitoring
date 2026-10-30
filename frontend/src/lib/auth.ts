import type { ManagedUser, UserRole } from "@/app/users/components/user-table";
import type { ProjectRole } from "@/types/order";

const sharedRoutes = ["/dashboard", "/history-archive"];
const roleRoutes: Record<UserRole, readonly string[]> = {
  Superadmin: [],
  Designer: [...sharedRoutes, "/orders", "/converting", "/offset", "/design-drawing", "/review-approval"],
  QC: [...sharedRoutes, "/quality-control", "/fa-report", "/submit-sample", "/after-sample", "/closing"],
  Intern: [...sharedRoutes, "/converting/tooling-progress", "/converting/rubber-order-setting"],
};

export function canAccessPath(role: UserRole, pathname: string) {
  if (role === "Superadmin") return true;
  return roleRoutes[role].some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export function authenticateUser(users: ManagedUser[], identity: string, password: string) {
  if (password !== "password") return null;
  const normalized = identity.trim().toLowerCase();
  return users.find(user => user.status === "Active" &&
    [user.name.toLowerCase(), user.email.toLowerCase()].includes(normalized)) ?? null;
}

export const workflowRoleForUser: Record<UserRole, ProjectRole> = {
  Superadmin: "superadmin", Designer: "design", QC: "qc", Intern: "intern",
};
