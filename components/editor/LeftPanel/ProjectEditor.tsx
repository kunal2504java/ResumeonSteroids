"use client";

import { useResumeStore } from "@/lib/store/resumeStore";
import BulletEditor from "./BulletEditor";

export default function ProjectEditor() {
  const projects = useResumeStore((s) => s.resume?.projects) || [];
  const addProject = useResumeStore((s) => s.addProject);
  const updateProject = useResumeStore((s) => s.updateProject);
  const removeProject = useResumeStore((s) => s.removeProject);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">
          Projects
        </h3>
        <button
          onClick={addProject}
          className="text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors cursor-pointer"
        >
          + Add
        </button>
      </div>

      {projects.map((proj, idx) => (
        <div
          key={proj.id}
          className="bg-[#0D1117] border border-[#1E2535] p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#71717A] font-mono">
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
              <label className="block text-[10px] text-[#71717A] mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={proj.name}
                onChange={(e) =>
                  updateProject(proj.id, "name", e.target.value)
                }
                placeholder="My Awesome Project"
                className="w-full bg-[#161B27] border border-[#1E2535] px-2.5 py-1.5 text-xs text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#71717A] mb-1">
                URL
              </label>
              <input
                type="text"
                value={proj.url}
                onChange={(e) =>
                  updateProject(proj.id, "url", e.target.value)
                }
                placeholder="github.com/user/repo"
                className="w-full bg-[#161B27] border border-[#1E2535] px-2.5 py-1.5 text-xs text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-[#71717A] mb-1">
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
              className="w-full bg-[#161B27] border border-[#1E2535] px-2.5 py-1.5 text-xs text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#71717A] mb-1">
                Start
              </label>
              <input
                type="text"
                value={proj.startDate}
                onChange={(e) =>
                  updateProject(proj.id, "startDate", e.target.value)
                }
                placeholder="Jan 2024"
                className="w-full bg-[#161B27] border border-[#1E2535] px-2.5 py-1.5 text-xs text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#71717A] mb-1">
                End
              </label>
              <input
                type="text"
                value={proj.endDate}
                onChange={(e) =>
                  updateProject(proj.id, "endDate", e.target.value)
                }
                placeholder="Present"
                className="w-full bg-[#161B27] border border-[#1E2535] px-2.5 py-1.5 text-xs text-white placeholder:text-[#71717A]/40 outline-none focus:border-[#6366f1]/50 transition-colors font-mono"
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
          className="w-full py-8 border border-dashed border-[#1E2535] text-sm text-[#71717A] hover:text-white hover:border-[#6366f1]/40 transition-colors cursor-pointer"
        >
          + Add your first project
        </button>
      )}
    </div>
  );
}
