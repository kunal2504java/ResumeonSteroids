import { NextResponse } from "next/server";
import type { Resume } from "@resumeai/shared";
import { readSnapshot, simulateAndPersist } from "@/lib/ats/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      assembled_resume?: Resume;
      job_description?: string;
      run_id?: string;
      max_pages?: number;
    };

    if (!body.assembled_resume || !body.run_id) {
      return NextResponse.json(
        { error: "run_id and assembled_resume are required" },
        { status: 400 },
      );
    }

    const snapshot = await simulateAndPersist({
      run_id: body.run_id,
      assembled_resume: body.assembled_resume,
      job_description: body.job_description ?? "",
      max_pages: body.max_pages,
    });

    return NextResponse.json({
      run_id: snapshot.run_id,
      ...snapshot.report,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ATS simulation failed" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const runId = request.headers.get("x-run-id");
  if (!runId) {
    return NextResponse.json({ error: "x-run-id header is required" }, { status: 400 });
  }

  const snapshot = await readSnapshot(runId);
  if (!snapshot) {
    return NextResponse.json({ error: "ATS report not found" }, { status: 404 });
  }

  return NextResponse.json({
    run_id: snapshot.run_id,
    ...snapshot.report,
  });
}
