import { sendChat } from "./chat.functions";
import {
  addMessage,
  flush,
  getChat,
  newId,
  removeMessage,
  setPending,
  updateMessage,
  getSettings,
  getProject,
} from "./store";
import { projectContext, summarizeProject } from "./project-files";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Web search runs only when the user's message asks for it — no links until they ask. */
const WEB_INTENT =
  /\b(search|google|look\s?up|lookup|find\s+(?:out|online)|latest|newest|news|today|current(?:ly)?|recent(?:ly)?|online|web|internet|sources?|citations?|references?|browse|trending|price|weather|stock|market|crypto|github|repo|documentation|compare|vs)\b/i;

export async function runReply(chatId: string) {
  const chat = getChat(chatId);
  if (!chat) return;
  const settings = getSettings();
  const project = getProject(chat.projectId);
  setPending(chatId, true);

  const history = chat.messages
    .filter((m) => m.role !== "system" && !m.error)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    .slice(-40);

  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";

  try {
    const projectSnapshot = project
      ? {
          ...project,
          contextSummary: project.contextSummary?.trim() || summarizeProject(project.files),
        }
      : undefined;

    const res = await sendChat({
      data: {
        messages: history,
        agentId: chat.agentId ?? "",
        modelId: chat.modelId,
        skillIds: settings.skills,
        web: WEB_INTENT.test(lastUser),
        thinking: settings.thinking !== false,
        ...(projectSnapshot ? { projectContext: projectContext(projectSnapshot) } : {}),
      },
    });

    if (res.error) {
      addMessage(chatId, {
        id: newId(),
        role: "assistant",
        content: res.error,
        ts: Date.now(),
        error: true,
      });
      return;
    }

    const id = newId();
    addMessage(chatId, { id, role: "assistant", content: "", ts: Date.now() });

    if (res.reasoning) {
      const rStep = Math.max(24, Math.ceil(res.reasoning.length / 30));
      for (let i = rStep; i < res.reasoning.length + rStep; i += rStep) {
        updateMessage(chatId, id, { reasoning: res.reasoning.slice(0, i) });
        await sleep(12);
      }
      updateMessage(chatId, id, { reasoning: res.reasoning });
    }

    const text = res.content;
    const step = Math.max(6, Math.ceil(text.length / 120));
    for (let i = step; i < text.length + step; i += step) {
      updateMessage(chatId, id, { content: text.slice(0, i) });
      await sleep(18);
    }
    updateMessage(chatId, id, {
      content: text,
      demo: res.demo,
      ...(res.sources.length ? { sources: res.sources } : {}),
    });
    if (res.notice) {
      addMessage(chatId, { id: newId(), role: "system", content: res.notice, ts: Date.now() });
    }
  } catch (e) {
    console.error(e);
    addMessage(chatId, {
      id: newId(),
      role: "assistant",
      content: "Something went wrong while contacting the server. Try again.",
      ts: Date.now(),
      error: true,
    });
  } finally {
    setPending(chatId, false);
    flush();
  }
}

export function regenerate(chatId: string, assistantMsgId: string) {
  removeMessage(chatId, assistantMsgId);
  void runReply(chatId);
}
