export type ToolCategory = "memory" | "project" | "review" | "docs" | "search";

export interface ToolContext {
  projectName?: string;
  projectSummary?: string;
  filePaths?: string[];
  files?: Array<{ path: string; content: string }>;
  userPrompt?: string;
}

export interface ToolResult {
  ok: boolean;
  summary: string;
  data?: Record<string, unknown>;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;
  run: (ctx: ToolContext) => Promise<ToolResult> | ToolResult;
}

export const WORKSPACE_TOOLS: AgentTool[] = [
  {
    id: "project-summary",
    name: "Project Summary",
    description: "Summarizes project structure and the most important files.",
    category: "project",
    version: "1.0.0",
    run: async (ctx) => ({
      ok: true,
      summary: `Project summary for ${ctx.projectName ?? "workspace"}: ${ctx.projectSummary ?? "No summary available yet."}`,
      data: { projectName: ctx.projectName ?? "workspace", projectSummary: ctx.projectSummary ?? "" },
    }),
  },
  {
    id: "memory-refresh",
    name: "Memory Refresh",
    description: "Refreshes long-term project memory from the active workspace files.",
    category: "memory",
    version: "1.0.0",
    run: async (ctx) => ({
      ok: true,
      summary: `Refreshed memory for ${ctx.projectName ?? "workspace"}.`,
      data: { fileCount: ctx.files?.length ?? 0 },
    }),
  },
  {
    id: "diff-review",
    name: "Diff Review",
    description: "Reviews file changes for risk, regression, and likely follow-up fixes.",
    category: "review",
    version: "1.0.0",
    run: async (ctx) => ({
      ok: true,
      summary: `Diff review prepared for ${ctx.projectName ?? "workspace"}.`,
      data: { filePaths: ctx.filePaths ?? [], prompt: ctx.userPrompt ?? "review" },
    }),
  },
  {
    id: "docs-generator",
    name: "Docs Generator",
    description: "Creates architecture notes or README snippets from the project's known structure.",
    category: "docs",
    version: "1.0.0",
    run: async (ctx) => ({
      ok: true,
      summary: `Documentation task prepared for ${ctx.projectName ?? "workspace"}.`,
      data: { projectSummary: ctx.projectSummary ?? "" },
    }),
  },
  {
    id: "workspace-search",
    name: "Workspace Search",
    description: "Finds relevant files and signals in the codebase for the current task.",
    category: "search",
    version: "1.0.0",
    run: async (ctx) => ({
      ok: true,
      summary: `Search index built for ${ctx.projectName ?? "workspace"}.`,
      data: { filePaths: ctx.filePaths ?? [] },
    }),
  },
];

export const TOOL_CATALOG = Object.fromEntries(WORKSPACE_TOOLS.map((tool) => [tool.id, tool]));

export function buildWorkspaceToolContext(input: ToolContext): ToolContext {
  return {
    projectName: input.projectName ?? "workspace",
    projectSummary: input.projectSummary ?? "",
    filePaths: input.filePaths ?? [],
    files: input.files ?? [],
    userPrompt: input.userPrompt ?? "",
  };
}
