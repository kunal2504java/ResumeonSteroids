import type { Skills } from "@resumeai/shared";

const NORMALIZATION_MAP: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  "c++": "C++",
  "c#": "C#",
  sql: "SQL",
  golang: "Go",
  go: "Go",
  rust: "Rust",
  kotlin: "Kotlin",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
  scala: "Scala",
  react: "React",
  "next.js": "Next.js",
  nextjs: "Next.js",
  node: "Node.js",
  "node.js": "Node.js",
  express: "Express",
  flask: "Flask",
  fastapi: "FastAPI",
  django: "Django",
  "spring boot": "Spring Boot",
  spring: "Spring",
  selenium: "Selenium",
  docker: "Docker",
  kubernetes: "Kubernetes",
  aws: "AWS",
  azure: "Azure",
  gcp: "GCP",
  git: "Git",
  github: "GitHub",
  "github actions": "GitHub Actions",
  linux: "Linux",
  postman: "Postman",
  firebase: "Firebase",
  supabase: "Supabase",
  vercel: "Vercel",
  terraform: "Terraform",
  jira: "Jira",
  "ci/cd": "CI/CD",
  cicd: "CI/CD",
  "rest api": "REST APIs",
  "rest apis": "REST APIs",
  rest: "REST APIs",
  graphql: "GraphQL",
  grpc: "gRPC",
  microservices: "Microservices",
  microservice: "Microservices",
  "system design": "System Design",
  "distributed systems": "Distributed Systems",
  "machine learning": "Machine Learning",
  "api design": "API Design",
  redis: "Redis",
  mongodb: "MongoDB",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
};

const LANGUAGE_TERMS = new Set([
  "javascript",
  "js",
  "typescript",
  "ts",
  "python",
  "java",
  "c",
  "c++",
  "c#",
  "sql",
  "go",
  "golang",
  "rust",
  "kotlin",
  "php",
  "ruby",
  "swift",
  "scala",
  "r",
  "matlab",
]);

const FRAMEWORK_TERMS = new Set([
  "react",
  "next.js",
  "nextjs",
  "node",
  "node.js",
  "express",
  "flask",
  "fastapi",
  "django",
  "spring",
  "spring boot",
  "angular",
  "vue",
  "nestjs",
  "tailwind",
  "bootstrap",
  "react native",
]);

const DATABASE_TERMS = new Set([
  "postgres",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "sqlite",
  "mariadb",
  "dynamodb",
  "cassandra",
  "oracle",
]);

const TOOL_TERMS = new Set([
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "git",
  "github",
  "github actions",
  "selenium",
  "postman",
  "linux",
  "firebase",
  "supabase",
  "vercel",
  "terraform",
  "jira",
  "webpack",
  "babel",
  "jenkins",
  "figma",
  "nginx",
  "grafana",
  "prometheus",
  "ci/cd",
  "cicd",
  "rest api",
  "rest apis",
  "rest",
  "graphql",
  "grpc",
  "microservices",
  "microservice",
  "system design",
  "distributed systems",
  "api design",
  "machine learning",
]);

const GENERIC_NON_TOOL_PATTERNS = [
  "computer engineering",
  "web applications",
  "data structures",
  "algorithms",
  "dsa",
  "design patterns",
  "problem solving",
  "quantitative analytics",
  "trading strategies",
  "trading systems",
  "software engineering",
  "object oriented programming",
  "oop",
];

function cleanSkill(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string): string {
  return cleanSkill(value).toLowerCase();
}

function displaySkill(value: string): string {
  const key = normalizeKey(value);
  return NORMALIZATION_MAP[key] ?? cleanSkill(value);
}

function classifySkill(value: string): keyof Skills | null {
  const key = normalizeKey(value);
  if (!key) {
    return null;
  }

  if (GENERIC_NON_TOOL_PATTERNS.some((pattern) => key.includes(pattern))) {
    return null;
  }

  if (LANGUAGE_TERMS.has(key)) {
    return "languages";
  }

  if (FRAMEWORK_TERMS.has(key)) {
    return "frameworks";
  }

  if (DATABASE_TERMS.has(key)) {
    return "databases";
  }

  if (TOOL_TERMS.has(key)) {
    return "tools";
  }

  if (
    key.includes("aws") ||
    key.includes("docker") ||
    key.includes("kubernetes") ||
    key.includes("git") ||
    key.includes("selenium") ||
    key.includes("linux") ||
    key.includes("terraform") ||
    key.includes("ci/cd") ||
    key.includes("rest") ||
    key.includes("graphql") ||
    key.includes("grpc") ||
    key.includes("microservice") ||
    key.includes("system design") ||
    key.includes("distributed systems")
  ) {
    return "tools";
  }

  return null;
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const display = displaySkill(value);
    const key = normalizeKey(display);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(display);
  }

  return result;
}

export function normalizeSkillsInput(input?: Partial<Skills> | null): Skills {
  const result: Skills = {
    languages: [],
    frameworks: [],
    tools: [],
    databases: [],
  };

  const buckets: Array<[keyof Skills, string[]]> = [
    ["languages", input?.languages ?? []],
    ["frameworks", input?.frameworks ?? []],
    ["tools", input?.tools ?? []],
    ["databases", input?.databases ?? []],
  ];

  for (const [, values] of buckets) {
    for (const raw of values) {
      const cleaned = cleanSkill(raw);
      const category = classifySkill(cleaned);
      if (!category) {
        continue;
      }
      result[category].push(cleaned);
    }
  }

  return {
    languages: dedupe(result.languages),
    frameworks: dedupe(result.frameworks),
    tools: dedupe(result.tools),
    databases: dedupe(result.databases),
  };
}

export function mergeSkills(...inputs: Array<Partial<Skills> | null | undefined>): Skills {
  const merged: Skills = {
    languages: [],
    frameworks: [],
    tools: [],
    databases: [],
  };

  for (const input of inputs) {
    const normalized = normalizeSkillsInput(input);
    merged.languages.push(...normalized.languages);
    merged.frameworks.push(...normalized.frameworks);
    merged.tools.push(...normalized.tools);
    merged.databases.push(...normalized.databases);
  }

  return {
    languages: dedupe(merged.languages),
    frameworks: dedupe(merged.frameworks),
    tools: dedupe(merged.tools),
    databases: dedupe(merged.databases),
  };
}
