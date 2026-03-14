-- Add usuario column to swap_history table
ALTER TABLE swap_history ADD COLUMN usuario VARCHAR(50);

-- Add index for better query performance
CREATE INDEX idx_swap_history_usuario ON swap_history(usuario);
