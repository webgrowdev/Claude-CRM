-- ============================================
-- Demo/Test Data for Claude CRM
-- ============================================
-- This file contains seed data for testing
-- Run this AFTER running 001_initial_schema.sql
-- ============================================

-- Insert demo clinic
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

-- Note: Users are created via Supabase Auth signup
-- Profiles will be auto-created via trigger when users sign up
-- For testing, you'll need to:
-- 1. Sign up via Supabase Auth (e.g., using Supabase client)
-- 2. Profile will be auto-created with trigger
-- 3. Manually update profile's clinic_id and role if needed

-- Insert demo treatments
INSERT INTO treatments (id, clinic_id, name, category, price, duration, description, is_active)
VALUES
    (
        't0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'Botox (Toxina Botulínica)',
        'Facial Aesthetics',
        3500.00,
        45,
        'Tratamiento con toxina botulínica para reducción de arrugas de expresión',
        true
    ),
    (
        't0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'Relleno con Ácido Hialurónico',
        'Facial Aesthetics',
        4500.00,
        60,
        'Relleno dérmico para restaurar volumen y suavizar arrugas',
        true
    ),
    (
        't0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'Hidrafacial',
        'Skin Care',
        1800.00,
        60,
        'Tratamiento de limpieza facial profunda con hidratación',
        true
    ),
    (
        't0000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'Peeling Químico',
        'Skin Care',
        2200.00,
        45,
        'Exfoliación química para renovación de la piel',
        true
    ),
    (
        't0000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000001',
        'Láser CO2 Fraccionado',
        'Laser Treatments',
        5500.00,
        90,
        'Tratamiento con láser para rejuvenecimiento y cicatrices',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Insert demo patients
-- Note: These patients won't have assigned_to until we have user profiles
INSERT INTO patients (id, clinic_id, name, email, phone, source, status, funnel_status, campaign, tags)
VALUES
    (
        'p0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'María González',
        'maria.gonzalez@email.com',
        '+52 55 9876 5432',
        'instagram',
        'new',
        'new',
        'Campaña Instagram Abril',
        ARRAY['botox', 'interesada']
    ),
    (
        'p0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'Laura Martínez',
        'laura.martinez@email.com',
        '+52 55 8765 4321',
        'whatsapp',
        'contacted',
        'contacted',
        'WhatsApp Mayo',
        ARRAY['rellenos', 'alta-prioridad']
    ),
    (
        'p0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000001',
        'Ana Rodríguez',
        'ana.rodriguez@email.com',
        '+52 55 7654 3210',
        'referral',
        'scheduled',
        'appointment',
        NULL,
        ARRAY['hidrafacial', 'vip']
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- NOTES
-- ============================================
-- 1. To add actual users, use Supabase Auth signup
-- 2. After signup, profiles are auto-created via trigger
-- 3. Update profiles.clinic_id and profiles.role as needed
-- 4. Example: UPDATE profiles SET clinic_id = 'c0000000-0000-0000-0000-000000000001', role = 'owner' WHERE id = '<user_auth_id>';
-- 5. Appointments should be created through the app once you have profiles
-- 6. Patient notes and activity logs will be created through normal app usage
