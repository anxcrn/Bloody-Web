import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat/chat-view";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New chat · Bloody" },
      { name: "description", content: "Chat with Bloody: deep reasoning, charts, task plans and security know-how." },
      { property: "og:title", content: "Bloody" },
      { property: "og:description", content: "Think deeper. Go further. An AI chat with agents and skills." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ChatView />,
});
