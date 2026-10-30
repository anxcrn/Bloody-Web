import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AGENTS, MODELS, SKILLS, getAgent, getModel, rawModel } from "./catalog";
import { demoReply } from "./demo";

const FORMAT_RULES = `Formatting: reply in Markdown.
Write like ChatGPT and Claude: open with a direct answer to the question, then explain. Be conversational but precise; never pad with filler phrases like "Great question!".
Structure longer answers with a few clear headings (##, ###), short sections and bullet points; use a table only when it genuinely helps. Do not over-format short answers.
To draw a chart, output a fenced block with language "chart" containing JSON like {"type":"bar|line|area|pie","title":"...","data":[{"name":"A","value":1}]}. Extra numeric keys per row become extra series.
To give a checklist, output a fenced block with language "tasks" containing lines like "- [ ] step".
When the user shares code to edit, return the full updated code in a fenced block with its language, then list what changed.
Write math in plain text or inline code (e.g. 17 × 23 = 391); never use LaTeX like \\( \\) or $...$.
For long tasks, work through them in clear numbered parts and end with what to do next if more remains.
Links: never invent or guess URLs, and do not add web links unless web search results were provided to you below or the user explicitly asks for links or sources. When search results are provided you may cite them with [n] markers.`;

const SAFETY = `Security policy: you teach, explain and defend. You help with authorised testing, CTFs, malware analysis of samples the user may study, and hardening. You refuse to produce ready-to-run malware, or exploits and intrusion steps aimed at specific third-party systems or people without authorisation. Offer a safe alternative when you refuse.`;

const inputSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(20000) }))
    .min(1)
    .max(60),
  agentId: z.string().max(60),
  modelId: z.string().max(140),
  skillIds: z.array(z.string().max(60)).max(40),
  web: z.boolean(),
  thinking: z.boolean().optional(),
  projectContext: z.string().max(120000).optional(),
});

interface SearchHit {
  title: string;
  url: string;
  content: string;
}

export interface ChatResult {
  content: string;
  sources: { title: string; url: string }[];
  demo: boolean;
  reasoning?: string;
  error?: string;
  notice?: string;
}

interface Provider {
  key: string;
  base: string;
}

function resolveProvider(modelId: string): { provider: Provider; apiModel: string; vendor: "groq" | "gemini" | "openai" } | undefined {
  const raw = rawModel(modelId);
  if (raw) {
    if (raw.provider === "groq") {
      const key = process.env["GROQ_API_KEY"] ?? process.env["AI_API_KEY"];
      if (!key) return undefined;
      return { provider: { key, base: "https://api.groq.com/openai/v1" }, apiModel: raw.model, vendor: "groq" };
    }
    const key = process.env["GOOGLE_API_KEY"];
    if (!key) return undefined;
    return {
      provider: { key, base: "https://generativelanguage.googleapis.com/v1beta/openai" },
      apiModel: raw.model,
      vendor: "gemini",
    };
  }
  // Preset personas: honour explicit custom-provider settings, else the stored fallback order.
  const aiKey = process.env["AI_API_KEY"];
  if (aiKey) {
    return {
      provider: { key: aiKey, base: (process.env["AI_BASE_URL"] ?? "https://api.openai.com/v1").replace(/\/$/, "") },
      apiModel: process.env["AI_MODEL"] ?? "gpt-4o-mini",
      vendor: "openai",
    };
  }
  if (process.env["GROQ_API_KEY"]) {
    return { provider: { key: process.env["GROQ_API_KEY"], base: "https://api.groq.com/openai/v1" }, apiModel: "openai/gpt-oss-120b", vendor: "groq" };
  }
  if (process.env["GOOGLE_API_KEY"]) {
    return { provider: { key: process.env["GOOGLE_API_KEY"], base: "https://generativelanguage.googleapis.com/v1beta/openai" }, apiModel: "gemini-2.5-flash", vendor: "gemini" };
  }
  return undefined;
}

export const sendChat = createServerFn({ method: "POST" })
  .validator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<ChatResult> => {
    const agent = getAgent(data.agentId);
    const model = getModel(data.modelId);
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";

    let notice: string | undefined;
    let hits: SearchHit[] = [];
    if (data.web) {
      const searchKey = process.env["SEARCH_API_KEY"];
      if (!searchKey) {
        notice = "Web search is on, but no search key is connected yet.";
      } else {
        try {
          const r = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${searchKey}` },
            body: JSON.stringify({ query: lastUser.slice(0, 380), max_results: 5 }),
          });
          if (r.ok) {
            const j = (await r.json()) as { results?: SearchHit[] };
            hits = (j.results ?? []).slice(0, 5);
          } else {
            notice = `Web search failed (${r.status}).`;
          }
        } catch {
          notice = "Web search could not be reached.";
        }
      }
    }

    const resolved = resolveProvider(data.modelId);
    if (!resolved) {
      const web = hits.length
        ? `\n\n## 🌐 Live web results\n\n${hits
            .map((h, i) => `**[${i + 1}] [${h.title}](${h.url})**\n\n${h.content.replace(/[#*>`|]+/g, " ").replace(/\s+/g, " ").slice(0, 260).trim()}…`)
            .join("\n\n")}`
        : "";
      return {
        content: demoReply(lastUser, agent, model) + web,
        sources: hits.map((h) => ({ title: h.title, url: h.url })),
        demo: true,
        ...(notice ? { notice } : {}),
      };
    }

    const skills = SKILLS.filter((s) => data.skillIds.includes(s.id));
    const system = [
      `You are Bloody, an AI assistant. Current persona: ${model.name}${model.style ? ` (${model.tagline}). ${model.style}` : ""}.`,
      agent ? `Agent role: ${agent.prompt}` : "",
      skills.length ? `Enabled skills:\n${skills.map((s) => `- ${s.name}: ${s.prompt}`).join("\n")}` : "",
      FORMAT_RULES,
      data.projectContext
        ? `You are building inside the user's project. When you change or add a file, give its full path as a heading and the complete file in a fenced code block.\n\n${data.projectContext}`
        : "",
      SAFETY,
      hits.length
        ? `Web search results:\n${hits.map((h, i) => `[${i + 1}] ${h.title} (${h.url})\n${h.content.slice(0, 600)}`).join("\n\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // Thinking mode: ask Groq models for their chain of thought. Gemini reasons by default.
    const thinkingExtras =
      data.thinking && resolved.vendor === "groq"
        ? { reasoning_effort: "medium" as const, reasoning_format: "parsed" as const }
        : {};

    const callProvider = async (withThinking: boolean) => {
      const extras = withThinking ? thinkingExtras : {};
      return fetch(`${resolved.provider.base}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resolved.provider.key}` },
        body: JSON.stringify({
          model: resolved.apiModel,
          messages: [{ role: "system", content: system }, ...data.messages],
          ...extras,
        }),
      });
    };

    interface Completion {
      content?: string | undefined;
      reasoning?: string | undefined;
    }
    const parse = (j: unknown): Completion => {
      const msg = (j as { choices?: { message?: { content?: string; reasoning?: string } }[] })?.choices?.[0]?.message;
      return { content: msg?.content, reasoning: msg?.reasoning };
    };

    try {
      let res = await callProvider(Boolean(data.thinking));
      // Some models reject reasoning params; retry once without them.
      if (!res.ok && data.thinking && res.status === 400) {
        console.warn("Thinking params rejected, retrying without them");
        res = await callProvider(false);
      }
      if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        console.error("AI provider error", res.status, body);
        return {
          content: "",
          sources: [],
          demo: false,
          error: `The AI provider returned ${res.status}. ${body}`,
        };
      }
      const { content, reasoning } = parse(await res.json());
      if (!content) {
        return { content: "", sources: [], demo: false, error: "The AI provider returned an empty reply." };
      }
      const result: ChatResult = {
        content,
        sources: hits.map((h) => ({ title: h.title, url: h.url })),
        demo: false,
        ...(reasoning ? { reasoning } : {}),
      };
      if (notice) result.notice = notice;
      return result;
    } catch (e) {
      console.error("AI request failed", e);
      return { content: "", sources: [], demo: false, error: "Could not reach the AI provider." };
    }
  });

interface ProviderModel {
  id: string; // "groq:llama-3.3-70b-versatile"
  name: string;
  vendor: "Groq" | "Gemini";
  thinking: boolean;
}

let modelCache: { at: number; models: ProviderModel[] } | undefined;

export const listModels = createServerFn({ method: "GET" }).handler(async (): Promise<{ models: ProviderModel[] }> => {
  if (modelCache && Date.now() - modelCache.at < 10 * 60 * 1000) return { models: modelCache.models };
  const models: ProviderModel[] = [];
  const groqKey = process.env["GROQ_API_KEY"] ?? process.env["AI_API_KEY"];
  const googleKey = process.env["GOOGLE_API_KEY"];
  const thinkingish = (id: string) => /gpt-oss|deepseek|qwen|qwq|r1|thinking|2\.5/i.test(id);

  await Promise.all([
    (async () => {
      if (!groqKey) return;
      try {
        const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${groqKey}` } });
        if (!r.ok) return;
        const j = (await r.json()) as { data?: { id?: string }[] };
        for (const m of j.data ?? []) {
          if (!m.id) continue;
          models.push({ id: `groq:${m.id}`, name: m.id, vendor: "Groq", thinking: thinkingish(m.id) });
        }
      } catch {
        /* leave list empty for this provider */
      }
    })(),
    (async () => {
      if (!googleKey) return;
      try {
        const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/models", {
          headers: { Authorization: `Bearer ${googleKey}` },
        });
        if (!r.ok) return;
        const j = (await r.json()) as { data?: { id?: string }[] };
        for (const m of j.data ?? []) {
          if (!m.id) continue;
          const name = m.id.replace(/^models\//, "");
          models.push({ id: `gemini:${name}`, name, vendor: "Gemini", thinking: thinkingish(name) });
        }
      } catch {
        /* leave list empty for this provider */
      }
    })(),
  ]);

  models.sort((a, b) => a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name));
  modelCache = { at: Date.now(), models };
  return { models };
});

export const getKeyStatus = createServerFn({ method: "GET" }).handler(async () => ({
  ai: Boolean(process.env["AI_API_KEY"] ?? process.env["GROQ_API_KEY"] ?? process.env["GOOGLE_API_KEY"]),
  search: Boolean(process.env["SEARCH_API_KEY"]),
  agents: AGENTS.length,
  models: MODELS.length,
}));
