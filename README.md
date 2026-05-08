# Clinic Appointment System

A full-stack clinic appointment system with a NestJS backend and a React + TypeScript frontend.

## Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/alfredocastalla/Clinic-Appointment-System.git
   cd Clinic-Appointment-System
   ```

2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Create the backend environment file:
   ```bash
   cd backend
   copy .env.example .env
   ```
   Update backend/.env with your MySQL credentials.

4. Start both services together:
   ```bash
   npm run start
   ```

   This launches:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Development commands

From the repository root:

- npm run start — start frontend and backend together
- npm run backend:dev — start backend in watch mode
- npm run frontend:dev — start frontend dev server
- npm run backend:build — compile backend TypeScript
- npm run frontend:build — build frontend production assets
- npm run install:all — install backend and frontend dependencies

## Project overview

### Backend
- NestJS API server
- TypeORM data access and MySQL support
- JWT authentication and role-based authorization
- Users, doctors, appointments, notifications, payments, and payment methods
- API validation with class-validator

### Frontend
- React + TypeScript + Vite
- Role-based dashboard experience
- Appointment booking and management
- Payment method management
- Notification display and user messaging

## Database setup

The backend reads from backend/.env.

Default values:

```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=clinic_appointment
```

If you use a different MySQL setup, update backend/.env accordingly.

## API endpoints

### Authentication
- POST /auth/register/user — register a patient
- POST /auth/register/doctor — register a doctor
- POST /auth/login — login and receive JWT

### Users
- GET /users
- GET /users/:id
- PATCH /users/:id
- DELETE /users/:id

### Doctors
- GET /doctors
- GET /doctors/:id
- POST /doctors
- PATCH /doctors/:id
- DELETE /doctors/:id

### Appointments
- GET /appointments
- POST /appointments
- PATCH /appointments/:id/confirm
- PATCH /appointments/:id/complete
- PATCH /appointments/:id/cancel
- PATCH /appointments/:id

### Notifications
- GET /notifications
- PATCH /notifications/:id/read
- PATCH /notifications/read-all

### Payments
- GET /payments
- POST /payments

### Payment methods
- GET /payment-methods
- POST /payment-methods

### Health check
- GET /api/health

## VS Code tasks

The repository includes tasks for VS Code:
- Start Backend Dev
- Start Frontend Dev
- Start Full App

## Project structure

``
clinic-appointment-system/
├── backend/
├── frontend/
├── package.json
├── README.md
├── spec.md
└── .vscode/
``

## License

MIT