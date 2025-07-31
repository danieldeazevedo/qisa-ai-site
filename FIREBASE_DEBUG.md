# 🔍 Debug Firebase Authentication

## Status dos Logs

O Firebase está inicializando corretamente:
```
Initializing Firebase with config...
Firebase config project ID: qisaauth
Firebase initialized successfully
```

## Próximos Passos para Debug

1. **Verificar Domínio Autorizado**
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Vá em Authentication > Settings > Authorized domains
   - Adicione o domínio atual: `[seu-projeto].replit.dev`

2. **Verificar Console do Navegador**
   - Pressione F12
   - Clique em "Login com Google"
   - Veja se aparecem erros no console

3. **Erros Comuns**
   - `auth/unauthorized-domain`: Domínio não autorizado
   - `auth/invalid-api-key`: API key incorreta
   - `auth/configuration-not-found`: Projeto não configurado

## Comandos de Teste

Se ainda não funcionar, teste no console do navegador:
```javascript
// Verificar se Firebase está carregado
console.log('Firebase auth:', window.firebase);

// Testar configuração
console.log('Auth object:', firebase.auth());
```