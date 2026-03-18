import { NextRequest } from "next/server";

// In-memory storage for development. Replace with Supabase in production.
const resumes = new Map<string, object>();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const resume = resumes.get(id);

  if (!resume) {
    return Response.json({ error: "Resume not found" }, { status: 404 });
  }

  return Response.json(resume);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  resumes.set(id, { ...body, id, updatedAt: new Date().toISOString() });

  return Response.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  resumes.delete(id);

  return Response.json({ success: true });
}
