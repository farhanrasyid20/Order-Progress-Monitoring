"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { useAuth } from "@/components/auth/auth-provider";
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

const joinOptionsStorageKey = "order-progress-monitoring:manfJoin1-options";
const addJoinOptionValue = "__add_manfJoin1_option__";

function readCustomJoinOptions(): string[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(joinOptionsStorageKey) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((value): value is string => typeof value === "string" && Boolean(value.trim()) && value !== addJoinOptionValue)
      : [];
  } catch {
    return [];
  }
}

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
  const { user } = useAuth();
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
  } : { ...createEmptyProjectFormDraft(), pic: user?.name ?? "" });
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [customJoinOptions, setCustomJoinOptions] = useState<string[]>(readCustomJoinOptions);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [newJoinOption, setNewJoinOption] = useState("");
  const [joinOptionError, setJoinOptionError] = useState("");
  const [joinStorageWarning, setJoinStorageWarning] = useState("");
  const joinDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isJoinModalOpen) joinDialogRef.current?.showModal();
    else joinDialogRef.current?.close();
  }, [isJoinModalOpen]);
  const invalidFields = getProjectFormConfig(draft).flatMap(section => section.fields)
    .filter(field => isFieldVisible(field, draft) && errors[field.key]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving && !isJoinModalOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isSaving, isJoinModalOpen, onClose]);

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
    const options = [...(field.options ?? [])];
    if (field.key === "manfJoin1") {
      // Keep saved project values selectable, including values entered before this dropdown existed.
      for (const value of [...customJoinOptions, draft.mainData.manfJoin1]) {
        if (value && !options.some((option) => option.value === value)) {
          options.push({ label: value, value });
        }
      }
    }
    const sharedProps = {
      id: fieldId,
      value: getProjectFieldValue(draft, field),
      disabled: isSaving || Boolean(order && (field.key === "entryType" || field.key === "previousProjectCode")) || field.disabledWhen?.(draft),
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${fieldId}-error` : undefined,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => {
        if (field.key !== "manfJoin1" || event.target.value !== addJoinOptionValue) {
          updateField(field, event.target.value);
          return;
        }

        setNewJoinOption("");
        setJoinOptionError("");
        setIsJoinModalOpen(true);
      },
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
            {options.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
            {field.key === "manfJoin1" ? <option value={addJoinOptionValue}>+ Tambah pilihan...</option> : null}
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
        {field.key === "manfJoin1" && joinStorageWarning ? <small role="status">{joinStorageWarning}</small> : null}
      </label>
    );
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving && !isJoinModalOpen) {
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
      <dialog
        ref={joinDialogRef}
        className="modal-dialog join-option-dialog"
        aria-labelledby={`${titleId}-join-title`}
        onClose={() => setIsJoinModalOpen(false)}
        onCancel={(event) => { event.preventDefault(); setIsJoinModalOpen(false); }}
      >
        <header className="modal-header">
          <div>
            <h2 id={`${titleId}-join-title`}>Tambah pilihan ManfJoin1</h2>
            <p>Masukkan nama pilihan yang ingin ditambahkan.</p>
          </div>
          <button type="button" className="modal-close" aria-label="Tutup tambah pilihan" onClick={() => setIsJoinModalOpen(false)}>
            <Icon name="close" size={18} />
          </button>
        </header>
        <form className="modal-form" onSubmit={(event) => {
          event.preventDefault();
          const value = newJoinOption.trim();
          if (!value || value === addJoinOptionValue) {
            setJoinOptionError("Masukkan nama pilihan yang valid.");
            return;
          }
          const field = getProjectFormConfig(draft).flatMap(section => section.fields).find(field => field.key === "manfJoin1");
          if (!field) return;
          const values = [...(field.options ?? []).map(option => option.value), ...customJoinOptions, draft.mainData.manfJoin1];
          const existing = values.find(option => option.toLowerCase() === value.toLowerCase());
          if (!existing) {
            const nextOptions = [...customJoinOptions, value];
            setCustomJoinOptions(nextOptions);
            try {
              window.localStorage.setItem(joinOptionsStorageKey, JSON.stringify(nextOptions));
              setJoinStorageWarning("");
            } catch {
              setJoinStorageWarning("Pilihan dapat digunakan sekarang, tetapi tidak dapat disimpan di browser ini.");
            }
          }
          updateField(field, existing ?? value);
          setIsJoinModalOpen(false);
        }}>
          <label className="modal-field">
            <span>Nama pilihan <b className="project-form-required">*</b></span>
            <input autoFocus value={newJoinOption} onChange={(event) => { setNewJoinOption(event.target.value); setJoinOptionError(""); }} aria-invalid={Boolean(joinOptionError)} aria-describedby={joinOptionError ? `${titleId}-join-error` : undefined} />
          </label>
          {joinOptionError ? <small className="project-form-error" id={`${titleId}-join-error`} role="alert">{joinOptionError}</small> : null}
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setIsJoinModalOpen(false)}>Batal</Button>
            <Button type="submit" icon="save">Tambah pilihan</Button>
          </footer>
        </form>
      </dialog>
    </div>
  );
}
