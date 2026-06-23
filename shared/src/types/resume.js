export const DEFAULT_PERSONAL_INFO = {
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    website: "",
};
export const DEFAULT_SKILLS = {
    languages: [],
    frameworks: [],
    tools: [],
    databases: [],
};
export function createDefaultResume(id, userId) {
    return {
        id,
        userId,
        name: "Untitled Resume",
        personalInfo: { ...DEFAULT_PERSONAL_INFO },
        summary: "",
        experience: [],
        education: [],
        projects: [],
        skills: { ...DEFAULT_SKILLS },
        achievements: [],
        template: "jake",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=resume.js.map