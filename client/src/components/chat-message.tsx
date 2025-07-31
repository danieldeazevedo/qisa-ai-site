import { Message } from "@shared/schema";
import { Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

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
    <div className={`flex items-start space-x-3 mb-6 animate-fade-in ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in">
          <Bot className="text-white text-sm" />
        </div>
      )}
      
      <div
        className={`max-w-md px-4 py-3 rounded-2xl animate-slide-in transition-all duration-300 ${
          isUser
            ? "bg-gradient-to-r from-primary to-secondary text-white rounded-tr-md shadow-lg"
            : "bg-card shadow-sm border border-border rounded-tl-md hover:shadow-md"
        }`}
      >
        {message.imageUrl ? (
          <div className="space-y-3">
            <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert text-white" : "text-foreground"}`}>
              <ReactMarkdown 
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <img
              src={message.imageUrl}
              alt="Generated image"
              className="rounded-xl w-full h-auto transition-transform duration-300 hover:scale-105"
            />
          </div>
        ) : (
          <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert text-white" : "text-foreground"}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <span
          className={`text-xs mt-2 block transition-opacity duration-300 ${
            isUser ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {timestamp}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in">
          <User className="text-muted-foreground text-sm" />
        </div>
      )}
    </div>
  );
}
