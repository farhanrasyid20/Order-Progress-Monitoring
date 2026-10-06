"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type {
  Order,
  OrderFormValues,
  ProjectPriority,
} from "@/types/order";

type OrderFormModalProps = {
  mode: "add" | "edit";
  order?: Order;
  onClose: () => void;
  onSubmit: (values: OrderFormValues) => void;
  submitLabel?: string;
};

const emptyValues: OrderFormValues = {
  customer: "",
  product: "",
  description: "",
  material: "",
  priority: "Medium",
  pic: "",
  projectDate: "",
  deadline: "",
};

const designers = ["Ihsan", "Aldo", "Dimas"];
const priorities: ProjectPriority[] = ["High", "Medium", "Low"];

/**
 * Modal owned by the Design Masuk / Orders feature. Its fields follow the
 * PSR project data in the supplied Design Workload System reference.
 */
export function OrderFormModal({
  mode,
  order,
  onClose,
  onSubmit,
  submitLabel,
}: OrderFormModalProps) {
  const titleId = useId();
  const [psrCode, setPsrCode] = useState(order?.no ?? "");
  const [values, setValues] = useState<OrderFormValues>(
    order
      ? {
          customer: order.customer,
          product: order.product,
          description: order.description,
          material: order.material,
          priority: order.priority,
          pic: order.pic,
          projectDate: order.projectDate,
          deadline: order.deadline,
        }
      : emptyValues,
  );
  const isEditing = mode === "edit";

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const updateValue = (field: keyof OrderFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
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
            <h2 id={titleId}>{isEditing ? "Edit Project" : "Add New Project"}</h2>
            <p>
              {isEditing
                ? `Update project details for ${order?.no}.`
                : "The new project will enter the design queue."}
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close project form"
            onClick={onClose}
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>PSR / Code</span>
              <input
                value={psrCode}
                onChange={(event) => setPsrCode(event.target.value)}
                placeholder="cth. PSR#260849"
                disabled={isEditing}
                autoFocus={!isEditing}
                required={!isEditing}
              />
            </label>
            <label className="modal-field">
              <span>Customer</span>
              <input
                value={values.customer}
                onChange={(event) => updateValue("customer", event.target.value)}
                placeholder="Enter customer name"
                required
              />
            </label>
            <label className="modal-field">
              <span>Product Type</span>
              <input
                value={values.product}
                onChange={(event) => updateValue("product", event.target.value)}
                placeholder="e.g. O-Ring or Gasket"
                required
              />
            </label>
            <label className="modal-field">
              <span>Material</span>
              <input
                value={values.material}
                onChange={(event) => updateValue("material", event.target.value)}
                placeholder="e.g. NBR, FKM, or Silicone"
                required
              />
            </label>
            <label className="modal-field">
              <span>Assign Designer</span>
              <select
                value={values.pic}
                onChange={(event) => updateValue("pic", event.target.value)}
                required
              >
                <option value="" disabled>
                  Select Designer
                </option>
                {designers.map((designer) => (
                  <option key={designer} value={designer}>
                    {designer}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Priority</span>
              <select
                value={values.priority}
                onChange={(event) =>
                  updateValue("priority", event.target.value as ProjectPriority)
                }
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="modal-field">
              <span>Project Date</span>
              <input
                value={values.projectDate}
                onChange={(event) => updateValue("projectDate", event.target.value)}
                placeholder="e.g. 20 Jul 2026"
                required
              />
            </label>
            <label className="modal-field">
              <span>Deadline</span>
              <input
                value={values.deadline}
                onChange={(event) => updateValue("deadline", event.target.value)}
                placeholder="e.g. 30 Jul 2026"
                required
              />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remarks</span>
              <textarea
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
                placeholder="Enter additional information or instructions"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={isEditing ? "pen" : "plus"}>
              {submitLabel ?? (isEditing ? "Save Changes" : "Add Project")}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
