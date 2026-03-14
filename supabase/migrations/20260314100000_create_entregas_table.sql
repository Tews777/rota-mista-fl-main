-- Create entregas table to store delivery data
CREATE TABLE public.entregas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  data DATE NOT NULL,
  ciclo TEXT NOT NULL DEFAULT 'AM',

  rota_de TEXT NOT NULL,
  modal_de TEXT NOT NULL,

  rota_para TEXT NOT NULL,
  modal_para TEXT NOT NULL,

  qtd_pacotes INTEGER NOT NULL DEFAULT 1,

  br TEXT NOT NULL,
  at_origem TEXT NOT NULL,
  at_destino TEXT NOT NULL,
  bairro TEXT NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX idx_entregas_data ON public.entregas(data);
CREATE INDEX idx_entregas_rota_de ON public.entregas(rota_de);
CREATE INDEX idx_entregas_rota_para ON public.entregas(rota_para);

-- Enable RLS
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/insert/update/delete (no auth required for this tool app)
CREATE POLICY "Anyone can read entregas"
  ON public.entregas FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert entregas"
  ON public.entregas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update entregas"
  ON public.entregas FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete entregas"
  ON public.entregas FOR DELETE
  USING (true);
