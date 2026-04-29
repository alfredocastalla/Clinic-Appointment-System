import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import {
  AuthUser,
  Role,
  clearSession,
  getStoredUser,
  setSession,
  updateStoredUser,
} from './lib/auth';
import { Appointment, Doctor } from './types';

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
};

type AppointmentFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

type RescheduleForm = {
  id: number;
  date: string;
  time: string;
  symptoms: string;
};

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
      <Route path="/login" element={<LoginPage currentUser={currentUser} onLogin={handleLogin} />} />
      <Route path="/register/patient" element={<RegisterPatientPage />} />
      <Route path="/register/doctor" element={<RegisterDoctorPage />} />
      <Route
        path="/dashboard/patient"
        element={
          <ProtectedRoute currentUser={currentUser} expectedRole="user">
            <PatientDashboard currentUser={currentUser} onLogout={handleLogout} />
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

  if (currentUser.role !== expectedRole) {
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
    <div className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow">Clinic Appointment System</span>
          <h1>One frontend, cleaner roles, and dashboards that actually feel organized.</h1>
          <p>
            The project now uses React + TypeScript with dedicated dashboard flows for
            patients, doctors, and admin. The backend seeds a default admin account so
            you can test the admin workspace immediately.
          </p>
          <div className="hero-note">
            <strong>Default admin</strong>
            <span>`admin@clinic.local` / `admin123`</span>
          </div>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => navigate(dashboardPath)}>
            {currentUser ? 'Open dashboard' : 'Login'}
          </button>
          <button className="secondary-button" onClick={() => navigate('/register/patient')}>
            Register patient
          </button>
          <button className="secondary-button" onClick={() => navigate('/register/doctor')}>
            Register doctor
          </button>
        </div>
      </section>
    </div>
  );
}

function LoginPage({
  currentUser,
  onLogin,
}: {
  currentUser: AuthUser | null;
  onLogin: (token: string, user: AuthUser) => void;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      navigate(getDashboardPath(currentUser.role), { replace: true });
    }
  }, [currentUser, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      navigate(getDashboardPath(response.user.role));
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Login"
      subtitle="Choose the role you want to open and sign in."
      footer={<AuthFooter />}
      message={message}
      error={error}
    >
      <form className="stack-form" onSubmit={handleSubmit}>
        <label>
          <span>Email</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </label>
        <label>
          <span>Role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="user">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
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
      <form className="stack-form" onSubmit={handleSubmit}>
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
      <form className="stack-form" onSubmit={handleSubmit}>
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
}: {
  currentUser: AuthUser | null;
  onLogout: () => void;
}) {
  const [activeView, setActiveView] = useState('overview');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentFilter>('all');
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleForm | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [updatingAppointment, setUpdatingAppointment] = useState(false);

  const doctorById = useMemo(
    () => Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor])),
    [doctors],
  );

  useEffect(() => {
    void loadData();
  }, []);

  const navItems: NavItem[] = [
    { key: 'overview', label: 'Overview', caption: 'Counts and quick context' },
    { key: 'book', label: 'Book Visit', caption: 'Create a new appointment' },
    { key: 'appointments', label: 'Appointments', caption: 'Manage your bookings' },
  ];

  async function loadData() {
    setError(null);

    try {
      const [doctorData, appointmentData] = await Promise.all([
        api<Doctor[]>('/doctors'),
        api<Appointment[]>('/appointments', { auth: true }),
      ]);
      setDoctors(doctorData);
      setAppointments(appointmentData);
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
      setActiveView('appointments');
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

  const upcomingAppointments = appointments.filter((appointment) => appointment.status !== 'cancelled');
  const filteredAppointments = getFilteredAppointments(appointments, statusFilter);

  return (
    <SidebarDashboard
      currentUser={currentUser}
      navItems={navItems}
      activeView={activeView}
      onSelectView={setActiveView}
      title="Patient Dashboard"
      subtitle="Track visits, browse doctors, and keep your booking flow tidy."
      onLogout={onLogout}
      message={message}
      error={error}
    >
      {activeView === 'overview' ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Available Doctors" value={String(doctors.length)} />
            <MetricCard label="Appointments" value={String(appointments.length)} />
            <MetricCard label="Active Visits" value={String(upcomingAppointments.length)} />
          </div>
          <div className="content-grid">
            <section className="panel">
              <SectionHeader
                title="Doctor directory"
                action={<button className="ghost-button" onClick={() => void loadData()}>Refresh</button>}
              />
              <div className="list-stack">
                {doctors.length === 0 ? (
                  <EmptyState text="No doctors available yet." />
                ) : (
                  doctors.map((doctor) => (
                    <article className="list-card" key={doctor.id}>
                      <div>
                        <h3>Dr. {doctor.name}</h3>
                        <p>{doctor.specialization}</p>
                        <p className="muted-copy">{doctor.address || 'Clinic address not set.'}</p>
                      </div>
                      <button
                        className="primary-button compact-button"
                        type="button"
                        onClick={() => {
                          setDoctorId(String(doctor.id));
                          setActiveView('book');
                        }}
                      >
                        Book
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>
            <section className="panel">
              <SectionHeader title="Upcoming visits" />
              <div className="list-stack">
                {upcomingAppointments.length === 0 ? (
                  <EmptyState text="No active appointments yet." />
                ) : (
                  upcomingAppointments.slice(0, 4).map((appointment) => (
                    <article className="list-card" key={appointment.id}>
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
                      </div>
                      <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}

      {activeView === 'book' ? (
        <section className="panel">
          <SectionHeader title="Book a new appointment" />
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
      ) : null}

      {activeView === 'appointments' ? (
        <section className="panel">
          <SectionHeader
            title="Your appointments"
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
                <button className="ghost-button" onClick={() => void loadData()}>Refresh</button>
              </div>
            }
          />
          <div className="list-stack">
            {filteredAppointments.length === 0 ? (
              <EmptyState text="You have not booked any appointments yet." />
            ) : (
              filteredAppointments.map((appointment) => (
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
      ) : null}
    </SidebarDashboard>
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
  const [activeView, setActiveView] = useState('overview');
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<AppointmentFilter>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadDoctorData();
  }, [currentUser?.id]);

  const navItems: NavItem[] = [
    { key: 'overview', label: 'Overview', caption: 'Status and quick totals' },
    { key: 'appointments', label: 'Appointments', caption: 'Review and update visits' },
    { key: 'profile', label: 'Profile', caption: 'Doctor account details' },
  ];

  async function loadDoctorData() {
    if (!currentUser) {
      return;
    }

    setError(null);

    try {
      const [doctor, appointmentData] = await Promise.all([
        api<Doctor>(`/doctors/${currentUser.id}`),
        api<Appointment[]>('/appointments', { auth: true }),
      ]);
      setProfile(doctor);
      setAppointments(appointmentData);
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
    >
      {activeView === 'overview' ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Total Visits" value={String(appointments.length)} />
            <MetricCard
              label="Pending"
              value={String(appointments.filter((appointment) => appointment.status === 'pending').length)}
            />
            <MetricCard
              label="Confirmed"
              value={String(appointments.filter((appointment) => appointment.status === 'confirmed').length)}
            />
          </div>
          <div className="content-grid">
            <section className="panel">
              <SectionHeader title="Today at a glance" />
              <div className="list-stack">
                {appointments.slice(0, 4).map((appointment) => (
                  <article className="list-card" key={appointment.id}>
                    <div>
                      <h3>{appointment.patientName}</h3>
                      <p>
                        {appointment.date}
                        {appointment.time ? ` at ${appointment.time}` : ''}
                      </p>
                    </div>
                    <span className={`status-pill status-${appointment.status}`}>{appointment.status}</span>
                  </article>
                ))}
                {appointments.length === 0 ? <EmptyState text="No appointments yet." /> : null}
              </div>
            </section>
            <section className="panel">
              <SectionHeader title="Profile summary" />
              <div className="profile-summary">
                <InfoPair label="Name" value={profile?.name || 'Loading...'} />
                <InfoPair label="Specialization" value={profile?.specialization || 'Not set'} />
                <InfoPair label="Address" value={profile?.address || 'Not set'} />
                <InfoPair label="Availability" value={profile?.availableTime || 'Not set'} />
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
  const [activeView, setActiveView] = useState('overview');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { key: 'overview', label: 'Overview', caption: 'System-wide metrics' },
    { key: 'users', label: 'Users', caption: 'Patient and admin accounts' },
    { key: 'doctors', label: 'Doctors', caption: 'Clinician directory' },
    { key: 'appointments', label: 'Appointments', caption: 'Booking activity' },
  ];

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function loadAdminData() {
    setMessage(null);
    setError(null);

    try {
      const [userData, doctorData, appointmentData] = await Promise.all([
        api<UserRecord[]>('/users'),
        api<Doctor[]>('/doctors'),
        api<Appointment[]>('/appointments', { auth: true }),
      ]);
      setUsers(userData);
      setDoctors(doctorData);
      setAppointments(appointmentData);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  const admins = users.filter((user) => user.role === 'admin');
  const patients = users.filter((user) => user.role === 'user');
  const doctorById = Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor]));

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
    >
      {activeView === 'overview' ? (
        <>
          <div className="metrics-grid">
            <MetricCard label="Patients" value={String(patients.length)} />
            <MetricCard label="Doctors" value={String(doctors.length)} />
            <MetricCard label="Appointments" value={String(appointments.length)} />
            <MetricCard label="Admins" value={String(admins.length)} />
          </div>
          <div className="content-grid">
            <section className="panel">
              <SectionHeader
                title="Recent appointments"
                action={<button className="ghost-button" onClick={() => void loadAdminData()}>Refresh</button>}
              />
              <div className="list-stack">
                {appointments.length === 0 ? (
                  <EmptyState text="No appointments found." />
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
            <section className="panel">
              <SectionHeader title="System notes" />
              <div className="profile-summary">
                <InfoPair label="Admin account" value="admin@clinic.local" />
                <InfoPair label="Seed password" value="admin123" />
                <InfoPair label="Backend health" value="/api/health" />
                <InfoPair label="Frontend mode" value="React + TypeScript" />
              </div>
            </section>
          </div>
        </>
      ) : null}

      {activeView === 'users' ? (
        <section className="panel">
          <SectionHeader title="User accounts" />
          <DataTable
            columns={['Name', 'Email', 'Role', 'Location']}
            rows={users.map((user) => [user.name, user.email, user.role, user.location || ''])}
            emptyText="No users available."
          />
        </section>
      ) : null}

      {activeView === 'doctors' ? (
        <section className="panel">
          <SectionHeader title="Doctor directory" />
          <DataTable
            columns={['Name', 'Email', 'Specialization', 'Availability']}
            rows={doctors.map((doctor) => [
              doctor.name,
              doctor.email,
              doctor.specialization,
              doctor.availableTime || 'Not set',
            ])}
            emptyText="No doctors available."
          />
        </section>
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
}) {
  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">Clinic workspace</span>
          <h2>MCAS</h2>
          <p>{currentUser?.name ?? 'Guest'}</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`sidebar-link ${activeView === item.key ? 'active' : ''}`}
              onClick={() => onSelectView(item.key)}
            >
              <strong>{item.label}</strong>
              <span>{item.caption}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="role-badge">{currentUser?.role ?? 'guest'}</span>
          <button className="secondary-button sidebar-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-shell">
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
    <div className="page-shell">
      <section className="auth-card">
        <div className="section-heading">
          <span className="eyebrow">Frontend / React + TypeScript</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {message ? <div className="notice success-notice">{message}</div> : null}
        {error ? <div className="notice error-notice">{error}</div> : null}
        {children}
        {footer}
      </section>
    </div>
  );
}

function AuthFooter() {
  return (
    <div className="auth-footer">
      <a href="/">Home</a>
      <a href="/login">Login</a>
      <a href="/register/patient">Patient</a>
      <a href="/register/doctor">Doctor</a>
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
