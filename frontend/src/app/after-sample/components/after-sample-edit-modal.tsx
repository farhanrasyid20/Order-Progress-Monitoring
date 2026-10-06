"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type AfterSampleEditModalProps = {
  order: Order;
  onClose: () => void;
};

/** Feature-owned decision form for a project with a completed sample. */
export function AfterSampleEditModal({
  order,
  onClose,
}: AfterSampleEditModalProps) {
  const titleId = useId();
  const { advanceOrder, moveOrderToStage } = useWorkflowOrders();
  const [pic, setPic] = useState(order.pic);
  const [decision, setDecision] = useState("Lanjut ke Order");
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
    const values = {
      pic,
      description: notes.trim() || `Keputusan: ${decision}`,
    };

    if (decision === "Lanjut ke Order") {
      moveOrderToStage(order.no, "order-production", values);
    } else {
      advanceOrder(order.no, values);
    }
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
            <h2 id={titleId}>After Sample / Decision</h2>
            <p>Tentukan tindak lanjut setelah sample {order.no} selesai.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir keputusan"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>PIC</span>
              <input value={pic} onChange={(event) => setPic(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Keputusan</span>
              <select value={decision} onChange={(event) => setDecision(event.target.value)}>
                <option>Lanjut ke Order</option>
                <option>Hanya Sample Saja</option>
              </select>
            </label>
            <label className="modal-field modal-field-full">
              <span>Catatan</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Catatan akhir atau instruksi tindak lanjut"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="check">
              Simpan Keputusan
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
