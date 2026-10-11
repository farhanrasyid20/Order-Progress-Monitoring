"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-input-wrapper">
      <input {...props} type={visible ? "text" : "password"} />
      <button type="button" className="password-visibility-toggle"
        aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
        <Icon name={visible ? "eye" : "eye-off"} size={18} />
      </button>
    </span>
  );
}

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const noticeId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const elements = dialogRef.current?.querySelectorAll<HTMLElement>("button, input");
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword !== confirmation) {
      setError("Konfirmasi password harus sama dengan password baru.");
    } else if (newPassword === currentPassword) {
      setError("Password baru harus berbeda dari password lama.");
    } else {
      setError("Password belum diubah. Layanan autentikasi belum terhubung.");
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section ref={dialogRef} className="modal-dialog change-password-dialog" role="dialog"
        aria-modal="true" aria-labelledby={titleId} aria-describedby={noticeId}>
        <header className="modal-header">
          <div><h2 id={titleId}>Change Password</h2><p>Perbarui password akun kamu.</p></div>
          <button type="button" className="modal-close" aria-label="Tutup modal" onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="change-password-fields">
            <label className="modal-field"><span>Current Password</span>
              <PasswordInput autoComplete="current-password" required autoFocus
                value={currentPassword} onChange={(event) => { setCurrentPassword(event.target.value); setError(""); }} />
            </label>
            <label className="modal-field"><span>New Password</span>
              <PasswordInput autoComplete="new-password" required minLength={8}
                placeholder="Minimum of 8 characters" value={newPassword}
                onChange={(event) => { setNewPassword(event.target.value); setError(""); }} />
            </label>
            <label className="modal-field"><span>Confirm New Password</span>
              <PasswordInput autoComplete="new-password" required minLength={8}
                value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setError(""); }} />
            </label>
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Change Password</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
