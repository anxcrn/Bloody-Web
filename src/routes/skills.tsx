import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { SKILLS } from "@/lib/catalog";
import { patchSettings, useAppState } from "@/lib/store";

export const Route = createFileRoute("/skills")({
  head: () => ({
    meta: [
      { title: "Skills · Bloody" },
      { name: "description", content: "Switch skills on or off: graphs, task plans, web research, secure code review, reverse engineering and more." },
      { property: "og:title", content: "Skills · Bloody" },
      { property: "og:description", content: "Choose which skills the AI uses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SkillsPage,
});

function SkillsPage() {
  const { settings } = useAppState();
  const groups = ["Research", "Build", "Security"] as const;

  function toggle(id: string, on: boolean) {
    patchSettings({ skills: on ? [...settings.skills, id] : settings.skills.filter((s) => s !== id) });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Skills" subtitle={`${settings.skills.length} of ${SKILLS.length} active in every chat`} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {groups.map((g) => (
            <section key={g}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">{g}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {SKILLS.filter((s) => s.category === g).map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                    <div>
                      <h3 className="font-bold">{s.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                    </div>
                    <Switch aria-label={s.name} checked={settings.skills.includes(s.id)} onCheckedChange={(v) => toggle(s.id, v)} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
