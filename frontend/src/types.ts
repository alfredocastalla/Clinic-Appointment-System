export type Doctor = {
  id: number;
  name: string;
  email: string;
  specialization: string;
  availableTime?: string;
  address?: string;
  phone?: string;
  photo?: string;
};

export type Appointment = {
  id: number;
  patientId?: number;
  patientName: string;
  doctorId: number;
  date: string;
  time?: string;
  symptoms?: string;
  status: string;
};
