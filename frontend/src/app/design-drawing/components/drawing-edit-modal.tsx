"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { isNetworkPath } from "@/lib/drawing-link";
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
  const [drawingLink, setDrawingLink] = useState(order.workflow.drawingLink?.startsWith("file:") ? "" : order.workflow.drawingLink ?? "");
  const [drawingNetworkPath, setDrawingNetworkPath] = useState(order.workflow.drawingNetworkPath ?? "");
  const [selectedFileName, setSelectedFileName] = useState(order.workflow.drawingFileName ?? "");
  const [notes, setNotes] = useState("");
  const [sourceError, setSourceError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const source = drawingNetworkPath.trim() || drawingLink.trim();

    if (!source) {
      setSourceError("Enter a file-server path or an internal web link for the drawing.");
      return;
    }

    if (!isNetworkPath(source) && !/^https?:\/\//i.test(source) && !/^file:\/\//i.test(source)) {
      setSourceError("Use a server path such as \\\\iib\\data\\... or an http(s) link.");
      return;
    }

    submitDrawing(order.id, {
      pic,
      deadline,
      drawingLink: source,
      drawingNetworkPath: isNetworkPath(source) ? source : undefined,
      drawingFileName: selectedFileName || undefined,
      notes,
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
              <span>File-server path</span>
              <input
                value={drawingNetworkPath}
                onChange={(event) => {
                  setDrawingNetworkPath(event.target.value);
                  setSourceError("");
                }}
                placeholder="\\\\iib\\data\\Drawing\\...\\drawing.pdf"
                title="Paste the path copied from the company file server"
              />
              <small className="drawing-source-help">Paste the path from File Explorer. Once file-server browsing is connected, this field will be filled automatically.</small>
            </label>
            <label className="modal-field modal-field-full">
              <span>Web link (optional)</span>
              <input
                type="url"
                value={drawingLink}
                onChange={(event) => {
                  setDrawingLink(event.target.value);
                  setSourceError("");
                }}
                placeholder="https://files.internal/..."
                pattern="https?://.+"
                title="Use an http:// or https:// drawing link"
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Select drawing file</span>
              <span className="project-file-picker">
                <input
                  type="file"
                  onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
                />
                <span className="project-file-button" aria-hidden="true"><Icon name="file" size={15} /> Select file</span>
                <span className={`project-file-name${selectedFileName ? " is-selected" : ""}`} aria-hidden="true">{selectedFileName || "No file selected"}</span>
              </span>
              <small className="drawing-source-help">Selecting a file confirms its name; paste its server path above until the company file-server browser is connected.</small>
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
              Simpan Drawing
            </Button>
          </footer>
          {sourceError ? <p className="project-form-error" role="alert">{sourceError}</p> : null}
        </form>
      </section>
    </div>
  );
}
