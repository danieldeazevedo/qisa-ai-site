# Qisa - Chatbot AI

Um chatbot inteligente baseado em IA com integração ao Google Gemini, funcionalidades de conversação natural e geração de imagens.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **UI**: Tailwind CSS + Shadcn/ui
- **Banco de Dados**: Redis (com fallback para memória)
- **IA**: Google Gemini API
- **Build**: ESBuild + Vite

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)
- Uma conta no [Google AI Studio](https://aistudio.google.com/) para obter a API key do Gemini

## 🛠️ Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd qisa-chatbot
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
touch .env
```

Adicione as seguintes variáveis no arquivo `.env`:

```env
# API Key do Google Gemini
GEMINI_API_KEY=sua_api_key_aqui

# Configurações do Banco de Dados (opcional - usa fallback em memória se não configurado)
DATABASE_URL=postgresql://user:password@localhost:5432/qisa
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=qisa
```

### 4. Obtenha a API Key do Google Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Faça login com sua conta Google
3. Clique em "Get API Key"
4. Crie uma nova API key
5. Copie a chave e adicione no arquivo `.env`

## 🏃‍♂️ Como Executar

### Desenvolvimento

Para executar a aplicação em modo de desenvolvimento:

```bash
npm run dev
```

Este comando irá:
- Iniciar o servidor backend na porta 5000
- Iniciar o servidor de desenvolvimento do Vite
- Abrir automaticamente no navegador

### Outros comandos úteis

```bash
# Compilar TypeScript para verificar erros
npm run build

# Executar apenas o servidor backend
npm run server

# Executar apenas o frontend
npm run client

# Limpar cache e reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

## 🗄️ Configuração do Banco de Dados (Opcional)

### Usando PostgreSQL

Se você quiser usar PostgreSQL em vez do fallback em memória:

```bash
# Instalar PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar o serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco de dados
sudo -u postgres createdb qisa

# Executar migrações
npm run db:push
```

### Usando Redis (Opcional)

Para melhor performance com Redis:

```bash
# Instalar Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Iniciar o serviço
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Testar conexão
redis-cli ping
```

## 🎯 Funcionalidades

- ✅ **Chat em tempo real** com IA Gemini
- ✅ **Geração de imagens** através de comandos de texto
- ✅ **Histórico de conversas** persistente
- ✅ **Chats pessoais** por navegador (sem necessidade de login)
- ✅ **Interface responsiva** e moderna
- ✅ **Exportar histórico** de conversas
- ✅ **Sistema de fallback** para funcionamento offline

## 🖥️ Desenvolvimento no VS Code

### Extensões Recomendadas

Instale estas extensões no VS Code para melhor experiência:

```bash
# Abrir VS Code e instalar extensões
code .
```

Extensões essenciais:
- **TypeScript and JavaScript Language Features** (nativo)
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Auto Rename Tag**
- **Bracket Pair Colorizer**
- **GitLens**

### Configuração do VS Code

Crie `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 📁 Estrutura do Projeto

```
qisa-chatbot/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários
│   │   ├── pages/          # Páginas da aplicação
│   │   └── main.tsx        # Entrada da aplicação
│   └── index.html
├── server/                 # Backend Express
│   ├── services/           # Serviços (Gemini AI)
│   ├── routes.ts           # Rotas da API
│   ├── storage.ts          # Camada de dados
│   └── index.ts            # Servidor principal
├── shared/                 # Tipos e schemas compartilhados
│   └── schema.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia aplicação completa
npm run server          # Apenas backend
npm run client          # Apenas frontend

# Build
npm run build           # Compila aplicação para produção
npm run build:server    # Compila apenas backend
npm run build:client    # Compila apenas frontend

# Banco de Dados
npm run db:push         # Aplica mudanças no schema
npm run db:generate     # Gera migrações

# Utils
npm run clean           # Limpa arquivos de build
npm run type-check      # Verifica tipos TypeScript
```

## 🚀 Deploy

### Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em:
- Backend: `dist/index.js`
- Frontend: `dist/public/`

### Variáveis de Ambiente em Produção

Certifique-se de configurar:

```env
NODE_ENV=production
GEMINI_API_KEY=sua_api_key_de_producao
DATABASE_URL=sua_url_de_banco_de_producao
```

## 🐛 Solução de Problemas

### Problemas Comuns

**Erro: "GEMINI_API_KEY is not defined"**
```bash
# Verifique se a API key está no .env
echo $GEMINI_API_KEY
# Reinicie o servidor após adicionar a key
```

**Erro: "Port 5000 already in use"**
```bash
# Mate processos na porta 5000
lsof -ti:5000 | xargs kill -9
# Ou use outra porta
PORT=3001 npm run dev
```

**Problemas de conexão com banco**
```bash
# A aplicação funciona sem banco (usa fallback em memória)
# Para forçar uso apenas em memória, remova DATABASE_URL do .env
```

## 📝 Logs e Debug

```bash
# Ver logs do servidor em tempo real
npm run dev | grep express

# Debug do frontend
# Abra DevTools do navegador (F12)

# Debug do backend
# Adicione console.log() nos arquivos server/
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação do [Google Gemini API](https://ai.google.dev/docs)
- Verifique os logs no console do navegador e terminal

---

**Desenvolvido com ❤️ usando React, Node.js e Google Gemini AI**