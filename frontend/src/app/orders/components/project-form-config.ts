import type {
  ProjectFormDraft,
  ProjectMainData,
  ProjectMainDataKey,
  OffsetProjectDataKey,
} from "@/types/order";

export type ProjectFormFieldKey =
  | ProjectMainDataKey
  | OffsetProjectDataKey
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
  type: "text" | "url" | "date" | "select" | "textarea" | "file";
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
      { key: "weight", source: "mainData", label: "Weight", type: "text", required: true },
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
        label: "File Design",
        type: "file",
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
  const today = new Date();
  const projectDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    mainData: createEmptyProjectMainData(),
    entryType: "new",
    previousProjectCode: "",
    preparationType: "",
    convertingRoute: "",
    pic: "",
    projectDate,
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
    ? (draft.mainData[field.key as ProjectMainDataKey | OffsetProjectDataKey] ?? "")
    : draft[field.key as keyof Omit<ProjectFormDraft, "mainData">];
}

const offsetSelect = (key: ProjectFormFieldKey, label: string, values: readonly string[]): ProjectFormField => ({
  key, source: "mainData", label, type: "select",
  options: [{ label: "Select...", value: "" }, ...values.map(value => ({ label: value, value }))],
});

/** Offset specifications follow the client workbook; assignment and notes stay shared. */
export function getProjectFormConfig(draft: ProjectFormDraft): readonly ProjectFormSection[] {
  if (draft.preparationType !== "offset") return projectFormConfig;
  const section = (id: string) => projectFormConfig.find(section => section.id === id)!;
  return [
    section("process-route"),
    { id: "project-information", title: "Project Information", fields: [
      { key: "mcNo", source: "mainData", label: "MC No. / Code", type: "text" },
      { key: "custName", source: "mainData", label: "Customer Name", placeholder: "Enter customer name", type: "text", required: true },
      offsetSelect("boardQua", "Material", ["Woodfree", "Art Paper", "Art Cartoon", "Ivory", "Duplex", "Aceboard", "Kraft", "Tesliner"]),
      { key: "fgQuantity", source: "mainData", label: "FG Qty (SHT)", type: "text" },
      { key: "imposition", source: "mainData", label: "Imposition / UP", type: "text" },
      offsetSelect("grammage", "Gramatur", [60,70,80,100,120,150,175,210,230,260,300,310,400].map(value => value + " gsm")),
      offsetSelect("printingSide", "Printing Side", ["1 side", "2 side"]),
      offsetSelect("printingMachine", "Machine", ["CD102", "SM102", "Sumitomo", "GTO54", "SC900", "SG1115"]),
    ] },
    { id: "dimensions", title: "Dimensions", fields: section("dimensions").fields.filter(field => ["width", "length", "weight"].includes(field.key)) },
    { ...section("printing-colour"), fields: section("printing-colour").fields.map((field, index) => ({
      ...field,
      label: index === 0 ? "Printing" : "Colours " + index,
      ...(index === 0 ? { placeholder: "Number of colours, Pantone colours, special colours" } : {}),
    })) },
    { id: "coatings", title: "Coatings", fields: [
      offsetSelect("varnish", "Varnish", ["WB Block Varnish", "WB Spot Varnish", "OPV Block Varnish", "OPV Spot Varnish"]),
      offsetSelect("lamination", "Lamination", ["Glossy", "Matte"]),
      offsetSelect("coatingSide", "Coating Side", ["1 side", "2 side"]),
    ] },
    { id: "special-effect", title: "Special Effect", fields: [
      offsetSelect("specialEffect", "Special Effect", ["Emboss", "Deboss", "Hotprint Gold/Silver", "Spot UV"]),
    ] },
    section("assignment-target"),
    section("notes"),
  ];
}
