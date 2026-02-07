-- Add API key column for external integrations
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE;

-- Create index for API key lookups
CREATE INDEX IF NOT EXISTS idx_clinics_api_key ON clinics(api_key) WHERE api_key IS NOT NULL;

-- Function to generate a random API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN 'ck_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Generate API keys for existing clinics that don't have one
UPDATE clinics SET api_key = generate_api_key() WHERE api_key IS NULL;
