import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { format, isSameDay } from "date-fns";
import { Search, History } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { HeartAvatar, Wordmark } from "@/components/brand";
import { MenuButton } from "@/components/app-shell";
import { SUGGESTIONS, getAgent, getModel } from "@/lib/catalog";
import { runReply } from "@/lib/generate";
import { addMessage, createChat, newId, patchSettings, setChatModel, useAppState } from "@/lib/store";
import { Composer } from "./composer";
import { AssistantBubble, ModelBanner, UserBubble } from "./message-bubble";
import { ModelPicker } from "./model-picker";

export function ChatView({ chatId }: { chatId?: string }) {
  const { chats, projects, settings, pending, ready } = useAppState();
  const navigate = useNavigate();
  const chat = chatId ? chats.find((c) => c.id === chatId) : undefined;
  const scroller = useRef<HTMLDivElement>(null);

  const modelId = chat?.modelId ?? settings.modelId;
  const model = getModel(modelId);
  const agent = getAgent(chat?.agentId);
  const project = chat?.projectId ? projects.find((p) => p.id === chat.projectId) : undefined;
  const busy = chatId ? Boolean(pending[chatId]) : false;
  const messages = chat?.messages ?? [];
  const last = messages[messages.length - 1];
  const hasConversation = messages.some((m) => m.role !== "system");

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [messages.length, last?.content.length, busy]);

  function send(text: string) {
    let id = chatId;
    if (!id) id = createChat({ modelId: settings.modelId, agentId: null });
    addMessage(id, { id: newId(), role: "user", content: text, ts: Date.now() });
    void runReply(id);
    if (!chatId) void navigate({ to: "/chat/$id", params: { id } });
  }

  function pickModel(id: string) {
    patchSettings({ modelId: id });
    if (chatId) setChatModel(chatId, id);
  }

  if (chatId && ready && !chat) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <MenuButton />
        <p className="text-lg font-semibold">This chat no longer exists.</p>
        <Link to="/" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
          Start a new chat
        </Link>
      </div>
    );
  }

  const items: React.ReactNode[] = [];
  let prev: number | null = null;
  for (const m of messages) {
    if (prev === null || !isSameDay(prev, m.ts)) {
      if (m.role !== "system" || m.kind !== "model" || hasConversation) {
        items.push(
          <div key={`d-${m.id}`} className="flex justify-center">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{format(m.ts, "MMM dd, yyyy")}</span>
          </div>,
        );
      }
      prev = m.ts;
    }
    if (m.role === "user") items.push(<UserBubble key={m.id} msg={m} initials={settings.initials} />);
    else if (m.role === "assistant")
      items.push(<AssistantBubble key={m.id} msg={m} chatId={chatId ?? ""} modelId={modelId} busy={busy} streaming={busy && m.id === last?.id} />);
    else if (m.kind === "model" && m.modelId) {
      if (hasConversation) items.push(<ModelBanner key={m.id} modelId={m.modelId} />);
    } else
      items.push(
        <p key={m.id} className="text-center text-xs text-muted-foreground">
          {m.content}
        </p>,
      );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-3 py-3 md:px-6">
        <MenuButton />
        <HeartAvatar className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <ModelPicker label={agent ? agent.name : model.name} current={modelId} onPick={pickModel} />
          <div className="truncate text-xs text-muted-foreground">
            {project ? (
              <Link to="/projects/$id" params={{ id: project.id }} className="font-semibold text-primary hover:underline">
                📁 {project.name}
              </Link>
            ) : (
              <>{model.tagline} • Model: {model.name.split(" ")[0]}</>
            )}
          </div>
        </div>
        <Link to="/search" aria-label="Search chats" className="rounded-full p-2 text-primary hover:bg-accent">
          <Search className="h-5 w-5" />
        </Link>
        <Link to="/library" aria-label="Library" className="hidden rounded-full p-2 text-primary hover:bg-accent sm:block">
          <History className="h-5 w-5" />
        </Link>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 py-5 md:px-8">
        {!hasConversation ? (
          <Hero agentName={agent?.name} agentTagline={agent?.tagline} modelName={model.name} onPick={send} />
        ) : (
          <div className="mx-auto flex max-w-4xl flex-col gap-5">
            {items}
            {busy && last?.role === "user" && (
              <div className="blood-enter flex items-center gap-3" aria-live="polite">
                <HeartAvatar className="h-11 w-11 animate-pulse" />
                <div className="cream-surface cream-flow flex h-11 items-center gap-2 rounded-2xl px-4" aria-label="Bloody is typing">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="blood-drop" style={{ animationDelay: `${i * 180}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <Composer onSend={send} disabled={busy} placeholder={`Message ${agent ? agent.name : model.name}...`} />
      </div>
    </div>
  );
}

function Hero({
  agentName,
  agentTagline,
  modelName,
  onPick,
}: {
  agentName: string | undefined;
  agentTagline: string | undefined;
  modelName: string;
  onPick: (t: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center">
      <HeartAvatar className="h-24 w-24" />
      <Wordmark className="mt-3 text-5xl" />
      <p className="mt-1 text-lg font-semibold">{agentName ?? modelName}</p>
      <p className="text-sm text-muted-foreground">{agentTagline ?? "Think Deeper. Go Further."}</p>
      <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-primary/50 hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
