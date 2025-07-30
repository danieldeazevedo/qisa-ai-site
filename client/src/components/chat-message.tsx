import { Message } from "@shared/schema";
import { Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const timestamp = formatDistanceToNow(message.createdAt ? new Date(message.createdAt) : new Date(), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div className={`flex items-start space-x-3 mb-6 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="text-white text-sm" />
        </div>
      )}
      
      <div
        className={`max-w-md px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-gradient-to-r from-primary to-secondary text-white rounded-tr-md"
            : "bg-white shadow-sm border border-gray-100 rounded-tl-md"
        }`}
      >
        {message.imageUrl ? (
          <div className="space-y-3">
            <p className={isUser ? "text-white" : "text-gray-900"}>
              {message.content}
            </p>
            <img
              src={message.imageUrl}
              alt="Generated image"
              className="rounded-xl w-full h-auto"
            />
          </div>
        ) : (
          <p className={isUser ? "text-white" : "text-gray-900"}>
            {message.content}
          </p>
        )}
        <span
          className={`text-xs mt-2 block ${
            isUser ? "text-white/80" : "text-gray-500"
          }`}
        >
          {timestamp}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="text-gray-600 text-sm" />
        </div>
      )}
    </div>
  );
}
