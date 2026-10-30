"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { ManagedUser } from "./user-table";

export function DeleteUserModal({ user, onClose, onConfirm }: {
  user: ManagedUser;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialogRef.current?.showModal(); }, []);

  return <dialog ref={dialogRef} className="modal-dialog delete-user-dialog" aria-labelledby={titleId}
    aria-describedby={`${titleId}-description`} onCancel={onClose} onClose={onClose}>
    <header className="modal-header">
      <div><h2 id={titleId}>Delete User</h2><p>Hapus user yang sudah tidak digunakan.</p></div>
      <button type="button" className="modal-close" aria-label="Close delete user" onClick={onClose}><Icon name="close" size={18} /></button>
    </header>
    <form className="modal-form" onSubmit={(event) => { event.preventDefault(); onConfirm(); }}>
      <p id={`${titleId}-description`}>Hapus user <strong>{user.name}</strong> ({user.email})? User ini tidak bisa login lagi setelah dihapus.</p>
      <footer className="modal-actions">
        <Button type="button" variant="secondary" autoFocus onClick={onClose}>Cancel</Button>
        <Button type="submit" icon="trash" className="user-delete-confirm">Delete User</Button>
      </footer>
    </form>
  </dialog>;
}
