import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, FileCode2, FolderOpen, MessageSquareText } from "lucide-react";
import { MenuButton } from "@/components/app-shell";
import { Composer } from "@/components/chat/composer";
import { runReply } from "@/lib/generate";
import { addMessage, createChat, newId, useAppState } from "@/lib/store";
import { BloodDrips } from "@/components/chat/blood-drips";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({
    meta: [
      { title: "Project · Bloody" },
      { name: "description", content: "Build inside your project with Bloody." },
      { property: "og:title", content: "Project · Bloody" },
      { property: "og:description", content: "Build inside your project with Bloody." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectPage,
});

const IDEAS = [
  "Explain how this project is structured",
  "Add a new feature and show me every file to change",
  "Find bugs and suggest fixes",
  "Build me a landing page for this",
];

function ProjectPage() {
  const { id } = Route.useParams();
  const { projects, chats, settings, ready } = useAppState();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === id);
  const [openFile, setOpenFile] = useState<string | null>(null);

  if (ready && !project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <MenuButton />
        <p className="text-lg font-semibold">This project no longer exists.</p>
        <Link to="/projects" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
          Back to projects
        </Link>
      </div>
    );
  }
  if (!project) return null;

  const projectChats = chats.filter((c) => c.projectId === id).sort((a, b) => b.updatedAt - a.updatedAt);
  const shown = project.files.find((f) => f.path === openFile);

  function start(text: string) {
    const chatId = createChat({ modelId: settings.modelId, agentId: null, projectId: id });
    addMessage(chatId, { id: newId(), role: "user", content: text, ts: Date.now() });
    void runReply(chatId);
    void navigate({ to: "/chat/$id", params: { id: chatId } });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-3 py-3 md:px-6">
        <MenuButton />
        <Link to="/projects" aria-label="All projects" className="rounded-full p-2 text-primary hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <FolderOpen className="h-6 w-6 text-primary" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{project.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {project.files.length} files{project.skipped ? ` • ${project.skipped} skipped` : ""}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="blood-enter relative overflow-hidden rounded-3xl border border-primary/20 cream-surface p-5 shadow-[var(--shadow-blood)]">
            <BloodDrips />
            <h2 className="font-brand text-2xl text-primary">Start building</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description || "Tell Bloody what to make. It can see this project's files."}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {IDEAS.map((s) => (
                <button
                  key={s}
                  onClick={() => start(s)}
                  className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm shadow-sm transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {projectChats.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-primary">Project chats</h2>
              <div className="space-y-1">
                {projectChats.map((c) => (
                  <Link
                    key={c.id}
                    to="/chat/$id"
                    params={{ id: c.id }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent"
                  >
                    <MessageSquareText className="h-4 w-4 text-primary/80" />
                    <span className="truncate">{c.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{format(c.updatedAt, "MMM dd")}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-sm font-semibold text-primary">Files</h2>
            {project.files.length === 0 ? (
              <p className="text-sm text-muted-foreground">Empty project — Bloody will start from scratch.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-[minmax(0,240px)_1fr]">
                <ul className="max-h-80 overflow-y-auto rounded-2xl border border-border bg-card p-2 text-sm">
                  {project.files.map((f) => (
                    <li key={f.path}>
                      <button
                        onClick={() => setOpenFile(f.path)}
                        className={`flex w-full items-center gap-2 truncate rounded-lg px-2 py-1 text-left hover:bg-accent ${openFile === f.path ? "bg-accent font-semibold text-primary" : ""}`}
                      >
                        <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{f.path}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <pre className="max-h-80 overflow-auto rounded-2xl border border-border bg-muted p-3 text-xs">
                  {shown ? shown.content : "Pick a file to preview it."}
                </pre>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <Composer onSend={start} disabled={false} placeholder={`Build something in ${project.name}...`} />
      </div>
    </div>
  );
}
