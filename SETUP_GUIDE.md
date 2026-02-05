# Claude CRM - Setup Guide

## 🚀 Quick Start

This comprehensive CRM system includes authentication, database integration, and all necessary pages for clinic management.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

## 🔧 Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**

Create a `.env.local` file based on `.env.example`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-secure-jwt-secret

# Google OAuth (optional, for calendar integration)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Set up Supabase database:**

- Go to your Supabase project
- Navigate to SQL Editor
- Run the schema from `src/lib/database/schema.sql`
- This will create all necessary tables, indexes, and seed data

4. **Run the development server:**
```bash
npm run dev
```

5. **Access the application:**
Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Structure

The system includes the following tables:

- **clinics** - Clinic information
- **users** - User accounts with authentication
- **patients** - Patient records
- **appointments** - Appointment scheduling
- **doctors** - Doctor profiles and schedules
- **treatments** - Treatment catalog
- **patient_notes** - Patient notes and history
- **activity_logs** - System activity tracking

## 🔐 Authentication

### Default Demo Credentials
- Email: `admin@glowclinic.com`
- Password: `admin123`

### User Roles
- **owner** - Full system access
- **manager** - Manage patients, appointments, reports
- **doctor** - Access to own appointments and patients
- **receptionist** - Manage appointments and patient check-in

### API Endpoints

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh-token` - Refresh JWT token

**Patients:**
- `GET /api/patients` - List patients (with filters)
- `POST /api/patients` - Create patient
- `PUT /api/patients?id=<id>` - Update patient
- `DELETE /api/patients?id=<id>` - Delete patient

**Doctors:**
- `GET /api/doctors` - List doctors
- `POST /api/doctors` - Create doctor
- `PUT /api/doctors?id=<id>` - Update doctor
- `DELETE /api/doctors?id=<id>` - Deactivate doctor

**Activity Logs:**
- `GET /api/activity-logs` - List activity logs (with filters)
- `POST /api/activity-logs` - Create activity log

**Export:**
- `POST /api/export` - Export data to CSV/Excel

## 📄 Pages

### Core Pages (Existing)
- `/` - Landing page
- `/login` - Authentication
- `/inbox` - Message inbox
- `/dashboard` - Dashboard overview
- `/leads` - Lead management
- `/pacientes` - Patient management
- `/appointments` - Appointment scheduling
- `/calendar` - Calendar view
- `/kanban` - Kanban board
- `/treatments` - Treatment catalog
- `/reports` - Analytics and reports
- `/settings` - System settings

### New Pages (Added)
- `/doctors` - Doctor management
- `/activity-log` - Activity history
- `/export` - Data export
- `/help` - Help center & FAQs
- `/contact` - Support contact

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Row Level Security (RLS) in database
- API route protection with middleware
- Activity logging for audit trail
- Role-based access control

## 🌐 API Usage Examples

### Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})
const { token, user } = await response.json()
```

### Create Patient
```javascript
const response = await fetch('/api/patients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Juan Pérez',
    phone: '+52 55 1234 5678',
    email: 'juan@example.com',
    source: 'instagram',
    status: 'new'
  })
})
```

### Get Activity Logs
```javascript
const response = await fetch('/api/activity-logs?page=1&limit=50', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
const { logs, pagination } = await response.json()
```

## 🎨 Customization

### Theme Configuration
Edit `tailwind.config.ts` to customize colors and styling.

### Adding New Pages
1. Create page in `src/app/<page-name>/page.tsx`
2. Update navigation if needed
3. Add API routes in `src/app/api/<endpoint>/route.ts`

### Database Schema Changes
1. Update `src/lib/database/schema.sql`
2. Run migrations in Supabase SQL editor
3. Update TypeScript types in `src/types/index.ts`

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase credentials in `.env.local`
- Check Supabase project is active
- Ensure RLS policies are configured

### Authentication Problems
- Verify JWT_SECRET is set
- Check token expiration (default 7 days)
- Clear localStorage and cookies

### Build Errors
```bash
npm run type-check  # Check TypeScript errors
npm run lint        # Check linting errors
```

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **Authentication:** JWT with bcryptjs
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **Date Handling:** date-fns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software for clinic management.

## 🆘 Support

For support:
- Check `/help` page in the application
- Contact via `/contact` page
- Review activity logs for debugging

## 🔄 Updates & Migration

### From Local Storage to Supabase
The AppContext now supports both local storage (for development) and Supabase (for production). To migrate:

1. Export your local data from the browser console
2. Import to Supabase using the API
3. Update environment variables
4. Restart the application

### Database Migrations
Future schema changes will be documented in migration files under `src/lib/database/migrations/`.

---

**Version:** 1.0.0
**Last Updated:** February 2026
