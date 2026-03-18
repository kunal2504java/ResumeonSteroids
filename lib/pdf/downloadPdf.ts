// This file is only ever imported via next/dynamic or eval-guarded dynamic import
// to avoid Turbopack tracing jsPDF's Node.js Worker dependency during SSR

export async function downloadPdf(element: HTMLElement, filename: string) {
  const { toPng } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");

  const png = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    width: 816,
    height: 1056,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  pdf.addImage(png, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
  pdf.save(`${filename}.pdf`);
}
