# Clinic Appointment System - Quick Start Guide

## 🚀 Getting Started in 30 Seconds

### 1. Start the Server
```bash
npm run start:dev
```
Wait for: `"Nest application successfully started"`

### 2. Open Your Browser
```
http://localhost:3001
```

### 3. Test User Registration
**Create a Patient Account:**
1. Click "Register as User"
2. Fill in: Name, Email, Password
3. Click Register
4. You'll be redirected to login

**Create a Doctor Account:**
1. Click "Register as Doctor"
2. Fill in: Name, Email, Password, Specialization, Available Time
3. Click Register
4. You'll be redirected to login

### 4. Login and Use
- Use the email and password you registered
- Select role (User or Doctor)
- Click Login
- Navigate the dashboard

## 📋 User Features

### As a Patient:
- ✅ View all available doctors
- ✅ Book appointments by doctor ID and date
- ✅ View your scheduled appointments
- ✅ Cancel appointments

### As a Doctor:
- ✅ View all appointments scheduled with you
- ✅ Update your profile (name, specialization, availability)
- ✅ View appointment statistics
- ✅ See how many appointments are booked vs cancelled

## 🔧 Technical Details

| Component | Details |
|-----------|---------|
| **Backend** | NestJS (TypeScript) |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Database** | SQLite (auto-created) |
| **Authentication** | JWT Tokens |
| **Port** | 3001 (configurable) |
| **CORS** | Enabled for all origins |

## 📂 Project Structure

```
backend/             ← NestJS API
frontend/            ← React + TypeScript app

src/                 ← Backend (NestJS)
├── auth/            (Login/Registration)
├── users/           (Patient management)
├── doctors/         (Doctor management)
├── appointments/    (Appointment CRUD)
└── app.module.ts    (Main configuration)

database.sqlite      ← Data storage
SETUP.md             ← Full setup guide
CHANGES.md           ← What was fixed
```

## 🔑 Key Credentials Format

**User Login:**
- Email: any@email.com
- Password: any password you set
- Role: User

**Doctor Login:**
- Email: doctor@email.com
- Password: any password you set
- Role: Doctor

## 💾 Data Persistence

All data is stored in `database.sqlite`:
- User accounts
- Doctor profiles
- Appointment records
- Passwords (hashed with bcrypt)

**Note:** Delete `database.sqlite` to reset everything.

## 🧪 Testing the API

### Example User Registration
```bash
curl -X POST http://localhost:3001/auth/register/user \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secure123"}'
```

### Example Doctor Registration
```bash
curl -X POST http://localhost:3001/auth/register/doctor \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Jane","email":"jane@example.com","password":"secure123","specialization":"Cardiology"}'
```

### Example Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secure123","role":"user"}'
```

Response includes JWT token for subsequent requests.

## ❌ Troubleshooting

**Problem:** "Cannot GET /"
- Solution: Make sure server is running with `npm run start:dev`

**Problem:** Port 3001 already in use
- Solution: `PORT=3002 npm run start:dev`

**Problem:** Database corrupted
- Solution: Delete `database.sqlite` and restart

**Problem:** API calls fail with 401
- Solution: Login again to get a new token

## 🌐 All Available URLs

```
Home:           http://localhost:3001/
Login:          http://localhost:3001/login.html
User Sign-up:   http://localhost:3001/register-user.html
Doctor Sign-up: http://localhost:3001/register-doctor.html
Dashboard:      http://localhost:3001/dashboard.html
```

## ✨ What's Been Fixed

✅ register-doctor.html - Fixed broken JavaScript
✅ main.ts - Added CORS support  
✅ package.json - Added missing express dependency

## 🎯 Next Steps

1. **Run the server:** `npm run start:dev`
2. **Open browser:** `http://localhost:3001`
3. **Register** as User or Doctor
4. **Login** and test features
5. **Explore** the API endpoints

## 📚 More Documentation

- **SETUP.md** - Complete setup and configuration guide
- **CHANGES.md** - Detailed list of all fixes and changes
- **spec.md** - Original specifications
- **package.json** - All dependencies

---

**Your Clinic Appointment System is ready to use! 🏥**

Enjoy managing your clinic appointments!
