"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type OffsetStageModalProps = {
  order: Order;
  onClose: () => void;
  title: string;
  nextLabel: string;
};

/** Generic completion handoff for the non-SPK Offset work queues. */
export function OffsetStageModal({ order, onClose, title, nextLabel }: OffsetStageModalProps) {
  const titleId = useId();
  const { advanceOrder } = useWorkflowOrders();
  const [pic, setPic] = useState(order.pic === "-" ? "" : order.pic);
  const [deadline, setDeadline] = useState("");
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
    advanceOrder(order.no, {
      pic,
      deadline: deadline || order.deadline,
      description: notes.trim() || `${title} completed.`,
    });
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
      <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>Selesaikan tugas Offset {order.no} lalu teruskan ke {nextLabel}.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label={`Tutup formulir ${title}`}
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Part Number / Code</span>
              <input value={order.no} disabled />
            </label>
            <label className="modal-field">
              <span>PIC</span>
              <input value={pic} onChange={(event) => setPic(event.target.value)} required />
            </label>
            <label className="modal-field modal-field-full">
              <span>Target Selesai</span>
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </label>
            <label className="modal-field modal-field-full">
              <span>Catatan Proses</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Masukkan hasil proses, hambatan, atau instruksi handoff"
                rows={4}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Selesai &amp; Lanjut
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
