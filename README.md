# Clinic Appointment System

A full-stack clinic appointment management system with a NestJS backend and a React + TypeScript frontend.

## Features

### Backend (NestJS + TypeORM + SQLite)
- **Authentication System**: JWT-based login with bcrypt password hashing
- **User Management**: Full CRUD operations for users and doctors
- **Appointment System**: Book, view, and cancel appointments
- **Role-based Access**: Separate registration for patients and doctors
- **Database**: SQLite with TypeORM entities and relationships

### Frontend (React + TypeScript)
- **Routing**: Dedicated routes for home, login, registration, and dashboards
- **Patient Dashboard**: Browse doctors, book appointments, and cancel appointments
- **Doctor Dashboard**: Confirm or cancel appointments and update doctor profile details
- **Type-safe UI**: Shared TypeScript models for API data and cleaner component structure

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

- `POST /auth/register/user` - Register new patient
- `POST /auth/register/doctor` - Register new doctor
- `POST /auth/login` - Login with email/password
- `GET /users` - Get all users
- `GET /doctors` - Get all doctors
- `POST /appointments` - Book appointment
- `GET /appointments` - Get all appointments
- `PATCH /appointments/:id/cancel` - Cancel appointment

## Project Structure

```
clinic-appointment-system/
├── backend/
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── database.sqlite
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── package.json
```

`backend/` contains the Nest API, and `frontend/` contains the React + TypeScript app.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

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
