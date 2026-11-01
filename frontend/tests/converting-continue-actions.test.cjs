/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const sourceRoot = path.resolve(__dirname, "../src");

function sourceFile(relativePath) {
  return fs.readFileSync(path.resolve(sourceRoot, relativePath), "utf8");
}

/** Executes the provider with synchronous hook state, without browser storage. */
function workflowHarness() {
  const states = [];
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => {
        states[index] = typeof value === "function" ? value(states[index]) : value;
      }];
    },
    useCallback: (callback) => callback,
    useMemo: (factory) => factory(),
    useRef: (current) => ({ current }),
    useEffect: () => {},
  };
  const cache = new Map();

  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;

    const loaded = { exports: {} };
    cache.set(filename, loaded);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier === "react") return react;
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const base = specifier.startsWith("@/")
          ? path.resolve(sourceRoot, specifier.slice(2))
          : path.resolve(path.dirname(filename), specifier);
        const resolved = [base, `${base}.ts`, `${base}.tsx`]
          .find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${filename}`);
        return load(resolved);
      }
      return require(specifier);
    };

    new Function("require", "module", "exports", source)(localRequire, loaded, loaded.exports);
    return loaded.exports;
  }

  const { WorkflowOrdersProvider } = load(path.resolve(sourceRoot, "components/workflow/workflow-provider.tsx"));
  const api = () => {
    cursor = 0;
    return WorkflowOrdersProvider({ children: null, currentUserName: "Continue Test" }).props.value;
  };

  return { api };
}

function manualRubberValues(status) {
  return {
    customer: "Manual Customer",
    product: "Manual Rubber Product",
    partNo: "RB-MANUAL",
    material: "Board",
    priority: "Medium",
    pic: "Rubber PIC",
    projectDate: "2026-10-30",
    deadline: "2026-11-10",
    description: "Manual rubber order",
    requirement: {
      requirementType: "Rubber 4MM",
      status,
      requestedBy: "Rubber PIC",
      supplier: "Supplier",
      orderDate: "2026-10-30",
      expectedDate: "2026-11-04",
      arrivalDate: null,
      invoiceNumber: "INV-RUBBER",
      price: "100",
      remark: "Continue test",
    },
  };
}

function inputAttributes(source, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`<span>${escapedLabel}</span>[\\s\\S]{0,300}?<input\\b([\\s\\S]*?)/>`));
  assert.ok(match, `Expected an input for ${label}`);
  return match[1];
}

test("Tooling Edit and Rubber Edit pass Save & Continue as a draft-mode continuation", () => {
  const tooling = sourceFile("app/converting/components/tooling-edit-modal.tsx");
  const rubber = sourceFile("app/converting/components/rubber-edit-modal.tsx");

  for (const [source, save] of [
    [tooling, "saveToolingRequirement"],
    [rubber, "saveRubberRequirement"],
  ]) {
    assert.match(source, /const continueWorkflow = submitMode\.current === "continue";/);
    assert.match(source, new RegExp(`${save}\\([\\s\\S]*?continueWorkflow,[\\s\\S]*?"draft"`, "s"));
    assert.match(source, /disabled=\{!canContinue\}/);
    assert.match(source, /submitMode\.current = "continue";/);
  }
});

test("Add Tooling and Add Rubber keep fulfilment fields optional, while Edit requires them", () => {
  const add = sourceFile("app/converting/components/standalone-requirement-modal.tsx");
  const editSources = [
    sourceFile("app/converting/components/tooling-edit-modal.tsx"),
    sourceFile("app/converting/components/rubber-edit-modal.tsx"),
  ];
  const addFields = ["Received Date", "Supplier / Vendor", "Invoice Number", "Price"];
  const editFields = ["Received Date *", "Supplier / Vendor *", "Invoice Number *", "Price *"];

  for (const label of addFields) {
    assert.doesNotMatch(inputAttributes(add, label), /\brequired\b/);
  }

  for (const source of editSources) {
    assert.match(source, /const \[supplier, setSupplier\] = useState/);
    for (const label of editFields) {
      assert.match(inputAttributes(source, label), /\brequired\b/);
    }
    const supplier = inputAttributes(source, "Supplier / Vendor *");
    assert.match(supplier, /onChange=\{\(event\) => setSupplier\(event\.target\.value\)\}/);
    assert.doesNotMatch(supplier, /\bdisabled\b/);
  }
});

test("Add Rubber keeps Save & Continue limited to ready statuses", () => {
  const source = sourceFile("app/converting/components/standalone-requirement-modal.tsx");

  assert.match(source, /<form className="modal-form" onSubmit=\{handleSubmit\} noValidate>/);
  assert.match(source, /submitMode\.current === "continue" && canContinue/);
  assert.match(source, /!project \? <Button[\s\S]*?Save & Continue/s);
  assert.match(source, /Status must be Received or Available to continue/);
  assert.match(source, /\{error \? <p className="project-form-error" role="alert">\{error\}<\/p> : null\}\s*<footer className="modal-actions">/);
});

test("manual Add Rubber continues ready orders to Material Request and retains non-ready orders", () => {
  for (const readyStatus of ["received", "available"]) {
    const harness = workflowHarness();
    harness.api().createStandaloneRequirementOrder("rubber", manualRubberValues(readyStatus), true);
    const order = harness.api().orders[0];

    assert.equal(order.rubberOrders.at(-1).status, readyStatus);
    assert.equal(order.stage, "material-request");
  }

  const harness = workflowHarness();
  harness.api().createStandaloneRequirementOrder("rubber", manualRubberValues("ordered"), true);
  const order = harness.api().orders[0];

  assert.equal(order.rubberOrders.at(-1).status, "ordered");
  assert.equal(order.stage, "rubber-order-setting");
});

test("manual Add Rubber saves an Ordered record without receipt details", () => {
  const harness = workflowHarness();
  const values = manualRubberValues("ordered");
  values.requirement.arrivalDate = null;
  values.requirement.supplier = "";
  values.requirement.invoiceNumber = "";
  values.requirement.price = "";

  harness.api().createStandaloneRequirementOrder("rubber", values, false);
  const order = harness.api().orders[0];

  assert.equal(order.rubberOrders.length, 1);
  assert.equal(order.rubberOrders[0].status, "ordered");
  assert.equal(order.rubberOrders[0].arrivalDate, null);
  assert.equal(order.rubberOrders[0].supplier, "");
  assert.equal(order.stage, "rubber-order-setting");
});
