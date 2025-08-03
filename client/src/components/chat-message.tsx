import { Message } from "@shared/schema";
import { Bot, User, Volume2, VolumeX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useTypewriter } from "@/hooks/use-typewriter";
import { useVoice } from "@/hooks/use-voice";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean; // To identify if this is the latest AI message for typewriter effect
}

export function ChatMessage({ message, isLatest = false }: ChatMessageProps) {
  const isUser = message.role === "user";
  const timestamp = formatDistanceToNow(message.createdAt ? new Date(message.createdAt) : new Date(), {
    addSuffix: true,
    locale: ptBR,
  });

  // Apply typewriter effect only to the latest AI message
  const shouldAnimate = !isUser && isLatest;
  const { displayedText, isComplete, isAnimating } = useTypewriter({
    text: message.content,
    enabled: shouldAnimate,
    messageId: message.id // Track message changes
  });

  // Use typewriter text if animating, otherwise use full content
  const contentToDisplay = shouldAnimate ? displayedText : message.content;

  // Voice functionality for AI messages
  const { speak, stopSpeaking, isSpeaking, isSupported: voiceSupported } = useVoice();

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(message.content);
    }
  };

  return (
    <div className={`flex items-start space-x-3 mb-6 animate-fade-in ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in">
          <Bot className="text-white text-sm" />
        </div>
      )}
      
      <div
        className={`max-w-md px-4 py-3 rounded-2xl animate-slide-in transition-all duration-300 relative group ${
          isUser
            ? "bg-gradient-to-r from-primary to-secondary text-white rounded-tr-md shadow-lg"
            : "bg-card shadow-sm border border-border rounded-tl-md hover:shadow-md"
        }`}
      >
        {/* Text-to-Speech Button for AI messages */}
        {!isUser && voiceSupported && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpeak}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 hover:bg-muted"
          >
            {isSpeaking ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </Button>
        )}
        {message.imageUrl ? (
          <div className="space-y-3">
            <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert text-white" : "text-foreground"}`}>
              <ReactMarkdown 
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {contentToDisplay}
              </ReactMarkdown>
              {shouldAnimate && isAnimating && (
                <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
              )}
            </div>
            {/* Only show image when text animation is complete or not animating */}
            {(!shouldAnimate || isComplete) && (
              <img
                src={message.imageUrl}
                alt="Generated image"
                className="rounded-xl w-full h-auto transition-transform duration-300 hover:scale-105 animate-fade-in"
              />
            )}
          </div>
        ) : (
          <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert text-white" : "text-foreground"}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {contentToDisplay}
            </ReactMarkdown>
            {shouldAnimate && isAnimating && (
              <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
            )}
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
