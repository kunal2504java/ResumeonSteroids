"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import { forwardRef } from "react";

const JakeTemplate = forwardRef<HTMLDivElement>(function JakeTemplate(_, ref) {
  const resume = useResumeStore((s) => s.resume);

  if (!resume) return null;

  const { personalInfo: p, education, experience, projects, skills } = resume;

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
      className="bg-white text-black w-[816px] min-h-[1056px] px-[48px] py-[36px]"
      style={{
        fontFamily: '"CMU Serif", Georgia, "Times New Roman", serif',
        fontSize: "10.5pt",
        lineHeight: "1.25",
      }}
    >
      {/* Header */}
      <div className="text-center mb-1">
        <h1
          className="font-bold tracking-wide"
          style={{ fontSize: "22pt", fontVariant: "small-caps" }}
        >
          {p.name || "Your Name"}
        </h1>
        {contactParts.length > 0 && (
          <div
            className="text-[9pt] mt-0.5 flex items-center justify-center flex-wrap gap-0"
            style={{ color: "#000" }}
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

      {/* Education */}
      {education.length > 0 && (
        <Section title="Education">
          {education.map((edu) => (
            <div key={edu.id} className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{edu.institution}</span>
                <span className="text-[9.5pt]">{edu.location}</span>
              </div>
              <div className="flex justify-between items-baseline italic text-[9.5pt]">
                <span>
                  {edu.degree}
                  {edu.field ? ` in ${edu.field}` : ""}
                  {edu.gpa ? `, GPA: ${edu.gpa}` : ""}
                </span>
                <span>
                  {edu.startDate}
                  {edu.endDate ? ` -- ${edu.endDate}` : ""}
                </span>
              </div>
              {edu.coursework.length > 0 && (
                <div className="text-[9pt] mt-0.5">
                  <span className="font-bold">Coursework: </span>
                  {edu.coursework.join(", ")}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <Section title="Experience">
          {experience.map((exp) => (
            <div key={exp.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">{exp.company}</span>
                <span className="text-[9.5pt]">
                  {exp.startDate}
                  {exp.endDate ? ` -- ${exp.endDate}` : ""}
                </span>
              </div>
              <div className="flex justify-between items-baseline italic text-[9.5pt]">
                <span>{exp.title}</span>
                <span>{exp.location}</span>
              </div>
              {exp.bullets.some((b) => b) && (
                <ul className="mt-0.5 ml-4 list-none">
                  {exp.bullets
                    .filter((b) => b)
                    .map((bullet, i) => (
                      <li
                        key={i}
                        className="relative pl-3 text-[9.5pt] leading-[1.35] mb-0.5"
                      >
                        <span className="absolute left-0">--</span>
                        {bullet}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((proj) => (
            <div key={proj.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold">{proj.name}</span>
                  {proj.techStack.length > 0 && (
                    <span className="text-[9.5pt]">
                      {" "}
                      | <em>{proj.techStack.join(", ")}</em>
                    </span>
                  )}
                </div>
                <span className="text-[9.5pt]">
                  {proj.startDate}
                  {proj.endDate ? ` -- ${proj.endDate}` : ""}
                </span>
              </div>
              {proj.bullets.some((b) => b) && (
                <ul className="mt-0.5 ml-4 list-none">
                  {proj.bullets
                    .filter((b) => b)
                    .map((bullet, i) => (
                      <li
                        key={i}
                        className="relative pl-3 text-[9.5pt] leading-[1.35] mb-0.5"
                      >
                        <span className="absolute left-0">--</span>
                        {bullet}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* Technical Skills */}
      {(skills.languages.length > 0 ||
        skills.frameworks.length > 0 ||
        skills.tools.length > 0 ||
        skills.databases.length > 0) && (
        <Section title="Technical Skills">
          <div className="text-[9.5pt] space-y-0.5">
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

      {/* Achievements */}
      {resume.achievements.length > 0 && (
        <Section title="Achievements">
          <ul className="ml-4 list-none">
            {resume.achievements
              .filter((a) => a)
              .map((achievement, i) => (
                <li
                  key={i}
                  className="relative pl-3 text-[9.5pt] leading-[1.35] mb-0.5"
                >
                  <span className="absolute left-0">--</span>
                  {achievement}
                </li>
              ))}
          </ul>
        </Section>
      )}

      {/* Empty state */}
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <div
        className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5"
        style={{ fontSize: "11pt", fontVariant: "small-caps" }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

export default JakeTemplate;
