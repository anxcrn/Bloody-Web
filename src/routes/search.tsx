import { useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Search as SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search chats · Bloody" },
      { name: "description", content: "Search across all your Bloody conversations." },
      { property: "og:title", content: "Search chats · Bloody" },
      { property: "og:description", content: "Search across all your conversations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { chats } = useAppState();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...chats]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((c) => {
        if (!term) return { chat: c, snippet: c.messages.find((m) => m.role !== "system")?.content ?? "" };
        const hit = c.messages.find((m) => m.role !== "system" && m.content.toLowerCase().includes(term));
        if (hit) return { chat: c, snippet: hit.content };
        if (c.title.toLowerCase().includes(term)) return { chat: c, snippet: c.title };
        return null;
      })
      .filter((r): r is { chat: (typeof chats)[number]; snippet: string } => r !== null);
  }, [chats, q]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Search" subtitle="Find anything you've discussed" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats and messages..." className="h-12 rounded-full pl-10" aria-label="Search chats" />
          </div>
          <ul className="mt-5 space-y-2">
            {results.map(({ chat, snippet }) => (
              <li key={chat.id}>
                <Link to="/chat/$id" params={{ id: chat.id }} className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold">{chat.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{format(chat.updatedAt, "MMM dd, yyyy")}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snippet}</p>
                </Link>
              </li>
            ))}
          </ul>
          {results.length === 0 && (
            <p className="mt-10 text-center text-muted-foreground">
              {chats.length === 0 ? "No chats yet." : "Nothing matches your search."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
