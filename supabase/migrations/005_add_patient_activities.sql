-- =============================================
-- Migration: Add Patient Activities Table
-- Description: Adds activity-level status tracking for patients
-- Each patient can have multiple activities (treatments), each with independent status
-- =============================================

-- Create patient_activities table
CREATE TABLE IF NOT EXISTS patient_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  treatment_name TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'scheduled', 'completed', 'dropped', 'lost')
  ),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Add indexes for better query performance
CREATE INDEX idx_patient_activities_clinic_id ON patient_activities(clinic_id);
CREATE INDEX idx_patient_activities_patient_id ON patient_activities(patient_id);
CREATE INDEX idx_patient_activities_status ON patient_activities(status);
CREATE INDEX idx_patient_activities_assigned_to ON patient_activities(assigned_to);
CREATE INDEX idx_patient_activities_treatment_id ON patient_activities(treatment_id);

-- Add composite index for common queries (clinic + patient + status)
CREATE INDEX idx_patient_activities_clinic_patient_status 
  ON patient_activities(clinic_id, patient_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE patient_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see activities from their clinic
CREATE POLICY patient_activities_select_policy ON patient_activities
  FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can only insert activities for their clinic
CREATE POLICY patient_activities_insert_policy ON patient_activities
  FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can only update activities from their clinic
CREATE POLICY patient_activities_update_policy ON patient_activities
  FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS Policy: Users can only delete activities from their clinic
CREATE POLICY patient_activities_delete_policy ON patient_activities
  FOR DELETE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patient_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_patient_activities_updated_at
  BEFORE UPDATE ON patient_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_patient_activities_updated_at();

-- Create trigger to set closed_at when status becomes completed/dropped/lost
CREATE OR REPLACE FUNCTION set_patient_activity_closed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'dropped', 'lost') AND OLD.status NOT IN ('completed', 'dropped', 'lost') THEN
    NEW.closed_at = now();
  ELSIF NEW.status NOT IN ('completed', 'dropped', 'lost') THEN
    NEW.closed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_patient_activity_closed_at
  BEFORE UPDATE ON patient_activities
  FOR EACH ROW
  EXECUTE FUNCTION set_patient_activity_closed_at();

-- Add comment to table
COMMENT ON TABLE patient_activities IS 'Tracks individual activities/treatments per patient with independent status';
COMMENT ON COLUMN patient_activities.status IS 'Activity status: new, contacted, scheduled, completed, dropped, lost';
COMMENT ON COLUMN patient_activities.closed_at IS 'Automatically set when status becomes completed/dropped/lost';

-- Ensure follow_ups table exists and has all necessary fields
-- (If follow_ups doesn't exist, create it; otherwise skip)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'follow_ups') THEN
    CREATE TABLE follow_ups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('call', 'message', 'email', 'meeting', 'appointment', 'whatsapp')),
      scheduled_at TIMESTAMPTZ NOT NULL,
      completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMPTZ,
      notes TEXT,
      duration INTEGER, -- in minutes
      treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
      treatment_name TEXT,
      assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
      google_event_id TEXT,
      meet_link TEXT,
      reminder_sent BOOLEAN DEFAULT false,
      confirmed_by_patient BOOLEAN DEFAULT false,
      appointment_status TEXT CHECK (appointment_status IN ('pending', 'confirmed', 'completed', 'no-show', 'cancelled')),
      treatment_phase TEXT CHECK (treatment_phase IN ('consultation', 'treatment', 'recovery', 'completed', 'follow_up')),
      session_number INTEGER,
      total_sessions INTEGER,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Add indexes
    CREATE INDEX idx_follow_ups_clinic_id ON follow_ups(clinic_id);
    CREATE INDEX idx_follow_ups_patient_id ON follow_ups(patient_id);
    CREATE INDEX idx_follow_ups_scheduled_at ON follow_ups(scheduled_at);
    CREATE INDEX idx_follow_ups_completed ON follow_ups(completed);
    
    -- Enable RLS
    ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
    
    -- RLS Policies
    CREATE POLICY follow_ups_select_policy ON follow_ups
      FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid()));
    
    CREATE POLICY follow_ups_insert_policy ON follow_ups
      FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid()));
    
    CREATE POLICY follow_ups_update_policy ON follow_ups
      FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid()));
    
    CREATE POLICY follow_ups_delete_policy ON follow_ups
      FOR DELETE USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid()));
      
    -- Trigger for updated_at
    CREATE TRIGGER trigger_follow_ups_updated_at
      BEFORE UPDATE ON follow_ups
      FOR EACH ROW
      EXECUTE FUNCTION update_patient_activities_updated_at();
  END IF;
END
$$;
