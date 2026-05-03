# Clinic Appointment System - Setup & Running Guide

## Overview
This is a full-stack clinic appointment management system built with:
- **Backend**: NestJS (TypeScript)
- **Frontend**: React (TypeScript)
- **Database**: MySQL (via WAMP Server)
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

### For Admins
- View all users, doctors, and appointments
- Manage system data
- Performance reports

## Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- WAMP Server (for MySQL database)
- Git

## Database Setup (MySQL with WAMP)

1. **Install WAMP Server**
   - Download from https://www.wampserver.com/
   - Install and start WAMP Server (icon should turn green)

2. **Start MySQL Service**
   - Left-click WAMP icon > "MySQL" > "Service" > "Start/Resume Service"

3. **Create Database**
   - Left-click WAMP icon > "phpMyAdmin"
   - Login with username: `root`, password: (empty)
   - Click "New" > Database name: `clinic_appointment`
   - Click "Create"

## Installation

1. **Clone Repository**:
```bash
git clone https://github.com/alfredocastalla/Clinic-Appointment-System.git
cd clinic-appointment-system
```

2. **Backend Setup**:
```bash
cd backend
npm install
npm run setup-db  # Creates database tables
```

3. **Frontend Setup**:
```bash
cd frontend
npm install
```

## Running the Application

### Development Mode
```bash
# Backend (Terminal 1)
cd backend
npm run start:dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### Production Mode
```bash
# Backend
cd backend
npm run start:prod

# Frontend (build and serve)
cd frontend
npm run build
# Serve the dist folder with any static server
```

## Environment Configuration

Backend uses `.env` file (already configured for local development):

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=clinic_appointment
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_EMAIL=admin@clinic.local
ADMIN_PASSWORD=admin123
```

## Accessing the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **phpMyAdmin**: http://localhost/phpmyadmin

## Default Accounts

- **Admin**: admin@clinic.local / admin123
- **Doctor**: Register new doctor account
- **Patient**: Register new patient account

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Users
- `GET /users` - Get all users (admin)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user

### Doctors
- `GET /doctors` - Get all doctors (public)
- `GET /doctors/:id` - Get doctor by ID
- `POST /doctors` - Create doctor
- `PATCH /doctors/:id` - Update doctor

### Appointments
- `GET /appointments` - Get user appointments
- `POST /appointments` - Book appointment
- `DELETE /appointments/:id` - Cancel appointment

### Payments
- `GET /payments` - Get user payments
- `POST /payments` - Process payment

### Notifications
- `GET /notifications` - Get user notifications
- `POST /notifications/mark-all-read` - Mark all as read

## Troubleshooting

1. **WAMP/MySQL Issues**:
   - Ensure WAMP is running (green icon)
   - Check MySQL service is started
   - Verify database `clinic_appointment` exists

2. **Port Conflicts**:
   - Backend: 3001
   - Frontend: 5173
   - MySQL: 3306

3. **Database Connection**:
   - Check `.env` file configuration
   - Ensure MySQL credentials are correct

4. **Build Errors**:
   - Run `npm install` in both backend and frontend
   - Check Node.js version (v18+)

## Development

### Project Structure
```
clinic-appointment-system/
├── backend/          # NestJS API
├── frontend/         # React SPA
├── student-min-specs/ # Requirements
└── docs/            # Documentation
```

### Available Scripts

**Backend**:
- `npm run start:dev` - Development with watch
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run lint` - Lint code

**Frontend**:
- `npm run dev` - Development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
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
