import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";

const route = new Hono();

route.post("/", authMiddleware, async (c) => {
  try {
    const { html } = await c.req.json();

    if (!html) {
      return c.json({ error: "HTML content required" }, 400);
    }

    // For client-side PDF generation, we return processed HTML
    // The actual PDF is generated on the client using html-to-image + jsPDF
    // This endpoint could be extended with Puppeteer for server-side generation
    return c.json({
      html,
      message: "Use client-side PDF generation with jsPDF",
    });
  } catch (error) {
    console.error("[PDF Export Error]", error);
    return c.json({ error: "PDF export failed" }, 500);
  }
});

export { route as pdfExportRoute };
