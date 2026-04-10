# Configuração de Autenticação - Rota Mista FL

## ✅ Sistema de Login Simples

O sistema agora funciona com **usuário + senha** sem necessidade de email.

Usuários válidos:
- **analista01** / senha: **analista01**
- **analista02** / senha: **analista02**
- **analista03** / senha: **analista03**
- **analista04** / senha: **analista04**

## Como Funciona

1. Você digita usuário e senha na página de login
2. O sistema valida contra as credenciais pré-configuradas
3. Se for válido, cria uma sessão no Supabase automaticamente
4. Você entra na aplicação e acessa o histórico compartilhado

## Criar Novos Usuários

Para adicionar novos usuários, edite o arquivo `src/pages/Login.tsx`:

```typescript
const VALID_USERS = [
  { username: "analista01", password: "analista01" },
  { username: "analista02", password: "analista02" },
  { username: "analista03", password: "analista03" },
  { username: "analista04", password: "analista04" },
  { username: "novo_user", password: "nova_senha" }, // ← Adicione aqui
];
```

Depois faça commit e deploy.

## Histórico Unificado

- Todos os usuários compartilham a **mesma tabela** `swap_history`
- Quando um faz uma troca, todos veem imediatamente
- Quando um clica "Limpar tudo", deleta para todos
- É 100% compartilhado - sem separação por usuário
