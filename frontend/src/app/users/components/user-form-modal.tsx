"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  userRoles,
  type ManagedUser,
  type UserDraft,
  type UserRole,
  type UserStatus,
} from "./user-table";

export type UserFormModalProps = {
  user: ManagedUser | null;
  onClose: () => void;
  onSave: (user: UserDraft) => void;
};

const emptyDraft: UserDraft = {
  name: "",
  email: "",
  role: "Viewer",
  status: "Active",
};

function toDraft(user: ManagedUser | null): UserDraft {
  if (!user) {
    return emptyDraft;
  }

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

/** Local add/edit dialog for the User Management feature. */
export function UserFormModal({ user, onClose, onSave }: UserFormModalProps) {
  const [draft, setDraft] = useState<UserDraft>(() => toDraft(user));
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isEditing = user !== null;

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
    });
  };

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="modal-header">
          <div>
            <h2 id={titleId}>{isEditing ? "Edit User" : "Add User"}</h2>
            <p>
              {isEditing
                ? "Update the user profile and access role."
                : "Create a user and assign their workspace role."}
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close user form"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-field">
            <span>Full name</span>
            <input
              ref={nameInputRef}
              type="text"
              value={draft.name}
              autoComplete="name"
              required
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>

          <label className="modal-field">
            <span>Email address</span>
            <input
              type="email"
              value={draft.email}
              autoComplete="email"
              required
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Role</span>
              <select
                value={draft.role}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    role: event.target.value as UserRole,
                  }))
                }
              >
                {userRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="modal-field">
              <span>Status</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as UserStatus,
                  }))
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={isEditing ? "pen" : "plus"}>
              {isEditing ? "Save Changes" : "Add User"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
