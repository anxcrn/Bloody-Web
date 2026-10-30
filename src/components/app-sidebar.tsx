import { Link, useNavigate } from "@tanstack/react-router";
import { Bot, FolderKanban, Library, MessageSquareText, MoreHorizontal, PanelLeftClose, Search, Settings, SquarePen, Trash2, Zap } from "lucide-react";
import { format } from "date-fns";
import hooded from "@/assets/hooded.png.asset.json";
import { heartUrl, Wordmark } from "./brand";
import { deleteChat, useAppState } from "@/lib/store";

const NAV = [
  { to: "/search", label: "Search", icon: Search },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/library", label: "Library", icon: Library },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/skills", label: "Skills", icon: Zap },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar({ onNavigate, onHide }: { onNavigate?: () => void; onHide?: () => void }) {
  const { chats } = useAppState();
  const navigate = useNavigate();
  const recent = [...chats].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10);
  const item =
    "flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-sidebar">
      {onHide && (
        <button
          aria-label="Hide side panel"
          title="Hide side panel"
          onClick={onHide}
          className="absolute right-2 top-2 z-20 rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-primary"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      )}
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-4 pb-3 pt-4">
        <img src={heartUrl} alt="" className="h-24 w-20 shrink-0 object-contain mix-blend-multiply" />
        <div className="leading-tight">
          <Wordmark className="text-3xl" />
          <div className="text-[15px] font-semibold text-foreground">Bloody AI</div>
          <div className="text-xs text-muted-foreground">Advanced Hacker AGI</div>
          <div className="text-[11px] text-muted-foreground/80">Think Deeper. Go Further.</div>
        </div>
      </Link>

      <nav className="space-y-0.5 px-3">
        <Link
          to="/"
          onClick={onNavigate}
          activeOptions={{ exact: true }}
          className={item}
          activeProps={{ className: "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" }}
        >
          <SquarePen className="h-5 w-5" /> New Chat
        </Link>
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={item}
            activeProps={{ className: "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" }}
          >
            <n.icon className="h-5 w-5" /> {n.label}
          </Link>
        ))}
      </nav>

      <div className="mx-4 my-3 border-t border-sidebar-border" />
      <div className="px-5 pb-1 text-sm font-semibold text-primary">Recent Chats</div>
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        {recent.length === 0 && (
          <p className="px-2 py-2 text-sm text-muted-foreground">No chats yet. Start one above.</p>
        )}
        {recent.map((c) => (
          <div key={c.id} className="group flex items-center rounded-xl hover:bg-sidebar-accent">
            <Link
              to="/chat/$id"
              params={{ id: c.id }}
              onClick={onNavigate}
              className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-sm"
              activeProps={{ className: "font-semibold text-primary" }}
            >
              <MessageSquareText className="h-5 w-5 shrink-0 text-primary/80" />
              <span className="truncate">{c.title}</span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground group-hover:hidden">
                {format(c.updatedAt, "MMM dd")}
              </span>
            </Link>
            <button
              aria-label={`Delete ${c.title}`}
              className="mr-1 hidden rounded-md p-1 text-muted-foreground hover:text-destructive group-hover:block"
              onClick={() => {
                deleteChat(c.id);
                navigate({ to: "/" });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {chats.length > 10 && (
          <Link to="/search" onClick={onNavigate} className="flex items-center gap-3 px-2 py-2 text-sm">
            <MoreHorizontal className="h-5 w-5" /> More
          </Link>
        )}
      </div>

      <img
        src={hooded.url}
        alt="Hooded figure with blood splatter: some questions shouldn't be asked"
        className="pointer-events-none hidden h-80 w-full shrink-0 object-contain object-bottom mix-blend-multiply [@media(min-height:760px)]:block [@media(min-height:1000px)]:h-96"
      />
    </div>
  );
}
