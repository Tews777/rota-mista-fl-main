
-- Create swap_history table to persist swap entries
CREATE TABLE public.swap_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data TEXT NOT NULL,
  ciclo TEXT NOT NULL DEFAULT 'AM',
  rota_de TEXT NOT NULL,
  modal_de TEXT NOT NULL,
  rota_para TEXT NOT NULL,
  modal_para TEXT NOT NULL,
  qtd_pacotes TEXT NOT NULL DEFAULT '1',
  br TEXT NOT NULL,
  at_origem TEXT NOT NULL,
  at_destino TEXT NOT NULL,
  bairro TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.swap_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/insert/delete (no auth required for this tool app)
CREATE POLICY "Anyone can read swap_history"
  ON public.swap_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert swap_history"
  ON public.swap_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete swap_history"
  ON public.swap_history FOR DELETE
  USING (true);
