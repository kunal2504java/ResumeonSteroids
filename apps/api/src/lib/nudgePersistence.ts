import { canTransitionStatus, type ApplicationStatus } from "./applications";
import { getSupabaseAdmin } from "./supabase";
import { runNudgeEngineForApplication } from "./nudgeEngine";

function toNudgeRow(nudge: ReturnType<typeof runNudgeEngineForApplication>["nudges"][number]) {
  return {
    application_id: nudge.application_id,
    user_id: nudge.user_id,
    nudge_type: nudge.nudge_type,
    priority: nudge.priority,
    title: nudge.title,
    body: nudge.body,
    action_label: nudge.action_label,
    action_type: nudge.action_type,
    action_payload: nudge.action_payload,
    due_date: nudge.due_date,
  };
}

export async function refreshNudgesForApplication(applicationId: string, userId: string) {
  const supabase = getSupabaseAdmin();
  const { data: application, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single();

  if (appError || !application) {
    throw new Error("Application not found");
  }

  const [events, targets, existingNudges] = await Promise.all([
    supabase
      .from("application_events")
      .select("*")
      .eq("application_id", applicationId)
      .eq("user_id", userId),
    supabase
      .from("outreach_targets")
      .select("*")
      .eq("application_id", applicationId)
      .eq("user_id", userId),
    supabase
      .from("nudges")
      .select("*")
      .eq("application_id", applicationId)
      .eq("user_id", userId)
      .eq("is_dismissed", false),
  ]);

  const result = runNudgeEngineForApplication({
    application: {
      id: application.id,
      user_id: application.user_id,
      company_name: application.company_name,
      role_title: application.role_title,
      status: application.status,
      applied_at: application.applied_at,
      created_at: application.created_at,
      updated_at: application.updated_at,
    },
    events: (events.data ?? []).map((event) => ({
      event_type: event.event_type,
      created_at: event.created_at,
      event_data: event.event_data ?? {},
    })),
    targets: (targets.data ?? []).map((target) => ({
      id: target.id,
      target_name: target.target_name,
      target_title: target.target_title,
      mutual_connection_name: target.mutual_connection_name,
      mutual_connection_title: target.mutual_connection_title,
    })),
    existingNudges: (existingNudges.data ?? []).map((nudge) => ({
      nudge_type: nudge.nudge_type,
      action_payload: nudge.action_payload ?? {},
      is_dismissed: nudge.is_dismissed,
    })),
  });

  if (result.autoTransitionTo) {
    const currentStatus = application.status as ApplicationStatus;
    if (canTransitionStatus(currentStatus, result.autoTransitionTo)) {
      await supabase
        .from("applications")
        .update({ status: result.autoTransitionTo })
        .eq("id", applicationId)
        .eq("user_id", userId);

      await supabase.from("application_events").insert({
        application_id: applicationId,
        user_id: userId,
        event_type: "status_changed",
        event_data: {
          from: currentStatus,
          to: result.autoTransitionTo,
          reason: "nudge_engine_auto_transition",
        },
      });
    }
  }

  if (result.nudges.length > 0) {
    const { error } = await supabase.from("nudges").insert(result.nudges.map(toNudgeRow));
    if (error) {
      throw new Error("Failed to persist nudges");
    }
  }

  return result;
}
