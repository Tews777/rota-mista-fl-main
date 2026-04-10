-- Criar tabela shared_file para sincronizar arquivo entre computadores
CREATE TABLE IF NOT EXISTS public.shared_file (
  id TEXT PRIMARY KEY DEFAULT 'shared',
  file_data TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  unique_brs INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para ordenação por data (otimização)
CREATE INDEX IF NOT EXISTS idx_shared_file_updated_at ON public.shared_file(updated_at DESC);

-- Habilitar RLS (Row Level Security) para acesso público
ALTER TABLE public.shared_file ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura pública
CREATE POLICY "shared_file_select_policy" ON public.shared_file
  FOR SELECT
  USING (true);

-- Criar política de inserção/atualização pública
CREATE POLICY "shared_file_upsert_policy" ON public.shared_file
  FOR INSERT
  WITH CHECK (true);

-- Criar política de atualização pública
CREATE POLICY "shared_file_update_policy" ON public.shared_file
  FOR UPDATE
  USING (true);

-- Criar política de deleção pública
CREATE POLICY "shared_file_delete_policy" ON public.shared_file
  FOR DELETE
  USING (true);

-- Conceder permissões ao usuário anônimo (anon)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_file TO anon;
