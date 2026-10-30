import { describe, expect, it } from "vitest";
import { AGENTS } from "@/lib/catalog";
import { INTEGRATIONS, getIntegration } from "@/lib/agent-integrations";

describe("agent registry", () => {
  it("lists all 11 agents, each with a GitHub repository", () => {
    expect(AGENTS).toHaveLength(11);
    for (const a of AGENTS) {
      expect(getIntegration(a.id)?.repo).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it("never claims a repository is installed or running before it is verified", () => {
    for (const i of INTEGRATIONS) {
      expect(["Running", "Configured"]).not.toContain(i.status);
    }
  });

  it("links the Researcher to GPT Researcher", () => {
    expect(getIntegration("researcher")?.repo).toBe("https://github.com/assafelovic/gpt-researcher");
  });
});
