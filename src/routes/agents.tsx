import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Github, Info, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AGENTS, type AgentDef } from "@/lib/catalog";
import { SHARED_ENGINE, getIntegration, type IntegrationStatus } from "@/lib/agent-integrations";
import { createChat, useAppState } from "@/lib/store";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agents · Bloody" },
      { name: "description", content: "Agents marketplace: 11 specialist agents, each linked to an open-source GitHub project with an integration plan." },
      { property: "og:title", content: "Agents · Bloody" },
      { property: "og:description", content: "Specialist agents for research, building and security, backed by open-source projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgentsPage,
});

const STATUS_STYLE: Record<IntegrationStatus, string> = {
  Available: "border-primary/30 bg-primary/10 text-primary",
  "Not Installed": "border-border bg-muted text-muted-foreground",
  Configured: "border-primary/40 bg-accent text-accent-foreground",
  Running: "border-primary bg-primary text-primary-foreground",
  Error: "border-destructive bg-destructive/10 text-destructive",
};

function AgentsPage() {
  const navigate = useNavigate();
  const { settings } = useAppState();
  const [details, setDetails] = useState<AgentDef | null>(null);
  const groups = ["General", "Build", "Security"] as const;

  const startChat = (a: AgentDef) => {
    const id = createChat({ modelId: settings.modelId, agentId: a.id });
    void navigate({ to: "/chat/$id", params: { id } });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Agents" subtitle="Marketplace of specialists, each backed by an open-source project" />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex gap-3 rounded-2xl border border-primary/20 bg-accent/50 p-4 text-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              No GitHub project is installed yet. Every agent works now in <b>Demo Mode</b>, using the chat model with
              the agent's instructions. Each project will be connected one by one as its own service, starting with
              Researcher.
            </p>
          </div>

          {groups.map((g) => (
            <section key={g}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">{g}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {AGENTS.filter((a) => a.category === g).map((a) => {
                  const it = getIntegration(a.id);
                  return (
                    <article key={a.id} className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold">{a.name}</h3>
                        {it && (
                          <Badge variant="outline" className={`shrink-0 text-[11px] ${STATUS_STYLE[it.status]}`}>
                            {it.status}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 flex-1 text-sm text-muted-foreground">{a.tagline}</p>
                      {it && (
                        <a
                          href={it.repo}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Github className="h-3.5 w-3.5" /> {it.project}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button className="flex-1 rounded-full" onClick={() => startChat(a)}>
                          Chat with Agent
                        </Button>
                        <Button variant="outline" className="rounded-full" onClick={() => setDetails(a)}>
                          Details
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          <section className="rounded-2xl border border-border bg-card p-4 text-sm">
            <h2 className="font-semibold">Shared agent engine</h2>
            <p className="mt-1 text-muted-foreground">{SHARED_ENGINE.note}</p>
            <a href={SHARED_ENGINE.repo} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Github className="h-3.5 w-3.5" /> {SHARED_ENGINE.project} · {SHARED_ENGINE.license}
            </a>
          </section>

          <p className="text-xs text-muted-foreground">
            Security agents are for learning, defence and authorised testing. They won't write working attacks against systems you don't own.
          </p>
        </div>
      </div>

      <AgentDetails agent={details} onClose={() => setDetails(null)} onChat={startChat} />
    </div>
  );
}

function AgentDetails({ agent, onClose, onChat }: { agent: AgentDef | null; onClose: () => void; onChat: (a: AgentDef) => void }) {
  const it = agent ? getIntegration(agent.id) : null;
  return (
    <Dialog open={!!agent} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        {agent && it && (
          <>
            <DialogHeader>
              <DialogTitle>{agent.name}</DialogTitle>
              <DialogDescription>{it.summary}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Project</dt>
              <dd>
                <a href={it.repo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  {it.project} <ExternalLink className="h-3 w-3" />
                </a>
              </dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{it.status} · Demo Mode active</dd>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{it.kind}</dd>
              <dt className="text-muted-foreground">Language</dt>
              <dd>{it.language}</dd>
              <dt className="text-muted-foreground">Licence</dt>
              <dd>{it.license}</dd>
            </dl>
            <div className="space-y-1 text-sm">
              <h4 className="font-semibold">How it would run</h4>
              <p className="text-muted-foreground">{it.deploy}</p>
            </div>
            <div className="space-y-1 text-sm">
              <h4 className="font-semibold">Integration plan</h4>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                {it.setup.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
            <div className="space-y-1 rounded-xl bg-accent/50 p-3 text-sm">
              <h4 className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" /> Safety rules
              </h4>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {it.safety.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <Button className="rounded-full" onClick={() => onChat(agent)}>
              Chat with Agent (Demo Mode)
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
