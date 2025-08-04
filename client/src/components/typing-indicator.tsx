import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 mb-6 animate-fade-in">
      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in">
        <Bot className="text-white text-sm" />
      </div>
      
      <div className="bg-card shadow-sm border border-border rounded-2xl rounded-tl-md px-4 py-3 hover:shadow-md transition-all duration-300">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-muted-foreground">Qisa está digitando</span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}