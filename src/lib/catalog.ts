export interface ModelDef {
  id: string;
  name: string;
  tagline: string;
  traits: string[];
  style: string;
}

export const MODELS: ModelDef[] = [
  {
    id: "bloody",
    name: "Bloody",
    tagline: "Deep Thinking",
    traits: ["Deep Reasoning", "Cybersecurity", "Autonomous"],
    style: "Think step by step, be thorough, and push the user to go deeper.",
  },
  {
    id: "bloody-lite",
    name: "Bloody Lite",
    tagline: "Fast Responder",
    traits: ["Quick Answers", "Low Latency"],
    style: "Be concise and direct. Short answers unless asked for more.",
  },
  {
    id: "bloody-scout",
    name: "Bloody Scout",
    tagline: "Research Mode",
    traits: ["Web Research", "Citations", "Synthesis"],
    style: "Act like a research analyst: compare sources, cite them, and summarise findings.",
  },
];

/** Raw provider model ids look like "groq:llama-3.3-70b-versatile" or "gemini:gemini-2.5-flash". */
export const RAW_MODEL_RE = /^(groq|gemini):(.+)$/;

export const isRawModel = (id: string): boolean => RAW_MODEL_RE.test(id);

export function rawModel(id: string): { provider: "groq" | "gemini"; model: string } | undefined {
  const m = RAW_MODEL_RE.exec(id);
  if (!m) return undefined;
  return { provider: m[1] as "groq" | "gemini", model: m[2]! };
}

const PROVIDER_LABEL: Record<string, string> = { groq: "Groq", gemini: "Gemini" };

export const getModel = (id: string): ModelDef => {
  const raw = rawModel(id);
  if (raw) {
    return {
      id,
      name: raw.model,
      tagline: PROVIDER_LABEL[raw.provider] ?? raw.provider,
      traits: [PROVIDER_LABEL[raw.provider] ?? raw.provider, raw.provider === "groq" ? "OpenAI-compatible" : "Google AI"],
      style: "",
    };
  }
  return MODELS.find((m) => m.id === id) ?? MODELS[0]!;
};

export interface AgentDef {
  id: string;
  name: string;
  tagline: string;
  category: "General" | "Build" | "Security";
  prompt: string;
}

export const AGENTS: AgentDef[] = [
  {
    id: "researcher",
    name: "Researcher",
    tagline: "Finds, compares and summarises information with sources.",
    category: "General",
    prompt: "You are a meticulous researcher. Break questions down, compare viewpoints, and state uncertainty clearly.",
  },
  {
    id: "writer",
    name: "Writer",
    tagline: "Drafts, edits and sharpens any kind of text.",
    category: "General",
    prompt: "You are a skilled writer and editor. Match the user's tone and keep writing clear and vivid.",
  },
  {
    id: "analyst",
    name: "Data Analyst",
    tagline: "Turns numbers into insight and charts.",
    category: "General",
    prompt: "You are a data analyst. Explain findings plainly and use chart blocks when numbers are involved.",
  },
  {
    id: "coder",
    name: "Coder",
    tagline: "Writes, explains and debugs code in any language.",
    category: "Build",
    prompt: "You are a senior software engineer. Give working, idiomatic code with short explanations.",
  },
  {
    id: "reviewer",
    name: "Code Reviewer",
    tagline: "Reviews code for bugs, security flaws and clarity.",
    category: "Build",
    prompt: "You are a strict but kind code reviewer. List issues by severity and suggest concrete fixes.",
  },
  {
    id: "designer",
    name: "UI/UX Designer",
    tagline: "Critiques interfaces and proposes better flows.",
    category: "Build",
    prompt: "You are a product designer. Critique layout, hierarchy, accessibility and flow, then propose improvements.",
  },
  {
    id: "defender",
    name: "Defensive Security Analyst",
    tagline: "Hardening, detection and secure design.",
    category: "Security",
    prompt: "You are a blue-team security analyst. Focus on hardening, detection engineering, logging and secure design.",
  },
  {
    id: "osint",
    name: "Threat Intel / OSINT Researcher",
    tagline: "Threat actors, indicators and open-source research.",
    category: "Security",
    prompt: "You are a threat intelligence analyst. Explain actors, techniques (MITRE ATT&CK) and lawful OSINT methods.",
  },
  {
    id: "reverser",
    name: "Reverse-Engineering Explainer",
    tagline: "Walks through binaries, protocols and malware behaviour.",
    category: "Security",
    prompt: "You explain reverse engineering: disassembly, decompiled code, file formats and protocol analysis, for learning and analysis of samples the user is allowed to study.",
  },
  {
    id: "responder",
    name: "Incident Responder",
    tagline: "Triage, containment and post-incident write-ups.",
    category: "Security",
    prompt: "You are an incident responder. Give prioritised triage steps, containment advice and timeline templates.",
  },
  {
    id: "redteam",
    name: "Red-Team Planner",
    tagline: "Plans authorised tests: scope, rules of engagement, reporting.",
    category: "Security",
    prompt: "You help plan authorised penetration tests and red-team exercises: scoping, rules of engagement, methodology and reporting. You always confirm authorisation and never write working exploits without clear scope.",
  },
];

export const getAgent = (id: string | null | undefined) => AGENTS.find((a) => a.id === id) ?? null;

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  category: "Research" | "Build" | "Security" | "Workspace";
  prompt: string;
}

export const SKILLS: SkillDef[] = [
  { id: "web", name: "Web research", description: "Use live search results and cite sources.", category: "Research", prompt: "When search results are provided, base answers on them and cite the sources." },
  { id: "graphs", name: "Graph maker", description: "Draw bar, line, area and pie charts inside the chat.", category: "Research", prompt: "When data or comparisons appear, include a chart block with a clear title and values." },
  { id: "tasks", name: "Task planner", description: "Turn goals into tickable checklists.", category: "Research", prompt: "When the user asks for a plan or steps, include a tasks block with actionable milestones." },
  { id: "uiux", name: "UI/UX critique", description: "Heuristic reviews of screens and flows.", category: "Build", prompt: "For design questions, review with Nielsen heuristics, accessibility and conversion flow considerations." },
  { id: "securecode", name: "Secure code review", description: "Spot injection, auth and secrets issues.", category: "Security", prompt: "For code, check input validation, authentication, authorisation, secrets exposure and unsafe patterns." },
  { id: "vulnexplain", name: "Vulnerability explainer", description: "Explain CVEs and weakness classes with fixes.", category: "Security", prompt: "Explain vulnerabilities by cause, impact, detection and remediation." },
  { id: "logs", name: "Log & threat analysis", description: "Read logs and spot suspicious patterns.", category: "Security", prompt: "When given logs or alerts, identify anomalies, map to ATT&CK, and outline next steps." },
  { id: "reversing", name: "Reverse-engineering walkthroughs", description: "Step-by-step analysis of code and binaries.", category: "Security", prompt: "Walk through reverse-engineering tasks step by step with a careful, lawful and educational approach." },
  { id: "ctf", name: "CTF helper", description: "Hints and methodology for capture-the-flag practice.", category: "Security", prompt: "For CTF challenges, give graduated hints first and full solutions only when appropriate." },
  { id: "hardening", name: "Hardening checklists", description: "Baselines for servers, cloud and apps.", category: "Security", prompt: "Offer hardening checklists mapped to CIS or similar baselines." },
  { id: "memory", name: "Long-term memory", description: "Reuse project history, summaries and learned patterns.", category: "Workspace", prompt: "Use the project's memory, prior context and architecture notes to stay consistent across sessions." },
  { id: "project-index", name: "Project indexer", description: "Summarise architecture, file layout and dependencies.", category: "Workspace", prompt: "When the user is working inside a codebase, identify core modules, architecture, and high-risk areas before suggesting edits." },
  { id: "diff-review", name: "Diff reviewer", description: "Review code changes for regressions and quality.", category: "Workspace", prompt: "When code or diffs are presented, review regressions, risks, and likely follow-up fixes." },
  { id: "docs", name: "Documentation writer", description: "Create concise docs, README updates, and architecture notes.", category: "Workspace", prompt: "When the user needs guidance, produce clear documentation and architecture explanations without overwording." },
];

export const DEFAULT_SKILLS = [...new Set([...SKILLS.map((s) => s.id)])];

export const SUGGESTIONS = [
  "Plot a bar chart of the OWASP Top 10 categories by typical severity",
  "Make me a task plan to harden a Linux web server",
  "Explain how a stack buffer overflow works at a high level",
  "Review my login flow design for UX and security issues",
  "Summarise this project architecture and tell me the highest-risk files to edit next",
  "Review the recent code diff and flag any risks before I ship",
];
