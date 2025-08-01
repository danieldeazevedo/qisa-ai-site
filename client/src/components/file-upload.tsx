import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { FileAttachment } from "@shared/schema";

interface FileUploadProps {
  onFilesUploaded: (files: FileAttachment[]) => void;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({ onFilesUploaded, maxFiles = 5, className = "" }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const isAuthenticated = user?.username && !user.username.includes('anonymous');

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles).filter(file => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type.startsWith('image/') || 
                         file.type.startsWith('text/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (!isValidType) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name}: Apenas PDFs, imagens e arquivos de texto são permitidos`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!isValidSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name}: Tamanho máximo de 10MB`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Muitos arquivos",
        description: `Máximo de ${maxFiles} arquivos permitidos`,
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para fazer upload de arquivos",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('📁 Starting upload with files:', files);
      
      const formData = new FormData();
      files.forEach((file, index) => {
        console.log(`📁 Adding file ${index}:`, file.name, file.type, file.size);
        formData.append('files', file);
      });

      console.log('📁 FormData created, sending request...');
      
      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          'x-username': user!.username,
        },
        body: formData,
      });

      console.log('📁 Response received:', response.status);

      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(result.files);
        onFilesUploaded(result.files);
        setFiles([]);
        
        toast({
          title: "Upload concluído",
          description: result.message,
        });
      } else {
        throw new Error(result.error || "Erro no upload");
      }
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível fazer upload dos arquivos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Faça login para fazer upload de arquivos</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          Arrastar arquivos aqui ou clique para selecionar
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Suporte a PDFs, imagens e arquivos de texto (máximo 10MB cada)
        </p>
        
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Selecionar Arquivos
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/*,text/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Arquivos Selecionados ({files.length}/{maxFiles})</h3>
          <ScrollArea className="max-h-40">
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <Button 
            onClick={uploadFiles} 
            disabled={uploading || files.length === 0}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fazendo Upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload ({files.length} arquivo{files.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fazendo upload...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Arquivos Processados
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                {file.type === 'pdf' ? (
                  <FileText className="w-5 h-5 text-red-500" />
                ) : (
                  <Image className="w-5 h-5 text-blue-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type.toUpperCase()}
                  </p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}