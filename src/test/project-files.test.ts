import { describe, expect, it } from "vitest";
import { collectFiles, MAX_FILE_BYTES, projectContext, summarizeProject, type PickedFile } from "@/lib/project-files";

const f = (path: string, content = "x", size = content.length): PickedFile => ({ path, size, read: async () => content });

describe("project folder import", () => {
  it("skips node_modules and .git folders", async () => {
    const r = await collectFiles([f("app/src/a.ts"), f("app/node_modules/x/index.js"), f("app/.git/HEAD")]);
    expect(r.files.map((x) => x.path)).toEqual(["src/a.ts"]);
    expect(r.skipped).toBe(2);
  });

  it("never reads .env secret files", async () => {
    const r = await collectFiles([f("app/.env"), f("app/.env.local"), f("app/README.md")]);
    expect(r.files.map((x) => x.path)).toEqual(["README.md"]);
  });

  it("skips binary and oversized files", async () => {
    const r = await collectFiles([f("app/logo.png"), f("app/big.ts", "x", MAX_FILE_BYTES + 1), f("app/ok.ts")]);
    expect(r.files.map((x) => x.path)).toEqual(["ok.ts"]);
  });

  it("builds a useful architecture summary", () => {
    const summary = summarizeProject([
      { path: "src/routes/index.tsx", content: "x" },
      { path: "src/lib/chat.functions.ts", content: "x" },
      { path: "src/components/chat/chat-view.tsx", content: "x" },
      { path: "README.md", content: "x" },
    ]);

    expect(summary).toContain("Architecture summary:");
    expect(summary).toContain("src/routes");
    expect(summary).toContain("src/lib");
  });

  it("context lists files and stays within budget", () => {
    const ctx = projectContext({ name: "P", description: "", files: [{ path: "a.ts", content: "y".repeat(500) }] }, 200);
    expect(ctx).toContain("- a.ts");
    expect(ctx.length).toBeLessThan(300);
  });
});
