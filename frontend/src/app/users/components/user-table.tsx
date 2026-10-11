"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

export const userRoles = [
  "Administrator",
  "Project Manager",
  "Designer",
  "Quality Control",
  "Viewer",
] as const;

export type UserRole = (typeof userRoles)[number];
export type UserStatus = "Active" | "Inactive";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
};

export type UserDraft = Pick<
  ManagedUser,
  "name" | "email" | "role" | "status"
>;

export type UserTableProps = {
  users: ManagedUser[];
  onEdit: (user: ManagedUser) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Feature-owned user table with a row action for editing a user. */
export function UserTable({ users, onEdit }: UserTableProps) {
  return (
    <div className="table-wrap">
      <table className="users-table">
        <colgroup>
          <col className="users-identity-column" />
          <col className="users-role-column" />
          <col className="users-status-column" />
          <col className="users-activity-column" />
          <col className="users-action-column" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">User</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Last Active</th>
            <th scope="col" className="users-action-cell">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <div className="user-identity">
                  <span className="user-avatar" aria-hidden="true">
                    {initials(user.name)}
                  </span>
                  <div>
                    <strong className="user-name">{user.name}</strong>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="user-role">{user.role}</span>
              </td>
              <td>
                <Badge tone={user.status === "Active" ? "success" : "warning"}>
                  {user.status}
                </Badge>
              </td>
              <td>{user.lastActive}</td>
              <td className="users-action-cell">
                <div className="table-actions">
                  <button
                    type="button"
                    className="table-action user-edit-action"
                    aria-label={`Edit ${user.name}`}
                    title={`Edit ${user.name}`}
                    onClick={() => onEdit(user)}
                  >
                    <Icon name="pen" size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 ? (
        <div className="empty-state">
          <div>
            <Icon name="users" />
          </div>
          <h3>No users found</h3>
          <p>Add a user to start managing workspace access.</p>
        </div>
      ) : null}
    </div>
  );
}
