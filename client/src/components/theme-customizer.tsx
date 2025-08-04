import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useThemeCustomization, type CustomTheme } from "@/hooks/use-theme-customization";
import { Palette, Plus, Trash2, Download, Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ThemeCustomizer() {
  const { 
    customThemes, 
    currentThemeId, 
    getCurrentTheme,
    setCurrentTheme, 
    saveTheme, 
    deleteTheme 
  } = useThemeCustomization();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const { toast } = useToast();

  const [newTheme, setNewTheme] = useState<CustomTheme>({
    id: '',
    name: '',
    colors: {
      primary: '262.1 83.3% 57.8%',
      secondary: '210 40% 98%',
      accent: '210 40% 98%',
      background: '0 0% 100%',
      surface: '210 40% 98%',
      text: '222.2 84% 4.9%',
      muted: '210 40% 98%'
    },
    gradients: {
      chat: 'from-blue-500 via-purple-500 to-pink-500',
      hero: 'from-primary to-secondary',
      background: 'from-blue-50 via-purple-50 to-pink-50'
    }
  });

  const startCreating = () => {
    setNewTheme({
      id: '',
      name: '',
      colors: { ...getCurrentTheme().colors },
      gradients: { ...getCurrentTheme().gradients }
    });
    setEditingTheme(null);
    setIsCreating(true);
  };

  const startEditing = (theme: CustomTheme) => {
    setNewTheme({ ...theme });
    setEditingTheme(theme);
    setIsCreating(true);
  };

  const saveNewTheme = () => {
    if (!newTheme.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, digite um nome para o tema.",
        variant: "destructive"
      });
      return;
    }

    const themeId = editingTheme?.id || newTheme.name.toLowerCase().replace(/\s+/g, '-');
    const themeToSave = { ...newTheme, id: themeId };
    
    saveTheme(themeToSave);
    setCurrentTheme(themeId);
    setIsCreating(false);
    
    toast({
      title: editingTheme ? "Tema atualizado" : "Tema criado",
      description: `O tema "${newTheme.name}" foi ${editingTheme ? 'atualizado' : 'criado'} com sucesso.`
    });
  };

  const exportTheme = (theme: CustomTheme) => {
    const dataStr = JSON.stringify(theme, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `qisa-theme-${theme.id}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Tema exportado",
      description: `O tema "${theme.name}" foi exportado com sucesso.`
    });
  };

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as CustomTheme;
        imported.id = imported.name.toLowerCase().replace(/\s+/g, '-');
        saveTheme(imported);
        toast({
          title: "Tema importado",
          description: `O tema "${imported.name}" foi importado com sucesso.`
        });
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Arquivo de tema inválido.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const presetColors = [
    { name: 'Azul', value: '220 100% 50%' },
    { name: 'Verde', value: '120 100% 40%' },
    { name: 'Vermelho', value: '0 100% 50%' },
    { name: 'Roxo', value: '270 100% 50%' },
    { name: 'Rosa', value: '330 100% 60%' },
    { name: 'Laranja', value: '30 100% 50%' },
    { name: 'Ciano', value: '180 100% 50%' },
    { name: 'Amarelo', value: '60 100% 50%' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          Temas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalização de Temas</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Galeria de Temas</TabsTrigger>
            <TabsTrigger value="create">Criar/Editar Tema</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gallery" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Temas Disponíveis</h3>
              <div className="flex gap-2">
                <Button onClick={startCreating} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Novo Tema
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importTheme}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button size="sm" variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Importar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    currentThemeId === theme.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setCurrentTheme(theme.id)}
                >
                  {currentThemeId === theme.id && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{theme.name}</h4>
                      {!['default', 'ocean', 'sunset', 'forest', 'lavender', 'midnight'].includes(theme.id) && (
                        <Badge variant="secondary" className="text-xs">Personalizado</Badge>
                      )}
                    </div>
                    
                    <div className="flex space-x-1">
                      {Object.entries(theme.colors).slice(0, 5).map(([key, value]) => (
                        <div
                          key={key}
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                      ))}
                    </div>
                    
                    <div 
                      className={`h-8 rounded bg-gradient-to-r ${theme.gradients.chat}`}
                    />
                    
                    <div className="flex justify-between">
                      <div className="flex gap-1">
                        {!['default', 'ocean', 'sunset', 'forest', 'lavender', 'midnight'].includes(theme.id) && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(theme);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTheme(theme.id);
                              }}
                              className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportTheme(theme);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="space-y-6">
            {!isCreating ? (
              <div className="text-center py-8">
                <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Selecione "Novo Tema" para começar a criar</p>
                <Button onClick={startCreating} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Novo Tema
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="theme-name">Nome do Tema</Label>
                  <Input
                    id="theme-name"
                    value={newTheme.name}
                    onChange={(e) => setNewTheme({ ...newTheme, name: e.target.value })}
                    placeholder="Digite o nome do tema"
                  />
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Cores</h4>
                  {Object.entries(newTheme.colors).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-4 items-center gap-4">
                      <Label className="capitalize">{key === 'primary' ? 'Principal' : key === 'secondary' ? 'Secundária' : key === 'accent' ? 'Destaque' : key === 'background' ? 'Fundo' : key === 'surface' ? 'Superfície' : key === 'text' ? 'Texto' : 'Fosco'}</Label>
                      <div className="col-span-2">
                        <Input
                          value={value}
                          onChange={(e) => setNewTheme({
                            ...newTheme,
                            colors: { ...newTheme.colors, [key]: e.target.value }
                          })}
                          placeholder="000 0% 0%"
                        />
                      </div>
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: `hsl(${value})` }}
                      />
                    </div>
                  ))}
                  
                  <div className="space-y-2">
                    <Label>Cores Pré-definidas</Label>
                    <div className="flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={color.name}
                          className="w-8 h-8 rounded border-2 border-transparent hover:border-primary"
                          style={{ backgroundColor: `hsl(${color.value})` }}
                          onClick={() => setNewTheme({
                            ...newTheme,
                            colors: { ...newTheme.colors, primary: color.value }
                          })}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Gradientes</h4>
                  {Object.entries(newTheme.gradients).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">
                        {key === 'chat' ? 'Chat' : key === 'hero' ? 'Herói' : 'Fundo'}
                      </Label>
                      <Input
                        value={value}
                        onChange={(e) => setNewTheme({
                          ...newTheme,
                          gradients: { ...newTheme.gradients, [key]: e.target.value }
                        })}
                        placeholder="from-blue-500 to-purple-500"
                      />
                      <div className={`h-8 rounded bg-gradient-to-r ${value}`} />
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={saveNewTheme}>
                    {editingTheme ? 'Atualizar Tema' : 'Salvar Tema'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}