import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageCircle, Clock, Bot, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Message } from "@shared/schema";

interface SearchResult extends Message {
  sessionTitle?: string;
}

interface ChatSearchProps {
  onMessageClick?: (sessionId: string, messageId: string) => void;
}

export function ChatSearch({ onMessageClick }: ChatSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['/api/chat/search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      const response = await fetch(`/api/chat/search?query=${encodeURIComponent(debouncedQuery)}`, {
        headers: {
          'x-username': localStorage.getItem('username') || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar no histórico');
      }
      
      return response.json() as SearchResult[];
    },
    enabled: debouncedQuery.length > 0,
  });

  const handleMessageClick = (result: SearchResult) => {
    if (onMessageClick) {
      onMessageClick(result.sessionId, result.id);
    }
    setIsOpen(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg hover:bg-muted"
          data-testid="button-search-history"
        >
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh]" data-testid="dialog-search">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar no Histórico
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Digite sua busca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-query"
            />
          </div>
          
          <ScrollArea className="h-96">
            {isLoading && searchQuery && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            
            {!searchQuery && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Busque em todas suas conversas</p>
                <p className="text-sm">Digite uma palavra ou frase para encontrar mensagens</p>
              </div>
            )}
            
            {searchQuery && !isLoading && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm">Tente usar palavras-chave diferentes</p>
              </div>
            )}
            
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleMessageClick(result)}
                  data-testid={`search-result-${result.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {result.role === 'user' ? (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {result.role === 'user' ? 'Você' : 'Qisa'}
                          </span>
                          {result.sessionTitle && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground truncate">
                                {result.sessionTitle}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(result.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground line-clamp-2">
                        {highlightText(result.content, searchQuery)}
                      </p>
                      
                      {result.imageUrl && (
                        <div className="mt-2">
                          <img
                            src={result.imageUrl}
                            alt="Imagem da mensagem"
                            className="max-w-32 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {searchResults.length > 0 && (
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}