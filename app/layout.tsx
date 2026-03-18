import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ResumeAI — Your resume, written by AI",
  description:
    "Connect GitHub, LeetCode, or Codeforces. Upload your old resume. Our AI builds a job-winning resume in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} antialiased`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
