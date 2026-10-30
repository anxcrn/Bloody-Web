import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getKeyStatus } from "@/lib/chat.functions";
import { MODELS } from "@/lib/catalog";
import { clearChats, patchSettings, useAppState } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Bloody" },
      { name: "description", content: "Choose your model, profile and connect your AI and search keys." },
      { property: "og:title", content: "Settings · Bloody" },
      { property: "og:description", content: "Model, profile and API key status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className={`inline-flex items-center gap-1 text-sm ${ok ? "text-primary" : "text-muted-foreground"}`}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
        {ok ? "Connected" : "Not connected yet"}
      </span>
    </div>
  );
}

function SettingsPage() {
  const { settings, chats } = useAppState();
  const status = useQuery({ queryKey: ["key-status"], queryFn: () => getKeyStatus() });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Settings" subtitle="Profile, model and connections" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">Profile</h2>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={settings.name} onChange={(e) => patchSettings({ name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="initials">Initials</Label>
                <Input id="initials" maxLength={3} value={settings.initials} onChange={(e) => patchSettings({ initials: e.target.value.toUpperCase() })} />
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">Default model</h2>
            <div className="grid gap-2">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => patchSettings({ modelId: m.id })}
                  aria-pressed={settings.modelId === m.id}
                  className={`rounded-xl border px-4 py-3 text-left transition-colors ${settings.modelId === m.id ? "border-primary bg-accent" : "border-border hover:bg-muted"}`}
                >
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.tagline} • {m.traits.join(" • ")}</div>
                </button>
              ))}
            </div>
            <p className="pt-2 text-sm text-muted-foreground">Web search runs automatically on every message.</p>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">Connections</h2>
            <Status ok={Boolean(status.data?.ai)} label="AI model key" />
            <Status ok={Boolean(status.data?.search)} label="Web search key" />
            <p className="text-sm text-muted-foreground">
              Until keys are connected, the chat answers in demo mode. When you're ready, send your keys to the builder in the project chat. They're stored securely on the server and never in your browser.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="font-bold">Data</h2>
            <p className="text-sm text-muted-foreground">{chats.length} chats are stored in this browser only.</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={chats.length === 0}>Delete all chats</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
                  <AlertDialogDescription>This removes every conversation and saved item from this browser. It can't be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      clearChats();
                      toast.success("All chats deleted");
                    }}
                  >
                    Delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </div>
      </div>
    </div>
  );
}
