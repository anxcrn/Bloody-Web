import { Checkbox } from "@/components/ui/checkbox";
import { setTask } from "@/lib/store";

interface Ctx {
  chatId: string;
  messageId: string;
  tasks?: Record<string, boolean> | undefined;
}

export function TasksBlock({ source, ctx }: { source: string; ctx: Ctx | null }) {
  const items = source
    .split("\n")
    .map((l) => /^\s*[-*]\s*\[( |x|X)\]\s*(.+)$/.exec(l))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m, i) => ({ key: `${i}:${m[2] ?? ""}`, text: m[2] ?? "", initial: m[1] !== " " }));

  if (items.length === 0) return null;
  const done = items.filter((t) => ctx?.tasks?.[t.key] ?? t.initial).length;

  return (
    <div className="my-3 rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span>Tasks</span>
        <span className="text-xs font-normal text-muted-foreground">
          {done}/{items.length} done
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((t) => {
          const checked = ctx?.tasks?.[t.key] ?? t.initial;
          return (
            <li key={t.key} className="flex items-start gap-3">
              <Checkbox
                checked={checked}
                aria-label={t.text}
                className="mt-0.5"
                onCheckedChange={(v) => ctx && setTask(ctx.chatId, ctx.messageId, t.key, v === true)}
              />
              <span className={checked ? "text-muted-foreground line-through" : ""}>{t.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
