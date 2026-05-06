# Clinic Appointment System - Specification Document

## Overview

The Clinic Appointment System is a full-stack web application built with NestJS backend and React + TypeScript frontend that allows patients to book appointments with doctors, manage payments, and receive notifications. The system includes comprehensive user authentication, role-based access control, appointment management, payment processing, and notification systems.

## Architecture

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: MySQL with TypeORM ORM
- **Authentication**: JWT (JSON Web Tokens) with Passport.js
- **Password Hashing**: bcrypt
- **Validation**: Class-validator for input validation
- **CORS**: Enabled for frontend-backend communication
- **Testing**: Jest for unit, integration, and e2e tests

## Database Setup

The backend uses MySQL and reads connection values from `backend/.env`.

The repository includes `backend/.env.example` as a starting template. Copy it to `backend/.env` and update `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` for your local MySQL setup.

Default configuration:

```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=clinic_appointment
```

To initialize:

1. Start your WAMP or local MySQL server.
2. Create the `clinic_appointment` database.
3. Update `backend/.env` with your MySQL settings.
4. Run the backend; TypeORM will create the schema automatically.

## Database Schema

### User Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  name: string
  email: string (Unique)
  password: string (Hashed)
  location?: string (Optional)
  phone?: string (Optional)
  role: string ('user' | 'doctor' | 'admin')
  createdAt: Date (Auto-generated)
  updatedAt: Date (Auto-generated)
}
```

### Doctor Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  name: string
  email: string (Unique)
  password: string (Hashed)
  specialization: string
  availableTime?: string (Optional)
  address?: string (Optional)
  phone?: string (Optional)
  photo?: string (Optional, Text)
}
```

### Appointment Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  patientId?: number (Optional, Foreign Key to User)
  patientName: string
  doctorId: number (Foreign Key to Doctor)
  date: string
  time?: string (Optional)
  symptoms?: string (Optional)
  status: string ('pending' | 'confirmed' | 'completed' | 'cancelled')
}
```

### Notification Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  title: string
  message: string
  type: NotificationType ('appointment_booked' | 'appointment_cancelled' | 'payment_received' | 'payment_failed' | 'general')
  isRead: boolean (Default: false)
  user: User (Many-to-One relationship)
  createdAt: Date (Auto-generated)
}
```

### Payment Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  patientId: number (Foreign Key to User)
  appointmentId?: number (Optional, Foreign Key to Appointment)
  amount: number (Float)
  currency: string
  status: string ('pending' | 'completed' | 'failed' | 'refunded')
  method: string ('credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'insurance')
  description: string
  transactionId?: string (Optional)
  createdAt: Date (Auto-generated)
  paidAt?: Date (Optional)
  receiptUrl?: string (Optional)
}
```

### PaymentMethod Entity
```typescript
{
  id: number (Primary Key, Auto-generated)
  patientId: number (Foreign Key to User)
  type: string ('credit_card' | 'debit_card')
  last4: string (Last 4 digits)
  brand: string (Card brand: 'visa', 'mastercard', etc.)
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}
```

## API Endpoints

### Health Check
- `GET /api/health` - System health check

### Authentication (`/auth`)
- `POST /auth/register/user` - Register a new user/patient
  - Body: `{ name: string, email: string, password: string, location?: string }`
- `POST /auth/register/doctor` - Register a new doctor
  - Body: `{ name: string, email: string, password: string, specialization: string, address?: string }`
- `POST /auth/login` - Login for users, doctors, and admins
  - Body: `{ email: string, password: string, role: 'user' | 'doctor' | 'admin' }`
  - Returns: `{ access_token: string, user: AuthUser }`

### Users (`/users`) - Admin/Doctor Only
- `GET /users` - Get all users (admin/doctor access only)
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `PATCH /users/profile/:id` - Update profile (patient or user self-update)
- `DELETE /users/:id` - Delete user

### Doctors (`/doctors`) - Public Access
- `GET /doctors` - Get all doctors (public endpoint for booking)
- `GET /doctors/:id` - Get doctor by ID
- `POST /doctors` - Create doctor (admin access)
- `PATCH /doctors/:id` - Update doctor profile
- `DELETE /doctors/:id` - Delete doctor (admin access)

### Appointments (`/appointments`) - Authenticated Users
- `GET /appointments` - Get appointments (filtered by user role)
  - Users see their appointments, Doctors see their assigned appointments
- `POST /appointments` - Create appointment (users only)
  - Body: `{ doctorId: number, date: string, time?: string, symptoms?: string }`
- `PATCH /appointments/:id/confirm` - Confirm appointment (doctors only)
- `PATCH /appointments/:id/complete` - Complete appointment (doctors only)
- `PATCH /appointments/:id/cancel` - Cancel appointment (users/doctors)
- `PATCH /appointments/:id` - Update appointment details

### Notifications (`/notifications`) - Authenticated Users
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark specific notification as read
- `PATCH /notifications/read-all` - Mark all user notifications as read

### Payments (`/payments`) - Authenticated Users
- `GET /payments` - Get payments (filtered by user role)
- `POST /payments` - Create payment
  - Body: `{ appointmentId?: number, amount: number, currency: string, method: string, description: string }`

### Payment Methods (`/payment-methods`) - Users Only
- `GET /payment-methods` - Get user's payment methods
- `POST /payment-methods` - Add payment method
  - Body: `{ type: string, last4: string, brand: string, expiryMonth: number, expiryYear: number, isDefault: boolean }`

## User Roles and Permissions

### User (Patient)
- Register and login with role-based dashboard access
- View available doctors with detailed profiles (specialization, contact info, photos)
- Book appointments with date, time, and symptom descriptions
- View and manage personal appointments (pending, confirmed, completed, cancelled)
- Cancel or reschedule appointments
- Manage payment methods (credit/debit cards)
- View payment history and receipts
- Receive notifications for appointment status changes
- Responsive dashboard with appointment calendar view

### Doctor
- Register and login with enhanced profile management
- Complete profile with specialization, contact details, and photos
- View and manage assigned appointments (confirm, complete, cancel)
- Update availability and schedule preferences
- View patient information for assigned appointments
- Access to appointment history and statistics
- Receive notifications for new appointment bookings
- Responsive dashboard with appointment management tools

### Admin (Future Enhancement)
- Full system administration capabilities
- User and doctor account management
- System-wide appointment oversight
- Payment and financial reporting
- Notification system management
- Analytics and reporting dashboard

## Recent Updates (April 2026)

### Authentication Enhancements
- Fixed authentication service to return consistent user objects
- Added role-based redirects after login
- Enhanced form validation with loading states
- Improved error handling and user feedback

### Doctor Dashboard Redesign
- Modern sidebar navigation layout
- Appointment management with confirm/cancel functionality
- Profile editing capabilities
- Real-time appointment status updates

### User Dashboard Redesign
- Responsive card-based doctor selection
- Modal-based appointment booking system
- Comprehensive appointment management
- Modern UI with Font Awesome icons

### Backend Improvements
- Added appointment confirmation endpoint
- Enhanced CORS support
- Improved error handling in services
- Database populated with test data

### Frontend Enhancements
- Responsive design for mobile devices
- Improved user experience with loading states
- Client-side routing and navigation
- Consistent styling across all pages

### Version Control
- GitHub repository: https://github.com/alfredocastalla/Clinic-Appointment-System
- Regular commits with detailed change logs
- Latest commit: Redesigned user dashboard with modern sidebar navigation

## Testing
- Jest configuration for unit, integration, and e2e tests
- Test files structured in test/ directory
- E2E tests for critical user flows

## Deployment
- Ready for deployment with npm scripts
- Static file serving for frontend
- Database initialization with sample data
- View all appointments
- Manage system settings

## Frontend Pages

### Public Pages
- **Home** (`/`) - Landing page with navigation to login/register
- **User Registration** (`/register/user`) - Form to register as a patient
- **Doctor Registration** (`/register/doctor`) - Form to register as a doctor
- **Login** (`/login`) - Authentication form for both users and doctors

### Protected Pages
- **Dashboard** (`/dashboard`) - Main application interface with role-based content
- **Doctors List** (`/doctors`) - Browse available doctors (public access)
- **Doctor Profile** (`/doctors/:id`) - View doctor details and book appointments
- **Appointments** (`/appointments`) - View and manage appointments
- **Notifications** (`/notifications`) - View system notifications
- **Payments** (`/payments`) - View payment history and manage payment methods
- **Profile** (`/profile`) - User profile management

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
- MySQL database is created automatically when using `backend/setup-db.js`
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