-- Add usuario column to swap_history table (if it doesn't exist)
ALTER TABLE IF EXISTS swap_history
ADD COLUMN IF NOT EXISTS usuario VARCHAR(50);

-- Add index for better query performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_swap_history_usuario ON swap_history(usuario);
