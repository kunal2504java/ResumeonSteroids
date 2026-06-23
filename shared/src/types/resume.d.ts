export interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
}
export interface Experience {
    id: string;
    company: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    bullets: string[];
}
export interface Education {
    id: string;
    institution: string;
    degree: string;
    field: string;
    location: string;
    startDate: string;
    endDate: string;
    gpa: string;
    coursework: string[];
}
export interface Project {
    id: string;
    name: string;
    techStack: string[];
    url: string;
    startDate: string;
    endDate: string;
    bullets: string[];
}
export interface Skills {
    languages: string[];
    frameworks: string[];
    tools: string[];
    databases: string[];
}
export type TemplateType = "jake" | "modern" | "minimal";
export type SectionKey = "personal" | "summary" | "experience" | "education" | "projects" | "skills" | "achievements";
export interface Resume {
    id: string;
    userId: string;
    name: string;
    personalInfo: PersonalInfo;
    summary: string;
    experience: Experience[];
    education: Education[];
    projects: Project[];
    skills: Skills;
    achievements: string[];
    template: TemplateType;
    createdAt: string;
    updatedAt: string;
}
export declare const DEFAULT_PERSONAL_INFO: PersonalInfo;
export declare const DEFAULT_SKILLS: Skills;
export declare function createDefaultResume(id: string, userId: string): Resume;
