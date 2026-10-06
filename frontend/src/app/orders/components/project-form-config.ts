import type {
  ProjectFormDraft,
  ProjectMainData,
  ProjectMainDataKey,
} from "@/types/order";

export type ProjectFormFieldKey =
  | ProjectMainDataKey
  | "entryType"
  | "previousProjectCode"
  | "preparationType"
  | "convertingRoute"
  | "pic"
  | "projectDate"
  | "deadline"
  | "drawingLink";

export type ProjectFormField = {
  key: ProjectFormFieldKey;
  source: "mainData" | "project";
  label: string;
  type: "text" | "url" | "date" | "select" | "textarea";
  placeholder?: string;
  required?: boolean | ((draft: ProjectFormDraft) => boolean);
  options?: readonly { label: string; value: string }[];
  fullWidth?: boolean;
  visibleWhen?: (draft: ProjectFormDraft) => boolean;
  disabledWhen?: (draft: ProjectFormDraft) => boolean;
};

export type ProjectFormSection = {
  id: string;
  title: string;
  description?: string;
  fields: readonly ProjectFormField[];
};

const designerOptions = [
  { label: "Not assigned", value: "" },
  { label: "Ihsan", value: "Ihsan" },
  { label: "Aldo", value: "Aldo" },
  { label: "Dimas", value: "Dimas" },
] as const;

/**
 * The field configuration is deliberately owned by the Orders feature because
 * stakeholder columns are still provisional and should be easy to revise.
 */
export const projectFormConfig: readonly ProjectFormSection[] = [
  {
    id: "process-route",
    title: "Process Route",
    description:
      "Select the project type and known preparation route. The new project ID is generated automatically when saved.",
    fields: [
      {
        key: "entryType",
        source: "project",
        label: "Project Type",
        type: "select",
        required: true,
        options: [
          { label: "New Project", value: "new" },
          { label: "Version Up", value: "version_up" },
        ],
      },
      {
        key: "previousProjectCode",
        source: "project",
        label: "Previous Project Code",
        type: "text",
        placeholder: "Enter the previous project code",
        required: (draft) => draft.entryType === "version_up",
        visibleWhen: (draft) => draft.entryType === "version_up",
      },
      {
        key: "preparationType",
        source: "project",
        label: "Preparation Type",
        type: "select",
        required: true,
        options: [
          { label: "Select preparation type...", value: "" },
          { label: "Converting", value: "converting" },
          { label: "Offset", value: "offset" },
        ],
      },
      {
        key: "convertingRoute",
        source: "project",
        label: "Converting Route",
        type: "select",
        required: (draft) => draft.preparationType === "converting",
        visibleWhen: (draft) => draft.preparationType === "converting",
        options: [
          { label: "Select converting route...", value: "" },
          { label: "By Design", value: "by_design" },
          { label: "By Production", value: "by_production" },
        ],
      },
    ],
  },
  {
    id: "project-information",
    title: "Project Information",
    fields: [
      {
        key: "mcNo",
        source: "mainData",
        label: "MC No.",
        type: "text",
        placeholder: "Optional manufacturing code",
      },
      {
        key: "component",
        source: "mainData",
        label: "Component",
        type: "text",
        placeholder: "Enter component name",
        required: true,
      },
      {
        key: "custName",
        source: "mainData",
        label: "Customer Name",
        type: "text",
        placeholder: "Enter customer name",
        required: true,
      },
      { key: "partNo", source: "mainData", label: "PartNo", type: "text" },
      { key: "partNo2", source: "mainData", label: "PartNo2", type: "text" },
      { key: "set", source: "mainData", label: "Set", type: "text" },
      { key: "sub", source: "mainData", label: "Sub", type: "text" },
      { key: "singDoub", source: "mainData", label: "SingDoub", type: "text" },
    ],
  },
  {
    id: "dimensions",
    title: "Dimensions",
    fields: [
      { key: "width", source: "mainData", label: "Width", type: "text" },
      { key: "length", source: "mainData", label: "Length", type: "text" },
      { key: "dieCutSht", source: "mainData", label: "DieCutSht", type: "text" },
      { key: "iSizeL", source: "mainData", label: "ISizeL", type: "text" },
      { key: "iSizeW", source: "mainData", label: "ISizeW", type: "text" },
      { key: "iSizeH", source: "mainData", label: "ISizeH", type: "text" },
      { key: "weight", source: "mainData", label: "Weight", type: "text" },
      { key: "fgWeight", source: "mainData", label: "FG Weight", type: "text" },
    ],
  },
  {
    id: "material",
    title: "Material",
    fields: [
      { key: "boardQua", source: "mainData", label: "BoardQua", type: "text" },
      { key: "corFlut", source: "mainData", label: "CorFlut", type: "text" },
      { key: "creaseL", source: "mainData", label: "CreaseL", type: "text" },
      { key: "creaseW", source: "mainData", label: "CreaseW", type: "text" },
      { key: "slotting", source: "mainData", label: "Slotting", type: "text" },
    ],
  },
  {
    id: "printing-colour",
    title: "Printing & Colour",
    fields: [
      { key: "printing", source: "mainData", label: "Printing", type: "text" },
      { key: "colours", source: "mainData", label: "Colours", type: "text" },
      { key: "colour2", source: "mainData", label: "Colour2", type: "text" },
      { key: "colour3", source: "mainData", label: "Colour3", type: "text" },
      { key: "colour4", source: "mainData", label: "Colour4", type: "text" },
      { key: "colour5", source: "mainData", label: "Colour5", type: "text" },
    ],
  },
  {
    id: "production-finishing",
    title: "Production / Finishing",
    fields: [
      { key: "unit", source: "mainData", label: "Unit", type: "text" },
      { key: "manfJoin1", source: "mainData", label: "ManfJoin1", type: "text" },
      { key: "manfJoin2", source: "mainData", label: "ManfJoin2", type: "text" },
      { key: "assembly", source: "mainData", label: "Assembly", type: "text" },
      { key: "finishing", source: "mainData", label: "Finishing", type: "text" },
      { key: "dispFlag", source: "mainData", label: "DispFlag", type: "text" },
    ],
  },
  {
    id: "assignment-target",
    title: "Assignment & Target",
    description: "Temporary display metadata for the project list.",
    fields: [
      {
        key: "pic",
        source: "project",
        label: "Designer",
        type: "select",
        options: designerOptions,
      },
      { key: "projectDate", source: "project", label: "Project Date", type: "date" },
      { key: "deadline", source: "project", label: "Deadline", type: "date" },
      {
        key: "drawingLink",
        source: "project",
        label: "Link Design",
        type: "url",
        placeholder: "https://...",
        fullWidth: true,
      },
    ],
  },
  {
    id: "notes",
    title: "Notes",
    fields: [
      {
        key: "remark",
        source: "mainData",
        label: "Remark",
        type: "textarea",
        placeholder: "Enter notes or additional instructions",
        fullWidth: true,
      },
    ],
  },
];

const mainDataKeys: readonly ProjectMainDataKey[] = [
  "mcNo",
  "component",
  "custName",
  "partNo",
  "partNo2",
  "set",
  "sub",
  "singDoub",
  "width",
  "length",
  "dieCutSht",
  "boardQua",
  "corFlut",
  "creaseL",
  "creaseW",
  "slotting",
  "remark",
  "iSizeL",
  "iSizeW",
  "iSizeH",
  "printing",
  "colours",
  "dispFlag",
  "unit",
  "manfJoin1",
  "manfJoin2",
  "weight",
  "assembly",
  "colour2",
  "colour3",
  "colour4",
  "colour5",
  "finishing",
  "fgWeight",
];

export function createEmptyProjectMainData(): ProjectMainData {
  return Object.fromEntries(mainDataKeys.map((key) => [key, ""])) as ProjectMainData;
}

export function createEmptyProjectFormDraft(): ProjectFormDraft {
  return {
    mainData: createEmptyProjectMainData(),
    entryType: "new",
    previousProjectCode: "",
    preparationType: "",
    convertingRoute: "",
    pic: "",
    projectDate: "",
    deadline: "",
    drawingLink: "",
  };
}

export function isFieldVisible(field: ProjectFormField, draft: ProjectFormDraft) {
  return field.visibleWhen?.(draft) ?? true;
}

export function isFieldRequired(field: ProjectFormField, draft: ProjectFormDraft) {
  return typeof field.required === "function" ? field.required(draft) : Boolean(field.required);
}

export function getProjectFieldValue(
  draft: ProjectFormDraft,
  field: ProjectFormField,
) {
  return field.source === "mainData"
    ? draft.mainData[field.key as ProjectMainDataKey]
    : draft[field.key as keyof Omit<ProjectFormDraft, "mainData">];
}
