import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string, isImageRequest: boolean) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isImageMode, setIsImageMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quickActions = [
    "Explicar IA",
    "Gerar logo",
    "Ajuda",
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim(), isImageMode);
      setMessage("");
      setIsImageMode(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const prompts: Record<string, string> = {
      "Explicar IA": "Pode me explicar como funciona a inteligência artificial?",
      "Gerar logo": "Gere uma imagem de um logo moderno para uma empresa de tecnologia",
      "Ajuda": "Como posso usar melhor seus recursos?",
    };
    
    const prompt = prompts[action] || action;
    const isImage = action.includes("Gerar") || action.includes("logo");
    onSendMessage(prompt, isImage);
  };

  return (
    <div className="bg-background border-t border-border px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isImageMode
                  ? "Descreva a imagem que você quer gerar..."
                  : "Digite sua mensagem para a Qisa..."
              }
              className="resize-none border-input bg-background text-foreground rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent max-h-32 min-h-[48px] placeholder:text-muted-foreground"
              rows={1}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-3 bottom-3 p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsImageMode(!isImageMode)}
            className={`p-3 border-input rounded-2xl transition-all ${
              isImageMode
                ? "bg-secondary/10 text-secondary border-secondary"
                : "text-muted-foreground hover:text-secondary hover:bg-secondary/10"
            }`}
          >
            <Image className="w-4 h-4" />
          </Button>

          <Button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction(action)}
              className="px-3 py-1.5 text-sm text-foreground bg-muted rounded-full hover:bg-muted/80 transition-colors"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
