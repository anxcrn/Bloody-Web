import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat/chat-view";

export const Route = createFileRoute("/chat/$id")({
  head: () => ({
    meta: [
      { title: "Chat · Bloody" },
      { name: "description", content: "A saved conversation with Bloody." },
      { property: "og:title", content: "Chat · Bloody" },
      { property: "og:description", content: "A saved conversation with Bloody." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { id } = Route.useParams();
  return <ChatView key={id} chatId={id} />;
}
