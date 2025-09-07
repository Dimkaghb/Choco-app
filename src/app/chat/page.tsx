import { ChatUI } from "@/components/chat-ui";
import { ProtectedRoute } from "@/components/protected-route";

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatUI />
    </ProtectedRoute>
  );
}
