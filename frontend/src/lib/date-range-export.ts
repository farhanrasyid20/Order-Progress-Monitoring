import type {
  MaterialRequestStatus,
  Order,
  RequirementRecord,
  RequirementStatus,
} from "@/types/order";

export type ExportRow = Record<string, string>;

export type DatedExportRow = {
  id: string;
  /** Normalized creation/business date used only for inclusive range filtering. */
  date: string;
  values: ExportRow;
};

export type DateRangeExportReport = {
  fileStem: string;
  columns: readonly string[];
  rows: readonly DatedExportRow[];
};

export type DateRangeFilterResult = {
  rows: readonly DatedExportRow[];
  error?: string;
};

const requirementStatusLabels: Record<RequirementStatus, string> = {
  needed: "Needed",
  ordered: "Ordered",
  received: "Received",
  available: "Available / Existing",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  repair: "Repair",
  issue: "Issue / Reorder",
};

const materialRequestStatusLabels: Record<MaterialRequestStatus, string> = {
  draft: "Draft",
  requested: "Requested",
  released: "Released",
  received: "Received",
  on_hold: "On Hold",
};

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function isCalendarDate(value: string) {
  const match = value.match(dateOnlyPattern);
  if (!match) return false;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

/**
 * Uses an explicit UTC date for ISO timestamps and preserves date-only
 * business fields without applying a local-time offset.
 */
export function normalizeExportDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (isCalendarDate(trimmed)) return trimmed;
  if (dateOnlyPattern.test(trimmed)) return null;

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) return null;

  return new Date(timestamp).toISOString().slice(0, 10);
}

function uniqueRows(rows: readonly DatedExportRow[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/** Validates an inclusive calendar-date range and removes invalid/duplicate records. */
export function filterRowsByDateRange(
  rows: readonly DatedExportRow[],
  openDate: string,
  closeDate: string,
): DateRangeFilterResult {
  if (!openDate || !closeDate) {
    return { rows: [], error: "Select both Open Month and Close Month." };
  }

  const start = normalizeExportDate(openDate);
  const end = normalizeExportDate(closeDate);
  if (!start || !end) {
    return { rows: [], error: "Open Month and Close Month must be valid dates." };
  }
  if (start > end) {
    return { rows: [], error: "Open Month cannot be later than Close Month." };
  }

  return {
    rows: uniqueRows(rows).filter((row) => {
      const rowDate = normalizeExportDate(row.date);
      return Boolean(rowDate && rowDate >= start && rowDate <= end);
    }),
  };
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Creates UTF-8-safe CSV text; the browser download layer supplies the BOM. */
export function createCsv(columns: readonly string[], rows: readonly DatedExportRow[]): string {
  const lines = [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row.values[column] ?? "")).join(",")),
  ];

  return lines.join("\r\n");
}

function safeFilePart(value: string, fallback: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

export function exportFileName(
  report: DateRangeExportReport,
  openDate: string,
  closeDate: string,
): string {
  return `${safeFilePart(report.fileStem, "export")}-${safeFilePart(openDate, "open")}-to-${safeFilePart(closeDate, "close")}.csv`;
}

function valueOrDash(value: string | null | undefined) {
  return value?.trim() || "-";
}

function productComponent(order: Order) {
  const product = valueOrDash(order.product);
  const component = order.mainData.component?.trim();

  return component && component !== product ? `${product} / ${component}` : product;
}

function productionDesignLabel(order: Order) {
  if (order.workflow.preparationType === "offset") return "Offset: Production";
  if (order.workflow.convertingRoute === "by_production") return "Converting: Production";
  if (order.workflow.convertingRoute === "by_design") return "Converting: Design";
  return "-";
}

function projectStatus(order: Order) {
  if (order.workflow.currentStatus === "cancelled") return "Cancelled";
  if (order.workflow.currentStatus === "completed" || order.stage === "completed") return "Completed";
  return valueOrDash(order.status);
}

/** The same newest non-empty Sample Progress note used by Incoming Design exports. */
export function latestSampleProductionNotes(order: Order): string | null {
  const records = (order.sampleProgress ?? []).filter((record) => record.notes.trim());
  if (!records.length) return null;

  return records.reduce((latest, record) => {
    const latestTime = Date.parse(latest.recordedAt);
    const recordTime = Date.parse(record.recordedAt);

    return Number.isNaN(recordTime) || (!Number.isNaN(latestTime) && recordTime < latestTime)
      ? latest
      : record;
  }).notes.trim();
}

function report(
  fileStem: string,
  columns: readonly string[],
  rows: readonly DatedExportRow[],
): DateRangeExportReport {
  return { fileStem, columns, rows: uniqueRows(rows) };
}

const incomingColumns = [
  "PSR / Code",
  "Customer",
  "Product / Component",
  "Production / Design",
  "PIC",
  "Status",
  "Project Created Date",
  "Last Update",
  "Production Notes",
  "Deadline",
  "Material",
  "Priority",
  "Description",
] as const;

export function buildIncomingDesignExportReport(orders: readonly Order[]): DateRangeExportReport {
  return report("incoming-design", incomingColumns, orders.map((order) => {
    const createdDate = normalizeExportDate(order.createdAt) ?? "";

    return {
      id: `incoming-${order.id}`,
      date: createdDate,
      values: {
        "PSR / Code": valueOrDash(order.no),
        Customer: valueOrDash(order.customer),
        "Product / Component": productComponent(order),
        "Production / Design": productionDesignLabel(order),
        PIC: valueOrDash(order.pic),
        Status: projectStatus(order),
        "Project Created Date": createdDate || valueOrDash(order.createdAt),
        "Last Update": valueOrDash(order.updatedAt),
        "Production Notes": latestSampleProductionNotes(order) ?? "-",
        Deadline: valueOrDash(order.deadline),
        Material: valueOrDash(order.material),
        Priority: valueOrDash(order.priority),
        Description: valueOrDash(order.description),
      },
    };
  }));
}

function requirementExportReport(
  orders: readonly Order[],
  kind: "tooling" | "rubber",
): DateRangeExportReport {
  const label = kind === "tooling" ? "Tooling" : "Rubber";
  const columns = [
    "PSR / Code",
    "Customer",
    "Product / Component",
    `${label} Type`,
    `Status ${label}`,
    "Order Date",
    "Expected Arrival Date",
    "Received Date",
    "Supplier",
    "Order By / PIC",
    "Price",
    "Invoice Number",
    "Remark",
    "Project Deadline",
    "Project Status",
  ] as const;
  const rows: DatedExportRow[] = [];

  orders.forEach((order) => {
    const requirements: readonly RequirementRecord[] = kind === "tooling"
      ? order.toolingOrders
      : order.rubberOrders;

    requirements.forEach((record) => {
      const orderDate = normalizeExportDate(record.orderDate) ?? "";
      rows.push({
        id: `${order.id}-${kind}-${record.sequence}`,
        date: orderDate,
        values: {
          "PSR / Code": valueOrDash(order.no),
          Customer: valueOrDash(order.customer),
          "Product / Component": productComponent(order),
          [`${label} Type`]: valueOrDash(record.requirementType),
          [`Status ${label}`]: requirementStatusLabels[record.status] ?? valueOrDash(record.status),
          "Order Date": orderDate || valueOrDash(record.orderDate),
          "Expected Arrival Date": valueOrDash(record.expectedDate),
          "Received Date": valueOrDash(record.arrivalDate),
          Supplier: valueOrDash(record.supplier),
          "Order By / PIC": valueOrDash(record.requestedBy),
          Price: valueOrDash(record.price),
          "Invoice Number": valueOrDash(record.invoiceNumber),
          Remark: valueOrDash(record.remark),
          "Project Deadline": valueOrDash(order.deadline),
          "Project Status": projectStatus(order),
        },
      });
    });
  });

  return report(kind === "tooling" ? "order-tooling" : "order-rubber", columns, rows);
}

export function buildToolingExportReport(orders: readonly Order[]): DateRangeExportReport {
  return requirementExportReport(orders, "tooling");
}

export function buildRubberExportReport(orders: readonly Order[]): DateRangeExportReport {
  return requirementExportReport(orders, "rubber");
}

const materialRequestColumns = [
  "PSR / Code",
  "Customer",
  "Product / Component",
  "MI Number",
  "Status Request Material",
  "Request Date",
  "Material",
  "Quantity",
  "Unit",
  "Requested By / PIC",
  "Project PIC",
  "Source",
  "Remark",
  "Project Deadline",
  "Project Status",
] as const;

export function buildMaterialRequestExportReport(orders: readonly Order[]): DateRangeExportReport {
  const rows: DatedExportRow[] = [];

  orders.forEach((order) => {
    order.materialRequests.forEach((record) => {
      const requestDate = normalizeExportDate(record.requestDate) ?? "";
      rows.push({
        id: `${order.id}-material-request-${record.sequence}`,
        date: requestDate,
        values: {
          "PSR / Code": valueOrDash(order.no),
          Customer: valueOrDash(order.customer),
          "Product / Component": productComponent(order),
          "MI Number": valueOrDash(record.miNumber),
          "Status Request Material": materialRequestStatusLabels[record.status] ?? valueOrDash(record.status),
          "Request Date": requestDate || valueOrDash(record.requestDate),
          Material: valueOrDash(record.material),
          Quantity: valueOrDash(record.quantity),
          Unit: valueOrDash(record.unit),
          "Requested By / PIC": valueOrDash(record.requestedBy),
          "Project PIC": valueOrDash(order.pic),
          Source: record.source === "tooling" ? "Tooling" : record.source === "rubber" ? "Rubber" : "-",
          Remark: valueOrDash(record.remark),
          "Project Deadline": valueOrDash(order.deadline),
          "Project Status": projectStatus(order),
        },
      });
    });
  });

  return report("material-request", materialRequestColumns, rows);
}

const sampleProgressColumns = [
  "PSR / Code",
  "Customer",
  "Product / Component",
  "Sample Number",
  "Sample PIC",
  "Production Notes",
  "Progress Date",
  "Recorded At",
  "Target Completion Date",
  "Project PIC",
  "Project Status",
  "Project Deadline",
] as const;

export function buildSampleProgressExportReport(orders: readonly Order[]): DateRangeExportReport {
  const rows: DatedExportRow[] = [];

  orders.forEach((order) => {
    (order.sampleProgress ?? []).forEach((record) => {
      const progressDate = normalizeExportDate(record.recordedAt) ?? "";
      rows.push({
        id: `${order.id}-sample-progress-${record.sequence}`,
        date: progressDate,
        values: {
          "PSR / Code": valueOrDash(order.no),
          Customer: valueOrDash(order.customer),
          "Product / Component": productComponent(order),
          "Sample Number": valueOrDash(record.sampleNumber),
          "Sample PIC": valueOrDash(record.pic),
          "Production Notes": valueOrDash(record.notes),
          "Progress Date": progressDate || valueOrDash(record.recordedAt),
          "Recorded At": valueOrDash(record.recordedAt),
          "Target Completion Date": valueOrDash(record.deadline),
          "Project PIC": valueOrDash(order.pic),
          "Project Status": projectStatus(order),
          "Project Deadline": valueOrDash(order.deadline),
        },
      });
    });
  });

  return report("sample-progress", sampleProgressColumns, rows);
}
