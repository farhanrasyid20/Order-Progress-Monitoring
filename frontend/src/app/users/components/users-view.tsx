"use client";

import { useState } from "react";
import { useUsers } from "@/components/users/users-provider";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";
import { UserFormModal } from "./user-form-modal";
import {
  UserTable,
  type ManagedUser,
  type UserDraft,
} from "./user-table";

/** Self-contained User Management screen and its local mock-data interactions. */
export function UsersView() {
  const { users, setUsers } = useUsers();
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const pagination = useTablePagination(users);

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

    pagination.resetPage();
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

      <section className="card users-card" aria-labelledby="users-table-title">
        <div className="section-head">
          <div>
            <h2 id="users-table-title">Workspace Users</h2>
            <p>
              {users.length} users &middot; {activeUserCount} active
            </p>
          </div>
        </div>
        <UserTable users={pagination.pageItems} onEdit={openEditForm} />
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          itemLabel="users"
          onPageChange={pagination.goToPage}
        />
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
