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
  const [pic] = useState(order.pic);
  const [deadline] = useState(order.deadline);
  const [sampleNumber] = useState(order.sampleProgress?.at(-1)?.sampleNumber ?? `${order.no}${order.requirementBranch ? "-" + order.requirementBranch.toUpperCase() : ""}-SMP`);
  const [notes, setNotes] = useState(order.sampleProgress?.at(-1)?.notes ?? "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    advanceOrder(order.id, { pic, deadline }, { pic, deadline, sampleNumber, notes });
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
            <h2 id={titleId}>Update Sample</h2>
            <p>Send the completed sample to QC Checking.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close sample form"
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
              <input value={pic} disabled />
            </label>
            <label className="modal-field">
              <span>Target Completion Date</span>
              <input
                value={deadline}
                disabled
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Sample Number</span>
              <input
                value={sampleNumber}
                disabled
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Production Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes for sample finalization"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon="arrow">
              Complete &amp; Send to QC
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
