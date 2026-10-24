"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Order, RequirementStatus } from "@/types/order";

export type ToolingEditModalProps = {
  order: Order;
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

/** Records a tooling requirement before handing an eligible project onward. */
export function ToolingEditModal({ order, onClose }: ToolingEditModalProps) {
  const titleId = useId();
  const router = useRouter();
  const submitMode = useRef<"save" | "continue">("save");
  const { saveToolingRequirement } = useWorkflowOrders();
  const latest = order.toolingOrders.at(-1);
  const savedRequirementType = latest?.requirementType?.trim() || "";
  const savedRequestedBy = [latest?.requestedBy, order.pic]
    .find(value => value?.trim() && value.trim() !== "-")?.trim() || "";
  const [requirementType, setRequirementType] = useState(savedRequirementType || "Auto Peeling");
  const [status, setStatus] = useState<RequirementStatus>(latest?.status ?? "needed");
  const [orderDate, setOrderDate] = useState(latest?.orderDate ?? "");
  const [expectedDate, setExpectedDate] = useState(latest?.expectedDate ?? "");
  const [arrivalDate, setArrivalDate] = useState(latest?.arrivalDate ?? "");
  const [requestedBy, setRequestedBy] = useState(savedRequestedBy);
  const [supplier, setSupplier] = useState(latest?.supplier ?? "");
  const [invoiceNumber, setInvoiceNumber] = useState(latest?.invoiceNumber ?? "");
  const [price, setPrice] = useState(latest?.price ?? "");
  const [remark, setRemark] = useState(latest?.remark ?? "");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const continueWorkflow = submitMode.current === "continue";

    saveToolingRequirement(
      order.id,
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
            <h2 id={titleId}>Update Tooling</h2>
            <p>Record tooling requirements for {order.no} before moving to the next stage.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close tooling form"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        {order.toolingOrders.length > 0 ? (
          <p className="modal-history-note">
            {order.toolingOrders.length} tooling {order.toolingOrders.length === 1 ? "requirement has" : "requirements have"} been recorded for this project.
          </p>
        ) : null}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>PSR / Code</span>
              <input value={order.no} disabled />
            </label>
            <label className="modal-field"><span>Customer</span><input value={order.customer} disabled /></label>
            <label className="modal-field"><span>Product / Component</span><input value={order.product} disabled /></label>
            <label className="modal-field">
              <span>Tooling Type</span>
              <select
                value={requirementType}
                disabled={Boolean(savedRequirementType)}
                onChange={(event) =>
                  setRequirementType(event.target.value)
                }
              >
                {savedRequirementType && !toolingTypes.some(type => type === savedRequirementType) ? <option value={savedRequirementType}>{savedRequirementType}</option> : null}
                {toolingTypes.map((type) => (
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
              <input value={requestedBy} disabled={Boolean(savedRequestedBy)} onChange={(event) => setRequestedBy(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Order Date</span>
              <input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Expected Arrival Date</span>
              <input type="date" value={expectedDate} onChange={(event) => setExpectedDate(event.target.value)} />
            </label>
            <label className="modal-field">
              <span>Received Date</span>
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
              <span>Price</span>
              <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Amount in IDR" />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Damage, reorder instructions, or receiving notes"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              onClick={() => {
                submitMode.current = "save";
              }}
            >
              Save Tooling
            </Button>
            <Button
              type="submit"
              icon="arrow"
              onClick={() => {
                submitMode.current = "continue";
              }}
            >
              Save &amp; Continue
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
