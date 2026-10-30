import { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, Mic, Plus } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SKILLS, SUGGESTIONS } from "@/lib/catalog";
import { patchSettings, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

interface SpeechRec {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function Composer({ onSend, disabled, placeholder }: { onSend: (text: string) => void; disabled: boolean; placeholder: string }) {
  const { settings } = useAppState();
  const thinking = settings.thinking !== false;
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<SpeechRec | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [disabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function submit() {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  }

  function toggleMic() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input isn't supported in this browser.");
      return;
    }
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new Ctor();
    r.lang = "en-US";
    r.interimResults = false;
    r.onresult = (e) => {
      const said = Array.from(e.results).map((x) => x[0]?.transcript ?? "").join(" ");
      setText((p) => (p ? `${p} ${said}` : said));
    };
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  }

  const icon = "rounded-full p-2 text-primary transition-colors hover:bg-accent";

  return (
    <div className="px-3 pb-4 pt-2 md:px-8">
      <div className="flex items-end gap-1 rounded-[1.75rem] border border-primary/40 bg-card px-3 py-2 shadow-sm focus-within:border-primary">
        <Popover open={plusOpen} onOpenChange={setPlusOpen}>
          <PopoverTrigger className={icon} aria-label="More options">
            <Plus className="h-5 w-5" />
          </PopoverTrigger>
          <PopoverContent align="start" side="top" className="w-72 p-2">
            <button
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => patchSettings({ thinking: !thinking })}
            >
              <span className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> Thinking mode
              </span>
              <span className={cn("text-xs font-semibold", thinking ? "text-primary" : "text-muted-foreground")}>{thinking ? "On" : "Off"}</span>
            </button>
            <div className="my-1 border-t border-border" />
            <div className="px-2 pb-1 pt-1 text-xs font-semibold text-muted-foreground">Quick prompts</div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setText(s);
                  setPlusOpen(false);
                }}
              >
                {s}
              </button>
            ))}
            <div className="px-2 pt-2 text-[11px] text-muted-foreground">
              {settings.skills.length}/{SKILLS.length} skills active
            </div>
          </PopoverContent>
        </Popover>
        <textarea
          ref={ref}
          value={text}
          rows={1}
          placeholder={placeholder}
          aria-label="Message"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-muted-foreground"
        />
        <button
          aria-label="Thinking mode"
          aria-pressed={thinking}
          title={thinking ? "Thinking mode on" : "Thinking mode off"}
          onClick={() => patchSettings({ thinking: !thinking })}
          className={cn(
            "mb-0.5 hidden items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:flex",
            thinking ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          <Brain className="h-4 w-4" /> Think
        </button>
        <button className={cn(icon, listening && "animate-pulse bg-accent")} aria-label="Voice input" onClick={toggleMic}>
          <Mic className="h-5 w-5" />
        </button>
        <button
          aria-label="Send message"
          disabled={disabled || !text.trim()}
          onClick={submit}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-blood transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
