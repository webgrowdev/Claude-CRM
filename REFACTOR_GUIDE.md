# CRM Refactor Implementation Guide

This document outlines the remaining work for the comprehensive CRM refactor to transform it into a premium SaaS platform.

## ✅ Completed Items

### BLOQUE 2: Quick Wins (P2-P3)
- **2.6 [P2] Clean legacy auth tokens** ✅
  - Splash page now uses AuthContext instead of direct localStorage access
  - Legacy token cleanup maintained as fallback in logout flows
  
- **2.7 [P2] i18n Consistency** ✅
  - Removed hardcoded language strings from BottomNav
  - All navigation now uses `t.xxx` translation keys
  - Added new translation keys with descriptive subtitles

- **2.8 [P3] Unify auth types** ✅
  - Removed unused `src/types/auth.ts` file
  - AuthContext is now the single source of truth

- **2.10 [P3] Remove mock data** ✅
  - Removed unused `src/data/mockData.ts`
  - File was not imported anywhere in the codebase

### BLOQUE 1: Navigation Renaming
- **1.3 Rename navigation labels** ✅
  - Appointments → "Recepción" (Reception)
  - Calendar → "Agenda"
  - Added descriptive subtitles for each section
  - Updated both Spanish and English translations

---

## 🚧 Remaining Critical Work

### BLOQUE 2: Core Refactors (P0-P1)

#### 2.1 [P0] Unify Lead/Patient - CRITICAL

**Current State:**
- `Patient = Lead` is an alias (line 87 in `src/types/index.ts`)
- Multiple pages exist for the same entity: `/leads`, `/inbox`, `/pacientes`
- Inbox treats leads with `status === 'new'` separately

**Implementation Steps:**

1. **Update Type Definitions** (`src/types/index.ts`)
   ```typescript
   // Remove: export type Patient = Lead
   // Rename interface Lead to Patient throughout
   
   export interface Patient {
     id: string
     name: string
     // ... keep all existing fields
   }
   ```

2. **Update AppContext** (`src/contexts/AppContext.tsx`)
   ```typescript
   // Rename state.leads → state.patients
   interface AppState {
     patients: Patient[]  // was: leads: Lead[]
     // ... rest unchanged
   }
   
   // Update all action types:
   // SET_LEADS → SET_PATIENTS
   // ADD_LEAD → ADD_PATIENT
   // UPDATE_LEAD → UPDATE_PATIENT
   // etc.
   ```

3. **Update All Components**
   - Search and replace `state.leads` → `state.patients`
   - Search and replace `addLead` → `addPatient`
   - Update imports: `import { Lead }` → `import { Patient }`

4. **Convert Inbox to Filtered View**
   - `/inbox` should filter `patients.filter(p => p.status === 'new')`
   - Remove any duplicate lead creation logic
   - Use same patient creation modal as other pages

5. **API Routes**
   - Update `/api/patients/route.ts` (if not already renamed from leads)
   - Ensure all endpoints use "patient" terminology

**Files to Modify:**
- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- `src/app/inbox/page.tsx`
- `src/app/pacientes/page.tsx`
- All components that reference `Lead` or `state.leads`

---

#### 2.2 [P0] Unify status/funnelStatus - CRITICAL

**Current State:**
- Each patient has TWO status fields:
  - `status: LeadStatus` (deprecated: 'new' | 'contacted' | 'scheduled' | 'closed' | 'lost')
  - `funnelStatus?: FunnelStatus` (new: 'new' | 'contacted' | 'appointment' | 'attended' | 'closed' | 'followup' | 'lost' | 'noshow')
- Most code uses the deprecated `status` field

**Implementation Steps:**

1. **Update Type Definition** (`src/types/index.ts`)
   ```typescript
   // Remove LeadStatus type entirely
   // Remove: export type LeadStatus = 'new' | 'contacted' | 'scheduled' | 'closed' | 'lost'
   
   export interface Patient {
     // Remove: status: LeadStatus
     status: FunnelStatus  // Make required, rename from funnelStatus
     // ... rest unchanged
   }
   
   // Remove deprecated types:
   // export type AttendanceStatus = ... (line 105)
   // export type AppointmentLevelStatus = ... (line 111)
   ```

2. **Create Migration Helper** (temporary, for database migration)
   ```typescript
   // src/lib/migrations/statusMigration.ts
   export function mapLegacyStatus(oldStatus: string): FunnelStatus {
     switch (oldStatus) {
       case 'new': return 'new'
       case 'contacted': return 'contacted'
       case 'scheduled': return 'appointment'
       case 'closed': return 'closed'
       case 'lost': return 'lost'
       default: return 'new'
     }
   }
   ```

3. **Update AppContext**
   ```typescript
   // In fetchLeads/fetchPatients:
   status: patient.funnel_status || mapLegacyStatus(patient.status),
   ```

4. **Update All Components**
   - Find all: `patient.status === 'new'` → verify matches FunnelStatus values
   - Find all: `lead.status ===` and update to use FunnelStatus values
   - Update Kanban to use FunnelStatus columns

5. **Database Migration** (if using Supabase)
   ```sql
   -- Add funnel_status column if not exists
   ALTER TABLE patients ADD COLUMN IF NOT EXISTS funnel_status TEXT;
   
   -- Migrate data
   UPDATE patients 
   SET funnel_status = CASE status
     WHEN 'new' THEN 'new'
     WHEN 'contacted' THEN 'contacted'
     WHEN 'scheduled' THEN 'appointment'
     WHEN 'closed' THEN 'closed'
     WHEN 'lost' THEN 'lost'
     ELSE 'new'
   END
   WHERE funnel_status IS NULL;
   
   -- Eventually: ALTER TABLE patients DROP COLUMN status;
   ```

**Files to Modify:**
- `src/types/index.ts`
- `src/contexts/AppContext.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/BottomNav.tsx`
- `src/app/kanban/page.tsx`
- All components filtering by status

---

#### 2.3 [P1] Integrate Kanban as View within Patients

**Current State:**
- `/kanban` is a separate route
- Listed in "More" section of Sidebar
- Uses deprecated LeadStatus

**Implementation Steps:**

1. **Update Pacientes Page** (`src/app/pacientes/page.tsx`)
   ```typescript
   type ViewMode = 'list' | 'kanban'
   const [viewMode, setViewMode] = useState<ViewMode>('list')
   
   // Add toggle buttons
   <div className="flex gap-2 mb-4">
     <Button onClick={() => setViewMode('list')}>Vista Lista</Button>
     <Button onClick={() => setViewMode('kanban')}>Vista Kanban</Button>
   </div>
   
   {viewMode === 'list' ? <PatientList /> : <KanbanView />}
   ```

2. **Create KanbanView Component**
   - Extract Kanban logic from `/app/kanban/page.tsx`
   - Move to `src/components/patients/KanbanView.tsx`
   - Update to use unified `status` (FunnelStatus)

3. **Remove Kanban Route**
   - Delete `src/app/kanban/` directory (or keep as redirect)
   - Remove from Sidebar navigation

**Files to Modify:**
- `src/app/pacientes/page.tsx`
- `src/components/patients/KanbanView.tsx` (new)
- `src/components/layout/Sidebar.tsx`
- `src/app/kanban/page.tsx` (delete or redirect)

---

#### 2.4 [P1] Unify Contact Creation - Single Form

**Current State:**
- Multiple entry points create patients/leads with different forms
- Duplicate logic in Sidebar, Inbox, Pacientes pages

**Implementation Steps:**

1. **Create Unified Modal** (`src/components/patients/CreatePatientModal.tsx`)
   ```typescript
   interface CreatePatientModalProps {
     isOpen: boolean
     onClose: () => void
     onSuccess?: (patient: Patient) => void
     defaultValues?: Partial<Patient>
   }
   
   export function CreatePatientModal({ isOpen, onClose, onSuccess }: CreatePatientModalProps) {
     // Single source of truth for patient creation
     // Handles form validation
     // Calls AppContext addPatient
     // Shows success/error states
   }
   ```

2. **Update All Entry Points**
   - Sidebar: Use `<CreatePatientModal />`
   - Inbox: Use `<CreatePatientModal />`
   - Pacientes: Use `<CreatePatientModal />`
   - Remove duplicate `handleAddLead` / `handleAddPatient` functions

**Files to Create/Modify:**
- `src/components/patients/CreatePatientModal.tsx` (new)
- `src/components/layout/Sidebar.tsx`
- `src/app/inbox/page.tsx`
- `src/app/pacientes/page.tsx`

---

### BLOQUE 1: Appointments vs Agenda Separation

#### 1.1 Migrate Appointments from followUps[] to appointments table

**Current State:**
- In-person appointments stored as `followUps` with `type === 'appointment'`
- Separate `appointments` table exists in database but underutilized
- `state.appointments` exists in AppContext

**Implementation Steps:**

1. **Create Appointments Service** (`src/services/appointments.service.ts`)
   ```typescript
   export async function getAppointments(clinicId: string, filters?: AppointmentFilters) {
     // Query appointments table directly
   }
   
   export async function createAppointment(data: CreateAppointmentData) {
     // Insert into appointments table only
   }
   
   export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
     // Update appointment, NOT followUp
   }
   ```

2. **Update AppContext**
   - `state.appointments` should load from appointments table
   - Remove appointment-type followUps from being treated as appointments
   - Keep only: 'call', 'message', 'email', 'meeting' in followUps

3. **Update Appointments Page** (`src/app/appointments/page.tsx`)
   ```typescript
   // Line 72-85: Change useMemo to read from state.appointments
   const appointments = useMemo(() => {
     return state.appointments  // Not state.leads.flatMap(...)
       .filter(apt => {
         // Apply date/doctor filters
       })
       .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
   }, [state.appointments, selectedDate])
   ```

4. **Update FollowUp Creation**
   - When creating `type: 'appointment'`, use `createAppointment()` service
   - Other types continue using followUps

**Files to Create/Modify:**
- `src/services/appointments.service.ts` (new)
- `src/contexts/AppContext.tsx`
- `src/app/appointments/page.tsx`
- `src/components/calendar/ScheduleFollowUpModal.tsx`

---

#### 1.2 Eliminate Data Overlap Between Agenda and Appointments

**Current State:**
- Calendar shows ALL followUp types including appointments
- Appointments page also shows appointments
- Both pages allow check-in actions

**Implementation Steps:**

1. **Update Calendar Page** (`src/app/calendar/page.tsx`)
   ```typescript
   // Show only non-appointment followUps
   const agendaItems = useMemo(() => {
     return state.leads.flatMap(lead =>
       lead.followUps
         .filter(fu => fu.type !== 'appointment')  // Exclude appointments
         .map(fu => ({ lead, followUp: fu }))
     )
   }, [state.leads])
   
   // Optionally show appointments as read-only reference
   const appointmentReferences = useMemo(() => {
     return state.appointments.map(apt => ({
       ...apt,
       isReference: true  // Flag for different rendering
     }))
   }, [state.appointments])
   ```

2. **Add Reference Badge for Appointments**
   ```typescript
   {item.isReference && (
     <Badge variant="outline" className="flex items-center gap-1">
       <MapPin className="w-3 h-3" />
       <Link href={`/appointments?date=${format(item.date, 'yyyy-MM-dd')}`}>
         {t.nav.manageInReception} →
       </Link>
     </Badge>
   )}
   ```

3. **Remove Check-in Actions from Calendar**
   - Remove "Asistió/No vino/Reprogramar" buttons from calendar view
   - Keep only "Marcar completado" for followUps
   - Keep "Unirse a Google Meet" for virtual meetings

**Files to Modify:**
- `src/app/calendar/page.tsx`
- `src/app/appointments/page.tsx`

---

#### 1.4 Adapt /calendar as General Agenda

**Current State:**
- Calendar shows mixed event types
- No clear visual distinction between types

**Implementation Steps:**

1. **Add Type Indicators** (`src/app/calendar/page.tsx`)
   ```typescript
   import { cn } from '@/lib/utils'
   
   const eventTypeConfig = {
     call: { icon: Phone, color: 'border-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700', label: '🔵 Llamada' },
     message: { icon: MessageCircle, color: 'border-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700', label: '💬 Mensaje' },
     meeting: { icon: Video, color: 'border-violet-500', bgColor: 'bg-violet-50', textColor: 'text-violet-700', label: '🟣 Videollamada' },
     appointment: { icon: MapPin, color: 'border-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700', label: '🟢 Cita presencial' }
   }
   
   // Use in rendering with complete class names:
   const config = eventTypeConfig[item.type]
   <div className={cn('border-l-4', config.color)}>
     <config.icon className="w-4 h-4" />
     <span className={config.textColor}>{config.label}</span>
   </div>
   ```

2. **Add Appointment Reference UI**
   ```typescript
   {item.type === 'appointment' && (
     <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
       <div className="flex items-center gap-2">
         <MapPin className="w-4 h-4 text-green-600" />
         <span className="text-sm text-green-700">Cita presencial</span>
       </div>
       <Link href={`/appointments?id=${item.id}`}>
         <Button size="sm" variant="outline" className="mt-2">
           {t.nav.manageInReception} →
         </Button>
       </Link>
     </div>
   )}
   ```

**Files to Modify:**
- `src/app/calendar/page.tsx`

---

#### 1.5 Evolve /appointments as Premium Reception Feature

**Implementation Steps:**

1. **Add Doctor Filter**
   ```typescript
   const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
   const doctors = useMemo(() => {
     // Get unique doctors from appointments or team
     return state.team?.filter(t => t.role === 'doctor') || []
   }, [state.team])
   
   <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
     <option value="all">Todos los doctores</option>
     {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
   </select>
   ```

2. **Add "Next Patient" Indicator**
   ```typescript
   const nextAppointment = appointments
     .filter(apt => apt.status === 'pending' || apt.status === 'confirmed')
     .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]
   
   {nextAppointment && (
     <Card className="border-2 border-primary-500 shadow-lg">
       <div className="flex items-center gap-2 mb-2">
         <Badge variant="primary">Próximo Paciente</Badge>
         <Clock className="w-4 h-4 animate-pulse" />
       </div>
       {/* Appointment details */}
     </Card>
   )}
   ```

**Files to Modify:**
- `src/app/appointments/page.tsx`

---

#### 2.5 [P2] Standardize Desktop/Mobile Navigation

**Current State:**
- Desktop Sidebar and Mobile BottomNav show different items
- Some sections only accessible on one platform

**Implementation Steps:**

1. **Update BottomNav** (`src/components/layout/BottomNav.tsx`)
   ```typescript
   const navItems = [
     { href: '/dashboard', label: t.nav.home, icon: LayoutDashboard },
     { href: '/inbox', label: t.nav.inbox, icon: Inbox, badge: newLeadsCount },
     { href: '/appointments', label: t.nav.appointments, icon: MapPin, badge: todayAppointments },
     { href: '/pacientes', label: t.nav.patients, icon: Users },
     { href: '/settings', label: t.nav.more, icon: MoreHorizontal }, // Opens drawer
   ]
   ```

2. **Create "More" Drawer for Mobile**
   ```typescript
   // When "More" is tapped, show drawer with:
   // - Reports
   // - Agenda (Calendar)
   // - Treatments
   // - Settings
   ```

**Files to Modify:**
- `src/components/layout/BottomNav.tsx`
- Create `src/components/layout/MobileMoreDrawer.tsx`

---

#### 2.9 [P3] Shared Service Layer for APIs

**Current State:**
- Duplicate logic in `/api/appointments` and `/api/v1/appointments`
- Same for patients routes

**Implementation Steps:**

1. **Create Services**
   ```typescript
   // src/services/patients.service.ts
   export class PatientsService {
     static async getPatients(clinicId: string, filters?: PatientFilters) {}
     static async getPatient(id: string) {}
     static async createPatient(data: CreatePatientData) {}
     static async updatePatient(id: string, data: UpdatePatientData) {}
     static async deletePatient(id: string) {}
   }
   
   // src/services/appointments.service.ts (already mentioned above)
   ```

2. **Update API Routes**
   ```typescript
   // /api/patients/route.ts
   import { PatientsService } from '@/services/patients.service'
   
   export async function GET(request: NextRequest) {
     // Auth checks
     const patients = await PatientsService.getPatients(clinicId, filters)
     return Response.json(patients)
   }
   
   // /api/v1/patients/route.ts - same implementation
   ```

**Files to Create/Modify:**
- `src/services/patients.service.ts` (new)
- `src/services/appointments.service.ts` (new)
- `src/app/api/patients/route.ts`
- `src/app/api/v1/patients/route.ts`
- `src/app/api/appointments/route.ts`
- `src/app/api/v1/appointments/route.ts`

---

## 🧪 Testing Strategy

After implementing each section:

1. **Type Check**: `npm run type-check`
2. **Build**: `npm run build`
3. **Manual Testing**:
   - Create a patient
   - Schedule different types of follow-ups
   - View calendar
   - View appointments/reception
   - Check navigation on desktop and mobile
   - Test status updates

---

## 📝 Notes

- Pre-existing TypeScript errors in API routes related to Supabase types (not introduced by refactor)
- Database schema changes may be required for status migration
- Consider feature flags for gradual rollout
- Backup database before running migrations

---

## 🎯 Priority Order for Implementation

1. **2.2** - Unify status (foundation for everything)
2. **2.1** - Unify Lead/Patient (conceptual clarity)
3. **1.1** - Migrate appointments to table (data separation)
4. **1.2** - Eliminate overlap (UX clarity)
5. **2.3** - Integrate Kanban (simplify navigation)
6. **2.4** - Unify creation modal (consistent UX)
7. **1.4** - Calendar visual updates (polish)
8. **1.5** - Reception features (value add)
9. **2.5** - Navigation standardization (accessibility)
10. **2.9** - Service layer (code quality)
