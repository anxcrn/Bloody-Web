import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Check, ChevronDown, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listModels } from "@/lib/chat.functions";
import { MODELS } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Header model selector: Bloody presets plus every model the connected provider keys can reach. */
export function ModelPicker({ label, current, onPick }: { label: string; current: string; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useQuery({ queryKey: ["provider-models"], queryFn: () => listModels(), staleTime: 10 * 60 * 1000, enabled: open });

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = list.data?.models ?? [];
    const match = all.filter((m) => !term || m.name.toLowerCase().includes(term));
    const byVendor = new Map<string, typeof all>();
    for (const m of match) byVendor.set(m.vendor, [...(byVendor.get(m.vendor) ?? []), m]);
    return [...byVendor.entries()];
  }, [list.data, q]);

  const presets = MODELS.filter((m) => !q.trim() || m.name.toLowerCase().includes(q.trim().toLowerCase()));

  const pick = (id: string) => {
    onPick(id);
    setOpen(false);
  };

  const row = (id: string, name: string, sub: string, thinking?: boolean) => (
    <button
      key={id}
      onClick={() => pick(id)}
      className={cn("flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left hover:bg-accent", current === id && "bg-accent")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
          <span className="truncate">{name}</span>
          {thinking && <Brain className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Supports thinking" />}
        </div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
      {current === id && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex max-w-full items-center gap-1 text-lg font-bold outline-none" aria-label="Choose model">
        <span className="truncate">{label}</span> <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search models…"
          aria-label="Search models"
          className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="max-h-[60vh] overflow-y-auto">
          {presets.length > 0 && <div className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Bloody</div>}
          {presets.map((m) => row(m.id, m.name, `${m.tagline} • ${m.traits.join(" • ")}`))}
          {list.isLoading && (
            <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading all models…
            </div>
          )}
          {groups.map(([vendor, models]) => (
            <div key={vendor}>
              <div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {vendor} · {models.length}
              </div>
              {models.map((m) => row(m.id, m.name, vendor, m.thinking))}
            </div>
          ))}
          {list.isSuccess && groups.length === 0 && !q && (
            <p className="px-2 py-3 text-xs text-muted-foreground">No extra models found for the connected keys.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
