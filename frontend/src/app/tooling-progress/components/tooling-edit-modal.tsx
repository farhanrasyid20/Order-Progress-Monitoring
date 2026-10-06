"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type ToolingEditModalProps = {
  order: Order;
  onClose: () => void;
};

/** Tooling Progress owns this edit form for projects received after approval. */
export function ToolingEditModal({ order, onClose }: ToolingEditModalProps) {
  const titleId = useId();
  const { advanceOrder } = useWorkflowOrders();
  const [tooling, setTooling] = useState("AUTO PEELING");
  const [dateReceive, setDateReceive] = useState(order.deadline);
  const [orderBy, setOrderBy] = useState(order.pic);
  const [invoice, setInvoice] = useState("");
  const [remark, setRemark] = useState(order.description === "-" ? "" : order.description);

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
      pic: orderBy,
      deadline: dateReceive,
      description: remark || `Tooling: ${tooling}${invoice ? ` | Invoice: ${invoice}` : ""}`,
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
            <h2 id={titleId}>Update Tooling</h2>
            <p>Simpan detail tooling {order.no} lalu kirim ke Rubber Order &amp; Setting.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir tooling"
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
              <span>Tooling</span>
              <select value={tooling} onChange={(event) => setTooling(event.target.value)}>
                <option>AUTO PEELING</option>
                <option>NIKKO</option>
                <option>NIKKO PEELING</option>
                <option>AUTO HAIDO</option>
                <option>JINYA</option>
                <option>TMZ</option>
              </select>
            </label>
            <label className="modal-field">
              <span>Date Receive</span>
              <input
                value={dateReceive}
                onChange={(event) => setDateReceive(event.target.value)}
                required
              />
            </label>
            <label className="modal-field">
              <span>Order By</span>
              <input
                value={orderBy}
                onChange={(event) => setOrderBy(event.target.value)}
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Invoice Number Received</span>
              <input
                value={invoice}
                onChange={(event) => setInvoice(event.target.value)}
                placeholder="Nomor invoice penerimaan"
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Catatan tooling"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Simpan &amp; Lanjut ke Rubber
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
