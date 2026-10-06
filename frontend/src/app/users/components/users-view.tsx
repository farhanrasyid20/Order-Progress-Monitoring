"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserFormModal } from "./user-form-modal";
import {
  UserTable,
  type ManagedUser,
  type UserDraft,
} from "./user-table";

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

export type UsersViewProps = {
  initialData?: ManagedUser[];
};

/** Self-contained User Management screen and its local mock-data interactions. */
export function UsersView({ initialData = initialUsers }: UsersViewProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialData);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const openAddForm = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user: ManagedUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const saveUser = (draft: UserDraft) => {
    if (editingUser) {
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === editingUser.id ? { ...user, ...draft } : user,
        ),
      );
    } else {
      setUsers((currentUsers) => [
        {
          id: `user-${Date.now()}`,
          ...draft,
          lastActive: "Just now",
        },
        ...currentUsers,
      ]);
    }

    closeForm();
  };

  const activeUserCount = users.filter((user) => user.status === "Active").length;

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>User Management</h1>
          <p>Manage users, roles, and access permissions.</p>
        </div>
        <Button type="button" icon="plus" onClick={openAddForm}>
          Add User
        </Button>
      </div>

      <section className="card full-orders users-card" aria-labelledby="users-table-title">
        <div className="section-head">
          <div>
            <h2 id="users-table-title">Workspace Users</h2>
            <p>
              {users.length} users &middot; {activeUserCount} active
            </p>
          </div>
        </div>
        <UserTable users={users} onEdit={openEditForm} />
      </section>

      {isFormOpen ? (
        <UserFormModal
          user={editingUser}
          onClose={closeForm}
          onSave={saveUser}
        />
      ) : null}
    </>
  );
}

export default UsersView;
