# Deploy do Qisa na Vercel - Guia Completo

Este guia mostra como fazer deploy da aplicação Qisa na Vercel, incluindo configuração do banco Redis e variáveis de ambiente.

## Pré-requisitos

- Conta no GitHub
- Conta na Vercel
- Conta no Upstash (Redis)
- Chave da API do Google Gemini

## Passo 1: Preparar o Repositório

### 1.1 Criar repositório no GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/qisa.git
git push -u origin main
```

### 1.2 Ajustar estrutura para Vercel
A aplicação precisa de pequenos ajustes para funcionar na Vercel:

1. **Criar arquivo `vercel.json`** na raiz do projeto:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/public"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. **Atualizar `package.json`** para incluir script de build:
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && tsc",
    "vercel-build": "npm run build"
  }
}
```

## Passo 2: Configurar Redis (Upstash)

### 2.1 Criar banco Redis
1. Acesse [Upstash Console](https://console.upstash.com/)
2. Clique em **"Create Database"**
3. Escolha:
   - **Name**: `qisa-redis`
   - **Region**: Mais próxima dos usuários
   - **Type**: Free tier
4. Clique em **"Create"**

### 2.2 Copiar credenciais
Na dashboard do banco criado, copie:
- **UPSTASH_REDIS_REST_URL**
- **UPSTASH_REDIS_REST_TOKEN**

## Passo 3: Obter Chave do Google Gemini

### 3.1 Acessar Google AI Studio
1. Vá para [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada

## Passo 4: Deploy na Vercel

### 4.1 Conectar repositório
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"New Project"**
3. Conecte sua conta GitHub
4. Selecione o repositório `qisa`
5. Clique em **"Import"**

### 4.2 Configurar projeto
**CONFIGURAÇÕES IMPORTANTES:**

#### Root Directory: 
- **Deixe VAZIO** ou coloque apenas `.` (ponto)

#### Framework Preset: 
- **Other**

#### Build and Output Settings:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4.3 Variáveis de ambiente
Na seção **"Environment Variables"**, adicione:

```env
# Redis (Upstash) - OBRIGATÓRIO
UPSTASH_REDIS_REST_URL=https://sua_url.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui

# Google Gemini - OBRIGATÓRIO  
GEMINI_API_KEY=sua_chave_gemini_aqui

# Ambiente
NODE_ENV=production
```

**⚠️ IMPORTANTE**: As variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` são obrigatórias para login e chat funcionarem.

### 4.4 Finalizar deploy
1. Clique em **"Deploy"**
2. Aguarde o build completar (3-5 minutos)
3. Sua aplicação estará disponível em `https://seu-projeto.vercel.app`

## ⚠️ TROUBLESHOOTING - Login e Chat não funcionam

### Problema: "Login não funciona" ou "Chat sem resposta"

**CAUSA PRINCIPAL**: Variáveis de ambiente Redis não configuradas

### ✅ SOLUÇÃO:
1. Na Vercel, vá em **Settings → Environment Variables**
2. **OBRIGATORIAMENTE** adicione:
```env
UPSTASH_REDIS_REST_URL=https://sua_url.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu_token_aqui
GEMINI_API_KEY=sua_chave_gemini
NODE_ENV=production
```

3. **REDEPLOY** após adicionar as variáveis:
   - Vá em **Deployments**
   - Clique nos **3 pontos** no último deploy
   - Clique em **"Redeploy"**

### Verificar se funcionou:
- Acesse `https://seu-app.vercel.app/api/health`
- Deve retornar: `{"status":"ok",...}`

### Se ainda não funcionar:
1. **Verifique logs**: Vercel Dashboard → Functions → Ver erros
2. **Teste Redis**: No Upstash Console, teste conexão
3. **Teste Gemini**: Verificar se API key é válida

**DICA**: O sistema funciona perfeitamente no Replit, os problemas na Vercel são sempre de configuração de variáveis.

### Erro: "Function Runtimes must have a valid version"

Se você receber este erro, significa que o `vercel.json` tem configuração de runtime inválida.

**SOLUÇÃO**: O arquivo `vercel.json` foi corrigido para usar `@vercel/node` em vez de runtime específico.

**Se ainda der erro**:
1. **Delete** o arquivo `vercel.json` temporariamente
2. **Refaça o deploy** sem o arquivo
3. **Adicione** o `vercel.json` de volta depois

**Configuração alternativa** (caso necessário):
- **Framework Preset**: `Other`
- **Build Command**: `npm run build`  
- **Output Directory**: `dist`
- **Root Directory**: `.` (ou vazio)

## Passo 5: Configurações Pós-Deploy

### 5.1 Configurar domínio personalizado (opcional)
1. Na dashboard do projeto na Vercel
2. Vá em **"Settings" > "Domains"**
3. Adicione seu domínio personalizado
4. Configure DNS conforme instruções

### 5.2 Monitoramento
1. Acesse **"Functions"** para ver logs do servidor
2. Use **"Analytics"** para métricas de uso
3. Configure **"Integrations"** se necessário

## Passo 6: Atualizações Futuras

### 6.1 Deploy automático
Todo push na branch `main` fará deploy automático na Vercel.

### 6.2 Deploy manual
```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

### 6.3 Rollback
Na dashboard da Vercel:
1. Vá em **"Deployments"**
2. Encontre a versão anterior
3. Clique em **"Promote to Production"**

## Estrutura de Arquivos para Vercel

```
qisa/
├── client/                 # Frontend React
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Backend Express
│   ├── index.ts
│   ├── routes.ts
│   └── services/
├── shared/                 # Tipos compartilhados
│   └── schema.ts
├── package.json           # Root package.json
├── vercel.json           # Configuração Vercel
└── VERCEL_DEPLOY.md      # Este arquivo
```

## Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Confirme se os scripts de build estão corretos
- Veja logs na aba **"Functions"**

### Erro de Conexão Redis
- Verifique se as variáveis `REDIS_URL` e `UPSTASH_REDIS_REST_TOKEN` estão corretas
- Teste conexão no painel do Upstash

### Erro 404 nas rotas da API
- Confirme se o `vercel.json` está configurado corretamente
- Verifique se as rotas começam com `/api/`

### Performance
- Use **Vercel Analytics** para monitorar
- Configure **Edge Functions** se necessário
- Otimize imagens com **Vercel Image Optimization**

## Custos

### Vercel
- **Hobby Plan**: Gratuito
  - 100GB de bandwidth
  - Domínios ilimitados
  - HTTPS automático

### Upstash Redis
- **Free Tier**: Gratuito
  - 10.000 comandos/dia
  - 256MB de storage
  - 1 banco de dados

### Google Gemini
- Consulte preços atuais na [documentação oficial](https://ai.google.dev/pricing)

## Suporte

Para problemas específicos:
- **Vercel**: [Documentação](https://vercel.com/docs)
- **Upstash**: [Documentação](https://docs.upstash.com/)
- **Google Gemini**: [Documentação](https://ai.google.dev/docs)

---

**Nota**: Este guia assume a estrutura atual do projeto Qisa. Ajuste conforme necessário para seu caso específico.