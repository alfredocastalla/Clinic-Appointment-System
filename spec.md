# Clinic Appointment System - Specification Document

## Overview

The Clinic Appointment System is a web-based application built with NestJS (Node.js framework) that allows patients to book appointments with doctors and doctors to manage their appointments. The system includes user authentication, role-based access control, and a simple web interface.

## Architecture

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: SQLite with TypeORM ORM
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **Password Hashing**: bcrypt
- **Static File Serving**: NestJS ServeStaticModule

### Frontend
- **Technology**: Vanilla HTML, CSS, JavaScript
- **Architecture**: Single Page Application (SPA) with client-side routing
- **Storage**: LocalStorage for authentication tokens and user data

## Database Schema

### User Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  name: string
  email: string
  password: string (Hashed)
  role: string ('user' | 'doctor' | 'admin')
}
```

### Doctor Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  name: string
  email: string
  password: string (Hashed)
  specialization: string
  availableTime: string (Optional)
}
```

### Appointment Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  patientName: string
  doctorId: number (Foreign Key to Doctor)
  date: string (Date format)
  status: string ('pending' | 'confirmed' | 'cancelled' | 'completed')
}
```

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/register/user` - Register a new user
- `POST /auth/register/doctor` - Register a new doctor
- `POST /auth/login` - Login for users and doctors

### Users (`/users`)
- `POST /users` - Create user
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Doctors (`/doctors`)
- `POST /doctors` - Create doctor
- `GET /doctors` - Get all doctors
- `GET /doctors/:id` - Get doctor by ID
- `PATCH /doctors/:id` - Update doctor
- `DELETE /doctors/:id` - Delete doctor

### Appointments (`/appointments`)
- `POST /appointments` - Create appointment
- `GET /appointments` - Get all appointments
- `PATCH /appointments/:id/cancel` - Cancel appointment

## User Roles and Permissions

### User (Patient)
- Register and login
- View available doctors
- Book appointments
- View their own appointments
- Cancel their appointments

### Doctor
- Register and login
- View their appointments
- Update profile and availability
- View appointment statistics

### Admin (Future Enhancement)
- View all users
- View all doctors
- View all appointments
- Manage system settings

## Frontend Pages

### Public Pages
- **Home** (`index.html`) - Landing page with navigation to login/register
- **User Registration** (`register-user.html`) - Form to register as a patient
- **Doctor Registration** (`register-doctor.html`) - Form to register as a doctor
- **Login** (`login.html`) - Authentication form for both users and doctors

### Protected Pages
- **Dashboard** (`dashboard.html`) - Main application interface with role-based content

## Authentication Flow

1. User registers or logs in via frontend forms
2. Backend validates credentials and returns JWT token
3. Frontend stores token and user data in localStorage
4. Subsequent API requests include Authorization header with Bearer token
5. Backend validates token using JWT strategy
6. Protected routes check user roles for authorization

## Business Logic

### Appointment Booking
1. User selects a doctor and preferred date
2. System validates doctor availability
3. Creates appointment with 'pending' status
4. Doctor can confirm or cancel the appointment
5. User can view and cancel their appointments

### Doctor Availability
- Doctors can set their available time slots
- System displays available doctors to patients
- Future enhancement: Time slot management

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control
- Input validation on API endpoints
- CORS configuration for cross-origin requests

## Development Setup

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation
```bash
npm install
```

### Running the Application
```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Database
- SQLite database file is created automatically
- Schema synchronization enabled in development
- Migrations can be added for production

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Deployment

### Environment Variables
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret key for JWT signing

### Build Process
1. Install dependencies
2. Run tests
3. Build application (`npm run build`)
4. Deploy dist/ folder to server
5. Set environment variables
6. Start application

## Future Enhancements

### High Priority
- Email notifications for appointments
- Calendar integration
- Time slot management
- Appointment reminders

### Medium Priority
- Admin dashboard
- Doctor scheduling management
- Patient medical history
- Payment integration

### Low Priority
- Multi-language support
- Mobile application
- Video consultation integration
- Advanced reporting

## Technology Stack Details

### Backend Dependencies
- `@nestjs/common`, `@nestjs/core` - NestJS framework
- `@nestjs/typeorm` - TypeORM integration
- `@nestjs/jwt`, `@nestjs/passport` - Authentication
- `bcrypt` - Password hashing
- `sqlite3` - SQLite database driver
- `mysql2` - MySQL driver (alternative)

### Development Dependencies
- `@nestjs/cli` - NestJS CLI
- `@nestjs/testing` - Testing utilities
- `@types/*` - TypeScript type definitions
- `jest` - Testing framework
- `eslint` - Code linting
- `prettier` - Code formatting

## File Structure

```
clinic-appointment-system/
├── src/
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── main.ts
│   ├── appointments/
│   │   ├── appointments.controller.ts
│   │   ├── appointments.module.ts
│   │   ├── appointments.service.ts
│   │   ├── entities/
│   │   │   └── appointment.entity.ts
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── jwt.strategy.ts
│   ├── doctors/
│   │   ├── doctors.controller.ts
│   │   ├── doctors.module.ts
│   │   ├── doctors.service.ts
│   │   └── entities/
│   │       └── doctor.entity.ts
│   └── users/
│       ├── users.controller.ts
│       ├── users.module.ts
│       ├── users.service.ts
│       └── entities/
│           └── user.entity.ts
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register-user.html
│   ├── register-doctor.html
│   └── dashboard.html
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
└── README.md
```

## API Response Formats

### Success Response
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Authentication Response
```json
{
  "access_token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

## Conclusion

The Clinic Appointment System provides a solid foundation for managing doctor-patient appointments with a clean architecture, proper authentication, and role-based access. The modular design allows for easy extension and maintenance. The combination of NestJS backend with a simple frontend provides a balance between functionality and simplicity.</content>
<parameter name="filePath">c:\Users\admin\OneDrive\Desktop\Application\clinic-appointment-system\spec.md