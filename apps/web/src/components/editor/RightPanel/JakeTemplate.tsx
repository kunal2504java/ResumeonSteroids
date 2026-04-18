"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import { forwardRef } from "react";

/**
 * Format "YYYY-MM" or "YYYY" into "November 2025" style.
 * Pass-through if already human-readable (e.g. "Present").
 */
function formatDate(date: string): string {
  if (!date) return "";
  const MONTHS = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (date.includes("-")) {
    const [year, month] = date.split("-");
    const monthName = month ? MONTHS[Number(month)] : "";
    return month ? `${monthName || month} ${year}` : year;
  }
  return date;
}

function dateRange(start: string, end: string): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (!s && !e) return "";
  if (!e || e === "Present") return `${s} \u2013 Present`;
  return `${s} \u2013 ${e}`;
}

const JakeTemplate = forwardRef<HTMLDivElement>(function JakeTemplate(_, ref) {
  const resume = useResumeStore((s) => s.resume);

  if (!resume) return null;

  const { personalInfo: p, education, experience, projects, skills } = resume;

  /* ---- contact line fragments ---- */
  const contactParts = [
    p.phone,
    p.email && (
      <a key="email" href={`mailto:${p.email}`} className="underline">
        {p.email}
      </a>
    ),
    p.linkedin && (
      <a key="li" href={p.linkedin} className="underline">
        {p.linkedin.replace(/https?:\/\/(www\.)?/, "")}
      </a>
    ),
    p.github && (
      <a key="gh" href={p.github} className="underline">
        {p.github.replace(/https?:\/\/(www\.)?/, "")}
      </a>
    ),
    p.website && (
      <a key="web" href={p.website} className="underline">
        {p.website.replace(/https?:\/\/(www\.)?/, "")}
      </a>
    ),
  ].filter(Boolean);

  return (
    <div
      ref={ref}
      data-resume-preview
      className="bg-white text-black w-[816px] h-[1056px] overflow-hidden"
      style={{
        fontFamily:
          '"Latin Modern Roman", "CMU Serif", "Computer Modern Serif", "STIX Two Text", "Times New Roman", serif',
        fontSize: "11pt",
        lineHeight: "1.15",
        padding: "48px",
      }}
    >
      {/* ===== HEADING ===== */}
      <div className="text-center mb-1">
        <h1
          className="font-bold"
          style={{
            fontSize: "26pt",
            fontVariant: "small-caps",
            letterSpacing: "0.02em",
            lineHeight: "1.05",
          }}
        >
          {p.name || "Your Name"}
        </h1>
        {p.location && (
          <div className="mt-[1px]" style={{ fontSize: "10pt", lineHeight: "1.1" }}>
            {p.location}
          </div>
        )}
        {contactParts.length > 0 && (
          <div
            className="flex items-center justify-center flex-wrap mt-[1px]"
            style={{ fontSize: "9pt", lineHeight: "1.1" }}
          >
            {contactParts.map((part, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <span className="mx-1.5">|</span>}
                {part}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ===== EDUCATION ===== */}
      {education.length > 0 && (
        <Section title="Education">
          {education.map((edu) => (
            <SubHeading
              key={edu.id}
              topLeft={edu.institution}
              topRight={edu.location}
              bottomLeft={
                <span>
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.gpa ? `, GPA: ${edu.gpa}` : ""}
                </span>
              }
              bottomRight={dateRange(edu.startDate, edu.endDate)}
            />
          ))}
        </Section>
      )}

      {/* ===== EXPERIENCE ===== */}
      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((exp) => (
            <div key={exp.id} className="mb-[2px]">
              <SubHeading
                topLeft={exp.company}
                topRight={dateRange(exp.startDate, exp.endDate)}
                bottomLeft={exp.title}
                bottomRight={exp.location}
              />
              <BulletList bullets={exp.bullets} />
            </div>
          ))}
        </Section>
      )}

      {/* ===== PROJECTS ===== */}
      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((proj) => (
            <div key={proj.id} className="mb-[2px]">
              <div className="flex justify-between items-baseline">
                <div style={{ fontSize: "9pt", lineHeight: "1.15" }}>
                  <span className="font-bold">{proj.name}</span>
                  {proj.techStack.length > 0 && (
                    <span>
                      {" | "}
                      <em>{proj.techStack.join(", ")}</em>
                    </span>
                  )}
                </div>
                <span className="text-right shrink-0 ml-4" style={{ fontSize: "9pt", lineHeight: "1.15" }}>
                  {dateRange(proj.startDate, proj.endDate)}
                </span>
              </div>
              <BulletList bullets={proj.bullets} />
            </div>
          ))}
        </Section>
      )}

      {/* ===== TECHNICAL SKILLS ===== */}
      {(skills.languages.length > 0 ||
        skills.frameworks.length > 0 ||
        skills.tools.length > 0 ||
        skills.databases.length > 0) && (
        <Section title="Technical Skills">
          <div style={{ fontSize: "9pt", lineHeight: "1.25" }}>
            {skills.languages.length > 0 && (
              <div>
                <span className="font-bold">Languages: </span>
                {skills.languages.join(", ")}
              </div>
            )}
            {skills.frameworks.length > 0 && (
              <div>
                <span className="font-bold">Frameworks: </span>
                {skills.frameworks.join(", ")}
              </div>
            )}
            {skills.tools.length > 0 && (
              <div>
                <span className="font-bold">Developer Tools: </span>
                {skills.tools.join(", ")}
              </div>
            )}
            {skills.databases.length > 0 && (
              <div>
                <span className="font-bold">Databases: </span>
                {skills.databases.join(", ")}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ===== ACHIEVEMENTS ===== */}
      {resume.achievements.length > 0 && resume.achievements.some((a) => a) && (
        <Section title="Achievements">
          <BulletList bullets={resume.achievements} />
        </Section>
      )}

      {/* ===== EMPTY STATE ===== */}
      {education.length === 0 &&
        experience.length === 0 &&
        projects.length === 0 &&
        !(
          skills.languages.length > 0 ||
          skills.frameworks.length > 0 ||
          skills.tools.length > 0 ||
          skills.databases.length > 0
        ) && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-[10pt]">
            <p>Fill in your details on the left to see your resume here.</p>
          </div>
        )}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  Section – renders the title with a horizontal rule below it        */
/* ------------------------------------------------------------------ */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-[8px] mb-[4px]">
      {/* Section heading – matches LaTeX \section formatting */}
      <div
        className="border-b border-black mb-[5px]"
        style={{
          fontSize: "14pt",
          fontVariant: "small-caps",
          letterSpacing: "0.02em",
          lineHeight: "1.05",
          paddingBottom: "1px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SubHeading – 2-row layout matching \resumeSubheading               */
/*  Row 1: topLeft (bold) ............. topRight                       */
/*  Row 2: bottomLeft (italic) ....... bottomRight (italic)            */
/* ------------------------------------------------------------------ */
function SubHeading({
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}: {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  bottomLeft: React.ReactNode;
  bottomRight: React.ReactNode;
}) {
  return (
    <div className="mb-[1px]">
      <div
        className="flex justify-between items-baseline gap-4"
        style={{ fontSize: "10pt", lineHeight: "1.1" }}
      >
        <span className="font-bold">{topLeft}</span>
        <span className="text-right shrink-0 ml-4">{topRight}</span>
      </div>
      <div
        className="flex justify-between items-baseline gap-4 italic"
        style={{ fontSize: "9pt", lineHeight: "1.1" }}
      >
        <span>{bottomLeft}</span>
        <span className="text-right shrink-0 ml-4">{bottomRight}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  BulletList – en-dash prefixed bullet items                         */
/* ------------------------------------------------------------------ */
function BulletList({ bullets }: { bullets: string[] }) {
  const filtered = bullets.filter((b) => b.trim());
  if (filtered.length === 0) return null;
  return (
    <ul className="mt-[2px] ml-[11px]" style={{ listStyle: "none", padding: 0 }}>
      {filtered.map((bullet, i) => (
        <li
          key={i}
          className="relative"
          style={{
            fontSize: "9pt",
            lineHeight: "1.15",
            paddingLeft: "11px",
            marginBottom: "0px",
          }}
        >
          <span
            className="absolute left-0"
            style={{ top: "0.08em", fontSize: "10pt", lineHeight: 1 }}
          >
            {"\u2022"}
          </span>
          {bullet}
        </li>
      ))}
    </ul>
  );
}

export default JakeTemplate;
