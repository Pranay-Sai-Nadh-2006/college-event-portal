export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  avatarColor: string;
  department?: string;
  studentId?: string; // Roll number for students
  bio?: string;
  phone?: string;
  registeredAt: string;
  lastLoginAt?: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  loginTime: string;
  deviceInfo?: string;
}

export interface CollegeEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  venue: string;
  category: 'Technical' | 'Cultural' | 'Sports' | 'Academic' | 'Workshop' | 'Seminar';
  deadline: string; // YYYY-MM-DD
  capacity: number;
  seatsLeft: number;
  bannerImage: string;
  organizerId: string;
  createdAt: string;
  published: boolean;
  tags?: string[];
}

export interface Registration {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registeredAt: string;
  ticketQRValue: string; // Mock QR value
  status: 'confirmed' | 'cancelled';
  feedbackSubmitted?: boolean;
  rating?: number;
  reminderSet?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'important' | 'general' | 'academic' | 'sports' | 'culture';
  date: string;
  postedBy: string; // Name of Admin
  createdAt: string;
}

export interface EventReview {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
}

export interface DatabaseState {
  users: User[];
  events: CollegeEvent[];
  registrations: Registration[];
  announcements: Announcement[];
  reviews?: EventReview[]; // Optional for backwards compatibility
  loginLogs?: LoginLog[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}
