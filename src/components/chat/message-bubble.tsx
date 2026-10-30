import { format } from "date-fns";
import { toast } from "sonner";
import { Bookmark, Brain, CheckCheck, ChevronDown, Copy, MoreHorizontal, RefreshCw, ThumbsDown, ThumbsUp, Trash2, SlidersHorizontal } from "lucide-react";
import { HeartAvatar } from "@/components/brand";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getModel } from "@/lib/catalog";
import { regenerate } from "@/lib/generate";
import { removeMessage, updateMessage, type Msg } from "@/lib/store";
import { Markdown, MsgCtx } from "./markdown";
import { BloodDrips } from "./blood-drips";

export function ModelBanner({ modelId }: { modelId: string }) {
  const m = getModel(modelId);
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-accent px-4 py-3">
      <SlidersHorizontal className="h-6 w-6 shrink-0 text-primary" />
      <div className="min-w-0 text-xs text-muted-foreground">
        <div>
          You selected a model: <span className="font-semibold text-primary">{m.name}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <span>{m.tagline}</span>
          {m.traits.map((t) => (
            <span key={t}>• {t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UserBubble({ msg, initials }: { msg: Msg; initials: string }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex max-w-full items-start justify-end gap-3">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-user-bubble px-4 py-3 text-[15px] shadow-sm sm:max-w-[75%]">
          {msg.content}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
          {initials}
        </div>
      </div>
      <div className="mr-14 flex items-center gap-1 text-xs text-muted-foreground">
        {format(msg.ts, "hh:mm a")} <CheckCheck className="h-4 w-4" />
      </div>
    </div>
  );
}

export function AssistantBubble({
  msg,
  chatId,
  modelId,
  busy,
  streaming = false,
}: {
  msg: Msg;
  chatId: string;
  modelId: string;
  busy: boolean;
  streaming?: boolean;
}) {
  const model = getModel(modelId);
  const btn = "rounded-md p-1.5 text-primary/80 transition-colors hover:bg-accent hover:text-primary";
  return (
    <div className="blood-enter flex items-start gap-3">
      <HeartAvatar className={`h-11 w-11 ${streaming ? "animate-pulse" : ""}`} />
      <div className="min-w-0 max-w-[88%] sm:max-w-[75%]">
        <div
          className={`relative overflow-hidden rounded-2xl rounded-tl-sm px-5 py-4 ${
            msg.error ? "bg-destructive/10" : `cream-surface ${streaming ? "cream-flow shadow-[var(--shadow-blood)]" : ""}`
          }`}
        >
          {streaming && !msg.error && <BloodDrips />}
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span className="font-brand text-primary">♥ BLOODY</span>
            <span className="text-muted-foreground">• {model.name}</span>
          </div>
          {msg.reasoning && (
            <details className="group mb-3 rounded-xl border border-primary/20 bg-background/60" open={streaming && !msg.content}>
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-primary">
                <Brain className={`h-4 w-4 ${streaming && !msg.content ? "animate-pulse" : ""}`} />
                {streaming && !msg.content ? "Thinking…" : "Thought process"}
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="max-h-72 overflow-y-auto whitespace-pre-wrap border-t border-primary/10 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                {msg.reasoning}
              </div>
            </details>
          )}
          <MsgCtx.Provider value={{ chatId, messageId: msg.id, tasks: msg.tasks }}>
            <Markdown content={msg.content || (msg.reasoning ? "" : "…")} />
          </MsgCtx.Provider>
          {streaming && <span className="blood-caret" aria-hidden />}
          {msg.sources && msg.sources.length > 0 && (
            <div className="mt-3 border-t border-primary/15 pt-2">
              <div className="mb-1 text-xs font-semibold text-muted-foreground">Sources</div>
              <ol className="space-y-0.5 text-xs">
                {msg.sources.map((s, i) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                      [{i + 1}] {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="mr-3">{format(msg.ts, "hh:mm a")}</span>
          <button
            className={btn}
            aria-label="Copy reply"
            onClick={() => {
              void navigator.clipboard.writeText(msg.content);
              toast.success("Copied");
            }}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            className={`${btn} ${msg.feedback === "up" ? "bg-accent text-primary" : ""}`}
            aria-label="Good reply"
            onClick={() => updateMessage(chatId, msg.id, { feedback: msg.feedback === "up" ? undefined : "up" })}
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button
            className={`${btn} ${msg.feedback === "down" ? "bg-accent text-primary" : ""}`}
            aria-label="Bad reply"
            onClick={() => updateMessage(chatId, msg.id, { feedback: msg.feedback === "down" ? undefined : "down" })}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className={btn} aria-label="More actions">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => {
                  updateMessage(chatId, msg.id, { saved: !msg.saved });
                  toast.success(msg.saved ? "Removed from library" : "Saved to library");
                }}
              >
                <Bookmark className="mr-2 h-4 w-4" /> {msg.saved ? "Remove from library" : "Save to library"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={busy} onClick={() => regenerate(chatId, msg.id)}>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => removeMessage(chatId, msg.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {msg.demo && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">Demo reply</span>}
        </div>
      </div>
    </div>
  );
}
