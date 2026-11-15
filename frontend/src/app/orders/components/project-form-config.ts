import type {
  ProjectFormDraft,
  ProjectMainData,
  ProjectMainDataKey,
  BoardMaterialLayerKey,
  OffsetProjectDataKey,
} from "@/types/order";
import {
  boardLayerLabels,
  getBoardTypeLayers,
  type BoardType,
} from "@/components/board-types/board-types-provider";

export type ProjectFormFieldKey =
  | ProjectMainDataKey
  | BoardMaterialLayerKey
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
      { key: "singDoub", source: "mainData", label: "Board Type", type: "select", options: [{ label: "Select...", value: "" }] },
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
      // Replaced at runtime by the selected Board Type material structure.
    ],
  },
  {
    id: "printing-colour",
    title: "Printing & Colour",
    fields: [
      {
        key: "printing", source: "mainData", label: "Printing", type: "select",
        options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }],
      },
      { key: "colours", source: "mainData", label: "Colours", type: "text", disabledWhen: (draft) => draft.mainData.printing !== "Yes" },
      { key: "colour2", source: "mainData", label: "Colour2", type: "text", disabledWhen: (draft) => draft.mainData.printing !== "Yes" },
      { key: "colour3", source: "mainData", label: "Colour3", type: "text", disabledWhen: (draft) => draft.mainData.printing !== "Yes" },
      { key: "colour4", source: "mainData", label: "Colour4", type: "text", disabledWhen: (draft) => draft.mainData.printing !== "Yes" },
      { key: "colour5", source: "mainData", label: "Colour5", type: "text", disabledWhen: (draft) => draft.mainData.printing !== "Yes" },
    ],
  },
  {
    id: "production-finishing",
    title: "Production / Finishing",
    fields: [
      {
        key: "unit", source: "mainData", label: "Unit", type: "select",
        options: [
          { label: "Select...", value: "" },
          { label: "PCS", value: "PCS" },
          { label: "SET", value: "SET" },
        ],
      },
      {
        key: "manfJoin1", source: "mainData", label: "ManfJoin1", type: "select",
        options: [
          { label: "Select...", value: "" },
          { label: "Glue", value: "Glue" },
          { label: "Hot Melt", value: "Hot Melt" },
          { label: "Stitching Single", value: "Stitching Single" },
          { label: "Stitching Double", value: "Stitching Double" },
        ],
      },
      { key: "manfJoin2", source: "mainData", label: "ManfJoin2", type: "text" },
      {
        key: "assembly", source: "mainData", label: "Assembly", type: "select",
        options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }],
      },
      { key: "finishing", source: "mainData", label: "Finishing", type: "text" },
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
        type: "text",
        disabledWhen: () => true,
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
    mainData: { ...createEmptyProjectMainData(), printing: "No", assembly: "No" },
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
    ? (draft.mainData[field.key as ProjectMainDataKey | BoardMaterialLayerKey | OffsetProjectDataKey] ?? "")
    : draft[field.key as keyof Omit<ProjectFormDraft, "mainData">];
}

const offsetSelect = (key: ProjectFormFieldKey, label: string, values: readonly string[]): ProjectFormField => ({
  key, source: "mainData", label, type: "select",
  options: [{ label: "Select...", value: "" }, ...values.map(value => ({ label: value, value }))],
});

/** Offset specifications follow the client workbook; assignment and notes stay shared. */
function boardTypeForDraft(draft: ProjectFormDraft, boardTypes: readonly BoardType[]) {
  return boardTypes.find((boardType) =>
    boardType.id === draft.mainData.singDoub || boardType.name === draft.mainData.singDoub,
  );
}

function convertingFormConfig(draft: ProjectFormDraft, boardTypes: readonly BoardType[]) {
  const selectedBoardType = boardTypeForDraft(draft, boardTypes);
  const boardTypeOptions = [
    { label: "Select...", value: "" },
    ...boardTypes
      .filter((boardType) => boardType.status === "Active" || boardType.id === draft.mainData.singDoub || boardType.name === draft.mainData.singDoub)
      .map((boardType) => ({ label: boardType.name, value: boardType.name })),
  ];
  if (draft.mainData.singDoub && !selectedBoardType) {
    boardTypeOptions.push({ label: draft.mainData.singDoub, value: draft.mainData.singDoub });
  }

  return projectFormConfig.map((section) => {
    if (section.id === "project-information") {
      return {
        ...section,
        fields: section.fields.map((field) => field.key === "singDoub" ? { ...field, options: boardTypeOptions } : field),
      };
    }
    if (section.id === "material") {
      const hasLegacyMaterial = ["boardQua", "corFlut", "creaseL", "creaseW", "slotting"]
        .some((key) => Boolean(draft.mainData[key as ProjectMainDataKey]?.trim()));
      return {
        ...section,
        fields: !selectedBoardType && hasLegacyMaterial ? [
          { key: "boardQua" as const, source: "mainData" as const, label: "BoardQua", type: "text" as const },
          { key: "corFlut" as const, source: "mainData" as const, label: "CorFlut", type: "text" as const },
          { key: "creaseL" as const, source: "mainData" as const, label: "CreaseL", type: "text" as const },
          { key: "creaseW" as const, source: "mainData" as const, label: "CreaseW", type: "text" as const },
          { key: "slotting" as const, source: "mainData" as const, label: "Slotting", type: "text" as const },
        ] : getBoardTypeLayers(selectedBoardType?.category).map((key) => ({
          key,
          source: "mainData" as const,
          label: key === "fluting1"
            ? `${selectedBoardType?.category === "Single Wall" ? "Fluting" : "Fluting 1"}${selectedBoardType?.fluteType ? ` (${selectedBoardType.fluteType.charAt(0)})` : ""}`
            : key === "fluting2"
              ? `Fluting 2${selectedBoardType?.fluteType ? ` (${selectedBoardType.fluteType.charAt(1) || selectedBoardType.fluteType})` : ""}`
              : boardLayerLabels[key],
          type: "text" as const,
        })),
      };
    }
    return section;
  });
}

export function getProjectFormConfig(draft: ProjectFormDraft, boardTypes: readonly BoardType[] = []): readonly ProjectFormSection[] {
  if (draft.preparationType !== "offset") return convertingFormConfig(draft, boardTypes);
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
