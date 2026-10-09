"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type SampleEditModalProps = {
  order: Order;
  onClose: () => void;
};

/** Sample Progress handoff for Converting work that is ready for QC. */
export function SampleEditModal({ order, onClose }: SampleEditModalProps) {
  const titleId = useId();
  const { advanceOrder } = useWorkflowOrders();
  const [pic, setPic] = useState(order.pic);
  const [deadline, setDeadline] = useState(order.deadline);
  const [sampleNumber, setSampleNumber] = useState(`${order.no}-SMP`);
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
    advanceOrder(order.no, { pic, deadline });
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
            <h2 id={titleId}>Perbarui Sample</h2>
            <p>Kirim sample yang selesai ke tahap QC Checking.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir sample"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Sample PIC</span>
              <input value={pic} onChange={(event) => setPic(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Target sample selesai</span>
              <input
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Nomor sample</span>
              <input
                value={sampleNumber}
                onChange={(event) => setSampleNumber(event.target.value)}
                placeholder="ID sample atau nomor revisi"
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Catatan produksi</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Catatan untuk proses finalisasi sample"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Selesaikan &amp; Kirim ke QC
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
