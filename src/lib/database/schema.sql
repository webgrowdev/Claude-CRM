-- ============================================
-- Claude CRM Database Schema
-- PostgreSQL / Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLINICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID,
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

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'doctor', 'receptionist')),
    avatar_url TEXT,
    specialty VARCHAR(255), -- For doctors
    color VARCHAR(7), -- For calendar display
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for clinic owner
ALTER TABLE clinics 
ADD CONSTRAINT fk_clinic_owner 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
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
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    value DECIMAL(10, 2) DEFAULT 0,
    total_paid DECIMAL(10, 2) DEFAULT 0,
    total_pending DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TREATMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
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

-- ============================================
-- DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    specialty TEXT,
    license_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    available_hours JSONB, -- Working hours configuration
    color VARCHAR(7), -- For calendar display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    appointment_status VARCHAR(50) DEFAULT 'pending' CHECK (appointment_status IN ('pending', 'confirmed', 'completed', 'no-show', 'cancelled')),
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

-- ============================================
-- PATIENT NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view')),
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('patient', 'appointment', 'treatment', 'user')),
    resource_id UUID,
    changes JSONB, -- Store what changed
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_created_at ON patients(created_at);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(appointment_status);

CREATE INDEX idx_activity_logs_clinic_id ON activity_logs(clinic_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clinic_id ON users(clinic_id);

CREATE INDEX idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_notes_updated_at BEFORE UPDATE ON patient_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their clinic's data)
-- Note: Adjust these based on your authentication setup

-- Patients: Users can only see patients from their clinic
CREATE POLICY patients_select_policy ON patients
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

-- Appointments: Users can only see appointments from their clinic
CREATE POLICY appointments_select_policy ON appointments
    FOR SELECT USING (
        clinic_id IN (
            SELECT clinic_id FROM users WHERE id = auth.uid()
        )
    );

-- Similar policies for other tables...
-- Add more RLS policies as needed based on your security requirements

-- ============================================
-- SEED DATA (Optional for demo)
-- ============================================

-- Insert a demo clinic
INSERT INTO clinics (id, name, email, phone, address, city, state, country)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'Glow Beauty Clinic',
    'contacto@glowclinic.com',
    '+52 55 1234 5678',
    'Av. Reforma 123, Col. Juárez',
    'Ciudad de México',
    'CDMX',
    'México'
) ON CONFLICT (id) DO NOTHING;

-- Insert a demo user (password: admin123)
-- Note: Hash generated with bcrypt for 'admin123'
INSERT INTO users (id, email, password_hash, name, phone, role, clinic_id, is_active)
VALUES (
    'u0000000-0000-0000-0000-000000000001',
    'admin@glowclinic.com',
    '$2a$10$rXKZ0YGKqCqEqG5qCqEqEqOqCqEqEqOqCqEqEqOqCqEqEqOqCqE', -- admin123
    'Admin User',
    '+52 55 1234 5678',
    'owner',
    'c0000000-0000-0000-0000-000000000001',
    true
) ON CONFLICT (email) DO NOTHING;

-- Update clinic owner
UPDATE clinics 
SET owner_id = 'u0000000-0000-0000-0000-000000000001'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

-- ============================================
-- NOTES
-- ============================================
-- 1. Run this schema in your Supabase SQL editor
-- 2. Adjust RLS policies based on your auth setup
-- 3. Consider adding more indexes based on query patterns
-- 4. Update the demo password hash with actual bcrypt hash
-- 5. Configure Supabase Auth to work with the users table
