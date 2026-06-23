import { NextResponse } from "next/server";
import { applyFix } from "@/lib/ats/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      run_id?: string;
      rule_id?: string;
    };

    if (!body.run_id || !body.rule_id) {
      return NextResponse.json(
        { error: "run_id and rule_id are required" },
        { status: 400 },
      );
    }

    const result = await applyFix(body.run_id, body.rule_id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ATS fix failed" },
      { status: 500 },
    );
  }
}
