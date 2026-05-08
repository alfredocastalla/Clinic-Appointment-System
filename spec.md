# Clinic Appointment System - Specification Document

## Project Overview

Clinic Appointment System is a full-stack web application built with a NestJS backend and a React + TypeScript frontend. It helps patients book appointments, manage payment methods, and receive notifications, while doctors can confirm and complete appointments.

## Architecture

### Backend
- Framework: NestJS
- Database: MySQL via TypeORM
- Authentication: JWT with Passport.js
- Password hashing: bcrypt
- Validation: class-validator
- API: REST endpoints for authentication, users, doctors, appointments, notifications, payments, and payment methods
- Testing: Jest for unit, integration, and end-to-end tests

### Frontend
- Framework: React + TypeScript
- Build tool: Vite
- Routing: React Router
- Authentication: JWT token storage and protected routes
- UI: responsive dashboard views for patients and doctors

## Development Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Configure backend environment:
   ```bash
   cd backend
   copy .env.example .env
   ```

3. Start both services:
   ```bash
   npm run start
   ```

### Individual services

- npm run backend:dev — start backend in watch mode
- npm run frontend:dev — start frontend dev server

## Database Configuration

Backend environment variables are stored in backend/.env.

Example configuration:

```env
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=clinic_appointment
```

## Data Model

### User
- id: Primary key
- name
- email
- password (hashed)
- role: user, doctor, or admin
- location, phone, and profile fields

### Doctor
- id
- name
- email
- password (hashed)
- specialization
- address, phone, availableTime

### Appointment
- id
- patientId
- doctorId
- date
- time
- symptoms
- status: pending, confirmed, completed, cancelled

### Notification
- id
- title
- message
- type
- isRead
- userId

### Payment
- id
- patientId
- appointmentId
- amount
- currency
- status
- method
- description

### PaymentMethod
- id
- patientId
- type
- last4
- brand
- expiryMonth
- expiryYear
- isDefault

## API Endpoints

### Health Check
- GET /api/health

### Auth
- POST /auth/register/user
- POST /auth/register/doctor
- POST /auth/login

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

### Payment Methods
- GET /payment-methods
- POST /payment-methods

## User Roles

### Patient
- Register and login
- Book appointments
- View and cancel appointments
- Manage payment methods
- Receive notifications

### Doctor
- Register and login
- View assigned appointments
- Confirm and complete appointments
- Update profile and availability

### Admin
- Admin role support is included in the backend model
- Admin routes can manage users and doctors

## Testing

- npm run backend:test — run backend unit, integration, and e2e tests
- npm run frontend:test — run frontend tests (if configured)

## Deployment

- npm run backend:build
- npm run frontend:build

This repository is ready for local development and can be deployed with standard Node.js and Vite deployment workflows.