# Configuração Google OAuth para Prometheus AI

## 📋 Passo a Passo

### 1. Acessar Google Cloud Console
- Vá para: https://console.cloud.google.com/
- Faça login com sua conta Google

### 2. Criar Novo Projeto
- Clique no seletor de projetos (topo)
- "NOVO PROJETO"
- Nome: "Prometheus AI"
- Criar

### 3. Ativar APIs Necessárias
- No menu: "APIs e Serviços" → "Biblioteca"
- Procure e ative: "Google+ API" ou "People API"
- Procure e ative: "Google Identity Toolkit API"

### 4. Criar Credenciais OAuth
- "APIs e Serviços" → "Tela de consentimento OAuth"
- **User Type**: Externo
- **Nome do aplicativo**: Prometheus AI
- **Email de suporte**: seu-email@gmail.com
- Preencha informações básicas
- Salve e continue

### 5. Criar Client ID
- "APIs e Serviços" → "Credenciais"
- "+ CRIAR CREDENCIAIS" → "ID do cliente OAuth"
- **Tipo de aplicativo**: Aplicativo da Web
- **Nome**: Prometheus AI Web
- **URIs de redirecionamento autorizados**:
  ```
  http://localhost:3000/api/auth/callback/google
  ```
- **Origens JavaScript autorizadas**:
  ```
  http://localhost:3000
  ```
- Criar

### 6. Obter Credenciais
- Copie o **Client ID**
- Copie o **Client Secret**
- Adicione ao arquivo `.env.local`:

```bash
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu-secret-unico-aqui
```

### 7. Reiniciar Servidor
```bash
npm run dev
```

## 🔧 Variáveis de Ambiente

### .env.local
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdef123456
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=sua-chave-secreta-aqui
```

### Gerar NEXTAUTH_SECRET
```bash
# No terminal:
openssl rand -base64 32
```

## 🚀 Testar

1. Acesse: http://localhost:3000/login
2. Clique no logo Google
3. Autorize o acesso
4. Se redirecionado para o dashboard → sucesso!

## ⚠️ Erros Comuns

### 401: invalid_client
- Client ID incorreto
- Client Secret incorreto
- URI de redirecionamento não configurada

### redirect_uri_mismatch
- Verifique se `http://localhost:3000/api/auth/callback/google` está exatamente igual no Google Console

### access_denied
- Usuário negou acesso
- Tente novamente e autorize

## 📱 URLs Importantes

- Google Console: https://console.cloud.google.com/
- Credenciais: https://console.cloud.google.com/apis/credentials
- Tela de consentimento: https://console.cloud.google.com/apis/credentials/consent
