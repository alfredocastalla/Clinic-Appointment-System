# Clinic Appointment System - Setup & Running Guide

## Overview
This is a full-stack clinic appointment management system built with:
- **Backend**: NestJS (TypeScript)
- **Frontend**: HTML5, CSS3, JavaScript
- **Database**: SQLite
- **Authentication**: JWT

## System Features

### For Patients/Users
- Register as a regular user
- Login with email and password
- View available doctors
- Book appointments with doctors
- View their appointments
- Cancel appointments

### For Doctors
- Register as a doctor with specialization
- Login with email and password
- View appointments scheduled with them
- Update their profile and availability
- View appointment statistics

### For Admins (Future)
- View all users, doctors, and appointments
- Manage system data

## Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

## Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Verify build** (optional):
```bash
npm run build
```

## Running the Application

### Development Mode (with auto-reload)
```bash
npm run start:dev
```
The server will start on `http://localhost:3001`

### Production Mode
```bash
npm run build
npm run start:prod
```

### Running with Watch Mode (recommended during development)
The `npm run start:dev` command includes hot-reload, so the application will automatically restart when you make changes to the source code.

## Database
- SQLite database is automatically created at `database.sqlite` on first run
- Schema is automatically synchronized with entity definitions (autoLoadEntities: true)
- No manual migration needed

## API Endpoints

### Authentication
- `POST /auth/register/user` - Register as a patient
- `POST /auth/register/doctor` - Register as a doctor
- `POST /auth/login` - Login (expects `email`, `password`, `role`)

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get specific user
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Doctors
- `GET /doctors` - Get all doctors
- `GET /doctors/:id` - Get specific doctor
- `POST /doctors` - Create doctor
- `PATCH /doctors/:id` - Update doctor
- `DELETE /doctors/:id` - Delete doctor

### Appointments
- `GET /appointments` - Get all appointments
- `POST /appointments` - Create appointment
- `PATCH /appointments/:id/cancel` - Cancel appointment

## Frontend Access
Once the server is running, open your browser and go to:
- Home: `http://localhost:3001/`
- Login: `http://localhost:3001/login.html`
- Register as User: `http://localhost:3001/register-user.html`
- Register as Doctor: `http://localhost:5173/register/doctor`
- Dashboard: `http://localhost:5173/dashboard/patient` or `http://localhost:5173/dashboard/doctor`

## Authentication Flow
1. User/Doctor registers via `/auth/register/user` or `/auth/register/doctor`
2. System returns JWT token and user info
3. User logs in via `/auth/login` with email, password, and role
4. Token is stored in localStorage
5. Token is sent in `Authorization: Bearer <token>` header for protected requests
6. Token expires after 1 hour (configurable in auth.module.ts)

## Configuration

### JWT Secret
The JWT secret is currently set to `'your-secret-key'` in `src/auth/auth.module.ts`. 
**For production**, use an environment variable:
```typescript
secret: process.env.JWT_SECRET || 'your-secret-key'
```

### Port
Default port is `3001`. To change it, set the `PORT` environment variable:
```bash
PORT=5000 npm run start:dev
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### All Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:cov
```

## Linting & Formatting

### Check linting issues
```bash
npm run lint
```

### Format code
```bash
npm run format
```

## Build

### Build for production
```bash
npm run build
```
Output will be in the `dist/` directory.

## Troubleshooting

### Port already in use
If port 3001 is already in use:
```bash
PORT=3002 npm run start:dev
```

### Database corruption
Delete `database.sqlite` and restart - a new database will be created automatically.

### CORS issues
CORS is enabled for all origins in `main.ts`. If you need to restrict it:
```typescript
app.enableCors({
  origin: 'http://localhost:3000', // Specify your frontend URL
  credentials: true,
});
```

### Clear node_modules
```bash
rm -r node_modules
npm install
```

## Project Structure
```
src/
├── auth/              # Authentication logic
├── users/             # User management
├── doctors/           # Doctor management
├── appointments/      # Appointment management
├── app.module.ts      # Main application module
└── main.ts            # Application entry point

backend/
├── src/               # NestJS source
├── test/              # Backend tests
└── database.sqlite    # Persisted SQL.js database file

frontend/
├── src/               # React + TypeScript source
├── package.json       # Frontend scripts and dependencies
└── vite.config.ts     # Vite dev server and API proxy

database.sqlite       # SQLite database (created on first run)
```

## Key Files Modified
- `backend/src/main.ts` - Backend entry point with CORS enabled
- `backend/src/app.module.ts` - Serves the built React frontend and configures SQL.js
- `frontend/src/App.tsx` - React routes and dashboard UI

## Production Deployment Notes
1. Set proper JWT_SECRET environment variable
2. Configure database for production (MySQL/PostgreSQL)
3. Update CORS origin restrictions
4. Enable HTTPS
5. Add rate limiting
6. Add request validation/sanitization
7. Add logging and monitoring
8. Consider containerization (Docker)

## License
UNLICENSED
