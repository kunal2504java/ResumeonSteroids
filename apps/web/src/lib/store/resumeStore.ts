import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Resume, SectionKey, Experience, Education, Project } from "@resumeai/shared";
import { v4 as uuid } from "uuid";

interface ResumeStore {
  resume: Resume | null;
  isDirty: boolean;
  isSaving: boolean;
  activeSection: SectionKey;
  undoStack: Resume[];
  toasts: { id: string; message: string; type: "success" | "error" | "info" }[];

  setResume: (r: Resume) => void;
  updatePersonalInfo: (field: string, value: string) => void;
  updateSummary: (value: string) => void;
  updateSection: <K extends keyof Resume>(section: K, data: Resume[K]) => void;
  setActiveSection: (section: SectionKey) => void;

  addExperience: () => void;
  updateExperience: (id: string, field: string, value: string) => void;
  removeExperience: (id: string) => void;
  addBullet: (experienceId: string) => void;
  updateBullet: (experienceId: string, index: number, value: string) => void;
  removeBullet: (experienceId: string, index: number) => void;
  reorderBullets: (experienceId: string, from: number, to: number) => void;

  addEducation: () => void;
  updateEducation: (id: string, field: string, value: string) => void;
  removeEducation: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, field: string, value: string) => void;
  removeProject: (id: string) => void;
  addProjectBullet: (projectId: string) => void;
  updateProjectBullet: (projectId: string, index: number, value: string) => void;
  removeProjectBullet: (projectId: string, index: number) => void;

  updateSkills: (category: string, skills: string[]) => void;
  updateAchievements: (achievements: string[]) => void;

  mergeImportedData: (data: Record<string, unknown>) => void;

  undo: () => void;
  pushUndo: () => void;
  markClean: () => void;
  save: () => Promise<void>;
  addToast: (message: string, type: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useResumeStore = create<ResumeStore>()(
  immer((set, get) => ({
    resume: null,
    isDirty: false,
    isSaving: false,
    activeSection: "personal",
    undoStack: [],
    toasts: [],

    setResume: (r) =>
      set((state) => {
        state.resume = r;
        state.isDirty = false;
      }),

    updatePersonalInfo: (field, value) =>
      set((state) => {
        if (!state.resume) return;
        (state.resume.personalInfo as Record<string, string>)[field] = value;
        state.isDirty = true;
        state.resume.updatedAt = new Date().toISOString();
      }),

    updateSummary: (value) =>
      set((state) => {
        if (!state.resume) return;
        state.resume.summary = value;
        state.isDirty = true;
        state.resume.updatedAt = new Date().toISOString();
      }),

    updateSection: (section, data) =>
      set((state) => {
        if (!state.resume) return;
        state.resume[section] = data;
        state.isDirty = true;
        state.resume.updatedAt = new Date().toISOString();
      }),

    setActiveSection: (section) =>
      set((state) => {
        state.activeSection = section;
      }),

    // Experience
    addExperience: () =>
      set((state) => {
        if (!state.resume) return;
        state.resume.experience.push({
          id: uuid(),
          company: "",
          title: "",
          location: "",
          startDate: "",
          endDate: "",
          bullets: [""],
        });
        state.isDirty = true;
      }),

    updateExperience: (id, field, value) =>
      set((state) => {
        if (!state.resume) return;
        const exp = state.resume.experience.find((e: Experience) => e.id === id);
        if (exp) {
          (exp as Record<string, unknown>)[field] = value;
          state.isDirty = true;
          state.resume.updatedAt = new Date().toISOString();
        }
      }),

    removeExperience: (id) =>
      set((state) => {
        if (!state.resume) return;
        state.resume.experience = state.resume.experience.filter(
          (e: Experience) => e.id !== id
        );
        state.isDirty = true;
      }),

    addBullet: (experienceId) =>
      set((state) => {
        if (!state.resume) return;
        const exp = state.resume.experience.find(
          (e: Experience) => e.id === experienceId
        );
        if (exp) {
          exp.bullets.push("");
          state.isDirty = true;
        }
      }),

    updateBullet: (experienceId, index, value) =>
      set((state) => {
        if (!state.resume) return;
        const exp = state.resume.experience.find(
          (e: Experience) => e.id === experienceId
        );
        if (exp && exp.bullets[index] !== undefined) {
          exp.bullets[index] = value;
          state.isDirty = true;
          state.resume.updatedAt = new Date().toISOString();
        }
      }),

    removeBullet: (experienceId, index) =>
      set((state) => {
        if (!state.resume) return;
        const exp = state.resume.experience.find(
          (e: Experience) => e.id === experienceId
        );
        if (exp) {
          exp.bullets.splice(index, 1);
          state.isDirty = true;
        }
      }),

    reorderBullets: (experienceId, from, to) =>
      set((state) => {
        if (!state.resume) return;
        const exp = state.resume.experience.find(
          (e: Experience) => e.id === experienceId
        );
        if (exp) {
          const [item] = exp.bullets.splice(from, 1);
          exp.bullets.splice(to, 0, item);
          state.isDirty = true;
        }
      }),

    // Education
    addEducation: () =>
      set((state) => {
        if (!state.resume) return;
        state.resume.education.push({
          id: uuid(),
          institution: "",
          degree: "",
          field: "",
          location: "",
          startDate: "",
          endDate: "",
          gpa: "",
          coursework: [],
        });
        state.isDirty = true;
      }),

    updateEducation: (id, field, value) =>
      set((state) => {
        if (!state.resume) return;
        const edu = state.resume.education.find((e: Education) => e.id === id);
        if (edu) {
          (edu as Record<string, unknown>)[field] = value;
          state.isDirty = true;
          state.resume.updatedAt = new Date().toISOString();
        }
      }),

    removeEducation: (id) =>
      set((state) => {
        if (!state.resume) return;
        state.resume.education = state.resume.education.filter(
          (e: Education) => e.id !== id
        );
        state.isDirty = true;
      }),

    // Projects
    addProject: () =>
      set((state) => {
        if (!state.resume) return;
        state.resume.projects.push({
          id: uuid(),
          name: "",
          techStack: [],
          url: "",
          startDate: "",
          endDate: "",
          bullets: [""],
        });
        state.isDirty = true;
      }),

    updateProject: (id, field, value) =>
      set((state) => {
        if (!state.resume) return;
        const proj = state.resume.projects.find((p: Project) => p.id === id);
        if (proj) {
          (proj as Record<string, unknown>)[field] = value;
          state.isDirty = true;
          state.resume.updatedAt = new Date().toISOString();
        }
      }),

    removeProject: (id) =>
      set((state) => {
        if (!state.resume) return;
        state.resume.projects = state.resume.projects.filter(
          (p: Project) => p.id !== id
        );
        state.isDirty = true;
      }),

    addProjectBullet: (projectId) =>
      set((state) => {
        if (!state.resume) return;
        const proj = state.resume.projects.find(
          (p: Project) => p.id === projectId
        );
        if (proj) {
          proj.bullets.push("");
          state.isDirty = true;
        }
      }),

    updateProjectBullet: (projectId, index, value) =>
      set((state) => {
        if (!state.resume) return;
        const proj = state.resume.projects.find(
          (p: Project) => p.id === projectId
        );
        if (proj && proj.bullets[index] !== undefined) {
          proj.bullets[index] = value;
          state.isDirty = true;
          state.resume.updatedAt = new Date().toISOString();
        }
      }),

    removeProjectBullet: (projectId, index) =>
      set((state) => {
        if (!state.resume) return;
        const proj = state.resume.projects.find(
          (p: Project) => p.id === projectId
        );
        if (proj) {
          proj.bullets.splice(index, 1);
          state.isDirty = true;
        }
      }),

    // Skills & Achievements
    updateSkills: (category, skills) =>
      set((state) => {
        if (!state.resume) return;
        (state.resume.skills as Record<string, string[]>)[category] = skills;
        state.isDirty = true;
        state.resume.updatedAt = new Date().toISOString();
      }),

    updateAchievements: (achievements) =>
      set((state) => {
        if (!state.resume) return;
        state.resume.achievements = achievements;
        state.isDirty = true;
        state.resume.updatedAt = new Date().toISOString();
      }),

    // Import merge — deep-merges data from connection flow into the resume
    /* eslint-disable @typescript-eslint/no-explicit-any */
    mergeImportedData: (data) =>
      set((state) => {
        if (!state.resume) return;

        // GitHub data
        const ghData = data.github as any;
        if (ghData) {
          if (ghData.projects?.length) {
            const newProjects = ghData.projects.slice(0, 4).map((p: any) => ({
              id: uuid(),
              name: p.name || "",
              techStack: p.techStack || [],
              url: p.url || "",
              startDate: "",
              endDate: "",
              bullets: p.highlights?.length ? p.highlights : [p.description || ""],
            }));
            state.resume.projects.push(...newProjects);
          }
          if (ghData.profile?.name && !state.resume.personalInfo.name) {
            state.resume.personalInfo.name = ghData.profile.name;
          }
          if (ghData.profile?.url) {
            state.resume.personalInfo.github = ghData.profile.url;
          }
        }

        // LeetCode data
        const lcData = data.leetcode as any;
        if (lcData) {
          if (lcData.achievement) state.resume.achievements.push(lcData.achievement);
          if (lcData.skills) {
            const existing = new Set(state.resume.skills.tools);
            lcData.skills.forEach((s: string) => existing.add(s));
            state.resume.skills.tools = Array.from(existing);
          }
        }

        // Codeforces data
        const cfData = data.codeforces as any;
        if (cfData?.achievement) {
          state.resume.achievements.push(cfData.achievement);
        }

        // LinkedIn data
        const liData = data.linkedin as any;
        if (liData) {
          if (liData.linkedinUrl) {
            state.resume.personalInfo.linkedin = liData.linkedinUrl;
          }
          if (liData.profile?.name && !state.resume.personalInfo.name) {
            state.resume.personalInfo.name = liData.profile.name;
          }
          if (liData.profile?.summary && !state.resume.summary) {
            state.resume.summary = liData.profile.summary;
          }
          if (Array.isArray(liData.experience) && liData.experience.length) {
            if (state.resume.experience.length <= 1 && !state.resume.experience[0]?.company) {
              state.resume.experience = liData.experience.map((e: any) => ({
                id: uuid(),
                company: e.company || "",
                title: e.title || "",
                location: e.location || "",
                startDate: e.startDate || "",
                endDate: e.endDate || "",
                bullets: e.bullets?.length ? e.bullets : [""],
              }));
            }
          }
          if (Array.isArray(liData.education) && liData.education.length) {
            if (state.resume.education.length <= 1 && !state.resume.education[0]?.institution) {
              state.resume.education = liData.education.map((e: any) => ({
                id: uuid(),
                institution: e.institution || "",
                degree: e.degree || "",
                field: e.field || "",
                location: e.location || "",
                startDate: e.startDate || "",
                endDate: e.endDate || "",
                gpa: e.gpa || "",
                coursework: e.coursework || [],
              }));
            }
          }
          if (liData.skills) {
            const existing = new Set(state.resume.skills.tools);
            const newSkills = [
              ...(liData.skills.tools || []),
              ...(liData.skills.languages || []),
              ...(liData.skills.frameworks || []),
            ];
            newSkills.forEach((s: string) => { if (s) existing.add(s); });
            state.resume.skills.tools = Array.from(existing);
          }
        }

        // Resume upload data
        const resumeImport = data.resume as any;
        if (resumeImport?.resumeData) {
          const rd = resumeImport.resumeData;
          if (rd.personalInfo) {
            Object.entries(rd.personalInfo as Record<string, string>).forEach(
              ([k, v]) => {
                if (v && !(state.resume!.personalInfo as Record<string, string>)[k]) {
                  (state.resume!.personalInfo as Record<string, string>)[k] = v;
                }
              }
            );
          }
          if (rd.summary && !state.resume.summary) {
            state.resume.summary = rd.summary;
          }
          if (Array.isArray(rd.experience) && rd.experience.length) {
            state.resume.experience = rd.experience.map((e: any) => ({
              id: uuid(),
              company: e.company || "",
              title: e.title || "",
              location: e.location || "",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              bullets: e.bullets || [""],
            }));
          }
          if (Array.isArray(rd.education) && rd.education.length) {
            state.resume.education = rd.education.map((e: any) => ({
              id: uuid(),
              institution: e.institution || "",
              degree: e.degree || "",
              field: e.field || "",
              location: e.location || "",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              gpa: e.gpa || "",
              coursework: e.coursework || [],
            }));
          }
          if (Array.isArray(rd.projects) && rd.projects.length) {
            state.resume.projects.push(
              ...rd.projects.map((p: any) => ({
                id: uuid(),
                name: p.name || "",
                techStack: p.techStack || [],
                url: p.url || "",
                startDate: p.startDate || "",
                endDate: p.endDate || "",
                bullets: p.bullets || [""],
              }))
            );
          }
          if (rd.skills && typeof rd.skills === "object") {
            Object.entries(rd.skills as Record<string, string[]>).forEach(
              ([key, values]) => {
                if (Array.isArray(values)) {
                  const existing = new Set(
                    (state.resume!.skills as Record<string, string[]>)[key] || []
                  );
                  values.forEach((v) => existing.add(v));
                  (state.resume!.skills as Record<string, string[]>)[key] =
                    Array.from(existing);
                }
              }
            );
          }
        }

        state.isDirty = true;
        state.resume.updatedAt = new Date().toISOString();
      }),
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Undo
    pushUndo: () =>
      set((state) => {
        if (!state.resume) return;
        state.undoStack.push(JSON.parse(JSON.stringify(state.resume)));
        if (state.undoStack.length > 50) state.undoStack.shift();
      }),

    undo: () =>
      set((state) => {
        const prev = state.undoStack.pop();
        if (prev) {
          state.resume = prev;
          state.isDirty = true;
        }
      }),

    markClean: () =>
      set((state) => {
        state.isDirty = false;
      }),

    save: async () => {
      const { resume, isDirty } = get();
      if (!resume || !isDirty) return;

      set((state) => {
        state.isSaving = true;
      });

      try {
        const res = await fetch(`/api/resume/${resume.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resume),
        });

        if (!res.ok) throw new Error("Save failed");

        set((state) => {
          state.isDirty = false;
          state.isSaving = false;
        });
      } catch {
        set((state) => {
          state.isSaving = false;
        });
        get().addToast("Failed to save", "error");
      }
    },

    addToast: (message, type) =>
      set((state) => {
        const id = uuid();
        state.toasts.push({ id, message, type });
        setTimeout(() => get().removeToast(id), 4000);
      }),

    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      }),
  }))
);

// Debounced auto-save hook
export function useAutoSave() {
  const { isDirty, save } = useResumeStore();

  if (isDirty) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      save();
    }, 1500);
  }
}
