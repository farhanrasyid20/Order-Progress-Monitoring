"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type {
  PreparationType,
  ProjectFormDraft,
  ProjectFormValues,
  ProjectMainDataKey,
} from "@/types/order";
import {
  createEmptyProjectFormDraft,
  getProjectFieldValue,
  isFieldRequired,
  isFieldVisible,
  projectFormConfig,
  type ProjectFormField,
  type ProjectFormFieldKey,
} from "./project-form-config";

type AddProjectModalProps = {
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
  return projectFormConfig.reduce<ProjectFormErrors>((errors, section) => {
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
export function AddProjectModal({ onClose, onSubmit }: AddProjectModalProps) {
  const titleId = useId();
  const [draft, setDraft] = useState<ProjectFormDraft>(createEmptyProjectFormDraft);
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

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

  const renderField = (field: ProjectFormField) => {
    if (!isFieldVisible(field, draft)) {
      return null;
    }

    const fieldId = `${titleId}-${field.key}`;
    const error = errors[field.key];
    const required = isFieldRequired(field, draft);
    const sharedProps = {
      id: fieldId,
      value: getProjectFieldValue(draft, field),
      disabled: isSaving || field.disabledWhen?.(draft),
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
        {field.type === "select" ? (
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
            <h2 id={titleId}>Add New Project</h2>
            <p>Enter the new project data. Fields can be adjusted as stakeholder needs evolve.</p>
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
            {projectFormConfig.map((section) => (
              <section className="project-form-section" key={section.id}>
                <div className="project-form-section-heading">
                  <h3>{section.title}</h3>
                  {section.description ? <p>{section.description}</p> : null}
                </div>
                <div className="modal-form-grid project-form-grid">
                  {section.fields.map(renderField)}
                </div>
              </section>
            ))}

            <footer className="modal-actions project-form-actions">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" icon="save" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Project"}
              </Button>
            </footer>
          </form>
        </div>
      </section>
    </div>
  );
}
