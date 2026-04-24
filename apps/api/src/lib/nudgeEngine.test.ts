import assert from "node:assert/strict";
import test from "node:test";
import { runNudgeEngineForApplication, nextNudgeRunAt } from "./nudgeEngine";
import type { ApplicationForNudge, ApplicationEventForNudge } from "./nudgeEngine";

const NOW = new Date("2026-04-24T12:00:00Z");

function app(overrides: Partial<ApplicationForNudge> = {}): ApplicationForNudge {
  return {
    id: "app_1",
    user_id: "user_1",
    company_name: "Acme",
    role_title: "Backend Engineer",
    status: "applied",
    applied_at: "2026-04-18T12:00:00Z",
    created_at: "2026-04-18T12:00:00Z",
    updated_at: "2026-04-18T12:00:00Z",
    ...overrides,
  };
}

function event(
  event_type: string,
  created_at: string,
  event_data?: Record<string, unknown>,
): ApplicationEventForNudge {
  return { event_type, created_at, event_data };
}

test("follow up nudge fires at 5 days", () => {
  const result = runNudgeEngineForApplication({
    application: app(),
    events: [],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "send_follow_up"), true);
});

test("follow up nudge does not fire at 3 days", () => {
  const result = runNudgeEngineForApplication({
    application: app({ applied_at: "2026-04-21T12:00:00Z", created_at: "2026-04-21T12:00:00Z" }),
    events: [],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "send_follow_up"), false);
});

test("follow up nudge does not fire if outreach was sent", () => {
  const result = runNudgeEngineForApplication({
    application: app(),
    events: [event("email_sent", "2026-04-20T12:00:00Z")],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "send_follow_up"), false);
});

test("send outreach nudge fires when target exists", () => {
  const result = runNudgeEngineForApplication({
    application: app(),
    events: [],
    targets: [{ id: "target_1", target_name: "Priya", target_title: "Engineering Manager" }],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "send_outreach"), true);
});

test("ghosted nudge fires at 14 days", () => {
  const result = runNudgeEngineForApplication({
    application: app({ applied_at: "2026-04-09T12:00:00Z", created_at: "2026-04-09T12:00:00Z" }),
    events: [],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "ghosted_alert"), true);
});

test("auto transition to ghosted after 21 days", () => {
  const result = runNudgeEngineForApplication({
    application: app({ applied_at: "2026-04-01T12:00:00Z", created_at: "2026-04-01T12:00:00Z" }),
    events: [],
    now: NOW,
  });
  assert.equal(result.autoTransitionTo, "ghosted");
});

test("prep nudge fires 48 hours before screen", () => {
  const result = runNudgeEngineForApplication({
    application: app({ status: "screen_scheduled" }),
    events: [event("screen_scheduled", "2026-04-22T12:00:00Z", { scheduled_at: "2026-04-26T10:00:00Z" })],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "prep_interview"), true);
});

test("thank you nudge fires day after screen event", () => {
  const result = runNudgeEngineForApplication({
    application: app({ status: "screen_scheduled" }),
    events: [event("screen_scheduled", "2026-04-22T12:00:00Z", { interviewer_name: "Aarav" })],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "send_thank_you"), true);
});

test("negotiate nudge fires on offer", () => {
  const result = runNudgeEngineForApplication({
    application: app({ status: "offer" }),
    events: [],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "negotiate_offer"), true);
});

test("referral nudge fires when mutual connection exists", () => {
  const result = runNudgeEngineForApplication({
    application: app({ status: "saved" }),
    events: [],
    targets: [
      {
        id: "target_1",
        target_name: "Meera",
        target_title: "Senior Engineer",
        is_mutual_connection: true,
        mutual_connection_name: "Meera",
        mutual_connection_title: "Senior Engineer",
      },
    ],
    now: NOW,
  });
  assert.equal(result.nudges.some((nudge) => nudge.nudge_type === "request_referral"), true);
});

test("nudge engine skips rejected applications", () => {
  const result = runNudgeEngineForApplication({
    application: app({ status: "rejected" }),
    events: [],
    now: NOW,
  });
  assert.deepEqual(result.nudges, []);
});

test("all nudges include action labels and action types", () => {
  const result = runNudgeEngineForApplication({
    application: app(),
    events: [],
    targets: [{ id: "target_1", target_name: "Priya", target_title: "Engineering Manager" }],
    now: NOW,
  });
  assert.equal(result.nudges.every((nudge) => nudge.action_label && nudge.action_type), true);
});

test("next nudge run is top of next hour", () => {
  assert.equal(nextNudgeRunAt(new Date("2026-04-24T12:34:56Z")).toISOString(), "2026-04-24T13:00:00.000Z");
});
