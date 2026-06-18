import type { Metadata } from "next";
import { Bricolage_Grotesque, Spline_Sans_Mono, Shantell_Sans } from "next/font/google";
import "./globals.css";

// Display + UI — the wonky-modern backbone
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

// Data, labels, eyebrows — the "spec sheet" voice
const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

// Handwritten marginalia only — kept sparing
const shantell = Shantell_Sans({
  variable: "--font-shantell",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ResumeAI — a resume you'd pin to the wall", template: "%s | ResumeAI" },
  description:
    "A resume studio for students and job seekers. Pull from GitHub, LeetCode, or your old PDF — we mark up every bullet, fix what the ATS chokes on, and hand you a clean draft.",
  keywords: [
    "resume builder",
    "AI resume",
    "GitHub resume",
    "LeetCode resume",
    "ATS resume checker",
    "student resume",
  ],
  authors: [{ name: "ResumeAI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "ResumeAI",
    title: "ResumeAI — scattered wins, into a resume that lands",
    description:
      "Connect GitHub, LeetCode, Codeforces, or your old resume. We mark it up like a mentor with a red pen and get it past the ATS.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeAI — a resume studio for the job hunt",
    description: "Mark up your resume like a mentor would. Built for students and job seekers.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="paper"
      suppressHydrationWarning
      className={`${bricolage.variable} ${splineMono.variable} ${shantell.variable} antialiased`}
    >
      <body className="min-h-screen">
        {/* fixed background layers: engineering grid + paper grain */}
        <div aria-hidden="true" className="paper-layer paper-grid" />
        <div aria-hidden="true" className="paper-layer paper-grain" />
        {children}
      </body>
    </html>
  );
}
