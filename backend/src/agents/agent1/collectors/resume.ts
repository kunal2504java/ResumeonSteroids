/**
 * Resume Upload Collector
 *
 * Accepts a base64-encoded PDF/DOCX file.
 * Returns the file data for downstream processing —
 * text extraction and Claude parsing happen in Agent 1's orchestrator.
 */

export interface ResumeRawData {
  source: "upload";
  fileBase64: string;
  mimeType: string;
  fileName: string;
}

/**
 * Collect an uploaded resume file.
 * Validates the input and returns it for downstream extraction.
 * The actual PDF/DOCX → text → Claude parsing is handled in Agent 1.
 */
export async function collectResume(
  fileBase64: string,
  mimeType: string,
  fileName: string
): Promise<ResumeRawData> {
  if (!fileBase64) {
    throw new Error("No file data provided");
  }

  const supportedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  const isSupported =
    supportedTypes.includes(mimeType) ||
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".txt");

  if (!isSupported) {
    throw new Error(`Unsupported file type: ${mimeType}. Use PDF, DOCX, or TXT.`);
  }

  return {
    source: "upload",
    fileBase64,
    mimeType,
    fileName,
  };
}
