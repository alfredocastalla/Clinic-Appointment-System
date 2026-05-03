export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'user' | 'admin' | 'doctor';
  name: string;
  location?: string; // For users
  specialization?: string; // For doctors
  address?: string; // For doctors
  phone?: string; // For doctors
  photo?: string; // For doctors
  availableTime?: string; // For doctors
}

export interface RequestWithUser {
  user: AuthenticatedUser;
}
