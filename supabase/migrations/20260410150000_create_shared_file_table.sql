-- Create shared_file table for storing the uploaded file that all users share
CREATE TABLE IF NOT EXISTS shared_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_data TEXT NOT NULL,
  filename VARCHAR(255),
  uploaded_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_records INT,
  unique_brs INT
);

-- Enable RLS
ALTER TABLE shared_file ENABLE ROW LEVEL SECURITY;

-- Public READ access
CREATE POLICY "Enable read access for all users"
  ON shared_file FOR SELECT
  USING (true);

-- Public INSERT access
CREATE POLICY "Enable insert access for all users"
  ON shared_file FOR INSERT
  WITH CHECK (true);

-- Public UPDATE access
CREATE POLICY "Enable update access for all users"
  ON shared_file FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Public DELETE access
CREATE POLICY "Enable delete access for all users"
  ON shared_file FOR DELETE
  USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_shared_file_updated_at ON shared_file (updated_at DESC);

-- Function to keep only the latest file (delete old ones automatically)
CREATE OR REPLACE FUNCTION cleanup_old_shared_files()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM shared_file
  WHERE id != NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep only latest
CREATE TRIGGER trigger_cleanup_old_shared_files
AFTER INSERT ON shared_file
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_shared_files();
