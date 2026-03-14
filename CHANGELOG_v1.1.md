# 📊 Novas Funcionalidades - v1.1.0

## ✨ Melhorias Implementadas

### 1. Dashboard com Estatísticas
- **Localização:** Aba "Dashboard" no menu principal
- **Funcionalidades:**
  - Filtro por período (Hoje, 7 dias, 30 dias, Todos)
  - Filtro por usuário
  - 4 Cards de estatísticas:
    - Total de Trocas
    - BRs Únicos
    - Rotas Movimentadas
  
### 2. Análise de Padrões (no Dashboard)
- **Rotas Mais Trocadas:** Top 5 rotas com maior movimentação
- **Bairros Mais Movimentados:** Top 5 bairros com mais atividade
- **Trocas por Usuário:** Comparativo de quem fez mais trocas
- **Trocas por Ciclo:** Distribuição AM/PM

### 3. Busca/Filtro no Histórico de Trocas
- **Localização:** Dashboard - seção "Trocas Recentes"
- **Filtros disponíveis:**
  - Por data (hoje, semana, mês, todos)
  - Por usuário
  - Tabela mostra últimas 10 trocas

### 4. Desfazer Troca (Undo)
- **Como usar:**
  - Vá para Dashboard
  - Role até "Trocas Recentes"
  - Clique no botão com ícone ↺ para desfazer
  - A troca será removida do banco de dados imediatamente

### 5. Indicador de Usuário Logado
- **Localização:** Header (canto superior direito)
- **Visual:** Badge com o nome do usuário e um ponto verde (online)
- **Exemplo:** "analista01" ou "analista02"

### 6. Remoção de Logs de Debug
- Todos os `console.log()` de debug foram removidos
- Mantidos apenas:
  - `console.error()` para erros reais
  - `console.warn()` para avisos

## 🗄️ Mudanças no Banco de Dados

### Nova Coluna em `swap_history`
```sql
ALTER TABLE swap_history ADD COLUMN usuario VARCHAR(50);
```

Agora cada troca registra automaticamente qual usuário a realizou.

## 📁 Arquivos Modificados

1. `src/pages/Index.tsx`
   - Adicionado estado para username
   - Adicionada função `handleUndoSwap()`
   - Nova aba "Dashboard"
   - Indicador de usuário no header
   - Remoção de logs de debug

2. `src/components/SwapHistoryTable.tsx`
   - Nova coluna "USUÁRIO" na tabela
   - Campo `usuario` no export Excel

3. `src/components/DashboardPanel.tsx` (NOVO)
   - Componente completo do dashboard
   - Filtros por data e usuário
   - Cards de estatísticas
   - Análise de padrões (4 gráficos)
   - Tabela com opção de desfazer

4. `supabase/migrations/20260314110000_add_usuario_column.sql` (NOVO)
   - Migração SQL para adicionar coluna
   - Index para performance

## 🚀 Como Usar

### Ver Dashboard
1. Faça login
2. Carregue um arquivo de rotas
3. Clique em "Dashboard"
4. Use os filtros para análises específicas

### Desfazer uma Troca
1. Vá para Dashboard
2. Procure a troca em "Trocas Recentes"
3. Clique no botão ↺ (desfazer)
4. Confirmação automática aparecerá

### Ver Trocas por Usuário
1. Dashboard
2. Selecione um usuário no filtro
3. Os cards e gráficos se atualizam automaticamente

## 📊 Exemplos de Análise

### Relatório Diário
- Filtro de período: "Hoje"
- Ver quantas trocas foram feitas
- Ver qual usuário fez mais
- Identificar BRs mais movimentados

### Comparação de Operadores
- Filtro de período: "Todos os períodos"
- Conferir "Trocas por Usuário"
- Ver histórico individual de cada um

## ⚠️ Notas Importantes

1. **Migração SQL:** Execute a migração no Supabase antes de usar
2. **Compatibilidade:** Trocas antigas não terão campo `usuario` (mostram "—")
3. **Performance:** Índice adicionado para queries rápidas
4. **Desfazer:** Apenas as últimas 10 trocas ficam visíveis (por espaço)

---

**Versão:** 1.1.0  
**Data:** 14 de Março de 2026  
**Deploy:** Automático via GitHub > Netlify
