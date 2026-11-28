"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

function OffsetContinueConfirmation({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const dismiss = (action: () => void) => {
    if (!dialog.current?.open) return;
    dialog.current.close();
    action();
  };

  return <dialog ref={dialog} role="alertdialog" className="modal-dialog offset-continue-dialog" aria-labelledby={titleId} aria-describedby={`${titleId}-message`}
    onKeyDown={(event) => { if (event.key === "Escape") event.stopPropagation(); }}
    onCancel={(event) => { event.preventDefault(); dismiss(onCancel); }}>
    <header className="modal-header"><h2 id={titleId}>Confirm submission</h2></header>
    <div className="modal-form">
      <p id={`${titleId}-message`}>Are you sure you want to save and continue? Once submitted, this record will be locked and can no longer be edited.</p>
      <footer className="modal-actions">
        <Button type="button" variant="secondary" autoFocus onClick={() => dismiss(onCancel)}>Cancel</Button>
        <Button type="button" onClick={() => dismiss(onConfirm)}>Confirm</Button>
      </footer>
    </div>
  </dialog>;
}

export function useOffsetContinueConfirmation(onConfirm: () => void) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return {
    requestConfirmation: () => setOpen(true),
    confirmation: open ? <OffsetContinueConfirmation onCancel={close} onConfirm={() => { close(); onConfirm(); }} /> : null,
  };
}
