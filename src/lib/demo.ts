import type { AgentDef, ModelDef } from "./catalog";

export function demoReply(userText: string, agent: AgentDef | null, model: ModelDef): string {
  const t = userText.toLowerCase();
  const who = agent ? agent.name : model.name;
  const parts: string[] = [];

  parts.push(
    `**Demo mode:** no AI key is connected yet, so this is a sample reply from **${who}**. Once your key is added you'll get real answers.`,
  );
  parts.push(`You asked: *"${userText.slice(0, 160)}"*`);

  if (/graph|chart|plot|compare|statistic/.test(t)) {
    parts.push(
      "Here is how a chart will look inside the chat:\n\n```chart\n" +
        JSON.stringify({
          type: "bar",
          title: "Sample: findings by severity",
          data: [
            { name: "Critical", value: 4 },
            { name: "High", value: 9 },
            { name: "Medium", value: 15 },
            { name: "Low", value: 22 },
          ],
        }) +
        "\n```",
    );
  }

  if (/task|plan|todo|steps|checklist|harden/.test(t)) {
    parts.push(
      "And a task list you can tick off:\n\n```tasks\n- [ ] Define scope and goals\n- [ ] Gather the information you need\n- [ ] Work through the highest-risk items first\n- [x] Ask Bloody for help\n```",
    );
  }

  if (!/graph|chart|plot|compare|statistic|task|plan|todo|steps|checklist|harden/.test(t)) {
    parts.push(
      "I can break problems down, draw charts (try *\"plot a chart of ...\"*), build task checklists (try *\"make a plan to ...\"*), and search the web when a search key is connected.",
    );
  }

  return parts.join("\n\n");
}
