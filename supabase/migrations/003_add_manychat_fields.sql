-- ============================================
-- ManyChat Integration Fields Migration
-- ============================================
-- Adds ManyChat-specific fields to patients table
-- and creates tables for ManyChat integration data

-- Add ManyChat fields to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS manychat_subscriber_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS manychat_tags TEXT[],
ADD COLUMN IF NOT EXISTS manychat_custom_fields JSONB,
ADD COLUMN IF NOT EXISTS manychat_subscription_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS manychat_last_message_date TIMESTAMP WITH TIME ZONE;

-- Create index on manychat_subscriber_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_patients_manychat_subscriber_id 
ON patients(manychat_subscriber_id) WHERE manychat_subscriber_id IS NOT NULL;

-- Create table for ManyChat settings per clinic
CREATE TABLE IF NOT EXISTS manychat_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    connected BOOLEAN DEFAULT false,
    api_key TEXT, -- Encrypted in application
    webhook_secret TEXT,
    channel_id VARCHAR(255),
    auto_create_patients BOOLEAN DEFAULT true,
    auto_sync_enabled BOOLEAN DEFAULT false,
    sync_interval_hours INTEGER DEFAULT 24,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    webhook_url TEXT,
    default_assignee UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clinic_id)
);

-- Create trigger for manychat_settings
CREATE TRIGGER update_manychat_settings_updated_at 
    BEFORE UPDATE ON manychat_settings
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_manychat_settings_clinic_id ON manychat_settings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_manychat_settings_connected ON manychat_settings(connected);

-- Create table for ManyChat webhook logs
CREATE TABLE IF NOT EXISTS manychat_webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    subscriber_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhook logs
CREATE INDEX IF NOT EXISTS idx_manychat_webhook_logs_clinic_id ON manychat_webhook_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_manychat_webhook_logs_subscriber_id ON manychat_webhook_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_manychat_webhook_logs_created_at ON manychat_webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manychat_webhook_logs_processed ON manychat_webhook_logs(processed);

-- Create table for ManyChat sync history
CREATE TABLE IF NOT EXISTS manychat_sync_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sync_type VARCHAR(50) NOT NULL, -- 'manual' or 'automatic'
    total_count INTEGER DEFAULT 0,
    created_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    errors JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sync history
CREATE INDEX IF NOT EXISTS idx_manychat_sync_history_clinic_id ON manychat_sync_history(clinic_id);
CREATE INDEX IF NOT EXISTS idx_manychat_sync_history_created_at ON manychat_sync_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manychat_sync_history_status ON manychat_sync_history(status);

-- Add 'sync' to action_type enum if not exists (for activity_logs)
-- Note: This may require manual adjustment based on your existing schema

-- Enable RLS on new tables
ALTER TABLE manychat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE manychat_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE manychat_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manychat_settings
CREATE POLICY "Users can view their clinic's ManyChat settings"
    ON manychat_settings FOR SELECT
    USING (clinic_id IN (
        SELECT clinic_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Owners and managers can update ManyChat settings"
    ON manychat_settings FOR ALL
    USING (clinic_id IN (
        SELECT clinic_id FROM profiles 
        WHERE id = auth.uid() AND role IN ('owner', 'manager')
    ));

-- RLS Policies for manychat_webhook_logs
CREATE POLICY "Users can view their clinic's webhook logs"
    ON manychat_webhook_logs FOR SELECT
    USING (clinic_id IN (
        SELECT clinic_id FROM profiles WHERE id = auth.uid()
    ));

-- RLS Policies for manychat_sync_history
CREATE POLICY "Users can view their clinic's sync history"
    ON manychat_sync_history FOR SELECT
    USING (clinic_id IN (
        SELECT clinic_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create sync history for their clinic"
    ON manychat_sync_history FOR INSERT
    WITH CHECK (clinic_id IN (
        SELECT clinic_id FROM profiles WHERE id = auth.uid()
    ));

-- Comment on tables
COMMENT ON TABLE manychat_settings IS 'ManyChat integration settings per clinic';
COMMENT ON TABLE manychat_webhook_logs IS 'Log of all ManyChat webhooks received';
COMMENT ON TABLE manychat_sync_history IS 'History of ManyChat synchronization operations';
