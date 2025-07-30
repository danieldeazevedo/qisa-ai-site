# 🔐 Configuração do Firebase para Qisa

Este documento explica como configurar a autenticação Google com Firebase na aplicação Qisa.

## 📋 Pré-requisitos

- Conta Google
- Acesso ao [Firebase Console](https://console.firebase.google.com/)
- Acesso ao Redis Upstash (ou use Redis local)

## 🚀 Passo a Passo

### 1. Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar um projeto"
3. Digite um nome para o projeto (ex: "qisa-chatbot")
4. Aceite os termos e continue
5. Desabilite Google Analytics (opcional)

### 2. Configurar Autenticação

1. No painel do Firebase, vá em **Authentication**
2. Clique em "Começar"
3. Na aba **Sign-in method**, clique em "Google"
4. Ative o Google Sign-in
5. Escolha um email de suporte
6. Clique em "Salvar"

### 3. Adicionar App Web

1. No painel principal, clique no ícone Web (`</>`)
2. Digite um nome para o app (ex: "qisa-web")
3. **NÃO** marque "Firebase Hosting"
4. Clique em "Registrar app"

### 4. Obter Credenciais

Na tela de configuração, você verá algo como:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  appId: "1:123456789:web:abc123"
};
```

**Copie os valores:**
- `apiKey` → `VITE_FIREBASE_API_KEY`
- `projectId` → `VITE_FIREBASE_PROJECT_ID`
- `appId` → `VITE_FIREBASE_APP_ID`

### 5. Configurar Domínios Autorizados

1. Volte para **Authentication > Settings**
2. Na seção **Authorized domains**, adicione:
   - `seu-repl-name.replit.dev` (seu domínio do Replit)
   - `localhost` (para desenvolvimento local)

### 6. Configurar Variáveis de Ambiente

No Replit, adicione as seguintes **Secrets**:

```
VITE_FIREBASE_API_KEY=AIzaSyB...
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
REDIS_URL=redis://default:senha@host:porta (Redis Upstash URL)
```

### 7. Testar a Aplicação

1. Reinicie o servidor
2. Acesse a página inicial
3. Clique em "Login com Google"
4. Faça login com sua conta Google
5. Você será redirecionado de volta para a aplicação logado

## ⚠️ Solução de Problemas

### Erro: "Firebase não configurado"
- Verifique se as 3 variáveis Firebase estão definidas corretamente

### Erro: "auth/invalid-api-key"
- Verifique se `VITE_FIREBASE_API_KEY` está correto
- Confirme que o projeto Firebase está ativo

### Erro: "auth/unauthorized-domain"
- Adicione o domínio atual aos domínios autorizados no Firebase Console

### Erro: "Redis unavailable"
- Configure `REDIS_URL` com sua URL do Redis Upstash
- Ou use Redis local: `redis://127.0.0.1:6379`

## 📊 Redis Upstash

Para usar Redis Upstash:

1. Acesse [upstash.com](https://upstash.com/)
2. Crie uma conta gratuita
3. Crie um novo banco Redis
4. Copie a "Redis URL" para a variável `REDIS_URL`

## 🎯 Funcionalidades

Com Firebase configurado:
- ✅ Login/logout com Google
- ✅ Chat seguro por usuário
- ✅ Histórico persistente no Redis
- ✅ Perfil do usuário na interface
- ✅ Sincronização Firebase → Redis

Sem Firebase:
- ✅ Chat anônimo funcional
- ✅ Histórico por sessão do navegador
- ✅ Todas as funcionalidades de IA

## 🔧 Desenvolvimento

A aplicação funciona em ambos os modos:
- **Com Firebase**: Autenticação completa
- **Sem Firebase**: Chat anônimo funcional

Isso permite desenvolvimento flexível e demonstrações fáceis.