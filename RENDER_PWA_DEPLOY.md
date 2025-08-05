# 🚀 Guia de Deploy PWA no Render

Este guia explica como fazer o deploy do projeto Qisa como uma Progressive Web App (PWA) no Render.

## 📋 Pré-requisitos

- Conta no GitHub (para conectar o repositório)
- Conta no Render.com
- Código do projeto no GitHub

## 🏗️ Processo de Build

### 1. Build Local (para testar)

```bash
# Execute o script de build para Render
./build-render.sh

# Ou execute manualmente:
vite build
cp client/manifest.webmanifest dist/public/
cp client/_redirects dist/public/
cp client/sw.js dist/public/
cp client/icon-*.png dist/public/
cp client/apple-touch-icon.png dist/public/
cp client/screenshot-*.png dist/public/
```

### 2. Estrutura de Arquivos Gerada

Após o build, a pasta `dist/public/` conterá:
```
dist/public/
├── index.html
├── manifest.webmanifest  ✨ PWA Manifest
├── sw.js                 ✨ Service Worker
├── _redirects           ✨ Configuração de rotas
├── icon-192x192.png     ✨ Ícones PWA
├── icon-512x512.png
├── apple-touch-icon.png
├── screenshot-mobile.png
├── screenshot-desktop.png
├── assets/              📁 CSS/JS compilados
└── ...outros arquivos estáticos
```

## 🌐 Deploy no Render

### 1. Criar Novo Static Site

1. Acesse [Render.com](https://render.com)
2. Clique em "New +" → "Static Site"
3. Conecte seu repositório GitHub

### 2. Configurações de Deploy

**Build Command:**
```bash
./build-render.sh
```

**Publish Directory:**
```
dist/public
```

**Environment Variables:**
```
NODE_VERSION=20
```

### 3. Configurações Avançadas

**Custom Headers (opcional):**
```
/*
  Cache-Control: public, max-age=31536000, immutable

/manifest.webmanifest
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=86400

/sw.js
  Cache-Control: no-cache
```

## ✨ Características PWA Configuradas

### 📱 Manifest (manifest.webmanifest)
- ✅ Nome e descrição em português
- ✅ Ícones 192x192 e 512x512
- ✅ Tema e cores personalizadas
- ✅ Screenshots para instalação
- ✅ Atalhos do aplicativo
- ✅ Modo standalone

### 🔧 Service Worker (sw.js)
- ✅ Cache estratégico por tipo de recurso
- ✅ Suporte offline para recursos estáticos
- ✅ Estratégia network-first para APIs
- ✅ Auto-limpeza de cache antigo

### 🛡️ Recursos PWA
- ✅ Botão de instalação automático
- ✅ Suporte offline básico
- ✅ Ícones adaptativos para diferentes dispositivos
- ✅ Splash screens personalizadas
- ✅ Roteamento client-side (_redirects)

## 🧪 Testando a PWA

### No Desktop (Chrome/Edge):
1. Acesse o site deployado
2. Procure por ícone "Instalar" na barra de endereços
3. Ou vá em Menu → "Instalar [Nome do App]"

### No Mobile (Android/iOS):
1. Acesse o site no navegador
2. Android: Menu → "Adicionar à tela inicial"
3. iOS: Compartilhar → "Adicionar à Tela de Início"

### Verificar PWA:
1. Chrome DevTools → Application → Manifest
2. Chrome DevTools → Application → Service Workers
3. Lighthouse audit para PWA score

## 🐛 Problemas Comuns

### PWA não aparece para instalação:
- ✅ Verifique se manifest.webmanifest está acessível
- ✅ Confirme que service worker está registrado
- ✅ Teste em HTTPS (Render fornece automaticamente)
- ✅ Verifique ícones 192x192 e 512x512

### Service Worker não carrega:
- ✅ Confirme que sw.js está na raiz
- ✅ Verifique console para erros
- ✅ Teste cache no DevTools → Application

### Roteamento não funciona:
- ✅ Confirme que _redirects foi copiado
- ✅ Teste navegação direta para rotas

## 🎯 Comandos Úteis

```bash
# Build local
./build-render.sh

# Testar build local
cd dist/public && python -m http.server 8000

# Ver tamanho do build
du -sh dist/public/

# Limpar build anterior
rm -rf dist/
```

## 🔗 Links Úteis

- [Render Static Sites Docs](https://render.com/docs/static-sites)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)

---

⚡ **Dica:** Após o deploy, teste a PWA em diferentes dispositivos para garantir que a instalação funciona corretamente!