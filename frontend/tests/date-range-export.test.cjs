/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const sourceRoot = path.resolve(__dirname, "../src");
const moduleCache = new Map();

function resolveModule(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function load(filename) {
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;

  const loaded = { exports: {} };
  moduleCache.set(filename, loaded);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const base = specifier.startsWith("@/")
        ? path.resolve(sourceRoot, specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      const resolved = resolveModule(base);
      if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${filename}`);
      return load(resolved);
    }
    return require(specifier);
  };

  new Function("require", "module", "exports", source)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

function sourceFile(relativePath) {
  return fs.readFileSync(path.resolve(sourceRoot, relativePath), "utf8");
}

const exporter = load(path.resolve(sourceRoot, "lib/date-range-export.ts"));

function requirement(sequence, orderDate = "2026-09-15", status = "ordered") {
  return {
    sequence,
    requirementType: "Auto Peeling",
    status,
    requestedBy: "PIC Requirement",
    supplier: "Vendor",
    orderDate,
    expectedDate: "2026-09-20",
    arrivalDate: "2026-09-25",
    invoiceNumber: `INV-${sequence}`,
    price: "10000",
    remark: "Requirement note",
  };
}

function materialRequest(sequence, requestDate = "2026-09-16") {
  return {
    sequence,
    miNumber: `MI-${sequence}`,
    status: "released",
    requestedBy: "PIC MI",
    requestDate,
    material: "M115",
    quantity: "10",
    unit: "sheet",
    remark: "MI note",
  };
}

function sampleProgress(sequence, recordedAt = "2026-09-17T10:00:00.000Z", notes = "Sample note") {
  return {
    sequence,
    pic: "PIC Sample",
    deadline: "2026-09-25",
    sampleNumber: `S-${sequence}`,
    notes,
    recordedAt,
  };
}

function makeOrder(overrides = {}) {
  const base = {
    id: "project-1",
    no: "PSR#1",
    lineage: { entryType: "new", rootProjectNo: "PSR#1", sourceProjectNo: null, versionNumber: 0 },
    mainData: { component: "Component A" },
    workflow: {
      preparationType: "converting",
      convertingRoute: "by_production",
      productionOrder: null,
      materialRequested: false,
      currentStage: "preparation",
      currentProcess: "Order Tooling",
      currentStatus: "in_progress",
      drawingLink: null,
      designDecision: null,
      progress: 50,
    },
    toolingOrders: [requirement(1)],
    rubberOrders: [requirement(1, "2026-09-18", "received")],
    materialRequests: [materialRequest(1)],
    offsetSpks: [],
    processHistory: [],
    sampleProgress: [sampleProgress(1)],
    createdAt: "2026-09-14T05:00:00.000Z",
    updatedAt: "2099-01-01T00:00:00.000Z",
    customer: "Customer A",
    product: "Product A",
    description: "Project description",
    material: "M115",
    priority: "Medium",
    process: "Sample Process",
    pic: "Project PIC",
    projectDate: "2026-09-14",
    deadline: "2026-10-01",
    status: "Sample In Progress",
    tone: "info",
    stage: "sample-progress",
    progress: 75,
  };

  return {
    ...base,
    ...overrides,
    mainData: { ...base.mainData, ...(overrides.mainData ?? {}) },
    workflow: { ...base.workflow, ...(overrides.workflow ?? {}) },
  };
}

test("date-range filtering is inclusive, supports one date, and validates ranges", () => {
  const rows = [
    { id: "start", date: "2026-08-01", values: { Value: "start" } },
    { id: "middle", date: "2026-09-15", values: { Value: "middle" } },
    { id: "end", date: "2026-10-31T23:59:59.000Z", values: { Value: "end" } },
    { id: "after", date: "2026-11-01", values: { Value: "after" } },
    { id: "start", date: "2026-08-01", values: { Value: "duplicate" } },
  ];

  const result = exporter.filterRowsByDateRange(rows, "2026-08-01", "2026-10-31");
  assert.equal(result.error, undefined);
  assert.deepEqual(result.rows.map((row) => row.id), ["start", "middle", "end"]);

  const oneDay = exporter.filterRowsByDateRange(rows, "2026-09-15", "2026-09-15");
  assert.deepEqual(oneDay.rows.map((row) => row.id), ["middle"]);
  assert.equal(exporter.filterRowsByDateRange(rows, "", "2026-10-31").error, "Select both Open Month and Close Month.");
  assert.equal(exporter.filterRowsByDateRange(rows, "invalid", "2026-10-31").error, "Open Month and Close Month must be valid dates.");
  assert.equal(exporter.filterRowsByDateRange(rows, "2026-11-01", "2026-10-31").error, "Open Month cannot be later than Close Month.");
  assert.equal(exporter.filterRowsByDateRange(rows, "2027-01-01", "2027-01-01").rows.length, 0);
  assert.equal(exporter.normalizeExportDate("2026-10-31T23:59:59.000Z"), "2026-10-31");
  assert.equal(exporter.normalizeExportDate("2026-02-30"), null);
});

test("all five reports use their required creation dates and preserve all lifecycle records", () => {
  const active = makeOrder({ id: "active" });
  const completed = makeOrder({
    id: "completed",
    no: "PSR#2",
    createdAt: "2026-08-01T00:00:00.000Z",
    workflow: { currentStatus: "completed", currentStage: "completed" },
    stage: "completed",
  });
  const cancelled = makeOrder({
    id: "cancelled",
    no: "PSR#3",
    createdAt: "2026-10-31T23:00:00.000Z",
    workflow: { currentStatus: "cancelled", currentStage: "completed" },
    stage: "completed",
  });
  const orders = [active, completed, cancelled];

  const incoming = exporter.buildIncomingDesignExportReport(orders);
  const tooling = exporter.buildToolingExportReport(orders);
  const rubber = exporter.buildRubberExportReport(orders);
  const material = exporter.buildMaterialRequestExportReport(orders);
  const sample = exporter.buildSampleProgressExportReport(orders);

  [incoming, tooling, rubber, material, sample].forEach((report) => {
    assert.equal(report.rows.length, 3);
    assert.equal(new Set(report.rows.map((row) => row.id)).size, 3);
  });

  assert.equal(incoming.rows[0].date, "2026-09-14");
  assert.equal(tooling.rows[0].date, "2026-09-15");
  assert.equal(rubber.rows[0].date, "2026-09-18");
  assert.equal(material.rows[0].date, "2026-09-16");
  assert.equal(sample.rows[0].date, "2026-09-17");
  assert.equal(incoming.rows.find((row) => row.id === "incoming-cancelled").values.Status, "Cancelled");
  assert.equal(incoming.rows.find((row) => row.id === "incoming-completed").values.Status, "Completed");

  const withoutBusinessDate = makeOrder({
    id: "missing-business-date",
    toolingOrders: [requirement(1, null)],
    materialRequests: [materialRequest(1, "")],
    updatedAt: "2026-09-15T00:00:00.000Z",
  });
  assert.equal(exporter.filterRowsByDateRange(exporter.buildToolingExportReport([withoutBusinessDate]).rows, "2026-09-01", "2026-09-30").rows.length, 0);
  assert.equal(exporter.filterRowsByDateRange(exporter.buildMaterialRequestExportReport([withoutBusinessDate]).rows, "2026-09-01", "2026-09-30").rows.length, 0);
});

test("reports flatten repeat records, are not pagination-limited, and keep Incoming Production Notes from Sample Progress", () => {
  const repeatOrder = makeOrder({
    id: "repeat",
    toolingOrders: [requirement(1, "2026-08-01"), requirement(2, "2026-10-31", "received")],
    sampleProgress: [
      sampleProgress(1, "2026-08-01T00:00:00.000Z", "Older note"),
      sampleProgress(2, "2026-10-31T00:00:00.000Z", ""),
      sampleProgress(3, "2026-09-30T00:00:00.000Z", "Newest non-empty note"),
    ],
  });
  const tooling = exporter.buildToolingExportReport([repeatOrder]);
  assert.equal(tooling.rows.length, 2);
  assert.equal(new Set(tooling.rows.map((row) => row.id)).size, 2);
  assert.deepEqual(
    exporter.filterRowsByDateRange(tooling.rows, "2026-08-01", "2026-10-31").rows.map((row) => row.date),
    ["2026-08-01", "2026-10-31"],
  );

  const incoming = exporter.buildIncomingDesignExportReport([repeatOrder]);
  assert.equal(incoming.rows[0].values["Production Notes"], "Newest non-empty note");

  const moreThanFifty = Array.from({ length: 51 }, (_, index) => makeOrder({
    id: `bulk-${index}`,
    no: `PSR#BULK-${index}`,
    toolingOrders: [requirement(1, "2026-09-15")],
  }));
  const bulkReport = exporter.buildToolingExportReport(moreThanFifty);
  const bulkRange = exporter.filterRowsByDateRange(bulkReport.rows, "2026-09-15", "2026-09-15");
  assert.equal(bulkReport.rows.length, 51);
  assert.equal(bulkRange.rows.length, 51);
});

test("report fields and CSV output retain module data and escape cells", () => {
  const order = makeOrder({
    sampleProgress: [sampleProgress(1, "2026-09-17T10:00:00.000Z", "Waiting, \"approval\"\nnext line")],
  });
  const incoming = exporter.buildIncomingDesignExportReport([order]);
  const tooling = exporter.buildToolingExportReport([order]);
  const rubber = exporter.buildRubberExportReport([order]);
  const material = exporter.buildMaterialRequestExportReport([order]);
  const sample = exporter.buildSampleProgressExportReport([order]);

  assert.ok(incoming.columns.includes("Production Notes"));
  assert.ok(incoming.columns.includes("Last Update"));
  assert.ok(tooling.columns.includes("Expected Arrival Date"));
  assert.ok(rubber.columns.includes("Received Date"));
  assert.ok(material.columns.includes("MI Number"));
  assert.ok(sample.columns.includes("Progress Date"));

  const csv = exporter.createCsv(incoming.columns, incoming.rows);
  assert.match(csv, /"Waiting, ""approval""\nnext line"/);
  assert.ok(csv.startsWith('"PSR / Code"'));
  assert.equal(csv.charCodeAt(0), '"'.charCodeAt(0));
  assert.equal(exporter.exportFileName(incoming, "2026-08-01", "2026-10-31"), "incoming-design-2026-08-01-to-2026-10-31.csv");
});

test("all five requested pages use the compact date-range export controls", () => {
  const controls = sourceFile("components/ui/date-range-export-controls.tsx");
  assert.equal((controls.match(/type="date"/g) ?? []).length, 2);
  assert.match(controls, />Open Month</);
  assert.match(controls, />Close Month</);
  assert.match(controls, /variant="secondary"/);
  assert.match(controls, /No records found for the selected date range/);

  const ordersView = sourceFile("app/orders/components/orders-view.tsx");
  assert.match(ordersView, /DateRangeExportControls/);
  assert.match(ordersView, /buildIncomingDesignExportReport\(orders\)/);

  const stageView = sourceFile("components/workflow/workflow-stage-view.tsx");
  assert.match(stageView, /dateRangeExport/);
  assert.match(stageView, /dateRangeExport\(orders\)/);
  [
    ["app/converting/components/tooling-progress-view.tsx", "buildToolingExportReport"],
    ["app/converting/components/rubber-order-setting-view.tsx", "buildRubberExportReport"],
    ["app/converting/components/material-request-view.tsx", "buildMaterialRequestExportReport"],
    ["app/converting/components/sample-view.tsx", "buildSampleProgressExportReport"],
  ].forEach(([filename, builder]) => {
    const source = sourceFile(filename);
    assert.match(source, new RegExp(`dateRangeExport=\\{${builder}\\}`));
  });
});
