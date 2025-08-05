import { Button } from "@/components/ui/button";
import { Lightbulb, Image, HelpCircle, Code, BookOpen, Zap } from "lucide-react";

interface QuickRepliesProps {
  onReplySelect: (message: string) => void;
  context?: string; // Context from last AI message to generate contextual suggestions
}

export function QuickReplies({ onReplySelect, context }: QuickRepliesProps) {
  const getContextualSuggestions = () => {
    if (!context || context.length < 20) return []; // Only show for substantial AI responses
    
    const lowerContext = context.toLowerCase();
    
    // Image generation related - only show when AI actually generated/talked about images
    if (lowerContext.includes('gerei') || lowerContext.includes('criei') || lowerContext.includes('gerando') || lowerContext.includes('criando uma imagem')) {
      return [
        "Gere uma imagem similar",
        "Mude o estilo para mais realista", 
        "Adicione mais detalhes",
        "Faça uma versão cartoon"
      ];
    }
    
    // Programming related
    if (lowerContext.includes('código') || lowerContext.includes('programação') || lowerContext.includes('javascript') || lowerContext.includes('python') || lowerContext.includes('function') || lowerContext.includes('algoritmo')) {
      return [
        "Pode me dar um exemplo prático?",
        "Como posso implementar isso?",
        "Quais são as melhores práticas?",
        "Me explique possíveis erros"
      ];
    }
    
    // Creative ideas (not image generation) - when AI gives creative suggestions
    if (lowerContext.includes('sugestões') || lowerContext.includes('ideias') || lowerContext.includes('criativo') || lowerContext.includes('inspiração')) {
      return [
        "Me dê mais ideias criativas",
        "Como posso ser mais criativo?",
        "Que outras opções existem?",
        "Inspire-me com algo diferente"
      ];
    }
    
    // Learning/Educational - when AI explains concepts
    if (lowerContext.includes('funciona') || lowerContext.includes('explicação') || lowerContext.includes('conceito') || lowerContext.includes('entender') || lowerContext.includes('resumo')) {
      return [
        "Pode dar mais exemplos?",
        "Simplifique a explicação",
        "Quais são os benefícios?",
        "Como posso praticar isso?"
      ];
    }
    
    // Problem solving - when AI helps with issues
    if (lowerContext.includes('solução') || lowerContext.includes('resolver') || lowerContext.includes('problema') || lowerContext.includes('erro') || lowerContext.includes('dificuldade')) {
      return [
        "Como posso resolver isso?",
        "Quais são as alternativas?",
        "Me ajude a implementar",
        "Onde posso encontrar mais ajuda?"
      ];
    }
    
    // AI/Technology explanations
    if (lowerContext.includes('inteligência artificial') || lowerContext.includes('machine learning') || lowerContext.includes('dados') || lowerContext.includes('algoritmo')) {
      return [
        "Pode dar exemplos práticos?",
        "Como isso afeta o dia a dia?",
        "Quais são as limitações?",
        "Me explique mais sobre isso"
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
        // Add a couple general suggestions only if we have contextual ones
        { icon: Lightbulb, text: "Me dê uma ideia criativa", category: "Criativo" },
        { icon: HelpCircle, text: "Explique algo diferente", category: "Ajuda" }
      ]
    : []; // Don't show default suggestions if no context

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