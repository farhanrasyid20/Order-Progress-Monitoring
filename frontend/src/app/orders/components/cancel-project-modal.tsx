"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export type CancelProjectModalProps = {
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

/**
 * Feature-owned confirmation dialog for cancelling a Design Masuk project.
 * A non-empty reason is required so the calling workflow can record it.
 */
export function CancelProjectModal({
  onClose,
  onConfirm,
}: CancelProjectModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const reasonId = useId();
  const errorId = useId();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError("Cancellation reason is required.");
      return;
    }

    onConfirm(trimmedReason);
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>Cancel Project?</h2>
            <p id={descriptionId}>
              The project will be marked as cancelled and cannot be updated further.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close cancellation dialog"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <label className="modal-field modal-field-full" htmlFor={reasonId}>
            <span>Cancellation Reason</span>
            <textarea
              id={reasonId}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError("");
              }}
              placeholder="Explain why this project is being cancelled..."
              rows={4}
              required
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            {error ? (
              <small className="project-form-error" id={errorId} role="alert">
                {error}
              </small>
            ) : null}
          </label>

          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Keep Project
            </Button>
            <Button
              type="submit"
              icon="alert"
              style={{
                background: "var(--danger)",
                borderColor: "var(--danger)",
                color: "var(--surface)",
              }}
            >
              Cancel Project
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default CancelProjectModal;
