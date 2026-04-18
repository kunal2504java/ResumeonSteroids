import { NextResponse } from "next/server";
import { fetchRules } from "@/lib/ats/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const payload = await fetchRules();
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load ATS rules" },
      { status: 500 },
    );
  }
}
