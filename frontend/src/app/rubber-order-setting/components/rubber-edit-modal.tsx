"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order } from "@/types/order";

export type RubberEditModalProps = {
  order: Order;
  onClose: () => void;
};

/** Rubber Order & Setting owns its edit form for work received from Tooling. */
export function RubberEditModal({ order, onClose }: RubberEditModalProps) {
  const titleId = useId();
  const { advanceOrder } = useWorkflowOrders();
  const [rubber, setRubber] = useState("Rubber 4MM");
  const [rubberProgress, setRubberProgress] = useState("Waiting KTP");
  const [dateReceive, setDateReceive] = useState(order.deadline);
  const [orderBy, setOrderBy] = useState(order.pic);
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
      description:
        remark || `Rubber: ${rubber} | Progress: ${rubberProgress}`,
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
            <h2 id={titleId}>Update Rubber Order</h2>
            <p>Simpan setting rubber {order.no} lalu lanjutkan ke Sample Progress.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir rubber"
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
              <span>Rubber</span>
              <select value={rubber} onChange={(event) => setRubber(event.target.value)}>
                <option>Rubber 4MM</option>
                <option>Rubber Duppon 3MM</option>
                <option>Rubber Varnish 1.7MM</option>
                <option>Stencil</option>
              </select>
            </label>
            <label className="modal-field">
              <span>Rubber Progress</span>
              <select
                value={rubberProgress}
                onChange={(event) => setRubberProgress(event.target.value)}
              >
                <option>Waiting KTP</option>
                <option>Waiting Check</option>
                <option>Done</option>
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
            <label className="modal-field modal-field-full">
              <span>Order By</span>
              <input
                value={orderBy}
                onChange={(event) => setOrderBy(event.target.value)}
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Catatan rubber order dan setting"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Simpan &amp; Lanjut ke Sample
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
