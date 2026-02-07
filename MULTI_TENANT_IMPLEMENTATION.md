# Multi-Tenant Implementation Guide

This document explains the complete multi-tenant architecture implementation for Claude-CRM.

## Overview

The system has been made fully multi-tenant, ensuring that:
- Each clinic's data is completely isolated
- External integrations can specify which clinic they're working with
- Webhooks can route to the correct clinic
- Cached data on the frontend is namespaced by clinic

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/004_add_clinic_api_key.sql`

- Added `api_key` column to `clinics` table for external API authentication
- Created index for fast API key lookups
- Auto-generates unique API keys for all clinics
- API keys follow the format: `ck_<64-char-hex>`

### 2. Type Definitions

**File:** `src/types/database.ts`

- Updated `clinics` table type to include `api_key: string | null`
- Added to Row, Insert, and Update types

### 3. Patient Creation API Enhancement

**File:** `src/app/api/patients/route.ts` (POST method)

**Changes:**
- Admins (owner/manager roles) can now specify `clinic_id` in request body to create patients for other clinics
- Validates that the specified clinic exists before creating the patient
- Regular users still get their JWT's `clinicId` automatically (no override allowed)

**Usage:**
```javascript
// Regular user - uses their JWT clinicId
POST /api/patients
Authorization: Bearer <jwt>
{ "name": "John Doe", "phone": "+1234567890" }

// Admin creating patient for another clinic
POST /api/patients
Authorization: Bearer <jwt>
{
  "name": "John Doe",
  "phone": "+1234567890",
  "clinic_id": "clinic-uuid-here"  // Only works for owner/manager roles
}
```

### 4. ManyChat Webhook Multi-Tenant Support

**File:** `src/app/api/webhooks/manychat/route.ts`

**Changes:**
- No longer uses hardcoded `NEXT_PUBLIC_DEFAULT_CLINIC_ID`
- Determines clinic from multiple sources (in order of priority):
  1. `clinic_id` query parameter in webhook URL
  2. `X-Webhook-Secret` header matched against `manychat_settings.webhook_secret`
  3. Falls back to `NEXT_PUBLIC_DEFAULT_CLINIC_ID` for backward compatibility

**Usage:**
```bash
# Method 1: Use clinic_id query param
POST /api/webhooks/manychat?clinic_id=<clinic-uuid>

# Method 2: Use webhook secret header
POST /api/webhooks/manychat
X-Webhook-Secret: <clinic-specific-secret>

# Method 3: Fallback (backward compatible)
POST /api/webhooks/manychat
# Uses NEXT_PUBLIC_DEFAULT_CLINIC_ID from .env
```

**Setup for each clinic:**
1. Add a unique `webhook_secret` in the `manychat_settings` table for the clinic
2. Configure ManyChat webhook URL: `https://your-domain.com/api/webhooks/manychat?clinic_id=<uuid>`
3. Or configure webhook to send `X-Webhook-Secret` header

### 5. Public API v1 - Patients

**File:** `src/app/api/v1/patients/route.ts`

New public API endpoint for external integrations using API key authentication.

**Authentication:**
- Requires `X-API-Key` header
- API key is looked up in `clinics.api_key` column
- All operations are scoped to the authenticated clinic

**Endpoints:**

```bash
# Create or update patient
POST /api/v1/patients
X-API-Key: ck_<your-clinic-api-key>
Content-Type: application/json
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "source": "website",
  "status": "new"
}

# Response:
{
  "success": true,
  "patient": { ... },
  "action": "created" | "updated"
}

# List patients
GET /api/v1/patients?search=jane&limit=50
X-API-Key: ck_<your-clinic-api-key>

# Response:
{
  "success": true,
  "patients": [...]
}
```

**Features:**
- Automatic deduplication by phone number within the clinic
- Updates existing patient if phone matches
- Returns action type ("created" or "updated")

### 6. Public API v1 - Appointments

**File:** `src/app/api/v1/appointments/route.ts`

New public API endpoint for external appointment management.

**Endpoints:**

```bash
# Create appointment
POST /api/v1/appointments
X-API-Key: ck_<your-clinic-api-key>
Content-Type: application/json
{
  "patient_id": "patient-uuid",
  "scheduled_at": "2024-03-20T10:00:00Z",
  "duration": 30,
  "doctor_id": "doctor-uuid",  // optional
  "treatment_id": "treatment-uuid",  // optional
  "status": "pending",
  "method": "in-person",
  "notes": "First consultation"
}

# List appointments
GET /api/v1/appointments?patient_id=<uuid>&start_date=2024-03-01&end_date=2024-03-31
X-API-Key: ck_<your-clinic-api-key>
```

**Security:**
- Verifies patient belongs to the clinic before creating appointment
- All queries filtered by clinic_id

### 7. Clinic Info API

**File:** `src/app/api/clinic/route.ts`

Endpoint for authenticated users to view/edit their clinic information.

**Endpoints:**

```bash
# Get clinic info
GET /api/clinic
Authorization: Bearer <jwt>

# Update clinic info (owner/manager only)
PUT /api/clinic
Authorization: Bearer <jwt>
Content-Type: application/json
{
  "name": "Updated Clinic Name",
  "email": "contact@clinic.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "timezone": "America/New_York"
}
```

### 8. Team API

**File:** `src/app/api/team/route.ts`

Endpoint to list team members for the authenticated user's clinic.

```bash
GET /api/team
Authorization: Bearer <jwt>

# Response:
{
  "success": true,
  "members": [
    {
      "id": "uuid",
      "name": "Dr. Smith",
      "role": "doctor",
      "phone": "+1234567890",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 9. Clinic Settings Page

**File:** `src/app/settings/clinic/page.tsx`

**Changes:**
- Loads clinic data from `/api/clinic` on mount
- Saves changes via `PUT /api/clinic`
- Shows loading state while fetching
- Displays save confirmation

### 10. Team Settings Page

**File:** `src/app/settings/team/page.tsx`

**Changes:**
- Loads team members from `/api/team` on mount
- Updated role types to match database: `owner`, `manager`, `doctor`, `receptionist`
- Shows loading state while fetching

### 11. Frontend localStorage Isolation

**File:** `src/contexts/AppContext.tsx`

**Changes:**
- Added `getClinicIdFromToken()` helper to decode JWT and extract clinicId
- Added `getStorageKey(key)` helper to namespace all localStorage keys
- All localStorage operations now use format: `clinic_<clinicId>_<key>`
- Example: `clinic_uuid-123_leads` instead of `clinic_leads`

**Benefits:**
- Multiple users from different clinics can use the same browser
- Cached data won't leak between clinics
- Switching accounts properly clears/loads correct clinic data

## Security Considerations

### API Key Management

**DO:**
- Store API keys securely in environment variables or secrets management
- Rotate API keys periodically
- Use HTTPS only for all API requests
- Monitor API key usage for anomalies

**DON'T:**
- Commit API keys to git repositories
- Share API keys between different environments (dev/staging/prod)
- Log API keys in application logs
- Send API keys in query parameters

### Access Control

All endpoints properly verify:
1. Authentication (JWT or API key)
2. Clinic ownership of resources
3. Role-based permissions (owner/manager for certain operations)

### Data Isolation Guarantees

- **Database level:** All queries filter by `clinic_id`
- **API level:** JWT payload or API key determines clinic context
- **Frontend level:** localStorage namespaced by clinic
- **Webhooks:** Require clinic identification via secret or parameter

## Testing Multi-Tenancy

### Manual Testing Checklist

- [ ] Create patient via POST /api/patients (regular user)
- [ ] Create patient via POST /api/patients with clinic_id (admin user)
- [ ] Verify ManyChat webhook routes to correct clinic
- [ ] Test API v1 endpoints with API key
- [ ] Verify clinic settings load and save correctly
- [ ] Verify team members load correctly
- [ ] Test localStorage isolation by logging in as different clinics
- [ ] Verify no data leaks between clinics in all API endpoints

### Integration Tests

Example test for multi-tenant isolation:

```javascript
// Test that clinic A cannot access clinic B's patients
const clinicAToken = 'jwt-for-clinic-a'
const clinicBToken = 'jwt-for-clinic-b'

// Create patient in clinic A
await fetch('/api/patients', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${clinicAToken}` },
  body: JSON.stringify({ name: 'Patient A', phone: '+1111111111' })
})

// Try to list patients from clinic B
const response = await fetch('/api/patients', {
  headers: { 'Authorization': `Bearer ${clinicBToken}` }
})

const { patients } = await response.json()
// Should NOT contain Patient A
expect(patients.find(p => p.phone === '+1111111111')).toBeUndefined()
```

## Migration Guide for Existing Installations

### Step 1: Run Database Migration

```bash
# Apply the migration
cd supabase
psql $DATABASE_URL < migrations/004_add_clinic_api_key.sql
```

### Step 2: Generate API Keys

The migration automatically generates API keys for existing clinics. You can regenerate them:

```sql
UPDATE clinics 
SET api_key = 'ck_' || encode(gen_random_bytes(32), 'hex')
WHERE api_key IS NULL;
```

### Step 3: Update ManyChat Webhooks

For each clinic using ManyChat:

1. Get the clinic's UUID from the database
2. Update the webhook URL to include `clinic_id` parameter:
   ```
   https://your-domain.com/api/webhooks/manychat?clinic_id=<clinic-uuid>
   ```

Or:

1. Generate a unique webhook secret for the clinic
2. Update `manychat_settings.webhook_secret` for that clinic
3. Configure ManyChat to send the secret in `X-Webhook-Secret` header

### Step 4: Clear Old localStorage (Optional)

Users may have old cached data without clinic namespacing. Options:

1. **Automatic:** The system will naturally create new namespaced keys on next use
2. **Manual:** Ask users to clear browser data for the domain
3. **Programmatic:** Add migration code to clear old keys:

```javascript
// Add to AppContext useEffect
if (typeof window !== 'undefined') {
  const oldKeys = ['clinic_leads', 'clinic_treatments', 'clinic_settings', 'clinic_user']
  oldKeys.forEach(key => localStorage.removeItem(key))
}
```

## Troubleshooting

### Issue: Webhook creates patient in wrong clinic

**Check:**
1. Is `clinic_id` parameter in webhook URL?
2. Is webhook secret correctly configured in `manychat_settings`?
3. Is `NEXT_PUBLIC_DEFAULT_CLINIC_ID` set as fallback?

### Issue: API key authentication fails

**Check:**
1. Is API key in correct format: `ck_<64-hex-chars>`?
2. Does the API key exist in `clinics.api_key`?
3. Is header name exact: `X-API-Key` (case-insensitive)?

### Issue: localStorage data not loading

**Check:**
1. Is JWT token valid and contains `clinicId`?
2. Check browser console for JWT decode errors
3. Verify token format is standard JWT (3 parts separated by dots)

### Issue: Settings not saving

**Check:**
1. User role is `owner` or `manager` (required for clinic updates)
2. JWT token is valid and not expired
3. Network tab shows successful PUT request
4. Check API logs for error details

## API Reference Summary

### Public APIs (API Key Required)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/patients` | GET | List patients for clinic |
| `/api/v1/patients` | POST | Create/update patient |
| `/api/v1/appointments` | GET | List appointments |
| `/api/v1/appointments` | POST | Create appointment |

### Authenticated APIs (JWT Required)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/patients` | GET | Any | List clinic's patients |
| `/api/patients` | POST | Any (owner/manager for clinic_id override) | Create patient |
| `/api/patients` | PUT | Any | Update patient |
| `/api/patients` | DELETE | Any | Delete patient |
| `/api/clinic` | GET | Any | Get clinic info |
| `/api/clinic` | PUT | owner, manager | Update clinic info |
| `/api/team` | GET | Any | List team members |
| `/api/appointments` | GET/POST/PUT/DELETE | Any | Manage appointments |

### Public Webhooks

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/manychat` | POST | Receive ManyChat events |
| `/api/webhooks/manychat` | GET | Webhook health check |

## Future Enhancements

Potential improvements for the multi-tenant system:

1. **Rate Limiting:** Per-clinic API rate limits
2. **Usage Analytics:** Track API usage per clinic
3. **API Key Rotation:** Automated key rotation with grace periods
4. **Audit Logging:** Enhanced logging of cross-clinic operations
5. **Backup & Restore:** Per-clinic data export/import
6. **Custom Domains:** Allow clinics to use their own domains
7. **White-labeling:** Clinic-specific branding and UI customization

## Support

For issues or questions about the multi-tenant implementation:
- Check the troubleshooting section above
- Review API endpoint documentation
- Check database migrations are applied
- Verify environment variables are set correctly
