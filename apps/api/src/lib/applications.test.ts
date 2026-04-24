import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_TRANSITIONS,
  canTransitionStatus,
  isApplicationStatus,
  parseLimit,
  sanitizeApplicationPayload,
} from "./applications";

test("application status transition map matches tracker state machine", () => {
  assert.deepEqual(ALLOWED_TRANSITIONS.saved, ["applied", "withdrawn"]);
  assert.deepEqual(ALLOWED_TRANSITIONS.applied, [
    "outreach_sent",
    "screen_scheduled",
    "rejected",
    "withdrawn",
    "ghosted",
  ]);
  assert.deepEqual(ALLOWED_TRANSITIONS.outreach_sent, [
    "screen_scheduled",
    "rejected",
    "withdrawn",
    "ghosted",
  ]);
  assert.deepEqual(ALLOWED_TRANSITIONS.screen_scheduled, [
    "interviewing",
    "rejected",
    "withdrawn",
  ]);
  assert.deepEqual(ALLOWED_TRANSITIONS.interviewing, ["offer", "rejected", "withdrawn"]);
  assert.deepEqual(ALLOWED_TRANSITIONS.offer, ["withdrawn"]);
  assert.deepEqual(ALLOWED_TRANSITIONS.rejected, []);
  assert.deepEqual(ALLOWED_TRANSITIONS.withdrawn, []);
  assert.deepEqual(ALLOWED_TRANSITIONS.ghosted, ["applied"]);
});

test("status transition validator allows only explicit transitions", () => {
  assert.equal(canTransitionStatus("saved", "applied"), true);
  assert.equal(canTransitionStatus("saved", "offer"), false);
  assert.equal(canTransitionStatus("applied", "ghosted"), true);
  assert.equal(canTransitionStatus("rejected", "applied"), false);
  assert.equal(canTransitionStatus("ghosted", "applied"), true);
});

test("application status guard rejects unknown values", () => {
  assert.equal(isApplicationStatus("applied"), true);
  assert.equal(isApplicationStatus("hired"), false);
  assert.equal(isApplicationStatus(null), false);
});

test("application payload requires company and role", () => {
  const result = sanitizeApplicationPayload({ company_name: "", role_title: "Engineer" });
  assert.equal(result.value, null);
  assert.equal(result.error, "company_name and role_title are required");
});

test("application payload defaults to saved status", () => {
  const result = sanitizeApplicationPayload({
    company_name: "Acme",
    role_title: "Backend Engineer",
  });
  assert.equal(result.error, null);
  assert.equal(result.value?.status, "saved");
  assert.equal(result.value?.applied_at, null);
});

test("application payload sets applied_at for already applied applications", () => {
  const result = sanitizeApplicationPayload({
    company_name: "Acme",
    role_title: "Backend Engineer",
    status: "applied",
  });
  assert.equal(result.error, null);
  assert.equal(result.value?.status, "applied");
  assert.equal(typeof result.value?.applied_at, "string");
});

test("parseLimit clamps query limits", () => {
  assert.equal(parseLimit(undefined), 50);
  assert.equal(parseLimit("0"), 1);
  assert.equal(parseLimit("500"), 100);
  assert.equal(parseLimit("abc"), 50);
});
