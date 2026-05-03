# Clinic Appointment System

A full-stack clinic appointment management system with a NestJS backend and a React + TypeScript frontend.

## Features

### Backend (NestJS + TypeORM + SQLite)
- **Authentication System**: JWT-based login with bcrypt password hashing
- **User Management**: Full CRUD operations for users and doctors
- **Appointment System**: Book, view, confirm, complete, and cancel appointments
- **Notification System**: Real-time notifications for appointment status changes
- **Payment Processing**: Payment creation and history tracking
- **Payment Methods**: Credit/debit card management for users
- **Role-based Access**: Separate registration for patients and doctors with admin capabilities
- **Database**: SQLite with TypeORM entities and relationships
- **API Validation**: Class-validator for input validation
- **CORS Support**: Cross-origin resource sharing for frontend integration

### Frontend (React + TypeScript)
- **Routing**: React Router for client-side navigation
- **Patient Dashboard**: Browse doctors, book appointments, manage payments, view notifications
- **Doctor Dashboard**: Confirm/complete appointments, update profile, manage schedule
- **Authentication**: JWT token management with automatic logout on expiration
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Type-safe UI**: Shared TypeScript interfaces for API data
- **Real-time Updates**: Notification system with unread indicators
- **Payment Management**: Secure payment method storage and transaction history

## Tech Stack

- **Backend**: NestJS, TypeORM, SQLite, JWT, bcrypt, Passport
- **Frontend**: React, TypeScript, Vite, Fetch API
- **Database**: SQLite with automatic schema generation
- **Authentication**: JWT with role-based access control

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/alfredocastalla/Clinic-Appointment-System.git
   cd clinic-appointment-system
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Start the application**:
   ```bash
   npm run backend:dev
   ```

   The API server will run on `http://localhost:3001`

4. **Start the frontend**:
   ```bash
   npm run frontend:dev
   ```

   The frontend will run on `http://localhost:5173`

## Usage

1. **Access the application**:
   Open `http://localhost:5173` in your browser during development, or `http://localhost:3001` for the backend-served production build.

2. **Register**:
   - Register as a patient or doctor
   - Login with your credentials

3. **Manage Appointments**:
   - Patients can book appointments with doctors
   - Doctors can view their scheduled appointments
   - Appointments can be cancelled

## API Endpoints

### Authentication
- `POST /auth/register/user` - Register new patient
- `POST /auth/register/doctor` - Register new doctor
- `POST /auth/login` - Login with email/password

### Users (Admin/Doctor access)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Doctors (Public access)
- `GET /doctors` - Get all doctors
- `GET /doctors/:id` - Get doctor by ID
- `POST /doctors` - Create doctor (admin)
- `PATCH /doctors/:id` - Update doctor
- `DELETE /doctors/:id` - Delete doctor (admin)

### Appointments (Authenticated users)
- `GET /appointments` - Get appointments (filtered by role)
- `POST /appointments` - Book appointment
- `PATCH /appointments/:id/confirm` - Confirm appointment (doctor)
- `PATCH /appointments/:id/complete` - Complete appointment (doctor)
- `PATCH /appointments/:id/cancel` - Cancel appointment
- `PATCH /appointments/:id` - Update appointment

### Notifications (Authenticated users)
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark notification as read
- `PATCH /notifications/read-all` - Mark all notifications as read

### Payments (Authenticated users)
- `GET /payments` - Get payment history
- `POST /payments` - Create payment

### Payment Methods (Users only)
- `GET /payment-methods` - Get user's payment methods
- `POST /payment-methods` - Add payment method

### Health Check
- `GET /api/health` - System health check

## Project Structure

```
clinic-appointment-system/
├── backend/                          # NestJS API server
│   ├── src/
│   │   ├── app.controller.ts        # Main app controller
│   │   ├── app.module.ts            # Root application module
│   │   ├── app.service.ts           # Main app service
│   │   ├── main.ts                  # Application entry point
│   │   ├── auth/                    # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── entities/
│   │   ├── users/                   # User management module
│   │   │   ├── users.controller.ts
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   └── entities/
│   │   ├── doctors/                 # Doctor management module
│   │   │   ├── doctors.controller.ts
│   │   │   ├── doctors.module.ts
│   │   │   ├── doctors.service.ts
│   │   │   └── entities/
│   │   ├── appointments/            # Appointment management module
│   │   │   ├── appointments.controller.ts
│   │   │   ├── appointments.module.ts
│   │   │   ├── appointments.service.ts
│   │   │   └── entities/
│   │   ├── notifications/           # Notification system module
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── entities/
│   │   ├── payments/                # Payment processing module
│   │   │   ├── payments.controller.ts
│   │   │   ├── payments.module.ts
│   │   │   ├── payments.service.ts
│   │   │   └── entities/
│   │   └── payment-methods/         # Payment methods module
│   │       ├── payment-methods.controller.ts
│   │       ├── payment-methods.module.ts
│   │       ├── payment-methods.service.ts
│   │       └── entities/
│   ├── test/                        # Test files
│   │   ├── app.e2e-spec.ts
│   │   ├── jest-e2e.json
│   │   ├── jest-integration.json
│   │   └── e2e/
│   │       ├── appointments.e2e-spec.ts
│   │       └── cypress/
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── frontend/                         # React + TypeScript client
│   ├── src/
│   │   ├── App.tsx                  # Main React component
│   │   ├── main.tsx                 # React entry point
│   │   ├── types.ts                 # Shared TypeScript types
│   │   ├── styles.css               # Global styles
│   │   └── lib/                     # Utility functions
│   │       └── api.ts               # API client functions
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── student-min-specs/               # Project specifications
├── package.json                     # Root package.json with scripts
├── spec.md                          # Technical specification
├── README.md                        # This file
└── QUICKSTART.md                    # Quick start guide
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
