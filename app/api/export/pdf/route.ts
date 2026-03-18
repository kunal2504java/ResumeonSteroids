import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();

    if (!html) {
      return Response.json({ error: "HTML content required" }, { status: 400 });
    }

    // For client-side PDF generation, we return processed HTML
    // The actual PDF is generated on the client using html-to-image + jsPDF
    // This endpoint could be extended with Puppeteer for server-side generation
    return Response.json({
      html,
      message: "Use client-side PDF generation with jsPDF",
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return Response.json({ error: "PDF export failed" }, { status: 500 });
  }
}
