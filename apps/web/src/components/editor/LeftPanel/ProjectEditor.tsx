"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import BulletEditor from "./BulletEditor";

const cardClass =
  "space-y-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-md";
const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.045] px-2.5 py-1.5 text-xs text-white shadow-inner shadow-black/40 outline-none backdrop-blur-md transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.07]";
const labelClass = "mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500";

export default function ProjectEditor() {
  const projects = useResumeStore((s) => s.resume?.projects) || [];
  const addProject = useResumeStore((s) => s.addProject);
  const updateProject = useResumeStore((s) => s.updateProject);
  const removeProject = useResumeStore((s) => s.removeProject);

  return (
    <div className="space-y-4 px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          Projects
        </h3>
        <button
          onClick={addProject}
          className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          + Add
        </button>
      </div>

      {projects.map((proj, idx) => (
        <div
          key={proj.id}
          className={cardClass}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-500">
              #{idx + 1}
            </span>
            <button
              onClick={() => removeProject(proj.id)}
              className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors cursor-pointer"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                Project Name
              </label>
              <input
                type="text"
                value={proj.name}
                onChange={(e) =>
                  updateProject(proj.id, "name", e.target.value)
                }
                placeholder="My Awesome Project"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                URL
              </label>
              <input
                type="text"
                value={proj.url}
                onChange={(e) =>
                  updateProject(proj.id, "url", e.target.value)
                }
                placeholder="github.com/user/repo"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Tech Stack (comma-separated)
            </label>
            <input
              type="text"
              value={proj.techStack.join(", ")}
              onChange={(e) =>
                updateProject(
                  proj.id,
                  "techStack",
                  e.target.value as unknown as string
                )
              }
              onBlur={(e) => {
                const store = useResumeStore.getState();
                const p = store.resume?.projects.find(
                  (p) => p.id === proj.id
                );
                if (p) {
                  store.updateSection("projects", store.resume!.projects.map(
                    (pr) =>
                      pr.id === proj.id
                        ? {
                            ...pr,
                            techStack: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          }
                        : pr
                  ));
                }
              }}
              placeholder="React, Node.js, PostgreSQL"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                Start
              </label>
              <input
                type="text"
                value={proj.startDate}
                onChange={(e) =>
                  updateProject(proj.id, "startDate", e.target.value)
                }
                placeholder="Jan 2024"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                End
              </label>
              <input
                type="text"
                value={proj.endDate}
                onChange={(e) =>
                  updateProject(proj.id, "endDate", e.target.value)
                }
                placeholder="Present"
                className={inputClass}
              />
            </div>
          </div>

          <BulletEditor
            bullets={proj.bullets}
            parentId={proj.id}
            parentType="project"
          />
        </div>
      ))}

      {projects.length === 0 && (
        <button
          onClick={addProject}
          className="w-full cursor-pointer rounded-2xl border border-dashed border-white/12 bg-white/[0.025] py-8 text-sm text-zinc-500 transition-colors hover:border-white/25 hover:text-white"
        >
          + Add your first project
        </button>
      )}
    </div>
  );
}
