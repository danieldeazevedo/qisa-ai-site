import { Button } from "@/components/ui/button";
import { Lightbulb, Image, HelpCircle, Code, BookOpen, Zap } from "lucide-react";

interface QuickRepliesProps {
  onReplySelect: (message: string) => void;
  context?: string; // Context from last AI message to generate contextual suggestions
}

export function QuickReplies({ onReplySelect, context }: QuickRepliesProps) {
  const getContextualSuggestions = () => {
    if (!context) return [];
    
    const lowerContext = context.toLowerCase();
    
    // Programming related
    if (lowerContext.includes('código') || lowerContext.includes('programação') || lowerContext.includes('javascript') || lowerContext.includes('python')) {
      return [
        "Pode me dar um exemplo prático?",
        "Como posso implementar isso?",
        "Quais são as melhores práticas?",
        "Me explique o erro mais comum"
      ];
    }
    
    // Creative/Image related
    if (lowerContext.includes('imagem') || lowerContext.includes('desenho') || lowerContext.includes('arte') || lowerContext.includes('criativo')) {
      return [
        "Gere uma imagem similar",
        "Mude o estilo para mais realista",
        "Adicione mais detalhes",
        "Faça uma versão cartoon"
      ];
    }
    
    // Learning/Educational
    if (lowerContext.includes('explicar') || lowerContext.includes('aprender') || lowerContext.includes('entender') || lowerContext.includes('conceito')) {
      return [
        "Pode dar mais exemplos?",
        "Simplifique a explicação",
        "Quais são os benefícios?",
        "Como posso praticar isso?"
      ];
    }
    
    // Problem solving
    if (lowerContext.includes('problema') || lowerContext.includes('erro') || lowerContext.includes('dificuldade') || lowerContext.includes('não funciona')) {
      return [
        "Como posso resolver isso?",
        "Quais são as alternativas?",
        "Me ajude a depurar",
        "Onde posso encontrar mais ajuda?"
      ];
    }
    
    return [];
  };

  const defaultSuggestions = [
    { icon: Lightbulb, text: "Me dê uma ideia criativa", category: "Criativo" },
    { icon: Image, text: "Gere uma imagem para mim", category: "Imagem" },
    { icon: HelpCircle, text: "Explique um conceito complexo", category: "Ajuda" },
    { icon: Code, text: "Ajude com programação", category: "Código" },
    { icon: BookOpen, text: "Me ensine algo novo", category: "Aprendizado" },
    { icon: Zap, text: "Resuma um tópico", category: "Resumo" }
  ];

  const contextualSuggestions = getContextualSuggestions();
  
  const allSuggestions = contextualSuggestions.length > 0 
    ? [
        ...contextualSuggestions.map(text => ({ text, contextual: true })),
        ...defaultSuggestions.slice(0, 2)
      ]
    : defaultSuggestions;

  return (
    <div className="mb-4 animate-slide-in">
      <div className="flex flex-wrap gap-2">
        {allSuggestions.slice(0, 6).map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onReplySelect(suggestion.text)}
            className={`text-sm transition-all duration-300 hover:scale-105 ${
              'contextual' in suggestion && suggestion.contextual
                ? 'border-primary/50 bg-primary/5 hover:bg-primary/10'
                : 'hover:border-primary/50'
            }`}
          >
            {'icon' in suggestion && (
              <suggestion.icon className="w-3 h-3 mr-1" />
            )}
            {suggestion.text}
            {'contextual' in suggestion && suggestion.contextual && (
              <span className="ml-1 text-xs text-primary">✨</span>
            )}
          </Button>
        ))}
      </div>
      {contextualSuggestions.length > 0 && (
        <p className="text-xs text-muted-foreground mt-2 ml-1">
          ✨ Sugestões baseadas na conversa
        </p>
      )}
    </div>
  );
}