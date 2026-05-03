import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api, getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from './lib/api';
import {
  AuthUser,
  Role,
  clearSession,
  getStoredUser,
  setSession,
  updateStoredUser,
} from './lib/auth';
import { Appointment, Doctor, Message, Payment, PaymentMethod, Notification } from './types';

type RegisterUserPayload = {
  name: string;
  email: string;
  password: string;
  location?: string;
};

type RegisterDoctorPayload = {
  name: string;
  email: string;
  password: string;
  specialization: string;
  address?: string;
};

type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: Role;
  location?: string;
};

type NavItem = {
  key: string;
  label: string;
  caption: string;
  icon?: string;
  badge?: string | number;
};

type AppointmentFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

type RescheduleForm = {
  id: number;
  date: string;
  time: string;
  symptoms: string;
};

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  location: string;
  dob: string;
};

type PaymentFormState = {
  patientId?: string;
  appointmentId?: string;
  amount: string;
  method: Payment['method'];
  description: string;
};

type LabResult = {
  id: number;
  title: string;
  date: string;
  doctor: string;
  summary: string;
  fileName: string;
};

type ImmunizationRecord = {
  id: number;
  vaccine: string;
  date: string;
  provider: string;
  notes: string;
};

type HealthNote = {
  id: number;
  title: string;
  date: string;
  details: string;
};

const MESSAGE_STORE_KEY = 'clinic-appointment-system-messages';

function loadStoredMessages(): Message[] {
  try {
    const raw = localStorage.getItem(MESSAGE_STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

function saveStoredMessages(messages: Message[]) {
  try {
    const existing = loadStoredMessages();
    const merged = [...existing.filter((item) => !messages.some((msg) => msg.id === item.id)), ...messages];
    localStorage.setItem(MESSAGE_STORE_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage failures in demo mode
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());

  const handleLogin = (token: string, user: AuthUser) => {
    setSession(token, user);
    setCurrentUser(user);
  };

  const handleUserUpdate = (user: AuthUser) => {
    updateStoredUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage currentUser={currentUser} />} />
      <Route path="/login" element={<LoginPage currentUser={currentUser} onLogin={handleLogin} onLogout={handleLogout} />} />
      <Route path="/dashboard" element={currentUser ? <Navigate to={getDashboardPath(currentUser.role)} replace /> : <Navigate to="/login" replace />} />
      <Route path="/register/patient" element={<RegisterPatientPage />} />
      <Route path="/register/doctor" element={<RegisterDoctorPage />} />
      <Route
        path="/dashboard/patient"
        element={
          <ProtectedRoute currentUser={currentUser} expectedRole="user">
            <PatientDashboard currentUser={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/doctor"
        element={
          <ProtectedRoute currentUser={currentUser} expectedRole="doctor">
            <DoctorDashboard
              currentUser={currentUser}
              onLogout={handleLogout}
              onUserUpdate={handleUserUpdate}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <ProtectedRoute currentUser={currentUser} expectedRole="admin">
            <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedRoute({
  children,
  currentUser,
  expectedRole,
}: {
  children: ReactNode;
  currentUser: AuthUser | null;
  expectedRole: Role;
}) {
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const isPatientRoute = expectedRole === 'user';
  const allowed = isPatientRoute
    ? currentUser.role === 'user' || currentUser.role === 'patient'
    : currentUser.role === expectedRole;

  if (!allowed) {
    return <Navigate to={getDashboardPath(currentUser.role)} replace />;
  }

  return <>{children}</>;
}

function getDashboardPath(role: Role) {
  if (role === 'doctor') {
    return '/dashboard/doctor';
  }

  if (role === 'admin') {
    return '/dashboard/admin';
  }

  return '/dashboard/patient';
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getFilteredAppointments(appointments: Appointment[], filter: AppointmentFilter) {
  if (filter === 'all') {
    return appointments;
  }

  return appointments.filter((appointment) => appointment.status === filter);
}

function HomePage({ currentUser }: { currentUser: AuthUser | null }) {
  const navigate = useNavigate();
  const dashboardPath = currentUser ? getDashboardPath(currentUser.role) : '/login';

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🏥</div>
            <h1 className="logo-text">CareWell Clinic</h1>
          </div>
          <nav className="nav-links">
            <button className="nav-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Home
            </button>
            <button className="nav-button" onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Features
            </button>
            <button className="nav-button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              How it works
            </button>
            <button className="nav-button secondary" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="nav-button secondary" onClick={() => navigate('/register/patient')}>
              Register
            </button>
          </nav>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <span className="eyebrow-pill">Smart clinic management</span>
            <h1>One platform for patients, doctors, and clinic teams.</h1>
            <p>
              CareWell Clinic brings appointment bookings, patient records, and doctor coordination together in a clean, modern experience.
              Save time, reduce no-shows, and deliver better care across every stage of the patient journey.
            </p>

            <div className="hero-actions">
              <button className="cta-button primary" onClick={() => navigate(dashboardPath)}>
                {currentUser ? `Open ${currentUser.role} Dashboard` : 'Start free trial'}
              </button>
              <button className="cta-button secondary" onClick={() => navigate('/register/doctor')}>
                Join as Doctor
              </button>
            </div>

            <div className="hero-stat-grid">
              <article className="stat-card">
                <strong>120+</strong>
                <span>Trusted doctors</span>
              </article>
              <article className="stat-card">
                <strong>4.9/5</strong>
                <span>Patient rating</span>
              </article>
              <article className="stat-card">
                <strong>15K</strong>
                <span>Appointments managed</span>
              </article>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image">
              <div className="image-panel">
                <div className="image-panel-header">CareWell Clinic</div>
                <div className="image-panel-body">
                  <div className="panel-item">
                    <span>Upcoming appointments</span>
                    <strong>18 scheduled</strong>
                  </div>
                  <div className="panel-item">
                    <span>New messages</span>
                    <strong>5 unread</strong>
                  </div>
                  <div className="panel-item">
                    <span>Pending requests</span>
                    <strong>3 approvals</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features-section" className="features-section">
          <div className="section-heading">
            <span className="eyebrow-pill">Why choose us</span>
            <h2>Built for modern clinics and caring teams.</h2>
            <p>From patient bookings to doctor availability, every detail is designed to make healthcare easier.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="card-icon">📅</div>
              <h3>Appointment automation</h3>
              <p>Keep schedules organized, reduce wait times, and let patients book directly online.</p>
            </div>
            <div className="feature-card">
              <div className="card-icon">👨‍⚕️</div>
              <h3>Doctor collaboration</h3>
              <p>Doctors can manage visits, update patient records, and coordinate care in one dashboard.</p>
            </div>
            <div className="feature-card">
              <div className="card-icon">🔐</div>
              <h3>Secure health data</h3>
              <p>Patient information stays protected with strong access controls and privacy-first design.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how-it-works">
          <div className="section-heading">
            <h2>How it works</h2>
            <p>Quick setup, easy booking, and complete visibility for everyone who uses your clinic system.</p>
          </div>
          <div className="how-grid">
            <article className="step-card">
              <span className="step-number">1</span>
              <h3>Create patient profiles</h3>
              <p>Register patients and doctors quickly so everyone can access appointments and records.</p>
            </article>
            <article className="step-card">
              <span className="step-number">2</span>
              <h3>Book appointments</h3>
              <p>Patients choose a doctor, pick an available slot, and get instant confirmation.</p>
            </article>
            <article className="step-card">
              <span className="step-number">3</span>
              <h3>Manage care</h3>
              <p>Doctors review patient history, update treatment notes, and complete visits with confidence.</p>
            </article>
          </div>
        </section>

        <section className="testimonial-section">
          <div className="section-heading">
            <h2>Trusted by clinics that care</h2>
            <p>Teams love using CareWell Clinic to keep patients on schedule and staff aligned.</p>
          </div>
          <div className="testimonial-grid">
            <article className="testimonial-card">
              <p>
                “CareWell Clinic made appointment management so much easier. Our staff can focus on patients instead of paperwork.”
              </p>
              <strong>Dr. Anna Lim</strong>
              <span>Cardiologist</span>
            </article>
            <article className="testimonial-card">
              <p>
                “I can see all my upcoming visits and patient notes in one place. It has transformed how our clinic runs.”
              </p>
              <strong>Mark Santos</strong>
              <span>Clinic Administrator</span>
            </article>
          </div>
        </section>

        <footer className="home-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <span className="footer-icon">🏥</span>
              <span className="footer-text">CareWell Clinic</span>
            </div>
            <p>Modern clinic software for patients, doctors, and care teams.</p>
            <div className="footer-actions">
              <button className="nav-button secondary" onClick={() => navigate('/register/patient')}>
                Register as Patient
              </button>
              <button className="nav-button secondary" onClick={() => navigate('/register/doctor')}>
                Register as Doctor
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function LoginPage({
  currentUser,
  onLogin,
  onLogout,
}: {
  currentUser: AuthUser | null;
  onLogin: (token: string, user: AuthUser) => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  useEffect(() => {
    if (!currentUser || isSwitchingAccount) {
      setEmail('');
    } else if (currentUser) {
      setEmail(currentUser.email);
    }
  }, [currentUser, isSwitchingAccount]);

  useEffect(() => {
    if (currentUser && !isSwitchingAccount) {
      setMessage(`You are currently signed in as ${currentUser.email}. Use the switch button below to login with another account.`);
    }
  }, [currentUser, isSwitchingAccount]);

  function handleSwitchAccount() {
    onLogout();
    setIsSwitchingAccount(true);
    setEmail('');
    setPassword('');
    setRole('user');
    setMessage('You can now login with another email.');
    setError(null);
    setEmailError(null);
    setPasswordError(null);
  }

  const validateForm = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email, password, role },
      });
      onLogin(response.access_token, response.user);
      setMessage('Login successful. Redirecting...');
      setTimeout(() => navigate(getDashboardPath(response.user.role)), 1000);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your clinic dashboard"
      footer={<AuthFooter />}
      message={message}
      error={error}
    >
      <div className="login-grid">
        <div className="login-panel">
          <div className="auth-hero-banner">
            <div className="hero-pill">Welcome to CareWell</div>
            <h3>Your health journey begins here</h3>
            <p>Sign in to access your appointments, doctor care, and clinic insights in one modern experience.</p>
            <div className="hero-metrics">
              <span>Fast booking</span>
              <span>Secure access</span>
              <span>Smart reminders</span>
            </div>
          </div>
          <div className="login-welcome-card">
            <span className="eyebrow">CareWell Clinic</span>
            <h2>Sign in securely</h2>
            <p>
              Manage appointments, patient records, and care workflows with one account. Choose the correct role and sign in to continue.
            </p>
          </div>
          <div className="role-highlights">
            <article className="role-card">
              <h3>Patient</h3>
              <p>Book appointments, track prescriptions, and view your medical history.</p>
            </article>
            <article className="role-card">
              <h3>Doctor</h3>
              <p>Review your schedule, confirm visits, and manage patient communications.</p>
            </article>
            <article className="role-card">
              <h3>Admin</h3>
              <p>Oversee clinic operations, staff, and appointment performance.</p>
            </article>
          </div>
        </div>

        <div className="login-form-panel">
          <form className="auth-form" onSubmit={handleSubmit}>
            {currentUser ? (
              <div className="switch-account-banner">
                <p>
                  Signed in as <strong>{currentUser.email}</strong>. Click below to switch accounts and use a different email.
                </p>
                <button type="button" className="secondary-button compact-button" onClick={handleSwitchAccount}>
                  Switch account
                </button>
              </div>
            ) : null}
            <div className="form-group">
              <label htmlFor="email">
                <span className="label-icon">📧</span>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                autoComplete="username email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                type="email"
                placeholder="Enter your email"
                required
                className={emailError ? 'error' : ''}
              />
              {emailError && <span className="field-error">{emailError}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="password">
                <span className="label-icon">🔒</span>
                Password
              </label>
              <input
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                type="password"
                placeholder="Enter your password"
                required
                className={passwordError ? 'error' : ''}
              />
              {passwordError && <span className="field-error">{passwordError}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="role">
                <span className="label-icon">👤</span>
                Account Type
              </label>
              <select id="role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
                <option value="user">👨‍⚕️ Patient</option>
                <option value="doctor">👩‍⚕️ Doctor</option>
                <option value="admin">⚙️ Admin</option>
              </select>
            </div>
            <button className="auth-button" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner">⏳</span>
                  Signing in...
                </>
              ) : (
                <>
                  <span className="button-icon">🚀</span>
                  Sign In
                </>
              )}
            </button>
            <p className="login-footnote">
              Don't have an account yet? <Link to="/register/patient">Register as patient</Link> or <Link to="/register/doctor">register as doctor</Link>.
            </p>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}

function RegisterPatientPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterUserPayload>({
    name: '',
    email: '',
    password: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api('/auth/register/user', { method: 'POST', body: form });
      setMessage('Patient account created. Redirecting to login...');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Register patient"
      subtitle="Create a patient account for booking appointments."
      footer={<AuthFooter />}
      message={message}
      error={error}
    >
      <section className="register-hero register-hero-patient">
        <span className="hero-pill">Patient onboarding</span>
        <h3>Begin your care journey with confidence</h3>
        <p>Register quickly and start booking appointments with trusted doctors in just a few clicks.</p>
      </section>
      <form className="stack-form register-form" onSubmit={handleSubmit}>
        <label>
          <span>Full name</span>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          <span>Email</span>
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            type="email"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            type="password"
            required
          />
        </label>
        <label>
          <span>Location</span>
          <input
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register patient'}
        </button>
      </form>
    </AuthLayout>
  );
}

function RegisterDoctorPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterDoctorPayload>({
    name: '',
    email: '',
    password: '',
    specialization: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await api('/auth/register/doctor', { method: 'POST', body: form });
      setMessage('Doctor account created. Redirecting to login...');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Register doctor"
      subtitle="Create a doctor account for managing appointments."
      footer={<AuthFooter />}
      message={message}
      error={error}
    >
      <section className="register-hero register-hero-doctor">
        <span className="hero-pill">Doctor access</span>
        <h3>Join CareWell and manage your practice</h3>
        <p>Create your profile to receive appointments, track schedules, and support patient care.</p>
      </section>
      <form className="stack-form register-form" onSubmit={handleSubmit}>
        <label>
          <span>Full name</span>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          <span>Email</span>
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            type="email"
            required
          />
        </label>
        <label>
          <span>Password</span>
          <input
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            type="password"
            required
          />
        </label>
        <label>
          <span>Specialization</span>
          <input
            value={form.specialization}
            onChange={(event) => setForm({ ...form, specialization: event.target.value })}
            required
          />
        </label>
        <label>
          <span>Clinic address</span>
          <input
            value={form.address}
            onChange={(event) => setForm({ ...form, address: event.target.value })}
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register doctor'}
        </button>
      </form>
    </AuthLayout>
  );
}

function PatientDashboard({
  currentUser,
  onLogout,
  onUserUpdate,
}: {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onUserUpdate?: (user: AuthUser) => void;
}) {
  if (!currentUser) {
    return (
      <div className="dashboard-fallback">
        <h2>Patient Dashboard Unavailable</h2>
        <p>
          We could not load your patient dashboard right now. Please log in again or contact support if the issue persists.
        </p>
        <Link to="/login" className="cta-button primary">
          Go to Login
        </Link>
      </div>
    );
  }
  const [activeView, setActiveView] = useState('dashboard');
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    appointmentId: '',
    amount: '',
    method: 'credit_card',
    description: '',
  });
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [medicalSummary, setMedicalSummary] = useState<{
    recentLabResults: LabResult[];
    allergies: string[];
    immunizations: ImmunizationRecord[];
    healthNotes: HealthNote[];
  }>({
    recentLabResults: [
      {
        id: 1,
        title: 'Complete Blood Count',
        date: '2025-05-15',
        doctor: 'Dr. Anna Lim',
        summary: 'Normal hemoglobin, white blood cells slightly elevated. No anemia detected.',
        fileName: 'CBC_Report_May_2025.pdf',
      },
      {
        id: 2,
        title: 'Chest X-ray',
        date: '2025-04-28',
        doctor: 'Dr. John Reyes',
        summary: 'No acute findings. Lungs are clear and heart size is normal.',
        fileName: 'Chest_Xray_April_2025.pdf',
      },
    ],
    allergies: ['No known drug allergies.'],
    immunizations: [
      {
        id: 1,
        vaccine: 'COVID-19 Booster',
        date: '2024-12-10',
        provider: 'City Health Clinic',
        notes: 'Completed booster dose as recommended.',
      },
      {
        id: 2,
        vaccine: 'Influenza',
        date: '2024-09-22',
        provider: 'CareWell Clinic',
        notes: 'Annual flu vaccine administered.',
      },
    ],
    healthNotes: [
      {
        id: 1,
        title: 'Annual wellness summary',
        date: '2025-03-10',
        details: 'Overall good health. Recommended regular exercise and balanced diet. Follow-up in 12 months.',
      },
      {
        id: 2,
        title: 'Medication review note',
        date: '2025-04-28',
        details: 'Reviewed current medication. No issues with the prescribed treatment plan.',
      },
    ],
  });
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState<LabResult | ImmunizationRecord | HealthNote | null>(null);
  const [selectedMedicalCategory, setSelectedMedicalCategory] = useState<'lab' | 'immunization' | 'note' | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    emailReminders: true,
    smsReminders: false,
    prescriptionAlerts: true,
    appointmentConfirmations: true,
  });
  const [privacySettings, setPrivacySettings] = useState({
    shareMedicalHistory: false,
    allowDoctorCommunication: true,
    dataRetention: '1year',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [languageSettings, setLanguageSettings] = useState({
    language: 'en',
    timezone: 'Asia/Manila',
  });
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<'notifications' | 'privacy' | 'password' | 'language' | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeMessageTab, setActiveMessageTab] = useState<'messages' | 'notifications'>('messages');
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const doctorById = useMemo(
    () => Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor])),
    [doctors],
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: currentUser?.name ?? '',
    email: currentUser?.email ?? '',
    phone: (currentUser as any)?.phone ?? '0917 123 4567',
    location: currentUser?.location ?? '',
    dob: '1992-04-12',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (messages.length > 0) {
      saveStoredMessages(messages);
    }
  }, [messages]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [rescheduleForm, setRescheduleForm] = useState<Partial<Appointment> | null>(null);
  const [updatingAppointment, setUpdatingAppointment] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfileForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: (currentUser as any)?.phone ?? '0917 123 4567',
      location: currentUser.location ?? '',
      dob: '1992-04-12',
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || appointments.length === 0) {
      return;
    }

    if (messages.length === 0) {
      const stored = loadStoredMessages().filter(
        (msg) => msg.senderId === currentUser.id || msg.recipientId === currentUser.id,
      );
      if (stored.length > 0) {
        setMessages(stored);
        return;
      }
    }

    if (messages.length > 0) {
      return;
    }

    // Seed messages based on actual appointments
    const seededMessages: Message[] = [];
    const uniqueDoctorIds = new Set(appointments.map((appt) => appt.doctorId));
    let messageId = 1;

    uniqueDoctorIds.forEach((doctorId) => {
      const doctor = doctorById[doctorId];
      if (!doctor) return;

      seededMessages.push({
        id: messageId++,
        senderId: doctorId,
        senderName: doctor.name,
        senderRole: 'doctor',
        recipientId: currentUser.id,
        recipientName: currentUser.name,
        content: `Your appointment with ${doctor.name} is confirmed.`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        read: false,
        conversationId: doctorId,
      });

      if (Math.random() > 0.5) {
        seededMessages.push({
          id: messageId++,
          senderId: doctorId,
          senderName: doctor.name,
          senderRole: 'doctor',
          recipientId: currentUser.id,
          recipientName: currentUser.name,
          content: 'Please remember to bring your medical records to the appointment.',
          timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: false,
          conversationId: doctorId,
        });
      }
    });

    setMessages(seededMessages);
  }, [currentUser, messages.length, appointments, doctorById]);

  useEffect(() => {
    if (!currentUser) return;

    const loadNotifications = async () => {
      try {
        const [notifs, count] = await Promise.all([
          getNotifications(),
          getUnreadNotificationCount(),
        ]);
        setNotifications(notifs);
        setUnreadCount(count.count);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, [currentUser]);

  const conversationSummaries = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const conversations = new Map<number, {
      conversationId: number;
      doctorId: number;
      doctorName: string;
      lastMessage: Message;
      unreadCount: number;
    }>();

    messages.forEach((msg) => {
      const conversationId = msg.conversationId ?? (msg.senderRole === 'doctor' ? msg.senderId : msg.recipientId);
      const doctorId = conversationId; // Since we set conversationId to doctorId
      const doctor = doctorById[doctorId];
      const doctorName = doctor ? doctor.name : (msg.senderRole === 'doctor' ? msg.senderName : msg.recipientName);
      const existing = conversations.get(conversationId);
      const unreadCount = (existing?.unreadCount ?? 0) + (!msg.read && msg.senderRole === 'doctor' ? 1 : 0);
      const latestMessage = existing && existing.lastMessage.timestamp > msg.timestamp ? existing.lastMessage : msg;

      conversations.set(conversationId, {
        conversationId,
        doctorId,
        doctorName,
        lastMessage: latestMessage,
        unreadCount,
      });
    });

    return Array.from(conversations.values()).sort((a, b) => b.lastMessage.timestamp.localeCompare(a.lastMessage.timestamp));
  }, [messages, currentUser?.id, doctorById]);

  const activeConversation = selectedConversation !== null
    ? conversationSummaries.find((conversation) => conversation.conversationId === selectedConversation) ?? null
    : null;

  const conversationMessages = selectedConversation !== null
    ? messages
        .filter((msg) => msg.conversationId === selectedConversation)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    : [];

  const unreadNotificationCount = useMemo(
    () => conversationSummaries.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversationSummaries],
  );

  function openConversation(conversationId: number) {
    setSelectedConversation(conversationId);
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.conversationId === conversationId && msg.senderRole === 'doctor'
          ? { ...msg, read: true }
          : msg,
      ),
    );
  }

  function openDoctorConversation(doctorId: number) {
    const doctor = doctorById[doctorId];
    setActiveView('messages');
    setSelectedConversation(doctorId);

    if (!doctor) {
      return;
    }

    setMessages((prevMessages) => {
      const hasConversation = prevMessages.some((msg) => msg.conversationId === doctorId);
      if (hasConversation) {
        return prevMessages;
      }

      return [
        ...prevMessages,
        {
          id: Date.now(),
          senderId: doctorId,
          senderName: doctor.name,
          senderRole: 'doctor',
          recipientId: currentUser?.id ?? 0,
          recipientName: currentUser?.name ?? 'You',
          content: `You can message Dr. ${doctor.name} here about your appointment.`,
          timestamp: new Date().toISOString(),
          read: true,
          conversationId: doctorId,
        },
      ];
    });
  }

  function openNotifications() {
    setActiveView('messages');
    if (selectedConversation === null && conversationSummaries.length > 0) {
      openConversation(conversationSummaries[0].conversationId);
    }
  }

  function closeConversation() {
    setSelectedConversation(null);
  }

  function markAllRead() {
    setMessages((prevMessages) => prevMessages.map((msg) => ({ ...msg, read: true })));
    setMessage('All messages marked as read.');
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser) {
      return;
    }

    setMessage(null);
    setError(null);

    try {
      const updatedUser = {
        ...currentUser,
        name: profileForm.name,
        email: profileForm.email,
        location: profileForm.location,
        phone: profileForm.phone,
      } as AuthUser;

      updateStoredUser(updatedUser);
      onUserUpdate?.(updatedUser);
      setMessage('Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (saveError) {
      setError((saveError as Error).message);
    }
  }

  async function handleMarkNotificationAsRead(id: number) {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function handleMarkAllNotificationsAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async function handleDeleteNotification(id: number) {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => prev - (notifications.find(n => n.id === id)?.isRead ? 0 : 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', caption: 'Get started', icon: '🏠' },
    { key: 'appointments', label: 'My Appointments', caption: 'View and manage bookings', icon: '📅' },
    { key: 'medical', label: 'Medical Records', caption: 'Health history', icon: '📋' },
    { key: 'prescriptions', label: 'Prescriptions', caption: 'Medication list', icon: '💊' },
    { key: 'messages', label: 'Messages', caption: 'Inbox and updates', icon: '💬', badge: unreadCount },
    { key: 'profile', label: 'Profile Settings', caption: 'Account details', icon: '👤' },
    { key: 'payments', label: 'Payments', caption: 'Payment history', icon: '💳' },
    { key: 'documents', label: 'Documents', caption: 'Store documents', icon: '📄' },
    { key: 'settings', label: 'Settings', caption: 'Account preferences', icon: '⚙️' },
    { key: 'support', label: 'Support & Session', caption: 'Get help', icon: '❓' },
    { key: 'logout', label: 'Logout', caption: 'Sign out', icon: '🚪' },
  ];

  async function loadData() {
    setError(null);

    try {
      const [doctorData, appointmentData, paymentData, paymentMethodData] = await Promise.all([
        api<Doctor[]>('/doctors', { auth: true }),
        api<Appointment[]>('/appointments', { auth: true }),
        api<Payment[]>('/payments', { auth: true }),
        api<PaymentMethod[]>('/payment-methods', { auth: true }),
      ]);
      setDoctors(doctorData);
      setAppointments(appointmentData);
      setPayments(paymentData);
      setPaymentMethods(paymentMethodData);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  async function handleBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBooking(true);
    setMessage(null);
    setError(null);

    try {
      await api('/appointments', {
        method: 'POST',
        auth: true,
        body: { doctorId: Number(doctorId), date, time, symptoms },
      });
      setDoctorId('');
      setDate('');
      setTime('');
      setSymptoms('');
      setMessage('Appointment booked successfully.');
      setIsBookingMode(false);
      await loadData();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setBooking(false);
    }
  }

  async function cancelAppointment(id: number) {
    setMessage(null);
    setError(null);

    try {
      await api(`/appointments/${id}/cancel`, { method: 'PATCH', auth: true });
      setMessage('Appointment cancelled.');
      await loadData();
    } catch (cancelError) {
      setError((cancelError as Error).message);
    }
  }

  async function handleReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rescheduleForm) {
      return;
    }

    setUpdatingAppointment(true);
    setMessage(null);
    setError(null);

    try {
      await api(`/appointments/${rescheduleForm.id}`, {
        method: 'PATCH',
        auth: true,
        body: {
          date: rescheduleForm.date,
          time: rescheduleForm.time,
          symptoms: rescheduleForm.symptoms,
        },
      });
      setMessage('Appointment rescheduled.');
      setRescheduleForm(null);
      await loadData();
    } catch (updateError) {
      setError((updateError as Error).message);
    } finally {
      setUpdatingAppointment(false);
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || !messageContent.trim() || selectedConversation === null) {
      return;
    }

    const conversation = conversationSummaries.find((conv) => conv.conversationId === selectedConversation);
    if (!conversation) {
      return;
    }

    setSendingMessage(true);
    setError(null);

    try {
      const newMessage: Message = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'user',
        recipientId: conversation.doctorId,
        recipientName: conversation.doctorName,
        content: messageContent.trim(),
        timestamp: new Date().toISOString(),
        read: true,
        conversationId: selectedConversation,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageContent('');
      setMessage('Message sent successfully.');

      setTimeout(() => {
        const reply: Message = {
          id: Date.now() + 1,
          senderId: conversation.doctorId,
          senderName: conversation.doctorName,
          senderRole: 'doctor',
          recipientId: currentUser.id,
          recipientName: currentUser.name,
          content: 'Thanks for your message. I will review this and get back to you shortly.',
          timestamp: new Date().toISOString(),
          read: false,
          conversationId: selectedConversation,
        };
        setMessages((prevMessages) => [...prevMessages, reply]);
      }, 1200);
    } catch (sendError) {
      setError((sendError as Error).message);
    } finally {
      setSendingMessage(false);
    }
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || !paymentForm.amount) {
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      const targetPatientId = paymentForm.patientId ? Number(paymentForm.patientId) : currentUser.id;
      const newPayment: Omit<Payment, 'id' | 'createdAt'> = {
        patientId: targetPatientId,
        appointmentId: paymentForm.appointmentId ? Number(paymentForm.appointmentId) : undefined,
        amount: parseFloat(paymentForm.amount),
        currency: 'PHP',
        status: 'completed',
        method: paymentForm.method,
        description: paymentForm.description || 'Payment for services',
        paidAt: new Date().toISOString(),
        transactionId: `TXN-${Date.now()}`,
      };

      if (!targetPatientId) {
        throw new Error('Please select a patient for this payment.');
      }

      const createdPayment = await api<Payment>('/payments', {
        method: 'POST',
        auth: true,
        body: newPayment,
      });

      setPayments((prev) => [createdPayment, ...prev]);
      setPaymentForm({ appointmentId: '', amount: '', method: 'credit_card', description: '' });
      setShowPaymentForm(false);
      setMessage('Payment processed successfully.');
      await loadData();
    } catch (paymentError) {
      setError((paymentError as Error).message);
    } finally {
      setProcessingPayment(false);
    }
  }

  function openPaymentForAppointment(appointment: Appointment) {
    setPaymentForm({
      appointmentId: String(appointment.id),
      amount: '1200.00',
      method: 'credit_card',
      description: `Payment for consultation on ${appointment.date}${appointment.time ? ` at ${appointment.time}` : ''}`,
    });
    setShowPaymentForm(true);
  }

  async function handleAddPaymentMethod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProcessingPayment(true);
    setError(null);

    try {
      const newMethod: Omit<PaymentMethod, 'id'> = {
        type: 'credit_card',
        last4: cardForm.number.slice(-4),
        brand: cardForm.number.startsWith('4') ? 'Visa' : cardForm.number.startsWith('5') ? 'Mastercard' : 'Unknown',
        expiryMonth: parseInt(cardForm.expiry.split('/')[0]),
        expiryYear: parseInt(`20${cardForm.expiry.split('/')[1]}`),
        isDefault: paymentMethods.length === 0,
      };

      const createdMethod = await api<PaymentMethod>('/payment-methods', {
        method: 'POST',
        auth: true,
        body: newMethod,
      });

      setPaymentMethods((prev) => [...prev, createdMethod]);
      setCardForm({ number: '', expiry: '', cvc: '', name: '' });
      setShowAddPaymentMethod(false);
      setMessage('Payment method added successfully.');
    } catch (methodError) {
      setError((methodError as Error).message);
    } finally {
      setProcessingPayment(false);
    }
  }

  function viewPaymentReceipt(payment: Payment) {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  }

  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const outstandingBalance = appointments
    .filter((appt) => appt.status === 'confirmed' || appt.status === 'completed')
    .filter((appt) => !payments.some((p) => p.appointmentId === appt.id))
    .length * 1200; // Assuming ₱1,200 per appointment

  const upcomingAppointments = appointments.filter((appointment) => appointment.status !== 'cancelled');

  const appointmentNotifications = useMemo(() => {
    if (!currentUser) return [];

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);

    const notifications: { id: number; title: string; description: string; type: 'info' | 'warning' | 'success'; }[] = [];

    appointments.forEach((appointment) => {
      const doctor = doctorById[appointment.doctorId];
      const doctorName = doctor ? `Dr. ${doctor.name}` : `Doctor #${appointment.doctorId}`;
      const paid = payments.some((payment) => payment.appointmentId === appointment.id && payment.status === 'completed');

      if (appointment.status === 'pending') {
        notifications.push({
          id: appointment.id,
          title: 'Appointment pending confirmation',
          description: `${doctorName} has not yet confirmed your ${appointment.date}${appointment.time ? ` at ${appointment.time}` : ''}.`,
          type: 'warning',
        });
      }

      if (appointment.status === 'confirmed' && (appointment.date === today || appointment.date === tomorrow)) {
        notifications.push({
          id: appointment.id + 10000,
          title: appointment.date === today ? 'Appointment today' : 'Appointment tomorrow',
          description: `${doctorName} is expecting you ${appointment.date === today ? 'today' : 'tomorrow'}${appointment.time ? ` at ${appointment.time}` : ''}.`,
          type: 'info',
        });
      }

      if (!paid && appointment.status !== 'cancelled') {
        notifications.push({
          id: appointment.id + 20000,
          title: 'Payment reminder',
          description: `Pay for your appointment with ${doctorName} scheduled on ${appointment.date}.`,
          type: 'warning',
        });
      }
    });

    return notifications.slice(0, 5);
  }, [appointments, currentUser, doctorById, payments]);

  return (
    <>
      <SidebarDashboard
        currentUser={currentUser}
        navItems={navItems}
        activeView={activeView}
        onSelectView={setActiveView}
        title="My Dashboard"
        subtitle="Manage your appointments and health information in one place."
        onLogout={onLogout}
        message={message}
        error={error}
        pageClassName="patient-dashboard"
        notificationCount={unreadNotificationCount}
        onNotificationClick={openNotifications}
      >
        {activeView === 'dashboard' ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Upcoming visits" value={String(upcomingAppointments.length)} />
            <MetricCard label="Doctors available" value={String(doctors.length)} />
            <MetricCard label="Confirmed" value={String(appointments.filter((appt) => appt.status === 'confirmed').length)} />
            <MetricCard label="Pending" value={String(appointments.filter((appt) => appt.status === 'pending').length)} />
          </div>

          <section className="panel hero-dashboard-panel">
            <div className="overview-hero">
              <div>
                <span className="eyebrow">Welcome back</span>
                <h2>{currentUser?.name || 'Patient'}</h2>
                <p>Manage your appointments and health information in one place.</p>
              </div>
            </div>
          </section>

          <div className="content-grid">
            <section className="panel">
              <SectionHeader title="Appointment Notifications" />
              <div className="list-stack">
                {appointmentNotifications.length === 0 ? (
                  <EmptyState text="No new appointment alerts right now." />
                ) : (
                  appointmentNotifications.map((notification) => (
                    <article className={`list-card notification-card notification-${notification.type}`} key={notification.id}>
                      <div>
                        <h3>{notification.title}</h3>
                        <p>{notification.description}</p>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="content-grid">
            <section className="panel">
              <SectionHeader title="Upcoming Appointments" action={<button className="ghost-button" onClick={() => void loadData()}>Refresh</button>} />
              <div className="list-stack">
                {upcomingAppointments.length === 0 ? (
                  <EmptyState text="No upcoming appointments yet." />
                ) : (
                  upcomingAppointments.slice(0, 4).map((appointment) => (
                    <article className="list-card" key={appointment.id}>
                      <div>
                        <h3>
                          {doctorById[appointment.doctorId]
                            ? `Dr. ${doctorById[appointment.doctorId].name}`
                            : `Doctor #${appointment.doctorId}`}
                        </h3>
                        <p>{appointment.date} {appointment.time ? `• ${appointment.time}` : ''}</p>
                        <p className="muted-copy">{doctorById[appointment.doctorId]?.specialization || 'General medicine'}</p>
                      </div>
                      <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="content-grid">
            <section className="panel">
              <SectionHeader title="Medical Summary" />
              <div className="summary-grid">
                <article className="summary-card">
                  <strong>Medical Records</strong>
                  <p>View and download your health records.</p>
                </article>
                <article className="summary-card">
                  <strong>Prescriptions</strong>
                  <p>View your prescription history.</p>
                </article>
                <article className="summary-card">
                  <strong>Allergies</strong>
                  <p>No known allergies.</p>
                </article>
                <article className="summary-card">
                  <strong>Blood Type</strong>
                  <p>O+</p>
                </article>
              </div>
            </section>
          </div>

          <div className="content-grid">
            <section className="panel">
              <SectionHeader title="Recent Prescriptions" />
              <div className="list-stack">
                <article className="list-card">
                  <div>
                    <h3>Amoxicillin 500mg</h3>
                    <p>1 capsule every 8 hours</p>
                    <p className="muted-copy">May 10, 2024 · Dr. John Reyes</p>
                  </div>
                </article>
                <article className="list-card">
                  <div>
                    <h3>Cetirizine 10mg</h3>
                    <p>1 tablet once daily</p>
                    <p className="muted-copy">April 18, 2024 · Dr. Anna Lim</p>
                  </div>
                </article>
              </div>
            </section>

            <section className="panel">
              <SectionHeader title="My Profile" />
              <div className="profile-summary">
                <InfoPair label="Email" value={currentUser?.email || '—'} />
                <InfoPair label="Phone" value={currentUser?.phone || '0917 123 4567'} />
                <InfoPair label="Date of Birth" value="April 12, 1992 (32 yrs)" />
                <InfoPair label="Location" value="123 Health St., Quezon City, Metro Manila" />
              </div>
            </section>
          </div>
        </>
      ) : null}

      {activeView === 'appointments' ? (
        <>
          {isBookingMode ? (
            <section className="panel">
              <SectionHeader
                title="Book a new appointment"
                action={<button className="ghost-button" onClick={() => setIsBookingMode(false)}>Back</button>}
              />
              <form className="stack-form" onSubmit={handleBook}>
                <label>
                  <span>Doctor</span>
                  <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} required>
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Date</span>
                  <input
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    type="date"
                    min={getTodayInputValue()}
                    required
                  />
                </label>
                <label>
                  <span>Time</span>
                  <input value={time} onChange={(event) => setTime(event.target.value)} type="time" />
                </label>
                <label>
                  <span>Symptoms or notes</span>
                  <textarea
                    rows={5}
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                    placeholder="Optional notes for the doctor"
                  />
                </label>
                <button className="primary-button" type="submit" disabled={booking}>
                  {booking ? 'Booking...' : 'Confirm appointment'}
                </button>
              </form>
            </section>
          ) : (
            <section className="panel">
              <SectionHeader
                title="Your appointments"
                action={
                  <div className="toolbar-actions">
                    <button className="primary-button compact-button" onClick={() => setIsBookingMode(true)}>
                      + Book Appointment
                    </button>
                    <button className="ghost-button" onClick={() => void loadData()}>Refresh</button>
                  </div>
                }
              />
              <div className="list-stack">
                {appointments.length === 0 ? (
                  <EmptyState text="You have not booked any appointments yet." />
                ) : (
                  appointments.map((appointment) => (
                    <article className="list-card" key={appointment.id}>
                  {rescheduleForm?.id === appointment.id ? (
                    <form className="inline-edit-form" onSubmit={handleReschedule}>
                      <div className="inline-edit-grid">
                        <label>
                          <span>Date</span>
                          <input
                            value={rescheduleForm.date}
                            onChange={(event) =>
                              setRescheduleForm({ ...rescheduleForm, date: event.target.value })
                            }
                            type="date"
                            min={getTodayInputValue()}
                            required
                          />
                        </label>
                        <label>
                          <span>Time</span>
                          <input
                            value={rescheduleForm.time}
                            onChange={(event) =>
                              setRescheduleForm({ ...rescheduleForm, time: event.target.value })
                            }
                            type="time"
                          />
                        </label>
                      </div>
                      <label>
                        <span>Symptoms or notes</span>
                        <textarea
                          rows={3}
                          value={rescheduleForm.symptoms}
                          onChange={(event) =>
                            setRescheduleForm({ ...rescheduleForm, symptoms: event.target.value })
                          }
                        />
                      </label>
                      <div className="list-actions">
                        <button className="primary-button compact-button" type="submit" disabled={updatingAppointment}>
                          {updatingAppointment ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          className="secondary-button compact-button"
                          type="button"
                          onClick={() => setRescheduleForm(null)}
                        >
                          Close
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <h3>
                          {doctorById[appointment.doctorId]
                            ? `Dr. ${doctorById[appointment.doctorId].name}`
                            : `Doctor #${appointment.doctorId}`}
                        </h3>
                        <p>
                          {appointment.date}
                          {appointment.time ? ` at ${appointment.time}` : ''}
                        </p>
                        <p className="muted-copy">{appointment.symptoms || 'No notes added.'}</p>
                      </div>
                      <div className="list-actions">
                        <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                        {appointment.status !== 'cancelled' && appointment.status !== 'completed' ? (
                          <button
                            className="secondary-button compact-button"
                            type="button"
                            onClick={() => openPaymentForAppointment(appointment)}
                          >
                            Pay service
                          </button>
                        ) : null}
                        {appointment.status === 'pending' ? (
                          <button
                            className="ghost-button compact-button"
                            type="button"
                            onClick={() =>
                              setRescheduleForm({
                                id: appointment.id,
                                date: appointment.date,
                                time: appointment.time ?? '',
                                symptoms: appointment.symptoms ?? '',
                              })
                            }
                          >
                            Reschedule
                          </button>
                        ) : null}
                        {appointment.status !== 'cancelled' ? (
                          <button
                            className="secondary-button compact-button"
                            type="button"
                            onClick={() => openDoctorConversation(appointment.doctorId)}
                          >
                            Message doctor
                          </button>
                        ) : null}
                        {appointment.status !== 'cancelled' && appointment.status !== 'completed' ? (
                          <button
                            className="danger-button compact-button"
                            type="button"
                            onClick={() => void cancelAppointment(appointment.id)}
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </>
                  )}
                </article>
                  ))
                )}
              </div>
            </section>
          )}
        </>
      ) : null}

      {activeView === 'prescriptions' ? (
        <section className="panel">
          <SectionHeader title="Prescriptions" action={<button className="ghost-button" type="button" onClick={() => setMessage('Prescription list refreshed.')}>Refresh</button>} />
          <div className="list-stack">
            <article className="list-card">
              <div>
                <h3>Amoxicillin 500mg</h3>
                <p>1 capsule every 8 hours</p>
                <p className="muted-copy">May 10, 2024 · Dr. John Reyes</p>
              </div>
              <div className="list-actions">
                <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Viewing prescription details soon.')}>View</button>
                <button className="primary-button compact-button" type="button" onClick={() => setMessage('Refill request sent.')}>Refill</button>
              </div>
            </article>
            <article className="list-card">
              <div>
                <h3>Cetirizine 10mg</h3>
                <p>1 tablet once daily</p>
                <p className="muted-copy">April 18, 2024 · Dr. Anna Lim</p>
              </div>
              <div className="list-actions">
                <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Viewing prescription details soon.')}>View</button>
                <button className="primary-button compact-button" type="button" onClick={() => setMessage('Refill request sent.')}>Refill</button>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {activeView === 'medical' ? (
        <section className="panel">
          <SectionHeader title="Medical Records" action={<button className="ghost-button" type="button" onClick={() => setMessage('Medical records refreshed.')}>Refresh</button>} />
          <div className="content-grid">
            <div>
              <div className="summary-grid">
                <article className="summary-card">
                  <strong>Lab reports</strong>
                  <p>{medicalSummary.recentLabResults.length} available reports</p>
                  <button className="secondary-button compact-button" type="button" onClick={() => {
                    setSelectedMedicalCategory('lab');
                    setSelectedMedicalRecord(medicalSummary.recentLabResults[0]);
                  }}>View latest</button>
                </article>
                <article className="summary-card">
                  <strong>Allergies</strong>
                  <p>{medicalSummary.allergies.join(' ')}</p>
                  <button className="secondary-button compact-button" type="button" onClick={() => { setMessage('Allergy records are up to date.'); }}>Review</button>
                </article>
                <article className="summary-card">
                  <strong>Immunizations</strong>
                  <p>{medicalSummary.immunizations.length} completed vaccines</p>
                  <button className="secondary-button compact-button" type="button" onClick={() => {
                    setSelectedMedicalCategory('immunization');
                    setSelectedMedicalRecord(medicalSummary.immunizations[0]);
                  }}>View history</button>
                </article>
                <article className="summary-card">
                  <strong>Health notes</strong>
                  <p>{medicalSummary.healthNotes.length} notes from your care team</p>
                  <button className="secondary-button compact-button" type="button" onClick={() => {
                    setSelectedMedicalCategory('note');
                    setSelectedMedicalRecord(medicalSummary.healthNotes[0]);
                  }}>Read note</button>
                </article>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Recent Medical Records</h3>
              <div className="list-stack">
                {medicalSummary.recentLabResults.map((lab) => (
                  <article className="list-card" key={lab.id}>
                    <div>
                      <h3>{lab.title}</h3>
                      <p>{lab.doctor}</p>
                      <p className="muted-copy">{lab.date}</p>
                    </div>
                    <div className="list-actions">
                      <button className="secondary-button compact-button" type="button" onClick={() => { setSelectedMedicalCategory('lab'); setSelectedMedicalRecord(lab); }}>View</button>
                      <button className="primary-button compact-button" type="button" onClick={() => setMessage(`${lab.fileName} download started.`)}>Download</button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="content-grid" style={{ marginTop: '24px' }}>
            <section className="panel">
              <SectionHeader title="Immunization History" />
              <div className="list-stack">
                {medicalSummary.immunizations.map((record) => (
                  <article className="list-card" key={record.id}>
                    <div>
                      <h3>{record.vaccine}</h3>
                      <p>{record.provider}</p>
                      <p className="muted-copy">{record.date}</p>
                    </div>
                    <button className="secondary-button compact-button" type="button" onClick={() => { setSelectedMedicalCategory('immunization'); setSelectedMedicalRecord(record); }}>View</button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="content-grid" style={{ marginTop: '24px' }}>
            <section className="panel">
              <SectionHeader title="Health Notes" />
              <div className="list-stack">
                {medicalSummary.healthNotes.map((note) => (
                  <article className="list-card" key={note.id}>
                    <div>
                      <h3>{note.title}</h3>
                      <p className="muted-copy">{note.date}</p>
                    </div>
                    <button className="secondary-button compact-button" type="button" onClick={() => { setSelectedMedicalCategory('note'); setSelectedMedicalRecord(note); }}>Read</button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {activeView === 'messages' ? (
        <section className="panel">
          <SectionHeader
            title={selectedConversation ? `Conversation with ${activeConversation?.doctorName ?? 'Doctor'}` : 'Messages & Notifications'}
            action={
              <div className="toolbar-actions">
                {selectedConversation ? (
                  <button className="ghost-button compact-button" type="button" onClick={closeConversation}>
                    ← Back
                  </button>
                ) : (
                  <div className="tab-buttons">
                    <button
                      className={`tab-button ${activeMessageTab === 'messages' ? 'active' : ''}`}
                      onClick={() => setActiveMessageTab('messages')}
                    >
                      Messages {conversationSummaries.filter(c => c.unreadCount > 0).length > 0 && `(${conversationSummaries.filter(c => c.unreadCount > 0).length})`}
                    </button>
                    <button
                      className={`tab-button ${activeMessageTab === 'notifications' ? 'active' : ''}`}
                      onClick={() => setActiveMessageTab('notifications')}
                    >
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                  </div>
                )}
                {!selectedConversation && activeMessageTab === 'messages' && (
                  <button className="ghost-button compact-button" type="button" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
                {!selectedConversation && activeMessageTab === 'notifications' && unreadCount > 0 && (
                  <button className="ghost-button compact-button" type="button" onClick={handleMarkAllNotificationsAsRead}>
                    Mark all read
                  </button>
                )}
              </div>
            }
          />

          {selectedConversation && activeConversation ? (
            <div className="chat-thread">
              <div className="chat-header">
                <div>
                  <strong>{activeConversation.doctorName}</strong>
                  <p className="muted-copy">Last message: {new Date(activeConversation.lastMessage.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="message-list">
                {conversationMessages.length === 0 ? (
                  <EmptyState text="No messages in this conversation yet." />
                ) : (
                  conversationMessages.map((msg) => (
                    <div key={msg.id} className={`message-bubble ${msg.senderRole === 'user' ? 'sent' : 'received'}`}>
                      <div className="message-meta">
                        <span>{msg.senderRole === 'user' ? 'You' : msg.senderName}</span>
                        <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form className="stack-form" onSubmit={handleSendMessage}>
                <label>
                  <span>Reply to {activeConversation.doctorName}</span>
                  <textarea
                    rows={4}
                    value={messageContent}
                    onChange={(event) => setMessageContent(event.target.value)}
                    placeholder="Write your reply..."
                    required
                  />
                </label>
                <button className="primary-button" type="submit" disabled={sendingMessage}>
                  {sendingMessage ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </div>
          ) : (
            activeMessageTab === 'messages' ? (
              <div className="list-stack">
                {conversationSummaries.length === 0 ? (
                  <EmptyState text="No conversations yet. Start by opening a thread." />
                ) : (
                  conversationSummaries.map((conversation) => (
                    <article className="list-card" key={conversation.conversationId}>
                      <div>
                        <h3>{conversation.doctorName}</h3>
                        <p>{conversation.lastMessage.content}</p>
                        <p className="muted-copy">{new Date(conversation.lastMessage.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="list-actions">
                        {conversation.unreadCount ? (
                          <span className="status-pill status-confirmed">{conversation.unreadCount} New</span>
                        ) : (
                          <span className="status-pill status-completed">Read</span>
                        )}
                        <button className="secondary-button compact-button" type="button" onClick={() => openConversation(conversation.conversationId)}>
                          Open
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : (
              <div className="list-stack">
                {notifications.length === 0 ? (
                  <EmptyState text="No notifications yet." />
                ) : (
                  notifications.map((notification) => (
                    <article className={`list-card ${!notification.isRead ? 'unread' : ''}`} key={notification.id}>
                      <div>
                        <h3>{notification.title}</h3>
                        <p>{notification.message}</p>
                        <p className="muted-copy">{new Date(notification.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="list-actions">
                        {!notification.isRead && (
                          <button className="secondary-button compact-button" type="button" onClick={() => handleMarkNotificationAsRead(notification.id)}>
                            Mark as read
                          </button>
                        )}
                        <button className="danger-button compact-button" type="button" onClick={() => handleDeleteNotification(notification.id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )
          )}
        </section>
      ) : null}

      {activeView === 'profile' ? (
        <section className="panel">
          <SectionHeader
            title="Profile Settings"
            action={
              <button
                className="ghost-button"
                type="button"
                onClick={() => setIsEditingProfile((current) => !current)}
              >
                {isEditingProfile ? 'Cancel edit' : 'Edit profile'}
              </button>
            }
          />
          {isEditingProfile ? (
            <form className="stack-form profile-edit-form" onSubmit={handleProfileSave}>
              <div className="profile-edit-grid">
                <label>
                  <span>Full name</span>
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>Phone</span>
                  <input
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                    placeholder="0917 123 4567"
                  />
                </label>
                <label>
                  <span>Location</span>
                  <input
                    value={profileForm.location}
                    onChange={(event) => setProfileForm({ ...profileForm, location: event.target.value })}
                  />
                </label>
                <label>
                  <span>Date of birth</span>
                  <input
                    type="date"
                    value={profileForm.dob}
                    onChange={(event) => setProfileForm({ ...profileForm, dob: event.target.value })}
                  />
                </label>
              </div>
              <div className="list-actions profile-form-actions">
                <button className="primary-button" type="submit">
                  Save profile
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-summary">
              <InfoPair label="Name" value={currentUser?.name || 'Patient'} />
              <InfoPair label="Email" value={currentUser?.email || '—'} />
              <InfoPair label="Phone" value={(currentUser as any)?.phone || '0917 123 4567'} />
              <InfoPair label="Location" value={currentUser?.location || 'Not set'} />
              <InfoPair label="Member since" value="April 2024" />
              <InfoPair label="Status" value="Active" />
            </div>
          )}
        </section>
      ) : null}

      {activeView === 'payments' ? (
        <section className="panel">
          <SectionHeader
            title="Payments"
            action={
              <div className="toolbar-actions">
                <button className="primary-button compact-button" onClick={() => setShowPaymentForm(true)}>
                  + Make Payment
                </button>
                <button className="ghost-button compact-button" onClick={() => void loadData()}>
                  Refresh
                </button>
              </div>
            }
          />
          <div className="content-grid">
            <div className="summary-grid">
              <article className="summary-card">
                <strong>Total Paid</strong>
                <p>₱{totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </article>
              <article className="summary-card">
                <strong>Outstanding Balance</strong>
                <p>₱{outstandingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </article>
              <article className="summary-card">
                <strong>Total Transactions</strong>
                <p>{payments.length}</p>
              </article>
              <article className="summary-card">
                <strong>Last Payment</strong>
                <p>{payments.length > 0 ? new Date(payments[0].paidAt || payments[0].createdAt).toLocaleDateString() : 'None'}</p>
              </article>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Payment Methods</h3>
            <div className="list-stack">
              {paymentMethods.length === 0 ? (
                <EmptyState text="No payment methods saved." />
              ) : (
                paymentMethods.map((method) => (
                  <article className="list-card" key={method.id}>
                    <div>
                      <h3>{method.brand} ****{method.last4}</h3>
                      <p className="muted-copy">
                        Expires {String(method.expiryMonth).padStart(2, '0')}/{method.expiryYear}
                        {method.isDefault && ' • Default'}
                      </p>
                    </div>
                    <div className="list-actions">
                      <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Payment method management coming soon.')}>
                        Edit
                      </button>
                    </div>
                  </article>
                ))
              )}
              <div className="list-actions" style={{ marginTop: '16px' }}>
                <button className="secondary-button" type="button" onClick={() => setShowAddPaymentMethod(true)}>
                  + Add Payment Method
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Recent Transactions</h3>
            <div className="list-stack">
              {payments.length === 0 ? (
                <EmptyState text="No payments yet." />
              ) : (
                payments.slice(0, 10).map((payment) => (
                  <article className="list-card" key={payment.id}>
                    <div>
                      <h3>{payment.description}</h3>
                      <p className="muted-copy">
                        {new Date(payment.createdAt).toLocaleDateString()} • {payment.method.replace('_', ' ')}
                        {payment.transactionId && ` • ${payment.transactionId}`}
                      </p>
                    </div>
                    <div className="list-actions">
                      <strong className={payment.status === 'completed' ? 'text-success' : payment.status === 'pending' ? 'text-warning' : 'text-error'}>
                        ₱{payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </strong>
                      <span className={`status-pill status-${payment.status}`}>
                        {payment.status}
                      </span>
                      {payment.status === 'completed' && (
                        <button className="secondary-button compact-button" type="button" onClick={() => viewPaymentReceipt(payment)}>
                          View Receipt
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeView === 'documents' ? (
        <section className="panel">
          <SectionHeader title="Documents" action={<button className="ghost-button" type="button" onClick={() => setMessage('Document list refreshed.')}>Refresh</button>} />
          <div className="content-grid">
            <div>
              <h3 style={{ marginBottom: '16px' }}>Your Documents</h3>
              <div className="list-stack">
                <article className="list-card">
                  <div>
                    <h3>Lab Results - April 2025.pdf</h3>
                    <p className="muted-copy">May 15, 2025 • 1.2 MB</p>
                  </div>
                  <div className="list-actions">
                    <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Document download will be ready soon.')}>Download</button>
                    <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Preview mode will be available soon.')}>Preview</button>
                  </div>
                </article>
                <article className="list-card">
                  <div>
                    <h3>Medical Certificate.pdf</h3>
                    <p className="muted-copy">April 28, 2025 • 680 KB</p>
                  </div>
                  <div className="list-actions">
                    <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Document download will be ready soon.')}>Download</button>
                    <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Preview mode will be available soon.')}>Preview</button>
                  </div>
                </article>
                <article className="list-card">
                  <div>
                    <h3>X-Ray Chest.png</h3>
                    <p className="muted-copy">April 10, 2025 • 2.4 MB</p>
                  </div>
                  <div className="list-actions">
                    <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Document download will be ready soon.')}>Download</button>
                    <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Preview mode will be available soon.')}>Preview</button>
                  </div>
                </article>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Storage Overview</h3>
              <article className="summary-card">
                <strong>6.2 GB used of 10 GB</strong>
                <p>3.8 GB available</p>
              </article>
              <button className="primary-button" type="button" style={{ marginTop: '16px' }} onClick={() => setMessage('Upload document flow coming soon.')}>Upload Document</button>
            </div>
          </div>
        </section>
      ) : null}

      {activeView === 'settings' ? (
        <section className="panel">
          <SectionHeader title="Account Settings" />
          <div className="settings-grid">
            <article className="summary-card">
              <strong>Notifications (Email/SMS)</strong>
              <p>Manage how you receive notifications about appointments, prescriptions, and messages.</p>
              <button className="secondary-button" type="button" style={{ marginTop: '12px' }} onClick={() => setActiveSettingsPanel('notifications')}>Configure</button>
            </article>
            <article className="summary-card">
              <strong>Privacy & Security</strong>
              <p>Control your privacy settings and manage two-factor authentication.</p>
              <button className="secondary-button" type="button" style={{ marginTop: '12px' }} onClick={() => setActiveSettingsPanel('privacy')}>Manage</button>
            </article>
            <article className="summary-card">
              <strong>Change Password</strong>
              <p>Update your account password to keep your account secure.</p>
              <button className="secondary-button" type="button" style={{ marginTop: '12px' }} onClick={() => setActiveSettingsPanel('password')}>Change</button>
            </article>
            <article className="summary-card">
              <strong>Language & Timezone</strong>
              <p>Set your preferred language and timezone for the platform.</p>
              <button className="secondary-button" type="button" style={{ marginTop: '12px' }} onClick={() => setActiveSettingsPanel('language')}>Configure</button>
            </article>
          </div>

          {activeSettingsPanel ? (
            <section className="panel" style={{ marginTop: '24px' }}>
              <SectionHeader title={
                activeSettingsPanel === 'notifications' ? 'Notification Settings' :
                activeSettingsPanel === 'privacy' ? 'Privacy & Security' :
                activeSettingsPanel === 'password' ? 'Change Password' :
                'Language & Timezone'
              } />
              <div className="settings-grid">
                {activeSettingsPanel === 'notifications' ? (
                  <article className="summary-card">
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailReminders}
                          onChange={(e) => setNotificationSettings((prev) => ({ ...prev, emailReminders: e.target.checked }))}
                        />
                        Email reminders
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={notificationSettings.smsReminders}
                          onChange={(e) => setNotificationSettings((prev) => ({ ...prev, smsReminders: e.target.checked }))}
                        />
                        SMS reminders
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={notificationSettings.prescriptionAlerts}
                          onChange={(e) => setNotificationSettings((prev) => ({ ...prev, prescriptionAlerts: e.target.checked }))}
                        />
                        Prescription alerts
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={notificationSettings.appointmentConfirmations}
                          onChange={(e) => setNotificationSettings((prev) => ({ ...prev, appointmentConfirmations: e.target.checked }))}
                        />
                        Appointment confirmations
                      </label>
                    </div>
                    <div className="list-actions">
                      <button className="primary-button" type="button" onClick={() => { setMessage('Notification settings saved.'); setActiveSettingsPanel(null); }}>Save</button>
                      <button className="secondary-button" type="button" onClick={() => setActiveSettingsPanel(null)}>Close</button>
                    </div>
                  </article>
                ) : null}

                {activeSettingsPanel === 'privacy' ? (
                  <article className="summary-card">
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={privacySettings.shareMedicalHistory}
                          onChange={(e) => setPrivacySettings((prev) => ({ ...prev, shareMedicalHistory: e.target.checked }))}
                        />
                        Share medical history with specialists
                      </label>
                    </div>
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={privacySettings.allowDoctorCommunication}
                          onChange={(e) => setPrivacySettings((prev) => ({ ...prev, allowDoctorCommunication: e.target.checked }))}
                        />
                        Allow doctor communication
                      </label>
                    </div>
                    <div className="form-group">
                      <label>Data retention</label>
                      <select
                        value={privacySettings.dataRetention}
                        onChange={(e) => setPrivacySettings((prev) => ({ ...prev, dataRetention: e.target.value }))}
                      >
                        <option value="6months">6 months</option>
                        <option value="1year">1 year</option>
                        <option value="3years">3 years</option>
                      </select>
                    </div>
                    <div className="list-actions">
                      <button className="primary-button" type="button" onClick={() => { setMessage('Privacy settings updated.'); setActiveSettingsPanel(null); }}>Save</button>
                      <button className="secondary-button" type="button" onClick={() => setActiveSettingsPanel(null)}>Close</button>
                    </div>
                  </article>
                ) : null}

                {activeSettingsPanel === 'password' ? (
                  <article className="summary-card">
                    <div className="form-group">
                      <label>Current password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>New password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm new password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                    </div>
                    <div className="list-actions">
                      <button
                        className="primary-button"
                        type="button"
                        onClick={() => {
                          if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                            setError('Please complete all password fields.');
                            return;
                          }
                          if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                            setError('New passwords do not match.');
                            return;
                          }
                          setError(null);
                          setMessage('Password updated successfully.');
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setActiveSettingsPanel(null);
                        }}
                      >Save</button>
                      <button className="secondary-button" type="button" onClick={() => setActiveSettingsPanel(null)}>Close</button>
                    </div>
                  </article>
                ) : null}

                {activeSettingsPanel === 'language' ? (
                  <article className="summary-card">
                    <div className="form-group">
                      <label>Language</label>
                      <select value={languageSettings.language} onChange={(e) => setLanguageSettings((prev) => ({ ...prev, language: e.target.value }))}>
                        <option value="en">English</option>
                        <option value="fil">Filipino</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Timezone</label>
                      <select value={languageSettings.timezone} onChange={(e) => setLanguageSettings((prev) => ({ ...prev, timezone: e.target.value }))}>
                        <option value="Asia/Manila">Asia/Manila</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                      </select>
                    </div>
                    <div className="list-actions">
                      <button className="primary-button" type="button" onClick={() => { setMessage('Language and timezone updated.'); setActiveSettingsPanel(null); }}>Save</button>
                      <button className="secondary-button" type="button" onClick={() => setActiveSettingsPanel(null)}>Close</button>
                    </div>
                  </article>
                ) : null}
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {activeView === 'support' ? (
        <section className="panel">
          <SectionHeader title="Support & Help" />
          <div className="content-grid">
            <div>
              <h3 style={{ marginBottom: '16px' }}>Need Help?</h3>
              <div className="list-stack">
                <article className="list-card">
                  <div>
                    <h3>Getting Started Guide</h3>
                    <p>Learn the basics of using the CareWell Clinic system.</p>
                  </div>
                  <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Support content is opening soon.')}>View</button>
                </article>
                <article className="list-card">
                  <div>
                    <h3>FAQs</h3>
                    <p>Find answers to common questions about appointments and services.</p>
                  </div>
                  <button className="secondary-button compact-button" type="button" onClick={() => setMessage('FAQ content is coming soon.')}>View</button>
                </article>
                <article className="list-card">
                  <div>
                    <h3>Contact Support</h3>
                    <p>Reach out to our support team for assistance.</p>
                  </div>
                  <button className="secondary-button compact-button" type="button" onClick={() => setMessage('Support contact will be available soon.')}>Contact</button>
                </article>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Contact Information</h3>
              <article className="summary-card">
                <strong>Email Support</strong>
                <p>support@carewellclinic.com</p>
                <p className="muted-copy">Response within 24 hours</p>
              </article>
              <article className="summary-card" style={{ marginTop: '16px' }}>
                <strong>Hotline (24/7)</strong>
                <p>(02) 8123 4567</p>
                <p className="muted-copy">Emergency & urgent concerns</p>
              </article>
            </div>
          </div>
        </section>
      ) : null}
    </SidebarDashboard>

    {showAppointmentDetails && selectedAppointment && (
      <div className="modal-overlay" onClick={() => setShowAppointmentDetails(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Appointment Details</h3>
            <button className="modal-close" onClick={() => setShowAppointmentDetails(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="appointment-details">
              <div className="detail-section">
                <h4>Appointment Information</h4>
                <div className="info-grid">
                  <InfoPair label="Patient" value={selectedAppointment!.patientName} />
                  <InfoPair label="Date" value={selectedAppointment!.date} />
                  <InfoPair label="Time" value={selectedAppointment!.time || 'Not specified'} />
                  <InfoPair label="Status" value={selectedAppointment!.status} />
                </div>
              </div>
              <div className="detail-section">
                <h4>Symptoms & Notes</h4>
                <p>{selectedAppointment!.symptoms || 'No symptoms provided.'}</p>
              </div>
              <div className="detail-section">
                <h4>Doctor Information</h4>
                <p>Doctor details will be displayed here when available.</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="secondary-button" onClick={() => setShowAppointmentDetails(false)}>Close</button>
          </div>
        </div>
      </div>
    )}

    {selectedMedicalRecord && selectedMedicalCategory && (
      <div className="modal-overlay" onClick={() => setSelectedMedicalRecord(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{
              selectedMedicalCategory === 'lab' ? 'Lab Result Details' :
              selectedMedicalCategory === 'immunization' ? 'Immunization Record' :
              'Health Note'
            }</h3>
            <button className="modal-close" onClick={() => setSelectedMedicalRecord(null)}>×</button>
          </div>
          <div className="modal-body">
            {selectedMedicalCategory === 'lab' ? (
              <>
                <div className="info-grid">
                  <InfoPair label="Title" value={(selectedMedicalRecord as LabResult).title} />
                  <InfoPair label="Date" value={(selectedMedicalRecord as LabResult).date} />
                  <InfoPair label="Doctor" value={(selectedMedicalRecord as LabResult).doctor} />
                  <InfoPair label="File" value={(selectedMedicalRecord as LabResult).fileName} />
                </div>
                <div className="detail-section">
                  <h4>Summary</h4>
                  <p>{(selectedMedicalRecord as LabResult).summary}</p>
                </div>
              </>
            ) : selectedMedicalCategory === 'immunization' ? (
              <>
                <div className="info-grid">
                  <InfoPair label="Vaccine" value={(selectedMedicalRecord as ImmunizationRecord).vaccine} />
                  <InfoPair label="Date" value={(selectedMedicalRecord as ImmunizationRecord).date} />
                  <InfoPair label="Provider" value={(selectedMedicalRecord as ImmunizationRecord).provider} />
                </div>
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{(selectedMedicalRecord as ImmunizationRecord).notes}</p>
                </div>
              </>
            ) : (
              <>
                <div className="info-grid">
                  <InfoPair label="Title" value={(selectedMedicalRecord as HealthNote).title} />
                  <InfoPair label="Date" value={(selectedMedicalRecord as HealthNote).date} />
                </div>
                <div className="detail-section">
                  <h4>Details</h4>
                  <p>{(selectedMedicalRecord as HealthNote).details}</p>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="secondary-button" onClick={() => setSelectedMedicalRecord(null)}>Close</button>
          </div>
        </div>
      </div>
    )}

    {showPaymentForm && (
      <div className="modal-overlay" onClick={() => setShowPaymentForm(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Make a Payment</h3>
            <button className="modal-close" onClick={() => setShowPaymentForm(false)}>×</button>
          </div>
          <form className="stack-form" onSubmit={handlePayment}>
            <label>
              <span>Appointment</span>
              <select
                value={paymentForm.appointmentId}
                onChange={(e) => setPaymentForm({ ...paymentForm, appointmentId: e.target.value })}
              >
                <option value="">General service</option>
                {appointments
                  .filter((appointment) => appointment.status !== 'cancelled')
                  .map((appointment) => (
                    <option key={appointment.id} value={String(appointment.id)}>
                      {appointment.date}{appointment.time ? ` at ${appointment.time}` : ''} · Dr. {doctorById[appointment.doctorId]?.name || `#${appointment.doctorId}`}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Amount (₱)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </label>
            <label>
              <span>Payment Method</span>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value as Payment['method'] })}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="insurance">Insurance</option>
              </select>
            </label>
            <label>
              <span>Description</span>
              <input
                type="text"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                placeholder="Payment for consultation"
                required
              />
            </label>
            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setShowPaymentForm(false)}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={processingPayment}>
                {processingPayment ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showAddPaymentMethod && (
      <div className="modal-overlay" onClick={() => setShowAddPaymentMethod(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Add Payment Method</h3>
            <button className="modal-close" onClick={() => setShowAddPaymentMethod(false)}>×</button>
          </div>
          <form className="stack-form" onSubmit={handleAddPaymentMethod}>
            <label>
              <span>Card Number</span>
              <input
                type="text"
                value={cardForm.number}
                onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\D/g, '') })}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </label>
            <div className="form-row">
              <label>
                <span>Expiry Date</span>
                <input
                  type="text"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2') })}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </label>
              <label>
                <span>CVC</span>
                <input
                  type="text"
                  value={cardForm.cvc}
                  onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, '') })}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </label>
            </div>
            <label>
              <span>Cardholder Name</span>
              <input
                type="text"
                value={cardForm.name}
                onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </label>
            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setShowAddPaymentMethod(false)}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={processingPayment}>
                {processingPayment ? 'Adding...' : 'Add Card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showPaymentDetails && selectedPayment && (
      <div className="modal-overlay" onClick={() => setShowPaymentDetails(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Payment Receipt</h3>
            <button className="modal-close" onClick={() => setShowPaymentDetails(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="receipt-details">
              <div className="detail-section">
                <h4>Payment Information</h4>
                <div className="info-grid">
                  <InfoPair label="Transaction ID" value={selectedPayment.transactionId || 'N/A'} />
                  <InfoPair label="Amount" value={`₱${selectedPayment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} />
                  <InfoPair label="Method" value={selectedPayment.method.replace('_', ' ')} />
                  <InfoPair label="Status" value={selectedPayment.status} />
                  <InfoPair label="Date" value={new Date(selectedPayment.paidAt || selectedPayment.createdAt).toLocaleString()} />
                </div>
              </div>
              <div className="detail-section">
                <h4>Description</h4>
                <p>{selectedPayment.description}</p>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="secondary-button" onClick={() => setShowPaymentDetails(false)}>
              Close
            </button>
            <button className="primary-button" type="button" onClick={() => setMessage('Receipt download coming soon.')}>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function DoctorDashboard({
  currentUser,
  onLogout,
  onUserUpdate,
}: {
  currentUser: AuthUser | null;
  onLogout: () => void;
  onUserUpdate: (user: AuthUser) => void;
}) {
  const [activeView, setActiveView] = useState('dashboard');
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<UserRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<AppointmentFilter>('all');
  const [patientSearch, setPatientSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (messages.length > 0) {
      saveStoredMessages(messages);
    }
  }, [messages]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    patientId: '',
    appointmentId: '',
    amount: '',
    method: 'credit_card',
    description: '',
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeMessageTab, setActiveMessageTab] = useState<'messages' | 'notifications'>('messages');

  useEffect(() => {
    void loadDoctorData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || appointments.length === 0) {
      return;
    }

    if (messages.length === 0) {
      const stored = loadStoredMessages().filter(
        (msg) => msg.senderId === currentUser.id || msg.recipientId === currentUser.id,
      );
      if (stored.length > 0) {
        setMessages(stored);
        return;
      }
    }

    if (messages.length > 0) {
      return;
    }

    // Seed messages based on actual appointments with patients
    const seededMessages: Message[] = [];
    const uniquePatientIds = new Set(appointments.map((appt) => appt.patientId).filter(Boolean));
    let messageId = 101;

    uniquePatientIds.forEach((patientId) => {
      if (!patientId) return;

      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return;

      // Create patient inquiry messages
      seededMessages.push({
        id: messageId++,
        senderId: patientId,
        senderName: patient.name,
        senderRole: 'user',
        recipientId: currentUser.id,
        recipientName: currentUser.name,
        content: `Hello Dr. ${currentUser.name}, I have a question about my upcoming appointment.`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        read: false,
        conversationId: patientId,
      });

      if (Math.random() > 0.5) {
        seededMessages.push({
          id: messageId++,
          senderId: patientId,
          senderName: patient.name,
          senderRole: 'user',
          recipientId: currentUser.id,
          recipientName: currentUser.name,
          content: 'Thank you for your response. I will see you at the appointment.',
          timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: Math.random() > 0.5,
          conversationId: patientId,
        });
      }
    });

    setMessages(seededMessages);
  }, [currentUser, messages.length, appointments, patients]);

  const conversationSummaries = useMemo(() => {
    if (!currentUser) {
      return [];
    }

    const conversations = new Map<number, {
      conversationId: number;
      patientId: number;
      patientName: string;
      lastMessage: Message;
      unreadCount: number;
    }>();

    messages.forEach((msg) => {
      const conversationId = msg.conversationId ?? (msg.senderRole === 'user' ? msg.senderId : msg.recipientId);
      const patientId = conversationId; // Since we set conversationId to patientId
      const patient = patients.find((p) => p.id === patientId);
      const patientName = patient ? patient.name : (msg.senderRole === 'user' ? msg.senderName : msg.recipientName);
      const existing = conversations.get(conversationId);
      const unreadCount = (existing?.unreadCount ?? 0) + (!msg.read && msg.senderRole === 'user' ? 1 : 0);
      const latestMessage = existing && existing.lastMessage.timestamp > msg.timestamp ? existing.lastMessage : msg;

      conversations.set(conversationId, {
        conversationId,
        patientId,
        patientName,
        lastMessage: latestMessage,
        unreadCount,
      });
    });

    return Array.from(conversations.values()).sort((a, b) => b.lastMessage.timestamp.localeCompare(a.lastMessage.timestamp));
  }, [messages, currentUser?.id, patients]);

  const activeConversation = selectedConversation !== null
    ? conversationSummaries.find((conversation) => conversation.conversationId === selectedConversation) ?? null
    : null;

  const conversationMessages = selectedConversation !== null
    ? messages
        .filter((msg) => msg.conversationId === selectedConversation)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    : [];

  const unreadNotificationCount = useMemo(
    () => conversationSummaries.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversationSummaries],
  );

  const doctorPatientIds = useMemo(
    () => new Set(appointments.map((appointment) => appointment.patientId).filter(Boolean)),
    [appointments],
  );

  const doctorPayments = useMemo(
    () => payments.filter((payment) => doctorPatientIds.has(payment.patientId)),
    [payments, doctorPatientIds],
  );

  function openNotifications() {
    setActiveView('messages');
    if (selectedConversation === null && conversationSummaries.length > 0) {
      openConversation(conversationSummaries[0].conversationId);
    }
  }

  function openConversation(conversationId: number) {
    setSelectedConversation(conversationId);
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.conversationId === conversationId && msg.senderRole === 'user'
          ? { ...msg, read: true }
          : msg,
      ),
    );
  }

  function closeConversation() {
    setSelectedConversation(null);
  }

  async function handleSendMessageToPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || !messageContent.trim() || selectedConversation === null) {
      return;
    }

    const conversation = conversationSummaries.find((conv) => conv.conversationId === selectedConversation);
    if (!conversation) {
      return;
    }

    setSendingMessage(true);
    setError(null);

    try {
      const newMessage: Message = {
        id: Date.now(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: 'doctor',
        recipientId: conversation.patientId,
        recipientName: conversation.patientName,
        content: messageContent.trim(),
        timestamp: new Date().toISOString(),
        read: true,
        conversationId: selectedConversation,
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageContent('');
      setMessage('Message sent to patient.');

      setTimeout(() => {
        const reply: Message = {
          id: Date.now() + 1,
          senderId: conversation.patientId,
          senderName: conversation.patientName,
          senderRole: 'user',
          recipientId: currentUser.id,
          recipientName: currentUser.name,
          content: 'Thank you, doctor. I will follow your instructions.',
          timestamp: new Date().toISOString(),
          read: false,
          conversationId: selectedConversation,
        };
        setMessages((prevMessages) => [...prevMessages, reply]);
      }, 1400);
    } catch (sendError) {
      setError((sendError as Error).message);
    } finally {
      setSendingMessage(false);
    }
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUser || !paymentForm.amount || !paymentForm.patientId) {
      setError('Please choose a patient and amount before recording a payment.');
      return;
    }

    setProcessingPayment(true);
    setError(null);

    try {
      const createdPayment = await api<Payment>('/payments', {
        method: 'POST',
        auth: true,
        body: {
          patientId: Number(paymentForm.patientId),
          appointmentId: paymentForm.appointmentId ? Number(paymentForm.appointmentId) : undefined,
          amount: parseFloat(paymentForm.amount),
          currency: 'PHP',
          status: 'completed',
          method: paymentForm.method,
          description: paymentForm.description || 'Payment processed by doctor',
          paidAt: new Date().toISOString(),
          transactionId: `TXN-${Date.now()}`,
        },
      });

      setPayments((prev) => [createdPayment, ...prev]);
      setPaymentForm({ patientId: '', appointmentId: '', amount: '', method: 'credit_card', description: '' });
      setShowPaymentForm(false);
      setMessage('Payment recorded successfully.');
      await loadDoctorData();
    } catch (paymentError) {
      setError((paymentError as Error).message);
    } finally {
      setProcessingPayment(false);
    }
  }

  function viewPaymentDetails(payment: Payment) {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  }

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', caption: 'Status and quick totals', icon: '📊' },
    { key: 'appointments', label: 'Appointments', caption: 'Review and update visits', icon: '📅' },
    { key: 'patients', label: 'My Patients', caption: 'Patient records', icon: '👥' },
    { key: 'schedule', label: 'Schedule', caption: 'Calendar and availability', icon: '🗓️' },
    { key: 'prescriptions', label: 'Prescriptions', caption: 'Medication management', icon: '💊' },
    { key: 'messages', label: 'Messages', caption: 'Patient communication', icon: '💬', badge: unreadCount },
    { key: 'payments', label: 'Payments', caption: 'Billing & receipts', icon: '💳' },
    { key: 'reports', label: 'Reports', caption: 'Performance insights', icon: '📈' },
    { key: 'profile', label: 'Profile', caption: 'Doctor account details', icon: '👨‍⚕️' },
    { key: 'settings', label: 'Settings', caption: 'Preferences', icon: '⚙️' },
    { key: 'logout', label: 'Logout', caption: 'Sign out', icon: '🚪' },
  ];

  async function loadDoctorData() {
    if (!currentUser) {
      return;
    }

    setError(null);

    try {
      const [doctor, appointmentData, patientData, paymentData, notifs, count] = await Promise.all([
        api<Doctor>(`/doctors/${currentUser.id}`, { auth: true }),
        api<Appointment[]>('/appointments', { auth: true }),
        api<UserRecord[]>('/users', { auth: true }),
        api<Payment[]>('/payments', { auth: true }),
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      const doctorAppointments = appointmentData.filter((appointment) => appointment.doctorId === currentUser.id);
      const patientIds = new Set(doctorAppointments.map((appointment) => appointment.patientId));
      const activePatients = patientData.filter((user) => user.role === 'user' && patientIds.has(user.id));

      setProfile(doctor);
      setAppointments(doctorAppointments);
      setPatients(activePatients);
      setPayments(paymentData);
      setNotifications(notifs);
      setUnreadCount(count.count);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const updated = await api<Doctor>(`/doctors/${profile.id}`, {
        method: 'PATCH',
        body: {
          name: profile.name,
          specialization: profile.specialization,
          availableTime: profile.availableTime,
          address: profile.address,
          phone: profile.phone,
          photo: profile.photo,
        },
      });
      setProfile(updated);
      onUserUpdate({ ...(currentUser as AuthUser), ...updated, role: 'doctor' });
      setMessage('Profile updated.');
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmAppointment(id: number) {
    setMessage(null);
    setError(null);

    try {
      await api(`/appointments/${id}/confirm`, { method: 'PATCH', auth: true });
      setMessage('Appointment confirmed.');
      await loadDoctorData();
    } catch (confirmError) {
      setError((confirmError as Error).message);
    }
  }

  async function cancelAppointment(id: number) {
    setMessage(null);
    setError(null);

    try {
      await api(`/appointments/${id}/cancel`, { method: 'PATCH', auth: true });
      setMessage('Appointment cancelled.');
      await loadDoctorData();
    } catch (cancelError) {
      setError((cancelError as Error).message);
    }
  }

  async function completeAppointment(id: number) {
    setMessage(null);
    setError(null);

    try {
      await api(`/appointments/${id}/complete`, { method: 'PATCH', auth: true });
      setMessage('Appointment completed.');
      await loadDoctorData();
    } catch (completeError) {
      setError((completeError as Error).message);
    }
  }

  async function handleMarkNotificationAsRead(id: number) {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function handleMarkAllNotificationsAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async function handleDeleteNotification(id: number) {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => prev - (notifications.find(n => n.id === id)?.isRead ? 0 : 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  const filteredAppointments = getFilteredAppointments(appointments, statusFilter);

  return (
    <SidebarDashboard
      currentUser={currentUser}
      navItems={navItems}
      activeView={activeView}
      onSelectView={setActiveView}
      title="Doctor Dashboard"
      subtitle="Handle patient requests and keep your clinic details up to date."
      onLogout={onLogout}
      message={message}
      error={error}
      pageClassName="doctor-dashboard"
      notificationCount={unreadNotificationCount}
      onNotificationClick={openNotifications}
    >
      {activeView === 'dashboard' ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Total Patients" value={String(patients.length)} />
            <MetricCard label="Today's Appointments" value={String(appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]).length)} />
            <MetricCard label="Pending Confirmations" value={String(appointments.filter((appointment) => appointment.status === 'pending').length)} />
            <MetricCard label="Completed This Month" value={String(appointments.filter((appointment) => appointment.status === 'completed').length)} />
          </div>
          <div className="content-grid">
            <section className="panel">
              <SectionHeader title="Today's Schedule" action={<button className="ghost-button" onClick={() => void loadDoctorData()}>Refresh</button>} />
              <div className="list-stack">
                {appointments
                  .filter(apt => apt.status === 'confirmed' && apt.date === new Date().toISOString().split('T')[0])
                  .slice(0, 4)
                  .map((appointment) => (
                    <article className="list-card" key={appointment.id}>
                      <div>
                        <h3>{appointment.patientName}</h3>
                        <p>
                          {appointment.date}
                          {appointment.time ? ` at ${appointment.time}` : ''}
                        </p>
                        <p className="muted-copy">{appointment.symptoms || 'No symptoms provided.'}</p>
                      </div>
                      <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                    </article>
                  ))}
                {appointments.filter(apt => apt.status === 'confirmed' && apt.date === new Date().toISOString().split('T')[0]).length === 0 ? (
                  <EmptyState text="No appointments scheduled for today." />
                ) : null}
              </div>
            </section>
            <section className="panel quick-actions-panel">
              <SectionHeader title="Quick Actions" />
              <div className="quick-actions-grid">
                <button className="secondary-button" onClick={() => setActiveView('appointments')}>
                  📅 Manage Appointments
                </button>
                <button className="secondary-button" onClick={() => setActiveView('patients')}>
                  👥 View Patients
                </button>
                <button className="secondary-button" onClick={() => setActiveView('prescriptions')}>
                  💊 Prescriptions
                </button>
                <button className="secondary-button" onClick={() => setActiveView('messages')}>
                  💬 Messages
                </button>
              </div>
              <div className="profile-summary">
                <InfoPair label="Specialization" value={profile?.specialization || 'Not set'} />
                <InfoPair label="Working Hours" value={profile?.availableTime || 'Not set'} />
                <InfoPair label="Clinic Address" value={profile?.address || 'Not set'} />
                <InfoPair label="Total Patients" value={String(patients.length)} />
              </div>
            </section>
          </div>
          <div className="content-grid">
            <section className="panel">
              <SectionHeader title="Recent Activity" />
              <div className="list-stack">
                {appointments.slice(0, 3).map((appointment) => (
                  <article className="list-card" key={appointment.id}>
                    <div>
                      <h3>{appointment.patientName}</h3>
                      <p>Appointment {appointment.status}</p>
                      <p className="muted-copy">{appointment.date} {appointment.time ? `• ${appointment.time}` : ''}</p>
                    </div>
                    <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                  </article>
                ))}
                {appointments.length === 0 ? <EmptyState text="No recent activity." /> : null}
              </div>
            </section>
            <section className="panel">
              <SectionHeader title="Performance Summary" />
              <div className="summary-grid">
                <article className="summary-card">
                  <strong>Patient Satisfaction</strong>
                  <p>4.8/5 average rating</p>
                </article>
                <article className="summary-card">
                  <strong>On-time Rate</strong>
                  <p>95% appointments on time</p>
                </article>
                <article className="summary-card">
                  <strong>Monthly Revenue</strong>
                  <p>₱85,000 generated</p>
                </article>
                <article className="summary-card">
                  <strong>Active Patients</strong>
                  <p>{patients.length} registered</p>
                </article>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {activeView === 'appointments' ? (
        <section className="panel">
          <SectionHeader
            title="Patient appointments"
            action={
              <div className="toolbar-actions">
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as AppointmentFilter)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="ghost-button" onClick={() => void loadDoctorData()}>Refresh</button>
              </div>
            }
          />
          <div className="list-stack">
            {filteredAppointments.length === 0 ? (
              <EmptyState text="No patient appointments yet." />
            ) : (
              filteredAppointments.map((appointment) => (
                <article className="list-card" key={appointment.id}>
                  <div>
                    <h3>{appointment.patientName}</h3>
                    <p>
                      {appointment.date}
                      {appointment.time ? ` at ${appointment.time}` : ''}
                    </p>
                    <p className="muted-copy">{appointment.symptoms || 'No symptoms provided.'}</p>
                  </div>
                  <div className="list-actions">
                    <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                    {appointment.status === 'pending' ? (
                      <button
                        className="primary-button compact-button"
                        type="button"
                        onClick={() => void confirmAppointment(appointment.id)}
                      >
                        Confirm
                      </button>
                    ) : null}
                    {appointment.status === 'confirmed' ? (
                      <button
                        className="ghost-button compact-button"
                        type="button"
                        onClick={() => void completeAppointment(appointment.id)}
                      >
                        Complete
                      </button>
                    ) : null}
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' ? (
                      <button
                        className="danger-button compact-button"
                        type="button"
                        onClick={() => void cancelAppointment(appointment.id)}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      ) : null}

      {activeView === 'payments' ? (
        <section className="panel">
          <SectionHeader
            title="Payments & Billing"
            action={
              <div className="toolbar-actions">
                <button className="secondary-button" type="button" onClick={() => setShowPaymentForm((prev) => !prev)}>
                  {showPaymentForm ? 'Close payment form' : 'New payment'}
                </button>
                <button className="ghost-button" type="button" onClick={() => void loadDoctorData()}>
                  Refresh
                </button>
              </div>
            }
          />

          <div className="metrics-grid">
            <MetricCard label="Total payments" value={String(doctorPayments.length)} />
            <MetricCard label="Collected" value={`₱${doctorPayments
              .filter((payment) => payment.status === 'completed')
              .reduce((sum, payment) => sum + payment.amount, 0)
              .toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} />
            <MetricCard label="Pending" value={String(doctorPayments.filter((payment) => payment.status === 'pending').length)} />
            <MetricCard label="Billed patients" value={String(new Set(doctorPayments.map((payment) => payment.patientId)).size)} />
          </div>

          {showPaymentForm ? (
            <form className="stack-form" onSubmit={handlePayment}>
              <label>
                <span>Patient</span>
                <select
                  value={paymentForm.patientId}
                  onChange={(event) => setPaymentForm({ ...paymentForm, patientId: event.target.value })}
                  required
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Appointment</span>
                <select
                  value={paymentForm.appointmentId}
                  onChange={(event) => setPaymentForm({ ...paymentForm, appointmentId: event.target.value })}
                >
                  <option value="">General service</option>
                  {appointments
                    .filter((appt) => appt.status !== 'cancelled' && !payments.some((p) => p.appointmentId === appt.id))
                    .map((appointment) => {
                      const patient = patients.find((p) => p.id === appointment.patientId);
                      return (
                        <option key={appointment.id} value={String(appointment.id)}>
                          {appointment.date}{appointment.time ? ` at ${appointment.time}` : ''} · {patient?.name || `Patient #${appointment.patientId}`}
                        </option>
                      );
                    })}
                </select>
              </label>
              <label>
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })}
                  placeholder="0.00"
                  required
                />
              </label>
              <label>
                <span>Method</span>
                <select
                  value={paymentForm.method}
                  onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value as Payment['method'] })}
                >
                  <option value="credit_card">Credit card</option>
                  <option value="debit_card">Debit card</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="insurance">Insurance</option>
                </select>
              </label>
              <label>
                <span>Description</span>
                <input
                  value={paymentForm.description}
                  onChange={(event) => setPaymentForm({ ...paymentForm, description: event.target.value })}
                  placeholder="Reason for the payment"
                />
              </label>
              <button className="primary-button" type="submit" disabled={processingPayment}>
                {processingPayment ? 'Saving payment...' : 'Record payment'}
              </button>
            </form>
          ) : null}

          <div className="list-stack">
            {doctorPayments.length === 0 ? (
              <EmptyState text="No payments recorded yet." />
            ) : (
              doctorPayments.map((payment) => {
                const patient = patients.find((user) => user.id === payment.patientId);
                return (
                  <article className="list-card" key={payment.id}>
                    <div>
                      <h3>{patient?.name || `Patient #${payment.patientId}`}</h3>
                      <p>{payment.description || 'Payment record'}</p>
                      <p className="muted-copy">
                        ₱{payment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} · {payment.method.replace('_', ' ')} · {payment.status}
                      </p>
                    </div>
                    <div className="list-actions">
                      <button className="secondary-button compact-button" type="button" onClick={() => viewPaymentDetails(payment)}>
                        Details
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {showPaymentDetails && selectedPayment ? (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Payment details</h3>
                  <button className="ghost-button" type="button" onClick={() => setShowPaymentDetails(false)}>
                    Close
                  </button>
                </div>
                <div className="receipt-details">
                  <div className="detail-section">
                    <h4>Payment Information</h4>
                    <div className="info-grid">
                      <InfoPair label="Transaction ID" value={selectedPayment.transactionId || 'N/A'} />
                      <InfoPair label="Amount" value={`₱${selectedPayment.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} />
                      <InfoPair label="Method" value={selectedPayment.method.replace('_', ' ')} />
                      <InfoPair label="Status" value={selectedPayment.status} />
                      <InfoPair label="Date" value={new Date(selectedPayment.paidAt || selectedPayment.createdAt).toLocaleString()} />
                      <InfoPair label="Patient" value={patients.find((user) => user.id === selectedPayment.patientId)?.name || `Patient #${selectedPayment.patientId}`} />
                    </div>
                  </div>
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{selectedPayment.description}</p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="secondary-button" onClick={() => setShowPaymentDetails(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeView === 'profile' ? (
        <section className="panel">
          <SectionHeader title="Doctor profile" />
          {!profile ? (
            <EmptyState text="Loading doctor profile..." />
          ) : (
            <form className="stack-form" onSubmit={handleProfileSave}>
              <label>
                <span>Name</span>
                <input
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                />
              </label>
              <label>
                <span>Specialization</span>
                <input
                  value={profile.specialization}
                  onChange={(event) => setProfile({ ...profile, specialization: event.target.value })}
                />
              </label>
              <label>
                <span>Available time</span>
                <input
                  value={profile.availableTime ?? ''}
                  onChange={(event) => setProfile({ ...profile, availableTime: event.target.value })}
                />
              </label>
              <label>
                <span>Address</span>
                <input
                  value={profile.address ?? ''}
                  onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  value={profile.phone ?? ''}
                  onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          )}
        </section>
      ) : null}

      {activeView === 'patients' ? (
        <section className="panel">
          <SectionHeader title="My Patients" action={<button className="ghost-button" onClick={() => void loadDoctorData()}>Refresh</button>} />
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.16)',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.16)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div className="list-stack">
            {patients.length === 0 ? (
              <EmptyState text="No patients registered yet." />
            ) : (
              patients
                .filter(
                  (patient) =>
                    patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                    patient.email.toLowerCase().includes(patientSearch.toLowerCase())
                )
                .map((patient) => {
                  const patientAppointments = appointments.filter(apt => apt.patientId === patient.id);
                  const totalAppointments = patientAppointments.length;
                  const completedAppointments = patientAppointments.filter(apt => apt.status === 'completed').length;
                  return (
                    <article className="list-card" key={patient.id}>
                      <div>
                        <h3>{patient.name}</h3>
                        <p>{patient.email}</p>
                        <p className="muted-copy">
                          {patient.location || 'No location set'} • {totalAppointments} appointment{totalAppointments !== 1 ? 's' : ''} 
                          {completedAppointments > 0 && ` (${completedAppointments} completed)`}
                        </p>
                      </div>
                      <div className="list-actions">
                        <button
                          className="secondary-button compact-button"
                          onClick={() => setActiveView('appointments')}
                        >
                          View Appointments
                        </button>
                      </div>
                    </article>
                  );
                })
            )}
          </div>
        </section>
      ) : null}

      {activeView === 'schedule' ? (
        <section className="panel">
          <SectionHeader title="Schedule & Availability" />
          <div className="content-grid">
            <div>
              <h3 style={{ marginBottom: '16px' }}>Today's Schedule</h3>
              <div className="list-stack">
                {appointments
                  .filter(apt => apt.status === 'confirmed' && apt.date === new Date().toISOString().split('T')[0])
                  .map((appointment) => (
                    <article className="list-card" key={appointment.id}>
                      <div>
                        <h3>{appointment.patientName}</h3>
                        <p>{appointment.time || 'Time not set'}</p>
                        <p className="muted-copy">{appointment.symptoms || 'No notes'}</p>
                      </div>
                      <span className="status-pill status-confirmed">Confirmed</span>
                    </article>
                  ))}
                {appointments.filter(apt => apt.status === 'confirmed' && apt.date === new Date().toISOString().split('T')[0]).length === 0 ? (
                  <EmptyState text="No appointments scheduled for today." />
                ) : null}
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Availability Settings</h3>
              <div className="profile-summary">
                <InfoPair label="Working Hours" value={profile?.availableTime || 'Not set'} />
                <InfoPair label="Clinic Address" value={profile?.address || 'Not set'} />
                <InfoPair label="Contact" value={profile?.phone || 'Not set'} />
                <InfoPair label="Specialization" value={profile?.specialization || 'Not set'} />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeView === 'prescriptions' ? (
        <section className="panel">
          <SectionHeader title="Prescription Management" />
          <div className="content-grid">
            <div>
              <h3 style={{ marginBottom: '16px' }}>Recent Prescriptions</h3>
              <div className="list-stack">
                <article className="list-card">
                  <div>
                    <h3>Amoxicillin 500mg</h3>
                    <p>Patient: Maria Santos</p>
                    <p className="muted-copy">May 15, 2024 • 1 capsule every 8 hours</p>
                  </div>
                  <button className="secondary-button compact-button" onClick={() => setMessage('Prescription details view coming soon.')}>View Details</button>
                </article>
                <article className="list-card">
                  <div>
                    <h3>Cetirizine 10mg</h3>
                    <p>Patient: Juan Reyes</p>
                    <p className="muted-copy">April 28, 2024 • 1 tablet daily</p>
                  </div>
                  <button className="secondary-button compact-button" onClick={() => setMessage('Prescription details view coming soon.')}>View Details</button>
                </article>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
              <div className="quick-actions-grid">
                <button className="secondary-button" onClick={() => setMessage('New prescription form coming soon.')}>New Prescription</button>
                <button className="secondary-button" onClick={() => setMessage('Refill request management coming soon.')}>Refill Request</button>
                <button className="secondary-button" onClick={() => setMessage('Medication history view coming soon.')}>Medication History</button>
                <button className="secondary-button" onClick={() => setMessage('Drug interaction checker coming soon.')}>Drug Interactions</button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeView === 'messages' ? (
        <section className="panel">
          <SectionHeader
            title={selectedConversation ? `Conversation with ${activeConversation?.patientName ?? 'Patient'}` : 'Messages & Notifications'}
            action={
              <div className="toolbar-actions">
                {selectedConversation ? (
                  <button className="ghost-button compact-button" type="button" onClick={closeConversation}>
                    ← Back
                  </button>
                ) : (
                  <div className="tab-buttons">
                    <button
                      className={`tab-button ${activeMessageTab === 'messages' ? 'active' : ''}`}
                      onClick={() => setActiveMessageTab('messages')}
                    >
                      Messages {conversationSummaries.filter(c => c.unreadCount > 0).length > 0 && `(${conversationSummaries.filter(c => c.unreadCount > 0).length})`}
                    </button>
                    <button
                      className={`tab-button ${activeMessageTab === 'notifications' ? 'active' : ''}`}
                      onClick={() => setActiveMessageTab('notifications')}
                    >
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </button>
                  </div>
                )}
                {!selectedConversation && activeMessageTab === 'notifications' && unreadCount > 0 && (
                  <button className="ghost-button compact-button" type="button" onClick={handleMarkAllNotificationsAsRead}>
                    Mark all read
                  </button>
                )}
              </div>
            }
          />

          {selectedConversation && activeConversation ? (
            <div className="chat-thread">
              <div className="chat-header">
                <div>
                  <strong>{activeConversation.patientName}</strong>
                  <p className="muted-copy">Last message: {new Date(activeConversation.lastMessage.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="message-list">
                {conversationMessages.length === 0 ? (
                  <EmptyState text="No messages exchanged yet." />
                ) : (
                  conversationMessages.map((msg) => (
                    <div key={msg.id} className={`message-bubble ${msg.senderRole === 'doctor' ? 'sent' : 'received'}`}>
                      <div className="message-meta">
                        <span>{msg.senderRole === 'doctor' ? 'You' : msg.senderName}</span>
                        <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
              <form className="stack-form" onSubmit={handleSendMessageToPatient}>
                <label>
                  <span>Reply to {activeConversation.patientName}</span>
                  <textarea
                    rows={4}
                    value={messageContent}
                    onChange={(event) => setMessageContent(event.target.value)}
                    placeholder="Write your message..."
                    required
                  />
                </label>
                <button className="primary-button" type="submit" disabled={sendingMessage}>
                  {sendingMessage ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </div>
          ) : (
            activeMessageTab === 'messages' ? (
              <div className="list-stack">
                {conversationSummaries.length === 0 ? (
                  <EmptyState text="No patient conversations yet." />
                ) : (
                  conversationSummaries.map((conversation) => (
                    <article className="list-card" key={conversation.conversationId}>
                      <div>
                        <h3>{conversation.patientName}</h3>
                        <p>{conversation.lastMessage.content}</p>
                        <p className="muted-copy">{new Date(conversation.lastMessage.timestamp).toLocaleString()}</p>
                      </div>
                      <div className="list-actions">
                        {conversation.unreadCount ? (
                          <span className="status-pill status-pending">{conversation.unreadCount} Unread</span>
                        ) : (
                          <span className="status-pill status-confirmed">Read</span>
                        )}
                        <button className="secondary-button compact-button" type="button" onClick={() => openConversation(conversation.conversationId)}>
                          Open
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : (
              <div className="list-stack">
                {notifications.length === 0 ? (
                  <EmptyState text="No notifications yet." />
                ) : (
                  notifications.map((notification) => (
                    <article className={`list-card ${!notification.isRead ? 'unread' : ''}`} key={notification.id}>
                      <div>
                        <h3>{notification.title}</h3>
                        <p>{notification.message}</p>
                        <p className="muted-copy">{new Date(notification.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="list-actions">
                        {!notification.isRead && (
                          <button className="secondary-button compact-button" type="button" onClick={() => handleMarkNotificationAsRead(notification.id)}>
                            Mark as read
                          </button>
                        )}
                        <button className="danger-button compact-button" type="button" onClick={() => handleDeleteNotification(notification.id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )
          )}
        </section>
      ) : null}

      {activeView === 'reports' ? (
        <section className="panel">
          <SectionHeader title="Performance Reports" />
          <div className="content-grid">
            <div className="report-grid">
              <article className="report-card">
                <span>Total Patients</span>
                <strong>{patients.length}</strong>
              </article>
              <article className="report-card">
                <span>Appointments This Month</span>
                <strong>{appointments.filter(apt => apt.status !== 'cancelled').length}</strong>
              </article>
              <article className="report-card">
                <span>Completion Rate</span>
                <strong>
                  {appointments.length > 0
                    ? Math.round((appointments.filter(apt => apt.status === 'completed').length / appointments.length) * 100)
                    : 0}%
                </strong>
              </article>
              <article className="report-card">
                <span>Average Rating</span>
                <strong>4.8/5</strong>
              </article>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Monthly Trends</h3>
              <div className="summary-grid">
                <article className="summary-card">
                  <strong>Patient Growth</strong>
                  <p>+12% from last month</p>
                </article>
                <article className="summary-card">
                  <strong>Appointment Volume</strong>
                  <p>45 appointments scheduled</p>
                </article>
                <article className="summary-card">
                  <strong>Revenue</strong>
                  <p>₱125,000 generated</p>
                </article>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeView === 'settings' ? (
        <section className="panel">
          <SectionHeader title="Doctor Settings" />
          <div className="settings-grid">
            <article className="summary-card">
              <strong>Notification Preferences</strong>
              <p>Manage how you receive appointment reminders and patient messages.</p>
              <button className="secondary-button" style={{ marginTop: '12px' }} onClick={() => setMessage('Notification settings will be available soon.')}>Configure</button>
            </article>
            <article className="summary-card">
              <strong>Working Hours</strong>
              <p>Set your availability and clinic operating hours.</p>
              <button className="secondary-button" style={{ marginTop: '12px' }} onClick={() => setMessage('Working hours settings coming soon.')}>Update</button>
            </article>
            <article className="summary-card">
              <strong>Security Settings</strong>
              <p>Change password and manage two-factor authentication.</p>
              <button className="secondary-button" style={{ marginTop: '12px' }} onClick={() => setMessage('Security settings panel coming soon.')}>Manage</button>
            </article>
            <article className="summary-card">
              <strong>System Preferences</strong>
              <p>Customize dashboard layout and default views.</p>
              <button className="secondary-button" style={{ marginTop: '12px' }} onClick={() => setMessage('System preferences coming soon.')}>Customize</button>
            </article>
          </div>
        </section>
      ) : null}
    </SidebarDashboard>
  );
}

function AdminDashboard({
  currentUser,
  onLogout,
}: {
  currentUser: AuthUser | null;
  onLogout: () => void;
}) {
  const [activeView, setActiveView] = useState('dashboard');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', caption: 'Overview', icon: '📊' },
    { key: 'appointments', label: 'Appointments', caption: 'Booking activity', icon: '📅', badge: appointments.filter((appointment) => appointment.status === 'pending').length },
    { key: 'patients', label: 'Patients', caption: 'Patient records', icon: '👥' },
    { key: 'doctors', label: 'Doctors', caption: 'Clinician directory', icon: '👨‍⚕️' },
    { key: 'services', label: 'Services', caption: 'Clinic offerings', icon: '🏥' },
    { key: 'reports', label: 'Reports', caption: 'Performance insights', icon: '📈' },
    { key: 'settings', label: 'Settings', caption: 'System configuration', icon: '⚙️' },
    { key: 'logout', label: 'Logout', caption: 'Sign out', icon: '🚪' },
  ];

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function loadAdminData() {
    setMessage(null);
    setError(null);

    try {
      const [userData, doctorData, appointmentData, notifs, count] = await Promise.all([
        api<UserRecord[]>('/users', { auth: true }),
        api<Doctor[]>('/doctors', { auth: true }),
        api<Appointment[]>('/appointments', { auth: true }),
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      const registeredPatients = userData.filter(
        (user) => user.role === 'user' && user.name && user.email,
      );
      const registeredDoctors = doctorData.filter(
        (doctor) => doctor.name && doctor.email && doctor.specialization,
      );

      setUsers(userData);
      setDoctors(registeredDoctors);
      setAppointments(appointmentData);
      setNotifications(notifs);
      setUnreadCount(count.count);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  async function handleMarkNotificationAsRead(id: number) {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function handleMarkAllNotificationsAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async function handleDeleteNotification(id: number) {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => prev - (notifications.find(n => n.id === id)?.isRead ? 0 : 1));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  const admins = users.filter((user) => user.role === 'admin');
  const patients = users.filter((user) => user.role === 'user');
  const pending = appointments.filter((appointment) => appointment.status === 'pending').length;
  const confirmed = appointments.filter((appointment) => appointment.status === 'confirmed').length;
  const cancelled = appointments.filter((appointment) => appointment.status === 'cancelled').length;
  const doctorById = Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor]));
  const patientById = Object.fromEntries(patients.map((patient) => [patient.id, patient]));

  const doctorAppointmentCounts = appointments.reduce<Record<number, number>>((counts, appointment) => {
    counts[appointment.doctorId] = (counts[appointment.doctorId] ?? 0) + 1;
    return counts;
  }, {});

  const patientAppointmentCounts = appointments.reduce<Record<number, number>>((counts, appointment) => {
    if (appointment.patientId != null) {
      counts[appointment.patientId] = (counts[appointment.patientId] ?? 0) + 1;
    }
    return counts;
  }, {});

  const topDoctorEntry = Object.entries(doctorAppointmentCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const topPatientEntry = Object.entries(patientAppointmentCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

  const topDoctorName = topDoctorEntry
    ? doctorById[Number(topDoctorEntry[0])]?.name ?? `Doctor #${topDoctorEntry[0]}`
    : 'No doctor data';
  const topDoctorCount = topDoctorEntry ? Number(topDoctorEntry[1]) : 0;

  const topPatientName = topPatientEntry
    ? patientById[Number(topPatientEntry[0])]?.name ?? `Patient #${topPatientEntry[0]}`
    : 'No patient data';
  const topPatientCount = topPatientEntry ? Number(topPatientEntry[1]) : 0;

  const clinicServices = [
    { name: 'Appointment Scheduling', description: 'Book and manage patient visits', status: 'Active' },
    { name: 'Doctor Management', description: 'Manage doctors and availability', status: 'Active' },
    { name: 'Patient Records', description: 'Secure patient history and notes', status: 'Active' },
    { name: 'Reporting & Analytics', description: 'Track clinic performance', status: 'Coming soon' },
  ];

  return (
    <SidebarDashboard
      currentUser={currentUser}
      navItems={navItems}
      activeView={activeView}
      onSelectView={setActiveView}
      title="Admin Dashboard"
      subtitle="Monitor staff, patients, and appointment flow from one control surface."
      onLogout={onLogout}
      message={message}
      error={error}
      pageClassName="admin-dashboard"
      notificationCount={appointments.filter((appointment) => appointment.status === 'pending').length}
      onNotificationClick={() => setActiveView('appointments')}
    >
      {activeView === 'dashboard' ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Total Patients" value={String(patients.length)} />
            <MetricCard label="Total Doctors" value={String(doctors.length)} />
            <MetricCard label="Admin accounts" value={String(admins.length)} />
            <MetricCard label="Pending" value={String(pending)} />
          </div>

          <div className="content-grid">
            <section className="panel">
              <SectionHeader
                title="Today's appointments"
                action={<button className="ghost-button" onClick={() => void loadAdminData()}>Refresh</button>}
              />
              <div className="list-stack">
                {appointments.length === 0 ? (
                  <EmptyState text="No appointments booked yet." />
                ) : (
                  appointments.slice(0, 5).map((appointment) => (
                    <article className="list-card" key={appointment.id}>
                      <div>
                        <h3>{appointment.patientName}</h3>
                        <p>
                          {doctorById[appointment.doctorId]
                            ? `Dr. ${doctorById[appointment.doctorId].name}`
                            : `Doctor #${appointment.doctorId}`}{' '}
                          on {appointment.date}
                        </p>
                      </div>
                      <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="panel quick-actions-panel">
              <SectionHeader title="Quick actions" />
              <div className="quick-actions-grid">
                <button className="secondary-button" type="button" onClick={() => setMessage('New patient form will be available soon.')}>New Patient</button>
                <button className="secondary-button" type="button" onClick={() => setMessage('New appointment flow will be available soon.')}>New Appointment</button>
                <button className="secondary-button" type="button" onClick={() => setMessage('Doctor management tools are coming soon.')}>Manage Doctors</button>
                <button className="secondary-button" type="button" onClick={() => {
                  setUsers([]);
                  setDoctors([]);
                  setAppointments([]);
                  setMessage('Account data reset. Reloading registered users...');
                  void loadAdminData();
                }}>Reset Accounts</button>
              </div>
              <div className="profile-summary">
                <InfoPair label="Admin account" value="admin@clinic.local" />
                <InfoPair label="Registered patients" value={String(patients.length)} />
                <InfoPair label="Total doctors" value={String(doctors.length)} />
                <InfoPair label="Admin accounts" value={String(admins.length)} />
                <InfoPair label="Pending appointments" value={String(pending)} />
              </div>
            </section>
          </div>
        </>
      ) : null}

      {activeView === 'appointments' ? (
        <section className="panel">
          <SectionHeader title="Appointments" />
          <DataTable
            columns={['Patient', 'Doctor', 'Date', 'Time', 'Status']}
            rows={appointments.map((appointment) => [
              appointment.patientName,
              doctorById[appointment.doctorId]?.name ?? `Doctor #${appointment.doctorId}`,
              appointment.date,
              appointment.time || '',
              appointment.status,
            ])}
            emptyText="No appointments available."
          />
        </section>
      ) : null}

      {activeView === 'patients' ? (
        <section className="panel">
          <SectionHeader title="Patients" action={<button className="ghost-button" onClick={() => void loadAdminData()}>Refresh</button>} />
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search patients by name, email, or location..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.16)',
                fontSize: '1rem',
              }}
            />
          </div>
          <DataTable
            columns={['Name', 'Email', 'Location', 'Status']}
            rows={patients
              .filter(
                (patient) =>
                  patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                  patient.email.toLowerCase().includes(patientSearch.toLowerCase()) ||
                  (patient.location || '').toLowerCase().includes(patientSearch.toLowerCase())
              )
              .map((patient) => [
                patient.name,
                patient.email,
                patient.location || '—',
                'Active',
              ])}
            emptyText="No patient records available."
          />
        </section>
      ) : null}

      {activeView === 'doctors' ? (
        <section className="panel">
          <SectionHeader title="Doctors" action={<button className="ghost-button" onClick={() => void loadAdminData()}>Refresh</button>} />
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search doctors by name, email, or specialization..."
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.16)',
                fontSize: '1rem',
              }}
            />
          </div>
          <DataTable
            columns={['Name', 'Email', 'Specialization', 'Availability']}
            rows={doctors
              .filter(
                (doctor) =>
                  doctor.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                  doctor.email.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                  doctor.specialization.toLowerCase().includes(doctorSearch.toLowerCase())
              )
              .map((doctor) => [
                doctor.name,
                doctor.email,
                doctor.specialization,
                doctor.availableTime || 'Not set',
              ])}
            emptyText="No doctors available."
          />
        </section>
      ) : null}

      {activeView === 'services' ? (
        <section className="panel">
          <SectionHeader title="Services" />
          <div className="service-grid">
            {clinicServices.map((service) => (
              <article className="service-card" key={service.name}>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <span className={`status-pill status-${service.status === 'Active' ? 'confirmed' : 'pending'}`}>
                  {service.status}
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === 'reports' ? (
        <section className="panel">
          <SectionHeader title="Reports" action={<button className="ghost-button" type="button" onClick={() => setMessage('CSV export will be enabled soon.')}>Export CSV</button>} />
          <div className="report-grid">
            <article className="report-card">
              <span>Weekly bookings</span>
              <strong>{String(appointments.filter((appointment) => appointment.status !== 'cancelled').length)}</strong>
            </article>
            <article className="report-card">
              <span>Completed visits</span>
              <strong>{String(confirmed)}</strong>
            </article>
            <article className="report-card">
              <span>Cancelled</span>
              <strong>{String(cancelled)}</strong>
            </article>
            <article className="report-card">
              <span>Top doctor</span>
              <strong>{topDoctorName}</strong>
              <p>{topDoctorCount} appointment{topDoctorCount !== 1 ? 's' : ''}</p>
            </article>
            <article className="report-card">
              <span>Top patient</span>
              <strong>{topPatientName}</strong>
              <p>{topPatientCount} appointment{topPatientCount !== 1 ? 's' : ''}</p>
            </article>
          </div>
        </section>
      ) : null}

      {activeView === 'settings' ? (
        <section className="panel">
          <SectionHeader title="Settings" />
          <div className="settings-grid">
            <InfoPair label="Clinic name" value="CareWell Clinic" />
            <InfoPair label="Timezone" value="GMT+8" />
            <InfoPair label="Appointment window" value="8:00 AM - 6:00 PM" />
            <InfoPair label="Notification" value="Enabled" />
          </div>
        </section>
      ) : null}
    </SidebarDashboard>
  );
}

function SidebarDashboard({
  currentUser,
  navItems,
  activeView,
  onSelectView,
  title,
  subtitle,
  children,
  onLogout,
  message,
  error,
  pageClassName,
  notificationCount,
  onNotificationClick,
}: {
  currentUser: AuthUser | null;
  navItems: NavItem[];
  activeView: string;
  onSelectView: (key: string) => void;
  title: string;
  subtitle: string;
  children: ReactNode;
  onLogout: () => void;
  message?: string | null;
  error?: string | null;
  pageClassName?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className={`workspace-shell ${pageClassName ?? ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="eyebrow">CareWell Clinic</span>
            <h2>Appointment System</h2>
            <p>{currentUser?.name ?? 'Guest'}</p>
            <button type="button" className="sidebar-home-link" onClick={() => navigate('/')}>Home</button>
          </div>
          <button 
            type="button" 
            className="sidebar-toggle" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sidebar-link ${activeView === item.key ? 'active' : ''}`}
              onClick={() => {
                if (item.key === 'logout') {
                  handleLogout();
                  return;
                }

                onSelectView(item.key);
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon && <span className="sidebar-icon">{item.icon}</span>}
              {!sidebarCollapsed && (
                <div className="sidebar-link-text">
                  <strong>{item.label}</strong>
                  <span>{item.caption}</span>
                </div>
              )}
              {item.badge !== undefined ? (
                <span className="sidebar-badge">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="role-badge">{currentUser?.role ?? 'guest'}</span>
        </div>
      </aside>

      <main className={`dashboard-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="workspace-header">
          <div className="topbar-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              ☰
            </button>
            <div className="topbar-title">
              <strong>CLINIC APPOINTMENT SYSTEM</strong>
              <p>{title}</p>
            </div>
          </div>
          <div className="topbar-right">
            <button
              type="button"
              className="icon-button"
              onClick={onNotificationClick}
              title="View notifications"
              aria-label="View notifications"
            >
              🔔
              <span className="notification-badge">
                {notificationCount ?? 0}
              </span>
            </button>
            <div className="user-chip">
              <strong>{currentUser?.name ?? 'Admin'}</strong>
              <span>{currentUser?.role ?? 'admin'}</span>
            </div>
          </div>
        </div>
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </header>
        {message ? <div className="notice success-notice">{message}</div> : null}
        {error ? <div className="notice error-notice">{error}</div> : null}
        {children}
      </main>
    </div>
  );
}

function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  message,
  error,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  message?: string | null;
  error?: string | null;
}) {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🏥</div>
            <h1 className="logo-text">CareWell Clinic</h1>
          </div>
          <div className="auth-title-section">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="auth-content">
          {message ? <div className="notice success-notice">✅ {message}</div> : null}
          {error ? <div className="notice error-notice">❌ {error}</div> : null}
          {children}
        </div>
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}

function AuthFooter() {
  return (
    <div className="auth-footer footer-links">
      <Link to="/">Home</Link>
      <Link to="/login">Login</Link>
      <Link to="/register/patient">Patient</Link>
      <Link to="/register/doctor">Doctor</Link>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      {action}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-pair">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataTable({
  columns,
  rows,
  emptyText,
}: {
  columns: string[];
  rows: string[][];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row[0]}-${rowIndex}`}>
              {row.map((value, valueIndex) => (
                <td key={`${columns[valueIndex]}-${valueIndex}`}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
