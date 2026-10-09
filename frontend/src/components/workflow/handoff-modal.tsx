"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "./workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type HandoffModalProps = {
  order: Order;
  onClose: () => void;
  title: string;
  copy: string;
  nextLabel: string;
  referenceLabel: string;
  referencePrefix: string;
};

/** Reusable completion form for shared QC and closing work queues. */
export function HandoffModal({
  order,
  onClose,
  title,
  copy,
  nextLabel,
  referenceLabel,
  referencePrefix,
}: HandoffModalProps) {
  const titleId = useId();
  const { advanceOrder } = useWorkflowOrders();
  const [pic, setPic] = useState(order.pic === "-" ? "" : order.pic);
  const [reference, setReference] = useState(`${order.no}-${referencePrefix}`);
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
      description: notes.trim() || `${title}: ${reference}`,
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
            <p>{copy}</p>
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
              <span>PIC</span>
              <input value={pic} onChange={(event) => setPic(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>{referenceLabel}</span>
              <input value={reference} onChange={(event) => setReference(event.target.value)} required />
            </label>
            <label className="modal-field modal-field-full">
              <span>Catatan</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Masukkan hasil pemeriksaan atau catatan handoff"
                rows={4}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Simpan &amp; Lanjut ke {nextLabel}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
