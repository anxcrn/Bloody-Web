// Registry linking each BLOODY agent to the open-source project it could be backed by.
// Nothing here is installed: repos are separate backend services, never frontend libraries.

export type IntegrationStatus = "Available" | "Not Installed" | "Configured" | "Running" | "Error";

export interface AgentIntegration {
  agentId: string;
  project: string;
  repo: string;
  license: string;
  language: string;
  kind: "Agent service" | "Agent framework" | "Security platform" | "Analysis tool";
  status: IntegrationStatus;
  summary: string;
  deploy: string;
  setup: string[];
  safety: string[];
}

const COMMON_SAFETY = "Pin a reviewed release; never run unreviewed code from the repo.";

export const INTEGRATIONS: AgentIntegration[] = [
  {
    agentId: "researcher",
    project: "GPT Researcher",
    repo: "https://github.com/assafelovic/gpt-researcher",
    license: "Apache-2.0",
    language: "Python",
    kind: "Agent service",
    status: "Not Installed",
    summary: "Deep research agent that gathers sources and writes cited reports.",
    deploy: "Docker container exposing its HTTP/WebSocket API; needs an AI key and a search key.",
    setup: [
      "Deploy the official Docker image on a separate host",
      "Give it the same AI and search keys BLOODY uses",
      "Add its URL as a server secret so BLOODY can forward research requests",
      "Stream the report back into the chat with its source list",
    ],
    safety: [COMMON_SAFETY, "Limit outbound browsing to public web pages."],
  },
  {
    agentId: "writer",
    project: "CrewAI",
    repo: "https://github.com/crewAIInc/crewAI",
    license: "MIT",
    language: "Python",
    kind: "Agent framework",
    status: "Not Installed",
    summary: "Framework for multi-agent crews; used to build a drafting, editing and review crew.",
    deploy: "Small Python service that defines a writer crew and exposes one endpoint.",
    setup: [
      "Write a writer / editor / proof-reader crew in Python",
      "Wrap it in a minimal HTTP service and deploy it",
      "Connect it to BLOODY through a server secret",
    ],
    safety: [COMMON_SAFETY, "Framework only: no built-in writer, so its behaviour is ours to define."],
  },
  {
    agentId: "analyst",
    project: "PandasAI",
    repo: "https://github.com/sinaptik-ai/pandas-ai",
    license: "MIT core, separate enterprise licence (check)",
    language: "Python",
    kind: "Agent service",
    status: "Not Installed",
    summary: "Conversational analysis over CSV, SQL and Parquet data.",
    deploy: "Python service in a sandbox, because it generates and runs code on your data.",
    setup: [
      "Run it inside an isolated container with no network access to private systems",
      "Add file upload in BLOODY to pass datasets to it",
      "Return results as BLOODY chart blocks",
    ],
    safety: [COMMON_SAFETY, "Executes generated code: sandbox required."],
  },
  {
    agentId: "coder",
    project: "OpenHands",
    repo: "https://github.com/OpenHands/OpenHands",
    license: "MIT core, separate enterprise folder (check)",
    language: "TypeScript / Python",
    kind: "Agent service",
    status: "Not Installed",
    summary: "Coding agent that edits files, runs commands and works on repositories.",
    deploy: "Docker deployment with its own sandbox runtime for every session.",
    setup: [
      "Deploy OpenHands with its sandboxed runtime on a dedicated host",
      "Expose its API privately and store the URL as a server secret",
      "Forward coding tasks from BLOODY and show diffs in chat",
    ],
    safety: [COMMON_SAFETY, "Runs shell commands: keep it isolated from production and secrets."],
  },
  {
    agentId: "reviewer",
    project: "Qodo PR-Agent",
    repo: "https://github.com/qodo-ai/pr-agent",
    license: "AGPL-3.0 (check before hosting)",
    language: "Python",
    kind: "Agent service",
    status: "Not Installed",
    summary: "Reviews pull requests, flags bugs and suggests improvements.",
    deploy: "Docker container or CLI triggered per review; needs a GitHub token.",
    setup: [
      "Connect GitHub so the agent can read pull requests",
      "Run PR-Agent as a service and call it with a pull request link",
      "Show its review comments in chat",
    ],
    safety: [COMMON_SAFETY, "Use a read-only GitHub token unless posting comments is wanted."],
  },
  {
    agentId: "designer",
    project: "Onlook",
    repo: "https://github.com/onlook-dev/onlook",
    license: "Apache-2.0",
    language: "TypeScript",
    kind: "Analysis tool",
    status: "Not Installed",
    summary: "Visual editor for React and Tailwind; a reference for AI-assisted design edits.",
    deploy: "Standalone app; best linked out to, or used as a design reference, not embedded.",
    setup: [
      "Keep the design critique in BLOODY's own agent prompt",
      "Optionally link to a hosted Onlook workspace for visual edits",
    ],
    safety: [COMMON_SAFETY],
  },
  {
    agentId: "defender",
    project: "Wazuh",
    repo: "https://github.com/wazuh/wazuh",
    license: "GPL-2.0 (check)",
    language: "C++ / Python",
    kind: "Security platform",
    status: "Not Installed",
    summary: "Security monitoring, endpoint detection and log analysis.",
    deploy: "Your own Wazuh server; BLOODY reads alerts through its API.",
    setup: [
      "Run Wazuh on infrastructure you own",
      "Create a read-only API user and store it as a server secret",
      "Let the agent summarise alerts and suggest hardening",
    ],
    safety: [COMMON_SAFETY, "Read-only access; only your own monitored systems."],
  },
  {
    agentId: "osint",
    project: "OpenCTI",
    repo: "https://github.com/OpenCTI-Platform/opencti",
    license: "Apache-2.0 community, separate enterprise edition (check)",
    language: "TypeScript / Python",
    kind: "Security platform",
    status: "Not Installed",
    summary: "Threat intelligence platform for indicators, actors and relationships.",
    deploy: "Docker Compose stack; BLOODY queries its GraphQL API.",
    setup: [
      "Deploy OpenCTI and its connectors on your own host",
      "Create an API token with read access",
      "Let the agent look up actors and indicators mapped to MITRE ATT&CK",
    ],
    safety: [COMMON_SAFETY, "Lawful, public-source research only; no tracking of private individuals."],
  },
  {
    agentId: "reverser",
    project: "Radare2",
    repo: "https://github.com/radareorg/radare2",
    license: "LGPL-3.0 (check)",
    language: "C",
    kind: "Analysis tool",
    status: "Not Installed",
    summary: "Disassembly, debugging and binary analysis.",
    deploy: "Run inside a throwaway sandbox per sample, driven through r2pipe.",
    setup: [
      "Build a sandbox worker with radare2 and r2pipe, no network",
      "Upload samples you are allowed to analyse",
      "Send disassembly output to the agent for explanation",
    ],
    safety: [COMMON_SAFETY, "Samples never execute outside the sandbox."],
  },
  {
    agentId: "responder",
    project: "DFIR-IRIS",
    repo: "https://github.com/dfir-iris/iris-web",
    license: "LGPL-3.0",
    language: "Python",
    kind: "Security platform",
    status: "Not Installed",
    summary: "Incident case management, evidence tracking and response workflows.",
    deploy: "Docker Compose stack; BLOODY talks to its REST API.",
    setup: [
      "Deploy IRIS on your own host",
      "Create an API key for a dedicated BLOODY user",
      "Let the agent draft timelines and triage notes into cases",
    ],
    safety: [COMMON_SAFETY, "Keep evidence inside IRIS; send only summaries to the AI."],
  },
  {
    agentId: "redteam",
    project: "MITRE CALDERA",
    repo: "https://github.com/mitre/caldera",
    license: "Apache-2.0",
    language: "Python",
    kind: "Security platform",
    status: "Not Installed",
    summary: "Adversary emulation for authorised security assessments.",
    deploy: "Isolated lab server; the agent only plans and reads results, it never launches operations.",
    setup: [
      "Run CALDERA in a lab network you own",
      "Record written authorisation and scope before any exercise",
      "Use the agent for planning, rules of engagement and reporting",
    ],
    safety: [COMMON_SAFETY, "Authorised, in-scope targets only; no access to user systems."],
  },
];

export const SHARED_ENGINE = {
  project: "Hugging Face smolagents",
  repo: "https://github.com/huggingface/smolagents",
  license: "Apache-2.0",
  note: "Possible shared runtime for tool-using agents across model providers. Code-executing agents need sandboxing.",
};

export const getIntegration = (agentId: string) => INTEGRATIONS.find((i) => i.agentId === agentId) ?? null;
