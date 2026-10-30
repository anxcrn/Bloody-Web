import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { FileCode2, FolderOpen, FolderPlus, Loader2, MessageSquareText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MenuButton } from "@/components/app-shell";
import { BloodDrips } from "@/components/chat/blood-drips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { collectFiles, fromFileList } from "@/lib/project-files";
import { createProject, deleteProject, useAppState } from "@/lib/store";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects · Bloody" },
      { name: "description", content: "Open a folder or start a blank project and build it with Bloody." },
      { property: "og:title", content: "Projects · Bloody" },
      { property: "og:description", content: "Pick a folder, then build anything with your AI partner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects, chats, ready } = useAppState();
  const navigate = useNavigate();
  const folderInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  async function onFolder(list: FileList | null) {
    if (!list || list.length === 0) return;
    setLoading(true);
    try {
      const { files, skipped, root } = await collectFiles(fromFileList(list));
      const id = createProject({ name: name || root || "My project", description: goal, files, skipped });
      toast.success(`Opened ${files.length} file${files.length === 1 ? "" : "s"}${skipped ? ` (${skipped} skipped)` : ""}`);
      void navigate({ to: "/projects/$id", params: { id } });
    } catch (e) {
      console.error(e);
      toast.error("Could not read that folder.");
    } finally {
      setLoading(false);
      if (folderInput.current) folderInput.current.value = "";
    }
  }

  function blank() {
    const id = createProject({ name: name || "New project", description: goal });
    void navigate({ to: "/projects/$id", params: { id } });
  }

  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-3 py-3 md:px-6">
        <MenuButton />
        <div>
          <h1 className="text-lg font-bold">Projects</h1>
          <p className="text-xs text-muted-foreground">Pick a folder, then start building anything.</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <section className="blood-enter relative overflow-hidden rounded-3xl border border-primary/20 cream-surface p-5 shadow-[var(--shadow-blood)] md:p-7">
            <BloodDrips />
            <h2 className="font-brand text-2xl text-primary">Start a project</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Bloody reads the text files in your folder so it can build on them. Files stay in this browser.
            </p>
            <div className="mt-4 grid gap-3">
              <Input placeholder="Project name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              <Textarea
                placeholder="What do you want to build? e.g. a portfolio site, a CLI tool, a game…"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                maxLength={1000}
                rows={2}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={folderInput}
                type="file"
                className="hidden"
                multiple
                aria-label="Choose a folder"
                {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                onChange={(e) => void onFolder(e.target.files)}
              />
              <Button onClick={() => folderInput.current?.click()} disabled={loading} className="rounded-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderOpen className="mr-2 h-4 w-4" />}
                Select a folder
              </Button>
              <Button variant="outline" onClick={blank} disabled={loading} className="rounded-full">
                <FolderPlus className="mr-2 h-4 w-4" /> Start from scratch
              </Button>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-primary">Your projects</h2>
            {ready && sorted.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {sorted.map((p) => {
                const count = chats.filter((c) => c.projectId === p.id).length;
                return (
                  <div key={p.id} className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50">
                    <Link to="/projects/$id" params={{ id: p.id }} className="block">
                      <div className="flex items-center gap-2 font-semibold">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <span className="truncate">{p.name}</span>
                      </div>
                      {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><FileCode2 className="h-3.5 w-3.5" /> {p.files.length} files</span>
                        <span className="flex items-center gap-1"><MessageSquareText className="h-3.5 w-3.5" /> {count} chats</span>
                        <span className="ml-auto">{format(p.updatedAt, "MMM dd")}</span>
                      </div>
                    </Link>
                    <button
                      aria-label={`Delete ${p.name}`}
                      className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                      onClick={() => {
                        deleteProject(p.id);
                        toast.success("Project removed");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
