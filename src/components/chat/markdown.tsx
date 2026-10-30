import { createContext, useContext, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChartBlock } from "./chart-block";
import { TasksBlock } from "./tasks-block";

export const MsgCtx = createContext<{ chatId: string; messageId: string; tasks?: Record<string, boolean> | undefined } | null>(null);

function textOf(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(textOf).join("");
  return "";
}

function Code({ className, children }: { className?: string; children?: ReactNode }) {
  const ctx = useContext(MsgCtx);
  const text = textOf(children).replace(/\n$/, "");
  const lang = /language-(\w+)/.exec(className ?? "")?.[1];
  if (lang === "chart") return <ChartBlock source={text} />;
  if (lang === "tasks") return <TasksBlock source={text} ctx={ctx} />;
  if (lang || text.includes("\n")) {
    return (
      <pre className="my-3 overflow-x-auto rounded-xl bg-foreground p-4 text-[13px] leading-relaxed text-background">
        <code>{text}</code>
      </pre>
    );
  }
  return <code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] text-primary">{children}</code>;
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="space-y-3 break-words text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => <Code className={className ?? ""}>{children}</Code>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          h1: ({ children }) => <h2 className="pt-1 text-xl font-extrabold text-primary">{children}</h2>,
          h2: ({ children }) => <h3 className="border-b border-border pb-1 pt-1 text-lg font-bold">{children}</h3>,
          h3: ({ children }) => <h4 className="text-base font-semibold text-primary">{children}</h4>,
          img: ({ src, alt }) =>
            typeof src === "string" && /^https:\/\//.test(src) ? (
              <figure className="my-2">
                <img src={src} alt={alt ?? ""} loading="lazy" className="max-h-96 w-auto max-w-full rounded-xl border border-border" />
                {alt && <figcaption className="mt-1 text-xs text-muted-foreground">{alt}</figcaption>}
              </figure>
            ) : null,
          hr: () => <hr className="my-4 border-border" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-3 text-muted-foreground">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border bg-muted px-2 py-1 text-left">{children}</th>,
          td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
