"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import type {
  ProjectPriority,
  RequirementStatus,
  StandaloneRequirementKind,
} from "@/types/order";

export type StandaloneRequirementModalProps = {
  kind: StandaloneRequirementKind;
  onClose: () => void;
};

const toolingTypes = [
  "Auto Peeling",
  "Nikko",
  "Nikko Peeling",
  "Auto Haido",
  "Jinya",
  "TMZ",
  "Pulp Tray",
  "Rotary",
  "Baosika",
  "Manual",
] as const;

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

const priorityOptions: readonly ProjectPriority[] = ["High", "Medium", "Low"];

/**
 * Creates a direct Tooling or Rubber requirement while preserving the normal
 * requirement fields used by the stage-specific update modals.
 */
export function StandaloneRequirementModal({
  kind,
  onClose,
}: StandaloneRequirementModalProps) {
  const titleId = useId();
  const submitMode = useRef<"save" | "continue">("save");
  const { createStandaloneRequirementOrder } = useWorkflowOrders();
  const requirementTypes = kind === "tooling" ? toolingTypes : rubberTypes;
  const kindLabel = kind === "tooling" ? "Tooling" : "Rubber";
  const [customer, setCustomer] = useState("");
  const [product, setProduct] = useState("");
  const [partNo, setPartNo] = useState("");
  const [material, setMaterial] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("Medium");
  const [requestedBy, setRequestedBy] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirementType, setRequirementType] = useState<string>(requirementTypes[0]);
  const [status, setStatus] = useState<RequirementStatus>("needed");
  const [orderDate, setOrderDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
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

    createStandaloneRequirementOrder(
      kind,
      {
        customer,
        product,
        partNo,
        material,
        priority,
        pic: requestedBy,
        projectDate: orderDate,
        deadline,
        description: remark || "-",
        requirement: {
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
      <section
        className="modal-dialog modal-dialog-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>Tambah {kindLabel}</h2>
            <p>Buat order {kindLabel.toLowerCase()} langsung tanpa melalui Incoming Design.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label={`Tutup formulir ${kindLabel.toLowerCase()}`}
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Customer</span>
              <input value={customer} onChange={(event) => setCustomer(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Produk / Komponen</span>
              <input value={product} onChange={(event) => setProduct(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Part Number / Code</span>
              <input value={partNo} onChange={(event) => setPartNo(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Material</span>
              <input value={material} onChange={(event) => setMaterial(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as ProjectPriority)}
              >
                {priorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Order By / PIC</span>
              <input
                value={requestedBy}
                onChange={(event) => setRequestedBy(event.target.value)}
                required
              />
            </label>
            <label className="modal-field">
              <span>Jenis {kindLabel}</span>
              <select
                value={requirementType}
                onChange={(event) => setRequirementType(event.target.value)}
              >
                {requirementTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
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
              <span>Tanggal Order</span>
              <input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Estimasi Datang</span>
              <input
                type="date"
                value={expectedDate}
                onChange={(event) => setExpectedDate(event.target.value)}
              />
            </label>
            <label className="modal-field">
              <span>Tanggal Diterima</span>
              <input
                type="date"
                value={arrivalDate}
                onChange={(event) => setArrivalDate(event.target.value)}
              />
            </label>
            <label className="modal-field">
              <span>Deadline</span>
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
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
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Rp / nominal"
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Catatan kebutuhan, supplier, atau instruksi order"
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
              Simpan {kindLabel}
            </Button>
            <Button
              type="submit"
              icon="arrow"
              disabled={!canContinue}
              title={
                canContinue
                  ? undefined
                  : "Status harus Received atau Available untuk melanjutkan"
              }
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
