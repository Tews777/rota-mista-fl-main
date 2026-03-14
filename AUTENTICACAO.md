# Configuração de Autenticação - Rota Mista FL

## Pré-requisitos
- Projeto Supabase criado (já temos em: https://rnexmtqpkokodcbkdolu.supabase.co)
- Acesso ao dashboard do Supabase

## Passo 1: Configurar RLS (Row Level Security)

A tabela `swap_history` já tem RLS habilitada com política de leitura/escrita pública. Vamos manter assim por enquanto, mas futuramente pode ser restringida por usuário.

## Passo 2: Criar os 2 Usuários

### Opção A: Via Dashboard Supabase (Recomendado)

1. Acesse: https://app.supabase.com/
2. Selecione seu projeto
3. Vá em **Authentication > Users**
4. Clique em **Add user**
5. Crie 2 usuários:

**Usuário 1:**
- Email: `operador1@floripa.local`
- Senha: `operador123`
- Auto confirm: ✓ marque esta opção

**Usuário 2:**
- Email: `operador2@floripa.local`
- Senha: `operador123`
- Auto confirm: ✓ marque esta opção

### Opção B: Via Script Node.js

1. Obtenha a **Service Role Key** (chave admin):
   - Vá em **Settings > API > Project API Keys**
   - Copie a chave de **Service Role Key**

2. No arquivo `scripts/create-users.js`, substitua:
   ```javascript
   const supabaseAdminKey = "YOUR_SUPABASE_ADMIN_KEY_HERE";
   ```
   pela sua chave de admin.

3. Execute:
   ```bash
   npm install @supabase/supabase-js
   node scripts/create-users.js
   ```

## Passo 3: Testar Login

1. Abra a aplicação: http://localhost:5173
2. Clique em "Entrar"
3. Use uma das credenciais:
   - Email: `operador1@floripa.local` / Senha: `operador123`
   - Email: `operador2@floripa.local` / Senha: `operador123`

## Como Funciona o Histórico Unificado

- Ambos os usuários compartilham a **mesma tabela** `swap_history`
- Quando operador 1 faz uma troca, operador 2 vê imediatamente (sem recarregar)
- Quando um clica "Limpar tudo", deleta para os 2
- Não há separação por usuário por enquanto - é um histórico compartilhado global

## Alterações de Segurança Futuras

Se quiser adicionar separação por usuário depois:

1. Adicionar coluna `user_id` na tabela `swap_history`
2. Atualizar RLS policy para filtrar por `user_id`
3. Salvar `user_id` ao criar trocas: `supabase.auth.getUser()`

---

**Próximas Ações:**
✓ Autenticação funcionando
✓ Histórico unificado
⏳ (Opcional) Separação por usuário com login
⏳ (Opcional) Sincronização em tempo real com Realtime Subscriptions
