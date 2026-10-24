"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const submitMode = useRef<"save" | "continue">("save");
  const { saveRubberRequirement } = useWorkflowOrders();
  const latest = order.rubberOrders.at(-1);
  const savedRequirementType = latest?.requirementType?.trim() || "";
  const savedRequestedBy = [latest?.requestedBy, order.pic]
    .find(value => value?.trim() && value.trim() !== "-")?.trim() || "";
  const [requirementType, setRequirementType] = useState(savedRequirementType || "Rubber 4MM");
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

    saveRubberRequirement(
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
            <h2 id={titleId}>Update Rubber</h2>
            <p>Record rubber, stencil, test run, or MC requirements for {order.no}.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close rubber form"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        {order.rubberOrders.length > 0 ? (
          <p className="modal-history-note">
            {order.rubberOrders.length} rubber/setting {order.rubberOrders.length === 1 ? "requirement has" : "requirements have"} been recorded for this project.
          </p>
        ) : null}

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Part Number / Code</span>
              <input value={order.no} disabled />
            </label>
            <label className="modal-field"><span>Customer</span><input value={order.customer} disabled /></label>
            <label className="modal-field"><span>Product / Component</span><input value={order.product} disabled /></label>
            <label className="modal-field">
              <span>Requirement Type</span>
              <select
                value={requirementType}
                disabled={Boolean(savedRequirementType)}
                onChange={(event) =>
                  setRequirementType(event.target.value)
                }
              >
                {savedRequirementType && !rubberTypes.some(type => type === savedRequirementType) ? <option value={savedRequirementType}>{savedRequirementType}</option> : null}
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
                placeholder="Pending inspection, failed test run, or setup adjustments"
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
              Save Requirement
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
