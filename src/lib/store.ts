import { useSyncExternalStore } from "react";
import { DEFAULT_SKILLS } from "./catalog";
import { refreshProjectSummary } from "./project-files";

export interface Source {
  title: string;
  url: string;
}

export interface Msg {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
  kind?: "model";
  modelId?: string;
  feedback?: "up" | "down" | undefined;
  saved?: boolean;
  sources?: Source[];
  tasks?: Record<string, boolean>;
  demo?: boolean;
  error?: boolean;
  /** Chain-of-thought shown in a collapsible "Thinking" panel when thinking mode is on. */
  reasoning?: string;
}

export interface ProjectFile {
  path: string;
  content: string;
}

export interface ProjectMemory {
  id: string;
  title: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  /** Files read from a folder the user picked; text only, size-capped. */
  files: ProjectFile[];
  skipped: number;
  contextSummary?: string;
  contextUpdatedAt?: number;
  memories?: ProjectMemory[];
}

export interface Chat {
  id: string;
  projectId?: string | null;
  title: string;
  createdAt: number;
  updatedAt: number;
  agentId: string | null;
  modelId: string;
  messages: Msg[];
}

export interface Settings {
  name: string;
  initials: string;
  modelId: string;
  skills: string[];
  web: boolean;
  /** Extended "thinking mode" toggle in the composer; shows the model's reasoning. */
  thinking: boolean;
}

export interface AppState {
  chats: Chat[];
  projects: Project[];
  settings: Settings;
  pending: Record<string, boolean>;
  ready: boolean;
}

const KEY = "bloody.v1";

const defaultSettings: Settings = {
  name: "You",
  initials: "SR",
  modelId: "bloody",
  skills: DEFAULT_SKILLS,
  web: false,
  thinking: true,
};

const LEGACY_MODEL: Record<string, string> = {
  mythos: "bloody",
  "mythos-lite": "bloody-lite",
  "mythos-scout": "bloody-scout",
};

let state: AppState = { chats: [], projects: [], settings: defaultSettings, pending: {}, ready: false };
const serverState = state;
let loaded = false;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<{ chats: Chat[]; projects: Project[]; settings: Settings }>;
      const settings = { ...defaultSettings, ...(parsed.settings ?? {}) };
      settings.modelId = LEGACY_MODEL[settings.modelId] ?? settings.modelId;
      state = {
        chats: Array.isArray(parsed.chats) ? parsed.chats : [],
        projects: Array.isArray(parsed.projects)
          ? parsed.projects.map((project) => ({
              ...project,
              contextSummary: project.contextSummary ?? "",
              contextUpdatedAt: project.contextUpdatedAt ?? 0,
              memories: project.memories ?? [],
            }))
          : [],
        settings,
        pending: {},
        ready: true,
      };
      return;
    }
  } catch {
    /* ignore corrupt storage */
  }
  state = { ...state, ready: true };
}

export function flush() {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = undefined;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ chats: state.chats, projects: state.projects, settings: state.settings }));
  } catch {
    /* storage full or unavailable */
  }
}

function set(next: Partial<AppState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 300);
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  if (!loaded && typeof window !== "undefined") {
    loaded = true;
    load();
    window.addEventListener("beforeunload", flush);
  }
  return state;
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverState);
}

export const newId = () => crypto.randomUUID();

export const getSettings = () => state.settings;
export const getChat = (id: string) => state.chats.find((c) => c.id === id);

function mapChat(id: string, fn: (c: Chat) => Chat) {
  set({ chats: state.chats.map((c) => (c.id === id ? fn(c) : c)) });
}

function modelBanner(modelId: string): Msg {
  return { id: newId(), role: "system", kind: "model", modelId, content: "", ts: Date.now() };
}

export function createChat(opts: { modelId: string; agentId: string | null; projectId?: string | null }): string {
  const id = newId();
  const now = Date.now();
  const chat: Chat = {
    id,
    title: "New chat",
    createdAt: now,
    updatedAt: now,
    agentId: opts.agentId,
    projectId: opts.projectId ?? null,
    modelId: opts.modelId,
    messages: [modelBanner(opts.modelId)],
  };
  set({ chats: [chat, ...state.chats] });
  return id;
}

export function addMessage(chatId: string, msg: Msg) {
  mapChat(chatId, (c) => {
    const isFirstUser = msg.role === "user" && !c.messages.some((m) => m.role === "user");
    return {
      ...c,
      title: isFirstUser ? msg.content.replace(/\s+/g, " ").trim().slice(0, 40) || c.title : c.title,
      updatedAt: Date.now(),
      messages: [...c.messages, msg],
    };
  });
}

export function updateMessage(chatId: string, msgId: string, patch: Partial<Msg>) {
  mapChat(chatId, (c) => ({
    ...c,
    messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
  }));
}

export function removeMessage(chatId: string, msgId: string) {
  mapChat(chatId, (c) => ({ ...c, messages: c.messages.filter((m) => m.id !== msgId) }));
}

export function setTask(chatId: string, msgId: string, key: string, done: boolean) {
  const chat = getChat(chatId);
  const msg = chat?.messages.find((m) => m.id === msgId);
  if (!msg) return;
  updateMessage(chatId, msgId, { tasks: { ...(msg.tasks ?? {}), [key]: done } });
}

export function setChatModel(chatId: string, modelId: string) {
  mapChat(chatId, (c) =>
    c.modelId === modelId ? c : { ...c, modelId, messages: [...c.messages, modelBanner(modelId)] },
  );
}

export const getProject = (id: string | null | undefined) => (id ? state.projects.find((p) => p.id === id) : undefined);

export function addProjectMemory(projectId: string, memory: Omit<ProjectMemory, "id" | "createdAt" | "updatedAt">) {
  const project = getProject(projectId);
  if (!project) return;
  const entry: ProjectMemory = {
    id: newId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...memory,
  };

  const memories = [entry, ...(project.memories ?? [])].slice(0, 12);
  updateProject(projectId, { memories, contextSummary: project.contextSummary ?? "" });
}

export function refreshProjectContext(projectId: string) {
  const project = getProject(projectId);
  if (!project) return;
  const summary = refreshProjectSummary(project);
  updateProject(projectId, {
    contextSummary: summary,
    contextUpdatedAt: Date.now(),
  });
}

export function createProject(p: { name: string; description?: string; files?: ProjectFile[]; skipped?: number }): string {
  const id = newId();
  const now = Date.now();
  const files = p.files ?? [];
  const project: Project = {
    id,
    name: p.name.trim() || "Untitled project",
    description: p.description?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
    files,
    skipped: p.skipped ?? 0,
    contextSummary: refreshProjectSummary({ name: p.name.trim() || "Untitled project", description: p.description?.trim() ?? "", files }),
    contextUpdatedAt: now,
    memories: [],
  };
  set({ projects: [project, ...state.projects] });
  return id;
}

export function updateProject(id: string, patch: Partial<Omit<Project, "id" | "createdAt">>) {
  set({
    projects: state.projects.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, ...patch, updatedAt: Date.now() };
      if (patch.files) {
        next.contextSummary = refreshProjectSummary({ name: p.name, description: p.description, files: patch.files });
        next.contextUpdatedAt = Date.now();
      }
      return next;
    }),
  });
}

export function deleteProject(id: string) {
  set({
    projects: state.projects.filter((p) => p.id !== id),
    chats: state.chats.map((c) => (c.projectId === id ? { ...c, projectId: null } : c)),
  });
}

export function deleteChat(id: string) {
  set({ chats: state.chats.filter((c) => c.id !== id) });
}

export function clearChats() {
  set({ chats: [] });
}

export function patchSettings(patch: Partial<Settings>) {
  set({ settings: { ...state.settings, ...patch } });
}

export function setPending(id: string, on: boolean) {
  const next = { ...state.pending };
  if (on) next[id] = true;
  else delete next[id];
  set({ pending: next });
}
