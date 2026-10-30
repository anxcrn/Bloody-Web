import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Menu, PanelLeftOpen } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";

interface PanelCtx {
  openMobile: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const COLLAPSE_KEY = "bloody.sidebarCollapsed";
const MenuCtx = createContext<PanelCtx>({ openMobile: () => {}, collapsed: false, setCollapsed: () => {} });

export const usePanel = () => useContext(MenuCtx);

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    setCollapsedState(window.localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    window.localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
  };

  return (
    <MenuCtx.Provider value={{ openMobile: () => setOpen(true), collapsed, setCollapsed }}>
      <div className="flex h-dvh overflow-hidden bg-background">
        {!collapsed && (
          <aside className="hidden w-80 shrink-0 border-r border-sidebar-border md:block">
            <AppSidebar onHide={() => setCollapsed(true)} />
          </aside>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <AppSidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </MenuCtx.Provider>
  );
}

export function MenuButton() {
  const { openMobile, collapsed, setCollapsed } = usePanel();
  return (
    <>
      <button aria-label="Open menu" onClick={openMobile} className="rounded-lg p-2 hover:bg-accent md:hidden">
        <Menu className="h-5 w-5" />
      </button>
      {collapsed && (
        <button
          aria-label="Show side panel"
          title="Show side panel"
          onClick={() => setCollapsed(false)}
          className="hidden rounded-lg p-2 text-primary hover:bg-accent md:block"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}
    </>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-8">
      <MenuButton />
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}
