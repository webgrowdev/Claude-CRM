-- ============================================
-- Claude CRM Database Schema - Supabase Native Auth
-- PostgreSQL / Supabase
-- ============================================
-- This schema uses Supabase Auth natively (auth.users)
-- profiles table is linked to auth.users via FOREIGN KEY
-- Multi-tenant design with clinic_id in all tables
-- RLS policies based on auth.uid() + clinic_id + role
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HELPER FUNCTION: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: clinics
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'México',
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for clinics
CREATE TRIGGER update_clinics_updated_at 
    BEFORE UPDATE ON clinics
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

-- Create index
CREATE INDEX idx_clinics_created_at ON clinics(created_at);

-- ============================================
-- TABLE: profiles (linked to auth.users)
-- ============================================
-- This table extends Supabase auth.users with app-specific data
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'doctor', 'receptionist')),
    avatar_url TEXT,
    specialty VARCHAR(255), -- For doctors
    color VARCHAR(7), -- For calendar display
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

-- Create indexes
CREATE INDEX idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- ============================================
-- TABLE: patients
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    identification_number VARCHAR(100),
    identification_type VARCHAR(50) CHECK (identification_type IN ('dni', 'passport', 'other')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('instagram', 'whatsapp', 'phone', 'website', 'referral', 'other')),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'closed', 'lost')),
    funnel_status VARCHAR(50) CHECK (funnel_status IN ('new', 'contacted', 'appointment', 'attended', 'closed', 'followup', 'lost', 'noshow')),
    instagram_handle VARCHAR(255),
    preferred_time VARCHAR(50),
    campaign VARCHAR(255),
    tags TEXT[], -- Array of tags
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_action_at TIMESTAMP WITH TIME ZONE,
    next_action TEXT,
    nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    value DECIMAL(10, 2) DEFAULT 0,
    total_paid DECIMAL(10, 2) DEFAULT 0,
    total_pending DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Create trigger for patients
CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

-- Create indexes
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_funnel_status ON patients(funnel_status);
CREATE INDEX idx_patients_assigned_to ON patients(assigned_to);
CREATE INDEX idx_patients_created_at ON patients(created_at);
CREATE INDEX idx_patients_next_action_at ON patients(next_action_at);

-- ============================================
-- TABLE: treatments
-- ============================================
CREATE TABLE IF NOT EXISTS treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    in_person_duration INTEGER,
    videocall_duration INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for treatments
CREATE TRIGGER update_treatments_updated_at 
    BEFORE UPDATE ON treatments
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

-- Create indexes
CREATE INDEX idx_treatments_clinic_id ON treatments(clinic_id);
CREATE INDEX idx_treatments_is_active ON treatments(is_active);
CREATE INDEX idx_treatments_category ON treatments(category);

-- ============================================
-- TABLE: appointments
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'no-show', 'cancelled')),
    treatment_phase VARCHAR(50) CHECK (treatment_phase IN ('consultation', 'preparation', 'treatment', 'recovery', 'completed')),
    method VARCHAR(50) DEFAULT 'in-person' CHECK (method IN ('in-person', 'video', 'call')),
    notes TEXT,
    google_event_id VARCHAR(255),
    meet_link TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    outcome_result VARCHAR(50) CHECK (outcome_result IN ('success', 'partial', 'failed')),
    outcome_description TEXT,
    next_steps TEXT,
    session_number INTEGER,
    total_sessions INTEGER,
    days_until_followup INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for appointments
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

-- Create indexes
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_treatment_id ON appointments(treatment_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);

-- ============================================
-- TABLE: patient_notes
-- ============================================
CREATE TABLE IF NOT EXISTS patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for patient_notes
CREATE TRIGGER update_patient_notes_updated_at 
    BEFORE UPDATE ON patient_notes
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();

-- Create indexes
CREATE INDEX idx_patient_notes_clinic_id ON patient_notes(clinic_id);
CREATE INDEX idx_patient_notes_patient_id ON patient_notes(patient_id);
CREATE INDEX idx_patient_notes_created_by ON patient_notes(created_by);
CREATE INDEX idx_patient_notes_created_at ON patient_notes(created_at);

-- ============================================
-- TABLE: activity_logs
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view')),
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('patient', 'appointment', 'treatment', 'user', 'clinic')),
    resource_id UUID,
    changes JSONB, -- Store what changed
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_activity_logs_clinic_id ON activity_logs(clinic_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);

-- ============================================
-- TRIGGER: Auto-create profile on auth user creation
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist'),
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: clinics
-- ============================================

-- Users can view their own clinic
CREATE POLICY "Users can view their own clinic" ON clinics
    FOR SELECT
    USING (
        id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Owners can update their clinic
CREATE POLICY "Owners can update their clinic" ON clinics
    FOR UPDATE
    USING (
        id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- RLS POLICIES: profiles
-- ============================================

-- Users can view profiles in their clinic
CREATE POLICY "Users can view profiles in their clinic" ON profiles
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (id = auth.uid());

-- Owners and managers can update profiles in their clinic
CREATE POLICY "Owners and managers can update profiles" ON profiles
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'manager')
        )
    );

-- ============================================
-- RLS POLICIES: patients
-- ============================================

-- Users can view patients in their clinic
CREATE POLICY "Users can view patients in their clinic" ON patients
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can insert patients in their clinic
CREATE POLICY "Users can insert patients in their clinic" ON patients
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can update patients in their clinic
CREATE POLICY "Users can update patients in their clinic" ON patients
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Owners can delete patients in their clinic
CREATE POLICY "Owners can delete patients" ON patients
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- RLS POLICIES: treatments
-- ============================================

-- Users can view treatments in their clinic
CREATE POLICY "Users can view treatments in their clinic" ON treatments
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Owners and managers can manage treatments
CREATE POLICY "Owners and managers can insert treatments" ON treatments
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners and managers can update treatments" ON treatments
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Owners can delete treatments" ON treatments
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- RLS POLICIES: appointments
-- ============================================

-- Users can view appointments in their clinic
CREATE POLICY "Users can view appointments in their clinic" ON appointments
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can insert appointments in their clinic
CREATE POLICY "Users can insert appointments in their clinic" ON appointments
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can update appointments in their clinic
CREATE POLICY "Users can update appointments in their clinic" ON appointments
    FOR UPDATE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Owners and managers can delete appointments
CREATE POLICY "Owners and managers can delete appointments" ON appointments
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role IN ('owner', 'manager')
        )
    );

-- ============================================
-- RLS POLICIES: patient_notes
-- ============================================

-- Users can view notes for patients in their clinic
CREATE POLICY "Users can view patient notes in their clinic" ON patient_notes
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can insert notes in their clinic
CREATE POLICY "Users can insert patient notes" ON patient_notes
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can update their own notes
CREATE POLICY "Users can update own notes" ON patient_notes
    FOR UPDATE
    USING (created_by = auth.uid());

-- Owners can delete notes in their clinic
CREATE POLICY "Owners can delete patient notes" ON patient_notes
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- RLS POLICIES: activity_logs
-- ============================================

-- Users can view activity logs in their clinic
CREATE POLICY "Users can view activity logs in their clinic" ON activity_logs
    FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Users can insert activity logs in their clinic
CREATE POLICY "Users can insert activity logs" ON activity_logs
    FOR INSERT
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Owners can delete activity logs
CREATE POLICY "Owners can delete activity logs" ON activity_logs
    FOR DELETE
    USING (
        clinic_id IN (
            SELECT clinic_id FROM profiles 
            WHERE id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE clinics IS 'Clinic/Organization data for multi-tenant setup';
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users with app-specific data';
COMMENT ON TABLE patients IS 'Patient/Lead information with funnel tracking';
COMMENT ON TABLE treatments IS 'Available treatments/services offered by clinic';
COMMENT ON TABLE appointments IS 'Scheduled appointments with patients';
COMMENT ON TABLE patient_notes IS 'Notes and observations about patients';
COMMENT ON TABLE activity_logs IS 'Audit trail of user actions';

-- ============================================
-- NOTES
-- ============================================
-- 1. auth.users is managed by Supabase Auth (signup/signin/password reset)
-- 2. profiles is app data linked to auth.users via FOREIGN KEY
-- 3. When a user signs up, trigger auto-creates profile
-- 4. RLS policies verify clinic_id of user vs table
-- 5. Queries use auth.uid() to verify access
-- 6. All tables have clinic_id for multi-tenant isolation
-- 7. updated_at is automatically updated via trigger
-- 8. Use CHECK constraints instead of ENUM types (portable)
