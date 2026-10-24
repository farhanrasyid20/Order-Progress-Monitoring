"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import type {
  PreparationType,
  Order,
  ProjectFormDraft,
  ProjectFormValues,
  ProjectMainDataKey,
} from "@/types/order";
import {
  createEmptyProjectFormDraft,
  getProjectFieldValue,
  isFieldRequired,
  isFieldVisible,
  getProjectFormConfig,
  type ProjectFormField,
  type ProjectFormFieldKey,
} from "./project-form-config";

type AddProjectModalProps = {
  order?: Order;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
};

type ProjectFormErrors = Partial<Record<ProjectFormFieldKey, string>>;

function isHttpLink(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateDraft(draft: ProjectFormDraft): ProjectFormErrors {
  return getProjectFormConfig(draft).reduce<ProjectFormErrors>((errors, section) => {
    section.fields.forEach((field) => {
      if (!isFieldVisible(field, draft)) {
        return;
      }

      const value = String(getProjectFieldValue(draft, field)).trim();

      if (isFieldRequired(field, draft) && !value) {
        errors[field.key] = `${field.label} is required.`;
      }

      if (field.type === "url" && value && !isHttpLink(value)) {
        errors[field.key] = `${field.label} must use an http:// or https:// URL.`;
      }
    });

    return errors;
  }, {});
}

/**
 * Large, feature-owned modal for creating a project. The field order and
 * conditional route behavior are entirely driven by projectFormConfig.
 */
function inputDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AddProjectModal({ order, onClose, onSubmit }: AddProjectModalProps) {
  const titleId = useId();
  const { nextProjectCode } = useWorkflowOrders();
  const [draft, setDraft] = useState<ProjectFormDraft>(() => order ? {
    mainData: { ...order.mainData },
    entryType: order.lineage.entryType,
    previousProjectCode: order.lineage.sourceProjectNo ?? "",
    preparationType: order.workflow.preparationType,
    convertingRoute: order.workflow.convertingRoute ?? "",
    pic: order.pic === "-" ? "" : order.pic,
    projectDate: inputDate(order.projectDate),
    deadline: inputDate(order.deadline),
    drawingLink: order.workflow.drawingLink ?? "",
  } : createEmptyProjectFormDraft());
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const invalidFields = getProjectFormConfig(draft).flatMap(section => section.fields)
    .filter(field => isFieldVisible(field, draft) && errors[field.key]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSaving, onClose]);

  const updateField = (field: ProjectFormField, value: string) => {
    setDraft((current) => {
      if (field.source === "mainData") {
        return {
          ...current,
          mainData: {
            ...current.mainData,
            [field.key as ProjectMainDataKey]: value,
          },
        };
      }

      const nextDraft = {
        ...current,
        [field.key]: value,
      } as ProjectFormDraft;

      if (field.key === "preparationType" && value !== "converting") {
        nextDraft.convertingRoute = "";
      }

      if (field.key === "entryType" && value === "new") {
        nextDraft.previousProjectCode = "";
      }

      return nextDraft;
    });

    setErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[field.key];

      if (field.key === "preparationType" && value !== "converting") {
        delete nextErrors.convertingRoute;
      }

      if (field.key === "entryType" && value === "new") {
        delete nextErrors.previousProjectCode;
      }

      return nextErrors;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateDraft(draft);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    window.setTimeout(() => {
      const sharedValues = {
        ...draft,
        designFile: designFile ?? undefined,
        preparationType: draft.preparationType as PreparationType,
        convertingRoute:
          draft.preparationType === "converting" ? draft.convertingRoute : "",
      };

      onSubmit(
        draft.entryType === "version_up"
          ? {
              ...sharedValues,
              entryType: "version_up",
              previousProjectCode: draft.previousProjectCode.trim(),
            }
          : {
              ...sharedValues,
              entryType: "new",
              previousProjectCode: "",
            },
      );
      onClose();
    }, 300);
  };

  const renderField = (field: ProjectFormField, sectionId: string) => {
    if (!isFieldVisible(field, draft)) {
      return null;
    }

    const fieldId = `${titleId}-${sectionId}-${field.key}`;
    const error = errors[field.key];
    const required = isFieldRequired(field, draft);
    const sharedProps = {
      id: fieldId,
      value: getProjectFieldValue(draft, field),
      disabled: isSaving || Boolean(order && (field.key === "entryType" || field.key === "previousProjectCode")) || field.disabledWhen?.(draft),
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${fieldId}-error` : undefined,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => updateField(field, event.target.value),
    };

    return (
      <label
        className={`modal-field ${field.fullWidth ? "modal-field-full" : ""}`.trim()}
        key={field.key}
      >
        <span>
          {field.label}
          {required ? <b className="project-form-required"> *</b> : null}
        </span>
        {field.type === "file" ? (
          <span className={`project-file-picker${isSaving ? " is-disabled" : ""}`}>
            <input
              id={fieldId}
              type="file"
              disabled={isSaving}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              onChange={(event) => setDesignFile(event.target.files?.[0] ?? null)}
            />
            <span className="project-file-button" aria-hidden="true">
              <Icon name="file" size={15} />
              Select file
            </span>
            <span
              className={`project-file-name${designFile ? " is-selected" : ""}`}
              title={designFile?.name}
              aria-hidden="true"
            >
              {designFile?.name ?? order?.workflow.drawingFileName ?? (order?.workflow.drawingLink ? "Current design file (select to replace)" : "No file selected")}
            </span>
          </span>
        ) : field.type === "select" ? (
          <select {...sharedProps}>
            {field.options?.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea {...sharedProps} placeholder={field.placeholder} rows={4} />
        ) : (
          <input {...sharedProps} type={field.type} placeholder={field.placeholder} />
        )}
        {error ? (
          <small className="project-form-error" id={`${fieldId}-error`}>
            {error}
          </small>
        ) : null}
      </label>
    );
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <section
        className="modal-dialog project-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-header project-form-header">
          <div>
            <h2 id={titleId}>{order ? "Edit Project" : "Add New Project"}</h2>
            <p>{order ? "Update project data. Required fields are marked with *." : "Enter the new project data. Fields can be adjusted as stakeholder needs evolve."}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close project form"
            onClick={onClose}
            disabled={isSaving}
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="project-form-scroll">
          <form className="modal-form project-form" onSubmit={handleSubmit} noValidate>
            {getProjectFormConfig(draft).map((section) => (
              <section className="project-form-section" key={section.id}>
                <div className="project-form-section-heading">
                  <h3>{section.title}</h3>
                  {section.description ? <p>{section.description}</p> : null}
                </div>
                <div className="modal-form-grid project-form-grid">
                  {section.id === "process-route" ? (
                    <label className="modal-field">
                      <span>PSR / Code</span>
                      <input type="text" value={order?.no ?? nextProjectCode} readOnly />
                    </label>
                  ) : null}
                  {section.fields.map((field) => renderField(field, section.id))}
                </div>
              </section>
            ))}

            <footer className="modal-actions project-form-actions">
              {invalidFields.length ? <p className="project-save-error" role="alert">
                Please complete or check: {invalidFields.map(field => field.label).join(", ")}.
              </p> : null}
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" icon="save" disabled={isSaving}>
                {isSaving ? "Saving..." : order ? "Save Changes" : "Save Project"}
              </Button>
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}
