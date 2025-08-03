import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Send, Image, Paperclip, Edit3 } from "lucide-react";
import type { FileAttachment } from "@shared/schema";

// Componente de popup informativo
function InfoPopup({ 
  message, 
  show, 
  onHide 
}: { 
  message: string; 
  show: boolean; 
  onHide: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
      <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium shadow-lg animate-fade-in">
        {message}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
      </div>
    </div>
  );
}

interface ChatInputProps {
  onSendMessage: (content: string, isImageRequest: boolean, attachments?: FileAttachment[], isImageEditMode?: boolean) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isImageMode, setIsImageMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [imageModeDialogOpen, setImageModeDialogOpen] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);
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

  // Show popups on component mount
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowImagePopup(true);
    }, 1000);

    const timer2 = setTimeout(() => {
      setShowAttachmentPopup(true);
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(message.trim(), isImageMode, attachments.length > 0 ? attachments : undefined, isEditMode);
      setMessage("");
      setIsImageMode(false);
      setIsEditMode(false);
      setAttachments([]);
    }
  };

  const handleFilesUploaded = (files: FileAttachment[]) => {
    setAttachments(prev => [...prev, ...files]);
    setUploadDialogOpen(false);
    
    // Check if any uploaded file is an image
    const hasNewImages = files.some(file => 
      file.type === 'image' || file.mimeType?.startsWith('image/')
    );
    
    if (hasNewImages) {
      // Show image mode selection dialog
      setImageModeDialogOpen(true);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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

  // Check if there are image attachments to show edit mode button
  const hasImageAttachments = attachments.some(att => 
    att.type === 'image' || att.mimeType?.startsWith('image/')
  );
  
  // Visual indicator of edit mode in textarea placeholder
  const getPlaceholder = () => {
    if (isImageMode) return "Descreva a imagem que você quer gerar...";
    if (hasImageAttachments && isEditMode) return "Descreva como editar a imagem (custará 1 QKoin)...";
    if (hasImageAttachments && !isEditMode) return "Faça uma pergunta sobre a imagem (grátis)...";
    return "Digite sua mensagem para a Qisa...";
  };

  return (
    <div className="bg-gradient-to-t from-background/85 via-background/75 to-background/70 border-t border-border/20 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-4 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={getPlaceholder()}
              className="resize-none border-input/50 bg-background/80 backdrop-blur-sm text-foreground rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 focus:bg-background shadow-lg max-h-32 min-h-[52px] placeholder:text-muted-foreground/70 transition-all duration-300"
              rows={1}
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <div className="absolute right-3 bottom-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <InfoPopup 
                    message="A Qisa também lê seus PDFs e imagens"
                    show={showAttachmentPopup}
                    onHide={() => setShowAttachmentPopup(false)}
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" aria-describedby="upload-dialog-description">
                <DialogHeader>
                  <DialogTitle>Anexar Arquivos</DialogTitle>
                  <div id="upload-dialog-description" className="text-sm text-muted-foreground mt-2">
                    Selecione arquivos para upload (imagens, PDFs, etc.)
                  </div>
                </DialogHeader>
                <FileUpload onFilesUploaded={handleFilesUploaded} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
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
            <InfoPopup 
              message="Teste e crie suas imagens"
              show={showImagePopup}
              onHide={() => setShowImagePopup(false)}
            />
          </div>

          <Button
            type="submit"
            disabled={(!message.trim() && attachments.length === 0) || isLoading}
            className="p-3.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="space-y-3 mt-3">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <span className="text-sm font-medium truncate max-w-32">
                    {attachment.originalName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Mode indicator for images */}
            {hasImageAttachments && (
              <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-xs">
                {isEditMode ? (
                  <span className="text-blue-600 font-medium">✏️ Modo: Editar Imagem (1 QKoin)</span>
                ) : (
                  <span className="text-green-600 font-medium">📖 Modo: Analisar Imagem (Grátis)</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageModeDialogOpen(true)}
                  className="h-5 px-2 text-xs hover:bg-muted"
                >
                  Trocar
                </Button>
              </div>
            )}
          </div>
        )}

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

        {/* Image Mode Selection Dialog */}
        <AlertDialog open={imageModeDialogOpen} onOpenChange={setImageModeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Escolha o modo para sua imagem</AlertDialogTitle>
              <AlertDialogDescription>
                Como você gostaria de processar a imagem anexada?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogAction
                onClick={() => {
                  setIsEditMode(false);
                  setImageModeDialogOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                📖 Analisar Imagem (Grátis)
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => {
                  setIsEditMode(true);
                  setImageModeDialogOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ✏️ Editar Imagem (1 QKoin)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
