import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runAndCapture } from "../scripts/ci/run-and-capture.mjs";

test("CI command capture preserves argument boundaries in paths with spaces", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "fsd cli capture-"));
  const cwd = path.join(root, "workspace with spaces");
  const logDirectory = path.join(root, "logs");
  fs.mkdirSync(cwd);

  try {
    const result = runAndCapture({
      command: process.execPath,
      args: ["-e", "process.stdout.write(process.cwd())"],
      cwd,
      logDirectory,
      label: "cwd with spaces",
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.stdout, fs.realpathSync(cwd));
    assert.match(fs.readFileSync(result.logPath, "utf8"), /exitCode: 0/);
    assert.match(
      fs.readFileSync(result.logPath, "utf8"),
      /"-e","process\.stdout\.write\(process\.cwd\(\)\)"/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("PR architecture comments workflow runs fsd check and posts one sticky comment", () => {
  const workflow = fs.readFileSync(
    path.join(
      import.meta.dirname,
      "..",
      ".github",
      "workflows",
      "pr-architecture-comments.yml"
    ),
    "utf8"
  );
  assert.match(workflow, /workflow_call:/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /fsd check/);
  assert.match(workflow, /fsd doctor/);
  assert.match(workflow, /<!-- fsd-architecture-check -->/);
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /issues\/comments/);
});
