"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { MaterialRequestStatus, Order } from "@/types/order";

export type MaterialRequestModalProps = {
  order: Order;
  onClose: () => void;
  offset?: boolean;
};

const statuses: readonly { value: MaterialRequestStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "requested", label: "Requested" },
  { value: "released", label: "Released" },
  { value: "received", label: "Received" },
  { value: "on_hold", label: "On Hold" },
];

export function MaterialRequestModal({ order, onClose, offset = false }: MaterialRequestModalProps) {
  const titleId = useId();
  const submitMode = useRef<"save" | "continue">("save");
  const { saveMaterialRequest } = useWorkflowOrders();
  const [miNumber, setMiNumber] = useState(
    `${offset ? "OMI" : "MI"}-${order.no.replace("#", "-")}-${order.materialRequests.length + 1}`,
  );
  const [status, setStatus] = useState<MaterialRequestStatus>("draft");
  const [requestedBy, setRequestedBy] = useState(order.pic === "-" ? "" : order.pic);
  const [requestDate, setRequestDate] = useState("");
  const [material, setMaterial] = useState(order.material === "-" ? "" : order.material);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("sheet");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const canContinue = status === "released" || status === "received";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMaterialRequest(
      order.no,
      {
        miNumber,
        status,
        requestedBy,
        requestDate,
        material,
        quantity,
        unit,
        remark,
      },
      submitMode.current === "continue" && canContinue,
    );
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
            <h2 id={titleId}>{offset ? "Offset Material / Create MI" : "Material Request / Create MI"}</h2>
            <p>Dokumentasikan material dan MI untuk proyek {order.no}.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir material"
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
              <span>Nomor MI</span>
              <input value={miNumber} onChange={(event) => setMiNumber(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Status MI</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as MaterialRequestStatus)}
              >
                {statuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Request By</span>
              <input value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Tanggal Request</span>
              <input type="date" value={requestDate} onChange={(event) => setRequestDate(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Material</span>
              <input value={material} onChange={(event) => setMaterial(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Quantity</span>
              <input value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Unit</span>
              <input value={unit} onChange={(event) => setUnit(event.target.value)} required />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Spesifikasi, prioritas, atau catatan pengeluaran material"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="secondary"
              onClick={() => {
                submitMode.current = "save";
              }}
            >
              Simpan MI
            </Button>
            <Button
              type="submit"
              icon="arrow"
              disabled={!canContinue}
              title={canContinue ? undefined : "Status MI harus Released atau Received untuk melanjutkan"}
              onClick={() => {
                submitMode.current = "continue";
              }}
            >
              Simpan &amp; Lanjut
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
