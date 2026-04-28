"use client";

import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { label: "Product", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Proof", href: "#proof" },
  { label: "Pricing", href: "#pricing" },
  { label: "Tracker", href: "/tracker" },
];

const integrations = ["GitHub", "LinkedIn", "Resume PDF", "LeetCode", "Codeforces", "Job Description"];

const proofPoints = [
  { value: "94%", label: "average ATS compatibility after tailoring" },
  { value: "11 min", label: "from raw profiles to polished resume" },
  { value: "3.8x", label: "more role-specific keywords in experience bullets" },
];

const workflow = [
  {
    eyebrow: "01",
    title: "Ingest actual proof",
    body: "Pulls public repos, profile history, old resume content, and competitive programming signals without making you rewrite everything manually.",
  },
  {
    eyebrow: "02",
    title: "Score against the role",
    body: "Compares the job description against projects, experience, tools, seniority, and gaps before deciding what deserves resume space.",
  },
  {
    eyebrow: "03",
    title: "Ship a tight resume",
    body: "Writes quantified bullets, trims duplicate projects, and keeps the final output structured for ATS parsing and recruiter scanning.",
  },
];

const features = [
  "Role-specific experience bullets",
  "GitHub project evidence extraction",
  "ATS simulation with parser checks",
  "One-page resume trimming",
  "Application tracker and nudges",
  "Interview prep from job context",
];

const featureTabs = [
  {
    title: "AI bullet writer",
    description:
      "Turns raw experience into specific, quantified bullets that read like real engineering work.",
    preview: "bullets",
  },
  {
    title: "GitHub project importer",
    description:
      "Finds strong repos, languages, stars, READMEs, and project evidence instead of dumping everything.",
    preview: "github",
  },
  {
    title: "LeetCode stats sync",
    description:
      "Adds competitive programming signal only when it helps the role and page budget.",
    preview: "leetcode",
  },
  {
    title: "JD tailor",
    description:
      "Maps keywords and required skills into experience bullets without keyword stuffing.",
    preview: "jd",
  },
  {
    title: "ATS score checker",
    description:
      "Runs parser, keyword, date, section, and formatting checks before download.",
    preview: "ats",
  },
] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

function PrimaryCTA({ children, href }: { children: React.ReactNode; href: string }) {
  const className =
    "inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black shadow-[inset_0_-1px_0_rgba(0,0,0,0.22),0_16px_48px_rgba(255,255,255,0.08)] transition hover:bg-zinc-200";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
    >
      {children}
    </a>
  );
}

function SecondaryCTA({ children, href }: { children: React.ReactNode; href: string }) {
  const className =
    "inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-zinc-200 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white";

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
    >
      {children}
    </a>
  );
}

function GridOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "linear-gradient(to bottom, black, transparent 72%)",
      }}
    />
  );
}

function FeaturePreview({ preview }: { preview: (typeof featureTabs)[number]["preview"] }) {
  if (preview === "github") {
    const repos = [
      { repo: "resume-agent", lang: "TypeScript", stars: 128 },
      { repo: "ats-simulator", lang: "Python", stars: 74 },
      { repo: "latex-renderer", lang: "Go", stars: 39 },
    ];

    return (
      <div className="space-y-3 text-xs">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          Imported from GitHub
        </div>
        {repos.map((item, index) => (
          <motion.div
            key={item.repo}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3"
          >
            <div>
              <div className="font-medium text-white">/{item.repo}</div>
              <div className="mt-1 text-zinc-500">{item.lang}</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-300">
              {item.stars} stars
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  if (preview === "leetcode") {
    const bars = [42, 68, 54, 76, 88, 61, 94, 72, 84, 58, 91, 79];

    return (
      <div className="space-y-5 text-xs">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Solved", value: "847" },
            { label: "Rating", value: "1,923" },
            { label: "Hard", value: "112" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
              <div className="text-2xl font-semibold tracking-tighter text-white">{stat.value}</div>
              <div className="mt-1 text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="flex h-28 items-end gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {bars.map((height, index) => (
            <motion.div
              key={`${height}-${index}`}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.04, duration: 0.45 }}
              className="flex-1 rounded-t-sm bg-white"
            />
          ))}
        </div>
      </div>
    );
  }

  if (preview === "jd") {
    return (
      <div className="space-y-4 text-xs">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
            Job description
          </div>
          <p className="mt-3 leading-6 text-zinc-300">
            Senior backend engineer with Python, PostgreSQL, AWS, distributed systems, and
            production ownership.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Python", "PostgreSQL", "AWS", "Redis", "distributed systems"].map((keyword) => (
            <span key={keyword} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-zinc-200">
              {keyword}
            </span>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-zinc-400">
          Rewrites experience bullets first. Skills-only keyword matches are deprioritized.
        </div>
      </div>
    );
  }

  if (preview === "ats") {
    const checks = [
      { label: "Parser compatibility", score: 96 },
      { label: "Keyword location", score: 91 },
      { label: "Section headings", score: 100 },
      { label: "Page length", score: 88 },
    ];

    return (
      <div className="space-y-4 text-xs">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              ATS score
            </div>
            <div className="mt-2 text-zinc-400">Workday, Greenhouse, Lever, iCIMS</div>
          </div>
          <div className="text-5xl font-semibold tracking-tighter text-white">94</div>
        </div>
        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.label}>
              <div className="mb-1.5 flex justify-between text-zinc-400">
                <span>{check.label}</span>
                <span className="text-zinc-200">{check.score}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${check.score}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const bullets = [
    "Architected Redis-backed search cache reducing API latency 42% across 1.8M monthly requests.",
    "Shipped AWS deployment pipeline cutting release time from 2 hours to 18 minutes.",
    "Migrated PostgreSQL reporting jobs to async workers, improving dashboard freshness by 61%.",
  ];

  return (
    <div className="space-y-4 text-xs">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
        Writing experience bullets
      </div>
      {bullets.map((bullet, index) => (
        <motion.div
          key={bullet}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-zinc-300"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
          <span className="leading-5">{bullet}</span>
        </motion.div>
      ))}
    </div>
  );
}

function InteractiveFeatureWindow() {
  const [active, setActive] = useState(0);
  const current = featureTabs[active];

  return (
    <section id="features" className="relative border-y border-white/10 bg-black py-28">
      <GridOverlay />
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
            Product
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tighter text-white sm:text-6xl">
            Explore the engine behind each resume.
          </h2>
          <p className="mt-5 text-base leading-7 text-zinc-400">
            Pick a capability on the left. The preview window changes on the right with live product signals.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-2">
            {featureTabs.map((feature, index) => (
              <button
                key={feature.title}
                type="button"
                onClick={() => setActive(index)}
                className={`group w-full rounded-2xl border p-5 text-left transition ${
                  active === index
                    ? "border-white/20 bg-white/[0.07] text-white"
                    : "border-transparent bg-transparent text-zinc-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`mt-1 font-mono text-xs ${active === index ? "text-white" : "text-zinc-600"}`}>
                    0{index + 1}
                  </span>
                  <span>
                    <span className="block text-base font-medium tracking-tight">{feature.title}</span>
                    <span className={`mt-2 block text-sm leading-6 ${active === index ? "text-zinc-400" : "text-zinc-600"}`}>
                      {feature.description}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          <motion.div
            layout
            className="sticky top-28 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                {current.title}
              </span>
            </div>
            <div className="min-h-[360px] p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.preview}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <FeaturePreview preview={current.preview} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ResumeMockup() {
  const bullets = [
    "Reduced API latency 42% by redesigning Redis-backed request caching for high-volume search endpoints.",
    "Shipped Docker and AWS deployment flow cutting release time from 2 hours to 18 minutes.",
    "Built PostgreSQL analytics layer processing 1.8M events with role-specific ATS keywords.",
  ];

  return (
    <motion.div
      variants={fadeUp}
      className="relative mx-auto mt-16 w-full max-w-[560px] lg:mt-0"
    >
      <div className="absolute -inset-12 rounded-full bg-white/10 blur-[120px]" />
      <div className="relative [perspective:1000px]">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
          className="transform-gpu [transform:rotateX(10deg)_rotateY(-12deg)]"
        >
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_50px_160px_rgba(0,0,0,0.75)] backdrop-blur-xl">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-zinc-950">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  tailored_resume.pdf
                </span>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-[1fr_170px]">
                <div className="rounded-2xl bg-zinc-100 p-7 text-zinc-950 shadow-2xl">
                  <div className="border-b border-zinc-300 pb-4 text-center">
                    <div className="text-xl font-bold tracking-tight">Kunal Pratap Singh</div>
                    <div className="mt-1 text-[10px] text-zinc-600">
                      Backend Engineer | GitHub | LinkedIn | Bengaluru
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-900">
                        Experience
                      </div>
                      <div className="mt-2 space-y-2">
                        {bullets.map((bullet) => (
                          <div key={bullet} className="flex gap-2 text-[10px] leading-4 text-zinc-700">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-zinc-900" />
                            <span>{bullet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-900">
                        Projects
                      </div>
                      <div className="mt-2 h-2 w-full rounded bg-zinc-300" />
                      <div className="mt-2 h-2 w-4/5 rounded bg-zinc-300" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">ATS score</div>
                    <div className="mt-3 text-4xl font-semibold tracking-tighter text-white">94</div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-[94%] rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Evidence used</div>
                    <div className="mt-3 space-y-2 text-xs text-zinc-300">
                      <div>GitHub repos</div>
                      <div>LinkedIn roles</div>
                      <div>Existing resume</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                    <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Page fit</div>
                    <div className="mt-3 text-sm font-medium text-white">1 page locked</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white text-xs font-bold text-black">
              R
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">ResumeAI</span>
          </Link>
          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-zinc-400 transition hover:text-white"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-zinc-400 transition hover:text-white"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden text-sm font-medium text-zinc-400 transition hover:text-white sm:block">
              Sign in
            </Link>
            <PrimaryCTA href="/dashboard">Get started</PrimaryCTA>
          </div>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        <section className="relative min-h-screen overflow-hidden bg-black pt-32">
          <GridOverlay />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-white/5 blur-[120px]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />

          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 lg:grid-cols-[0.95fr_1.05fr] lg:pb-32">
            <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-3xl">
              <motion.div
                variants={fadeUp}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Resume intelligence for software engineers
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="max-w-4xl text-5xl font-semibold tracking-tighter text-white sm:text-6xl lg:text-[82px] lg:leading-[0.9]"
              >
                Turn scattered proof into a resume that wins interviews.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg"
              >
                Connect GitHub, LinkedIn, LeetCode, and an existing resume. ResumeAI audits the evidence,
                scores it against the job, and assembles a crisp ATS-ready resume without filler.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <PrimaryCTA href="/dashboard">Build my resume</PrimaryCTA>
                <SecondaryCTA href="#product">See the product</SecondaryCTA>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-10 grid max-w-xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                {proofPoints.map((point) => (
                  <div key={point.value} className="bg-black/70 p-4 backdrop-blur-md">
                    <div className="text-2xl font-semibold tracking-tighter text-white">{point.value}</div>
                    <div className="mt-1 text-xs leading-5 text-zinc-500">{point.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <ResumeMockup />
          </div>
        </section>

        <section id="product" className="relative border-y border-white/10 bg-zinc-950 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">Integrations</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tighter text-white sm:text-5xl">
                  Built around the evidence you already have.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-zinc-400">
                No fake dashboards, no manual copy-paste maze. Every source becomes structured resume signal.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {integrations.map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ y: -3 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md transition hover:bg-white/[0.08]"
                >
                  <div className="mb-8 h-8 w-8 rounded-lg border border-white/10 bg-white/[0.06]" />
                  <div className="text-sm font-medium text-white">{item}</div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">Parsed, scored, and deduped.</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <InteractiveFeatureWindow />

        <section id="workflow" className="relative bg-black py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">Workflow</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tighter text-white sm:text-6xl">
                Agentic where it matters. Deterministic where it counts.
              </h2>
              <p className="mt-5 text-base leading-7 text-zinc-400">
                The system separates judgment from formatting so your resume is specific, verifiable, and tight.
              </p>
            </div>

            <div className="mt-16 grid gap-4 lg:grid-cols-3">
              {workflow.map((step) => (
                <motion.article
                  key={step.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md"
                >
                  <div className="text-xs font-medium text-zinc-500">{step.eyebrow}</div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-tight text-white">{step.title}</h3>
                  <p className="mt-4 text-sm leading-6 text-zinc-400">{step.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="proof" className="relative overflow-hidden border-y border-white/10 bg-zinc-950 py-28">
          <GridOverlay />
          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">Quality bar</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tighter text-white sm:text-6xl">
                Designed to remove the generic resume smell.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
                The output prioritizes experience, validates company context, removes duplicate projects,
                and keeps the final resume within the page budget.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-sm font-medium text-zinc-200 backdrop-blur-md"
                >
                  <div className="mb-7 h-1 w-10 rounded-full bg-white" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-black py-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">Start</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tighter text-white sm:text-6xl">
              Build the resume before the opportunity gets cold.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400">
              Start with your existing proof. Tailor for a role. Download a clean resume built for ATS and recruiters.
            </p>
            <div className="mt-9 flex justify-center">
              <PrimaryCTA href="/dashboard">Create a resume</PrimaryCTA>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
          <span>ResumeAI</span>
          <span>Built for engineers who need signal, not decoration.</span>
        </div>
      </footer>
    </div>
  );
}
