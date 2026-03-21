import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "ResumeAI", template: "%s | ResumeAI" },
  description:
    "AI-powered resume builder. Connect GitHub, LeetCode, Codeforces — we write your resume in seconds.",
  keywords: [
    "resume builder",
    "AI resume",
    "GitHub resume",
    "LeetCode resume",
    "software engineer resume",
  ],
  authors: [{ name: "ResumeAI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "ResumeAI",
    title: "ResumeAI — Your resume, written by AI",
    description:
      "Connect GitHub, LeetCode, Codeforces. Upload your old resume. AI builds a job-winning resume in seconds.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeAI — Your resume, written by AI",
    description: "AI-powered resume builder for engineers.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
