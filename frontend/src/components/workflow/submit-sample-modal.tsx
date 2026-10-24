"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useWorkflowOrders } from "./workflow-provider";
import type { Order } from "@/types/order";

export function SubmitSampleModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const titleId = useId();
  const { submitSample } = useWorkflowOrders();
  const [date, setDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationError, setConfirmationError] = useState(false);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed) {
      setConfirmationError(true);
      return;
    }
    if (!date) return;
    submitSample(order.id, date);
    onClose();
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className="modal-header"><div><h2 id={titleId}>Submit Sample</h2><p>{order.no} / {order.product}</p></div><button className="modal-close" type="button" aria-label="Close Submit Sample" onClick={onClose}><Icon name="close" size={18} /></button></header>
      <form className="modal-form" onSubmit={handleSubmit}>
        <label className="modal-field"><span>Submission Date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required autoFocus /></label>
        <label className="closing-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); if (event.target.checked) setConfirmationError(false); }} aria-required="true" aria-invalid={confirmationError} aria-describedby={confirmationError ? `${titleId}-confirmation-error` : undefined} /><span>I confirm this sample has been submitted on the selected date.</span></label>
        {confirmationError ? <p id={`${titleId}-confirmation-error`} className="project-form-error" role="alert">Please tick the confirmation checkbox before submitting the sample.</p> : null}
        <p className="submit-sample-note">After confirmation, this project will wait for Sample Approve, Revision, or Cancel.</p>
        <footer className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Back</Button><Button type="submit" icon="check" disabled={!date}>Confirm Submit Sample</Button></footer>
      </form>
    </section>
  </div>;
}
