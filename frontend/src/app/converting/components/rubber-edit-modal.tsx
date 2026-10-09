"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order, RequirementStatus } from "@/types/order";

export type RubberEditModalProps = {
  order: Order;
  onClose: () => void;
};

const rubberTypes = [
  "Rubber 7MM",
  "Rubber 4MM",
  "Rubber Dupon 3MM",
  "Rubber Varnish 1.7MM",
  "Stencil",
  "Test Run",
  "MC Check",
] as const;

const requirementStatuses: readonly { value: RequirementStatus; label: string }[] = [
  { value: "needed", label: "Needed" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "available", label: "Available / Existing" },
  { value: "on_hold", label: "On Hold" },
  { value: "repair", label: "Repair" },
  { value: "issue", label: "Issue / Reorder" },
  { value: "cancelled", label: "Cancelled" },
];

/** Stores rubber, stencil, test-run, and MC readiness as structured requirements. */
export function RubberEditModal({ order, onClose }: RubberEditModalProps) {
  const titleId = useId();
  const submitMode = useRef<"save" | "continue">("save");
  const { saveRubberRequirement } = useWorkflowOrders();
  const [requirementType, setRequirementType] = useState<(typeof rubberTypes)[number]>(
    "Rubber 4MM",
  );
  const [status, setStatus] = useState<RequirementStatus>("needed");
  const [orderDate, setOrderDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [requestedBy, setRequestedBy] = useState(order.pic === "-" ? "" : order.pic);
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [price, setPrice] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const canContinue = status === "received" || status === "available";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const continueWorkflow = submitMode.current === "continue" && canContinue;

    saveRubberRequirement(
      order.no,
      {
        requirementType,
        status,
        requestedBy,
        supplier,
        orderDate: orderDate || null,
        expectedDate: expectedDate || null,
        arrivalDate: arrivalDate || null,
        invoiceNumber,
        price,
        remark,
      },
      continueWorkflow,
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
            <h2 id={titleId}>Rubber Order &amp; Setting</h2>
            <p>Catat kebutuhan rubber, stencil, test run, atau MC untuk {order.no}.</p>
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

        {order.rubberOrders.length > 0 ? (
          <p className="modal-history-note">
            {order.rubberOrders.length} kebutuhan rubber/setting sudah dicatat untuk proyek ini.
          </p>
        ) : null}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Part Number / Code</span>
              <input value={order.no} disabled />
            </label>
            <label className="modal-field">
              <span>Jenis Requirement</span>
              <select
                value={requirementType}
                onChange={(event) =>
                  setRequirementType(event.target.value as (typeof rubberTypes)[number])
                }
              >
                {rubberTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as RequirementStatus)}
              >
                {requirementStatuses.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Order By / PIC</span>
              <input value={requestedBy} onChange={(event) => setRequestedBy(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Tanggal Order</span>
              <input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Estimasi Datang</span>
              <input type="date" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Tanggal Diterima</span>
              <input type="date" value={arrivalDate} onChange={(event) => setArrivalDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Supplier / Vendor</span>
              <input value={supplier} onChange={(event) => setSupplier(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Invoice Number</span>
              <input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Harga</span>
              <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Rp / nominal" />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Contoh: waiting check, test run gagal, atau setting ulang"
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
              Simpan Requirement
            </Button>
            <Button
              type="submit"
              icon="arrow"
              disabled={!canContinue}
              title={canContinue ? undefined : "Status harus Received atau Available untuk melanjutkan"}
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
