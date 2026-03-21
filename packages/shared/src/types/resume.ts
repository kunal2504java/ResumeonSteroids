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

export type SectionKey =
  | "personal"
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "achievements";

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

export const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  github: "",
  website: "",
};

export const DEFAULT_SKILLS: Skills = {
  languages: [],
  frameworks: [],
  tools: [],
  databases: [],
};

export function createDefaultResume(id: string, userId: string): Resume {
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
