"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type ApprovalEditModalProps = {
  order: Order;
  onClose: () => void;
};

/** Review & Approval's local edit form for the order received from Design. */
export function ApprovalEditModal({ order, onClose }: ApprovalEditModalProps) {
  const titleId = useId();
  const { advanceOrder } = useWorkflowOrders();
  const [reviewer, setReviewer] = useState(order.pic);
  const [deadline, setDeadline] = useState(order.deadline);
  const [approvalReference, setApprovalReference] = useState(`${order.no}-APP`);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    advanceOrder(order.no, { pic: reviewer, deadline });
    onClose();
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
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>Review &amp; Approval</h2>
            <p>Setujui {order.no} dan teruskan ke Tooling Progress.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir review"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Reviewer</span>
              <input
                value={reviewer}
                onChange={(event) => setReviewer(event.target.value)}
                required
              />
            </label>
            <label className="modal-field">
              <span>Target tooling</span>
              <input
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Referensi approval</span>
              <input
                value={approvalReference}
                onChange={(event) => setApprovalReference(event.target.value)}
                placeholder="Nomor approval atau konfirmasi customer"
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Catatan review</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Catatan untuk proses tooling"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Setujui &amp; Kirim ke Tooling
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
