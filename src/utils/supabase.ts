/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { DatabaseState, User, CollegeEvent, Registration, Announcement, LoginLog, EventReview } from '../types';

// Supabase environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.dummy';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cloud Database Helper Functions for Supabase
export async function pushToCloudDatabase(state: DatabaseState): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    // Upsert users
    if (state.users && state.users.length > 0) {
      await supabase.from('users').upsert(
        state.users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          password: u.password,
          avatar_color: u.avatarColor,
          department: u.department,
          student_id: u.studentId,
          bio: u.bio,
          registered_at: u.registeredAt,
          last_login_at: u.lastLoginAt
        }))
      );
    }

    // Upsert events
    if (state.events && state.events.length > 0) {
      await supabase.from('events').upsert(
        state.events.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          date: e.date,
          time: e.time,
          venue: e.venue,
          category: e.category,
          deadline: e.deadline,
          capacity: e.capacity,
          seats_left: e.seatsLeft,
          banner_image: e.bannerImage,
          organizer_id: e.organizerId,
          published: e.published,
          tags: e.tags
        }))
      );
    }

    // Upsert registrations
    if (state.registrations && state.registrations.length > 0) {
      await supabase.from('registrations').upsert(
        state.registrations.map(r => ({
          id: r.id,
          user_id: r.userId,
          user_name: r.userName,
          user_email: r.userEmail,
          event_id: r.eventId,
          event_title: r.eventTitle,
          event_date: r.eventDate,
          event_venue: r.eventVenue,
          registered_at: r.registeredAt,
          ticket_qr_value: r.ticketQRValue,
          status: r.status,
          reminder_set: r.reminderSet
        }))
      );
    }

    // Upsert login logs
    if (state.loginLogs && state.loginLogs.length > 0) {
      await supabase.from('login_logs').upsert(
        state.loginLogs.map(l => ({
          id: l.id,
          user_id: l.userId,
          user_name: l.userName,
          user_email: l.userEmail,
          user_role: l.userRole,
          login_time: l.loginTime,
          device_info: l.deviceInfo
        }))
      );
    }

    return true;
  } catch (error) {
    console.warn('Supabase cloud sync notification:', error);
    return false;
  }
}
