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

export type Message = {
  id: number;
  senderId: number;
  senderName: string;
  senderRole: 'user' | 'doctor';
  recipientId: number;
  recipientName: string;
  content: string;
  timestamp: string;
  read: boolean;
  conversationId?: number;
};

export type Payment = {
  id: number;
  patientId: number;
  appointmentId?: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'insurance';
  description: string;
  transactionId?: string;
  createdAt: string;
  paidAt?: string;
  receiptUrl?: string;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: 'appointment_booked' | 'appointment_cancelled' | 'payment_received' | 'payment_failed' | 'general';
  isRead: boolean;
  createdAt: string;
};

export type PaymentMethod = {
  id: number;
  type: 'credit_card' | 'debit_card';
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
};
