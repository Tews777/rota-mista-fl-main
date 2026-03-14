# 🚀 GUIA DE DEPLOY - ROTA MISTA FL

## Opção 1: Vercel (Recomendado - Mais Fácil)

### Pré-requisitos
- Conta no GitHub
- Conta no Vercel (gratuita)

### Passos

1. **Fazer push para GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/seu-usuario/rota-mista-fl.git
   git push -u origin main
   ```

2. **Conectar ao Vercel**
   - Ir em https://vercel.com
   - Clicar em "New Project"
   - Selecionar seu repositório GitHub
   - Vercel detecta automaticamente que é Vite

3. **Configurar Variáveis de Ambiente**
   - No painel do Vercel, ir em "Settings" > "Environment Variables"
   - Adicionar:
     ```
     VITE_SUPABASE_URL = https://rnexmtqpkokodcbkdolu.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_nyPtc-B4Ja_Cx9X7_X5Ibg_vacA6goq
     ```

4. **Deploy**
   - Clicar em "Deploy"
   - Vercel fará `npm install` e `npm run build` automaticamente
   - App estará online em minutos!

---

## Opção 2: Netlify

### Pré-requisitos
- Conta no Netlify (gratuita)

### Passos

1. **Fazer build localmente**
   ```bash
   npm run build
   ```

2. **Deploy da pasta dist/**
   - Ir em https://app.netlify.com
   - Clicar em "Add new site" > "Deploy manually"
   - Arrastar a pasta `dist/` gerada

3. **Configurar Variáveis (após deploy)**
   - Ir em "Site settings" > "Build & deploy" > "Environment"
   - Adicionar variáveis:
     ```
     VITE_SUPABASE_URL = https://rnexmtqpkokodcbkdolu.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_nyPtc-B4Ja_Cx9X7_X5Ibg_vacA6goq
     ```

4. **Conectar GitHub (opcional)**
   - Para deploy automático a cada push

---

## Opção 3: Docker + Seu Servidor

### Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  server {
    listen 80;
    location / {
      root /usr/share/nginx/html;
      try_files $uri $uri/ /index.html;
    }
  }
}
```

### Build e Deploy
```bash
docker build -t rota-mista-fl .
docker run -p 80:80 rota-mista-fl
```

---

## Opção 4: GitHub Pages (Gratuito)

### Configuração
1. Atualizar `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/rota-mista-fl/', // seu-repo
     // ... resto da config
   });
   ```

2. Fazer push para GitHub
3. Ir em Settings > Pages > Select "GitHub Actions"
4. Vercel fará deploy automático

---

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Build local testado (`npm run build`)
- [ ] `.env.local` NÃO está no Git
- [ ] `.env.example` está documentado
- [ ] Supabase projeto está ativo
- [ ] Tabelas do banco criadas e com RLS
- [ ] Build sem erros TypeScript
- [ ] Testes passaram (se houver)

---

## Após Deploy

### Monitorar
- Verificar se a aplicação está respondendo
- Testar upload de arquivo
- Testar salvamento no banco
- Testar busca e filtros
- Testar exportação para Excel

### Troubleshooting

**Erro "Cannot find module"**
- Verificar se `.env.local` tem as variáveis corretas
- Fazer rebuild: `npm run build`

**Erro "Failed to connect to Supabase"**
- Verificar se `VITE_SUPABASE_URL` está correto
- Verificar se `VITE_SUPABASE_PUBLISHABLE_KEY` está correto
- Verificar se Supabase projeto está ativo

**Aplicação lenta**
- Verificar tamanho dos arquivos (CSS/JS)
- Usar DevTools para network analysis
- Considerar code-splitting

---

## Dominios Customizados

### Vercel
1. Settings > Domains
2. Adicionar seu domínio
3. Seguir instruções de DNS

### Netlify
1. Domain settings > Custom domains
2. Adicionar seu domínio
3. Atualizar DNS records

---

## SSL/HTTPS

✅ **Automático no Vercel e Netlify** (certificado Let's Encrypt)

Para servidor próprio:
```bash
# Usando Let's Encrypt
certbot certonly --standalone -d seu-dominio.com
```

---

**Seu app estará online em minutos! 🎉**

Para dúvidas, consulte a documentação:
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Supabase: https://supabase.com/docs
