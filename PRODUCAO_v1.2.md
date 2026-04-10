# 🚀 GUIA DE PRODUÇÃO v1.2 - Rota Mista FL

## 📋 Visão Geral

Sistema de gerenciamento de rotas e trocas para **4 analistas trabalhando simultaneamente de computadores diferentes**.

**Funcionalidades principais:**
- ✅ 4 usuários com login independente
- ✅ Histórico de trocas **sincronizado em tempo real** entre todos via Supabase
- ✅ Upload de arquivo Excel (cada PC seu próprio arquivo)
- ✅ Dashboard com análises e filtros
- ✅ Busca avançada de BRs e rotas
- ✅ Desfazer (undo) de trocas

---

## 👥 Usuários Disponíveis

4 analistas podem fazer login simultaneamente de computadores diferentes:

| Usuário | Senha | Computador | Função |
|---------|-------|-----------|--------|
| **analista01** | analista01 | PC1 | Analista de Rotas |
| **analista02** | analista02 | PC2 | Analista de Rotas |
| **analista03** | analista03 | PC3 | Analista de Rotas |
| **analista04** | analista04 | PC4 | Analista de Rotas |

---

## 🔄 Como Funciona a Sincronização

### 1. **Arquivo de Rotas** (Upload)
Cada analista faz **seu próprio upload** do arquivo Excel no seu computador:
- PC1 (analista01): Upload arquivo → Salva localmente
- PC2 (analista02): Upload arquivo → Salva localmente
- PC3 (analista03): Upload arquivo → Salva localmente
- PC4 (analista04): Upload arquivo → Salva localmente

**Nota:** Cada PC tem seu próprio arquivo em cache (localStorage/IndexedDB).

### 2. **Histórico de Trocas** (Sincronizado em Tempo Real)
Quando qualquer analista faz uma troca:
1. A troca é salva no Supabase (tabela `swap_history`)
2. Supabase Realtime avisa todos os outros usuários
3. **Todos veem a troca imediatamente** (mesmo em PCs diferentes)

**Exemplo:**
```
19:30 → analista01 (PC1) faz uma troca → Todos veem em segundos
19:31 → analista02 (PC2) faz uma troca → Todos veem em segundos
19:32 → analista03 (PC3) vê histórico atualizado de ambas ✅
```

---

## 🎯 Fluxo de Uso no Dia a Dia

### Início do Dia
```
1. Cada analista abre rota-mista-fl.vercel.app
2. Faz login com suas credenciais (analista01, analista02, etc)
3. Faz upload do arquivo Excel mais recente
4. Sistema salva localmente e começa a monitorar histórico
```

### Durante o Expediente
```
1. Analista clica em "Busca" → Procura BRs no seu arquivo
2. Encontra um BR para trocar
3. Clica "Trocar" → Sistema registra no Supabase
4. Todos os 4 analistas veem a troca simultaneamente
5. Se errou, clica "↺ Desfazer" para corrigir
```

### Dashboard & Análises
```
1. Clique na aba "Dashboard"
2. Veja estatísticas em tempo real:
   - Total de BRs processados
   - Rotas mais utilizadas
   - Bairros mais movimentados
   - Análise por usuário e ciclo
```

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

### Tabela: `swap_history`
Todas as trocas/movimentações são registradas aqui:

```sql
id             | UUID (único)
data           | TEXT (data da troca)
ciclo          | TEXT (AM ou PM)
rota_de        | TEXT (rota original)
modal_de       | TEXT (modal original)
rota_para      | TEXT (rota destino)
modal_para     | TEXT (modal destino)
qtd_pacotes    | INTEGER (quantidade)
br             | TEXT (BR movido)
at_origem      | TEXT (AT origem)
at_destino     | TEXT (AT destino)
bairro         | TEXT (bairro)
usuario        | TEXT (analista01-04)
created_at     | TIMESTAMP (quando foi feito)
```

**Características:**
- ✅ Histórico unificado (todos contribuem, todos veem)
- ✅ Sincronização em tempo real via Supabase Realtime
- ✅ Acesso público (RLS policies habilitadas)
- ✅ Backup automático pelo Supabase

---

## 📊 Dashboard - Funcionalidades

### Abas Disponíveis
1. **Busca** - Procura BRs no arquivo
2. **Histórico** - Ver trocas registradas
3. **Dashboard** - Análises e estatísticas

### Filtros no Dashboard
- **Período:** Hoje, 7 dias, 30 dias, Todos
- **Usuário:** Todos, analista01, analista02, analista03, analista04

### Estatísticas
- Total de BRs processados
- Rotas mais utilizadas
- Bairros mais movimentados
- Análise por função/usuário
- Ciclos (AM/PM)

---

## 🔧 Configuração de Produção

### Variáveis de Ambiente
Arquivo `.env`:
```
VITE_SUPABASE_URL="https://mpcfvbaogrpdnzponhfy.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Deploy
- **Plataforma:** Vercel
- **Repositório:** GitHub (rota-mista-fl-main)
- **URL:** https://rota-mista-fl-main.vercel.app
- **Deploy Automático:** Sim (merges para main)

### Tabelas Criadas
- ✅ `swap_history` - Histórico de trocas
- ✅ `entregas` - Registros de entregas
- ✅ `shared_file` - Arquivo compartilhado (para sincronização futura)

---

## 🆘 Troubleshooting

### "Nenhum arquivo no Supabase"
✅ Normal! Cada PC tem seu próprio arquivo em cache local.

### "Histórico vazio"
✅ Normal no primeiro dia. Começa a registrar conforme você faz trocas.

### "Não vejo a troca de outro analista"
❌ Verifique:
1. Internet está conectada?
2. O outro analista está logado?
3. Tente recarregar a página (F5)

### "Erro ao salvar troca"
❌ Possíveis causas:
1. Sem acesso à internet
2. Supabase em manutenção
3. Usuário não está logado

**Solução:** Recarregue a página e tente novamente.

---

## 📱 Acesso por Dispositivo

### Desktop (Recomendado)
- ✅ Compatível com Firefox, Chrome, Edge
- ✅ Suporta tela grande para melhor visualização
- ✅ Acesso aos 4 analistas simultaneamente

### Tablet
- ✅ Funciona em iPad/Android
- ✅ Interface responsiva
- ⚠️ Teclado virtual pode ocupar espaço

### Mobile
- ❌ Não recomendado
- ⚠️ Interface muito pequena
- ❌ Acesso limitado a funcionalidades

---

## 🔐 Segurança

### Autenticação
- Login simples com usuário/senha
- Sessão armazenada em localStorage
- Sem exposição de dados sensíveis

### Dados
- Banco Supabase com backups automáticos
- RLS policies habilitadas (acesso público autorizado)
- Histórico imutável (não deleta, apenas marca)

### Recomendações
1. Use uma **rede privada/VPN** se possível
2. Não compartilhe suas credenciais de login
3. Feche o navegador ao sair do PC
4. Limpe o cache regularmente (localStorage)

---

## 📈 Monitoramento & Manutenção

### Verificar Status
- Acesse: https://rota-mista-fl-main.vercel.app
- Qualquer mensagem de erro? Nos avise!

### Backups
- Supabase faz backup automático todos os dias
- Histórico é imutável (não pode ser apagado)

### Custos
- **Vercel:** Grátis (sob demanda)
- **Supabase:** ~R$ 50-100/mês (conforme uso)
- **Total:** Muito mais barato que Firebase

---

## 📞 Suporte

### Problemas Comuns
1. **Login não funciona** → Verifique se usuário existe (analista01-04)
2. **Arquivo não carrega** → Upload novamente
3. **Histórico desincronizado** → Recarregue a página (F5)
4. **Lentidão** → Limpe cache (F12 → Application → Clear All)

### Contato
- Entre em contato com o desenvolvedor via GitHub
- Abra uma issue no repositório: rota-mista-fl-main

---

## ✅ Checklist de Produção

Antes de usar em produção, verifique:

- [ ] 4 usuários conseguem fazer login
- [ ] Histórico sincroniza entre PCs diferentes
- [ ] Upload de arquivo funciona
- [ ] Dashboard mostra estatísticas
- [ ] Undo (desfazer) funciona
- [ ] Sem erros no console (F12)
- [ ] Todos os 4 analistas treinados

---

**Versão:** 1.2  
**Data:** 10 de abril de 2026  
**Status:** ✅ Pronto para Produção
