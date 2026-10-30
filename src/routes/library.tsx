import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Bookmark, Copy } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Markdown, MsgCtx } from "@/components/chat/markdown";
import { updateMessage, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library · Bloody" },
      { name: "description", content: "Saved answers, charts and task lists from your Bloody chats." },
      { property: "og:title", content: "Library · Bloody" },
      { property: "og:description", content: "Saved answers, charts and task lists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

const FILTERS = ["All", "Graphs", "Tasks", "Text"] as const;

function LibraryPage() {
  const { chats } = useAppState();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const saved = chats
    .flatMap((c) => c.messages.filter((m) => m.saved).map((m) => ({ chat: c, msg: m })))
    .sort((a, b) => b.msg.ts - a.msg.ts)
    .filter(({ msg }) => {
      const hasChart = msg.content.includes("```chart");
      const hasTasks = msg.content.includes("```tasks");
      if (filter === "Graphs") return hasChart;
      if (filter === "Tasks") return hasTasks;
      if (filter === "Text") return !hasChart && !hasTasks;
      return true;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Library" subtitle="Answers, graphs and task lists you saved" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn("rounded-full border px-4 py-1.5 text-sm", filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent")}
              >
                {f}
              </button>
            ))}
          </div>
          {saved.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              <Bookmark className="mx-auto mb-2 h-8 w-8 text-primary/60" />
              Nothing saved yet. Open the “…” menu under any reply and choose <b>Save to library</b>.
            </div>
          ) : (
            <ul className="space-y-4">
              {saved.map(({ chat, msg }) => (
                <li key={msg.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <Link to="/chat/$id" params={{ id: chat.id }} className="truncate font-medium text-primary underline-offset-2 hover:underline">
                      {chat.title}
                    </Link>
                    <span className="shrink-0">{format(msg.ts, "MMM dd, yyyy")}</span>
                  </div>
                  <MsgCtx.Provider value={{ chatId: chat.id, messageId: msg.id, tasks: msg.tasks }}>
                    <Markdown content={msg.content} />
                  </MsgCtx.Provider>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                      onClick={() => {
                        void navigator.clipboard.writeText(msg.content);
                        toast.success("Copied");
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button
                      className="rounded-full border border-border px-3 py-1 text-xs hover:bg-accent"
                      onClick={() => updateMessage(chat.id, msg.id, { saved: false })}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
