"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type DrawingEditModalProps = {
  order: Order;
  onClose: () => void;
};

/**
 * Design & Drawing owns this form. Saving it completes the current queue task
 * and makes the drawing available for a decision in Incoming Design.
 */
export function DrawingEditModal({ order, onClose }: DrawingEditModalProps) {
  const titleId = useId();
  const { submitDrawing } = useWorkflowOrders();
  const [pic, setPic] = useState(order.pic);
  const [deadline, setDeadline] = useState(order.deadline);
  const [drawingLink, setDrawingLink] = useState(order.workflow.drawingLink ?? "");
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
    submitDrawing(order.no, { pic, deadline, drawingLink, notes });
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
            <h2 id={titleId}>Perbarui Desain</h2>
            <p>Kirim link drawing {order.no} ke Incoming Design.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir desain"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Designer / PIC</span>
              <input value={pic} onChange={(event) => setPic(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Deadline</span>
              <input
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Link drawing</span>
              <input
                type="url"
                value={drawingLink}
                onChange={(event) => setDrawingLink(event.target.value)}
                placeholder="https://..."
                pattern="https?://.+"
                title="Gunakan link yang diawali http:// atau https://"
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Catatan</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Tambahkan catatan untuk keputusan desain"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Simpan Link Drawing
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
