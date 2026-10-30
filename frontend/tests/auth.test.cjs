/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function load(relativePath) {
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src", relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  new Function("module", "exports", source)(loaded, loaded.exports);
  return loaded.exports;
}
const { demoUsers } = load("data/users.ts");
const { authenticateUser, canAccessPath, workflowRoleForUser } = load("lib/auth.ts");

test("all five demo accounts authenticate by username and email with password", () => {
  assert.equal(demoUsers.length, 5);
  for (const user of demoUsers) {
    assert.equal(authenticateUser(demoUsers, ` ${user.name.toUpperCase()} `, "password"), user);
    assert.equal(authenticateUser(demoUsers, user.email, "password"), user);
    assert.equal(authenticateUser(demoUsers, user.name, "wrong"), null);
    assert.equal(authenticateUser([{ ...user, status: "Inactive" }], user.name, "password"), null);
  }
  assert.equal(authenticateUser(demoUsers, "unknown", "password"), null);
});

test("role access matches the requested menu matrix", () => {
  const routes = ["/dashboard", "/orders", "/issue-log", "/converting/tooling-progress", "/converting/rubber-order-setting", "/converting/material-request", "/converting/sample", "/offset/prepress", "/offset/material", "/offset/plate", "/offset/varnish", "/offset/press", "/quality-control", "/history-archive", "/users"];
  const expected = {
    Superadmin: routes,
    Designer: routes.filter(route => ["/dashboard", "/orders", "/history-archive"].includes(route) || route.startsWith("/converting/") || route.startsWith("/offset/")),
    QC: ["/dashboard", "/quality-control", "/history-archive"],
    Intern: ["/dashboard", "/converting/tooling-progress", "/converting/rubber-order-setting", "/history-archive"],
  };
  for (const [role, allowed] of Object.entries(expected)) {
    for (const route of routes) assert.equal(canAccessPath(role, route), allowed.includes(route), `${role}: ${route}`);
  }
});

test("nested routes keep access rules without matching similarly named paths", () => {
  assert.equal(canAccessPath("Intern", "/converting/tooling-progress/details"), true);
  assert.equal(canAccessPath("Intern", "/converting/tooling-progress-other"), false);
  assert.equal(canAccessPath("QC", "/users/edit"), false);
  assert.equal(canAccessPath("Designer", "/offset/design"), true);
  assert.equal(canAccessPath("Designer", "/offset/spk"), true);
  assert.deepEqual(workflowRoleForUser, { Superadmin: "superadmin", Designer: "design", QC: "qc", Intern: "intern" });
});
