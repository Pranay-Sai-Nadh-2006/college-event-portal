import { DatabaseState, CollegeEvent, Registration, Announcement, User, EventReview } from '../types';
import { defaultUsers, defaultEvents, defaultAnnouncements, defaultRegistrations } from '../data/defaultData';

const DB_KEY = 'college_event_portal_db';
const CLOUD_SYNC_KEY = 'college_event_portal_cloud_endpoint';

// Cloud Sync Helper Engine
let isSyncing = false;

export function getDbState(): DatabaseState {
  if (typeof window === 'undefined') {
    return {
      users: defaultUsers,
      events: defaultEvents,
      registrations: defaultRegistrations,
      announcements: defaultAnnouncements,
      reviews: [],
      loginLogs: []
    };
  }

  const stored = localStorage.getItem(DB_KEY);
  if (!stored) {
    const initialState: DatabaseState = {
      users: defaultUsers,
      events: defaultEvents,
      registrations: defaultRegistrations,
      announcements: defaultAnnouncements,
      reviews: [],
      loginLogs: []
    };
    localStorage.setItem(DB_KEY, JSON.stringify(initialState));
    return initialState;
  }

  try {
    const parsed = JSON.parse(stored) as DatabaseState;
    // Backwards compatibility / integrity check
    if (!parsed.users || !parsed.events || !parsed.registrations || !parsed.announcements) {
      throw new Error('Incomplete data');
    }

    if (!parsed.reviews) {
      parsed.reviews = [];
    }

    if (!parsed.loginLogs) {
      parsed.loginLogs = [];
    }

    // Auto-inject missing default events if they aren't in the database yet
    let stateChanged = false;
    defaultEvents.forEach(defEvt => {
      const exists = parsed.events.some(e => e.id === defEvt.id);
      if (!exists) {
        parsed.events.push(defEvt);
        stateChanged = true;
      }
    });

    if (stateChanged) {
      // Keep events sorted by date or order
      parsed.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      saveDbState(parsed);
    }

    return parsed;
  } catch (error) {
    console.warn('DB state corrupted, resetting to default', error);
    const fallbackState: DatabaseState = {
      users: defaultUsers,
      events: defaultEvents,
      registrations: defaultRegistrations,
      announcements: defaultAnnouncements,
      reviews: []
    };
    localStorage.setItem(DB_KEY, JSON.stringify(fallbackState));
    return fallbackState;
  }
}

export function saveDbState(state: DatabaseState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  }
}

// User Actions
export function registerUser(user: Omit<User, 'id' | 'registeredAt'>): { success: boolean; user?: User; error?: string } {
  const state = getDbState();
  const emailLower = user.email.toLowerCase().trim();

  const exists = state.users.some(u => u.email.toLowerCase() === emailLower);
  if (exists) {
    return { success: false, error: 'An account with this email already exists' };
  }

  const newUser: User = {
    ...user,
    id: `usr_${Math.random().toString(36).substring(2, 11)}`,
    email: emailLower,
    registeredAt: new Date().toISOString()
  };

  state.users.push(newUser);
  saveDbState(state);
  return { success: true, user: newUser };
}

export function updateUserProfile(userId: string, updatedFields: Partial<User>): { success: boolean; user?: User; error?: string } {
  const state = getDbState();
  const userIndex = state.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, error: 'User not found' };
  }

  const updatedUser = {
    ...state.users[userIndex],
    ...updatedFields,
    // ID and Email must remain unchanged for security
    id: userId,
    email: state.users[userIndex].email,
    role: state.users[userIndex].role
  };

  state.users[userIndex] = updatedUser;
  saveDbState(state);
  return { success: true, user: updatedUser };
}

// Event Registration Actions
export function registerForEvent(userId: string, eventId: string, reminderSet?: boolean): { success: boolean; registration?: Registration; error?: string } {
  const state = getDbState();
  
  const user = state.users.find(u => u.id === userId);
  const event = state.events.find(e => e.id === eventId);

  if (!user) return { success: false, error: 'User not found' };
  if (!event) return { success: false, error: 'Event not found' };

  // Check if already registered
  const existingReg = state.registrations.find(
    r => r.userId === userId && r.eventId === eventId && r.status === 'confirmed'
  );
  if (existingReg) {
    return { success: false, error: 'You are already registered for this event!' };
  }

  // Check deadline
  const todayStr = new Date().toISOString().split('T')[0];
  if (event.deadline < todayStr) {
    return { success: false, error: 'Registration deadline has already passed' };
  }

  // Check capacity
  if (event.seatsLeft <= 0) {
    return { success: false, error: 'This event is fully booked!' };
  }

  // Deduct seat
  event.seatsLeft = Math.max(0, event.seatsLeft - 1);

  // Create registration
  const registration: Registration = {
    id: `reg_${Math.random().toString(36).substring(2, 11)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    eventId: event.id,
    eventTitle: event.title,
    eventDate: event.date,
    eventVenue: event.venue,
    registeredAt: new Date().toISOString(),
    ticketQRValue: `TICKET-${event.id.toUpperCase()}-${user.id.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'confirmed',
    reminderSet: reminderSet || false
  };

  state.registrations.push(registration);
  saveDbState(state);
  return { success: true, registration };
}

export function cancelRegistration(userId: string, eventId: string): { success: boolean; error?: string } {
  const state = getDbState();
  
  const regIndex = state.registrations.findIndex(
    r => r.userId === userId && r.eventId === eventId && r.status === 'confirmed'
  );
  if (regIndex === -1) {
    return { success: false, error: 'No active registration found' };
  }

  const event = state.events.find(e => e.id === eventId);
  if (event) {
    // Return seat
    event.seatsLeft = Math.min(event.capacity, event.seatsLeft + 1);
  }

  // Mark status as cancelled
  state.registrations[regIndex].status = 'cancelled';
  saveDbState(state);
  return { success: true };
}

// Admin Event CRUD Actions
export function createEvent(event: Omit<CollegeEvent, 'id' | 'seatsLeft' | 'createdAt'>): { success: boolean; event: CollegeEvent } {
  const state = getDbState();
  const newEvent: CollegeEvent = {
    ...event,
    id: `evt_${Math.random().toString(36).substring(2, 11)}`,
    seatsLeft: event.capacity,
    createdAt: new Date().toISOString()
  };

  state.events.unshift(newEvent); // Add to beginning
  saveDbState(state);
  return { success: true, event: newEvent };
}

export function updateEvent(eventId: string, updatedData: Partial<CollegeEvent>): { success: boolean; event?: CollegeEvent; error?: string } {
  const state = getDbState();
  const index = state.events.findIndex(e => e.id === eventId);
  if (index === -1) return { success: false, error: 'Event not found' };

  const currentEvent = state.events[index];
  
  // Capacity adjustments logic
  let newSeatsLeft = currentEvent.seatsLeft;
  if (updatedData.capacity !== undefined && updatedData.capacity !== currentEvent.capacity) {
    const seatsTaken = currentEvent.capacity - currentEvent.seatsLeft;
    newSeatsLeft = Math.max(0, updatedData.capacity - seatsTaken);
  }

  const updatedEvent: CollegeEvent = {
    ...currentEvent,
    ...updatedData,
    seatsLeft: newSeatsLeft,
    id: eventId // Safeguard id
  };

  state.events[index] = updatedEvent;
  
  // Update registrations cached event details
  state.registrations.forEach(r => {
    if (r.eventId === eventId) {
      if (updatedEvent.title) r.eventTitle = updatedEvent.title;
      if (updatedEvent.date) r.eventDate = updatedEvent.date;
      if (updatedEvent.venue) r.eventVenue = updatedEvent.venue;
    }
  });

  saveDbState(state);
  return { success: true, event: updatedEvent };
}

export function deleteEvent(eventId: string): { success: boolean; error?: string } {
  const state = getDbState();
  const index = state.events.findIndex(e => e.id === eventId);
  if (index === -1) return { success: false, error: 'Event not found' };

  // Remove the event
  state.events.splice(index, 1);

  // Cancel associated registrations
  state.registrations = state.registrations.map(r => {
    if (r.eventId === eventId && r.status === 'confirmed') {
      return { ...r, status: 'cancelled' };
    }
    return r;
  });

  saveDbState(state);
  return { success: true };
}

// Announcements CRUD
export function createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): { success: boolean; announcement: Announcement } {
  const state = getDbState();
  const newAnnouncement: Announcement = {
    ...announcement,
    id: `ann_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: new Date().toISOString()
  };

  state.announcements.unshift(newAnnouncement);
  saveDbState(state);
  return { success: true, announcement: newAnnouncement };
}

export function deleteAnnouncement(announcementId: string): { success: boolean; error?: string } {
  const state = getDbState();
  const index = state.announcements.findIndex(a => a.id === announcementId);
  if (index === -1) return { success: false, error: 'Announcement not found' };

  state.announcements.splice(index, 1);
  saveDbState(state);
  return { success: true };
}

// Reviews CRUD Action
export function addEventReview(
  eventId: string,
  userId: string,
  rating: number,
  comment: string
): { success: boolean; review?: EventReview; error?: string } {
  const state = getDbState();
  
  const user = state.users.find(u => u.id === userId);
  const event = state.events.find(e => e.id === eventId);
  
  if (!user) return { success: false, error: 'User not found' };
  if (!event) return { success: false, error: 'Event not found' };

  // Check if they are registered (only registered users can leave a review)
  const registrationIndex = state.registrations.findIndex(
    r => r.userId === userId && r.eventId === eventId && r.status === 'confirmed'
  );

  if (registrationIndex === -1) {
    return { success: false, error: 'Only registered students can review this event' };
  }

  // Add the review
  if (!state.reviews) {
    state.reviews = [];
  }

  // Remove existing review by this user if any (they can update it)
  state.reviews = state.reviews.filter(r => !(r.userId === userId && r.eventId === eventId));

  const newReview: EventReview = {
    id: `rev_${Math.random().toString(36).substring(2, 11)}`,
    eventId,
    userId,
    userName: user.name,
    userEmail: user.email,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };

  state.reviews.push(newReview);

  // Mark on registration
  state.registrations[registrationIndex].feedbackSubmitted = true;
  state.registrations[registrationIndex].rating = rating;

  saveDbState(state);
  return { success: true, review: newReview };
}

export function getEventReviews(eventId: string): EventReview[] {
  const state = getDbState();
  if (!state.reviews) return [];
  return state.reviews.filter(r => r.eventId === eventId);
}

// User Login Tracking & Audit Logging
export function recordLogin(userId: string): { success: boolean; user?: User; log?: any } {
  const state = getDbState();
  const user = state.users.find(u => u.id === userId);
  if (!user) return { success: false };

  const nowIso = new Date().toISOString();
  user.lastLoginAt = nowIso;

  if (!state.loginLogs) {
    state.loginLogs = [];
  }

  const newLog = {
    id: `log_${Math.random().toString(36).substring(2, 11)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    userRole: user.role,
    loginTime: nowIso,
    deviceInfo: typeof navigator !== 'undefined' ? `${navigator.platform || 'Web'} (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'})` : 'Web Client'
  };

  // Keep latest 100 login logs
  state.loginLogs.unshift(newLog);
  if (state.loginLogs.length > 100) {
    state.loginLogs = state.loginLogs.slice(0, 100);
  }

  saveDbState(state);
  return { success: true, user, log: newLog };
}

// Admin Action: Revoke/Cancel any student's event registration
export function adminCancelRegistration(registrationId: string): { success: boolean; error?: string } {
  const state = getDbState();
  const regIndex = state.registrations.findIndex(r => r.id === registrationId);
  
  if (regIndex === -1) {
    return { success: false, error: 'Registration record not found' };
  }

  const reg = state.registrations[regIndex];
  
  // Return seat to event if currently confirmed
  if (reg.status === 'confirmed') {
    const event = state.events.find(e => e.id === reg.eventId);
    if (event) {
      event.seatsLeft = Math.min(event.capacity, event.seatsLeft + 1);
    }
  }

  state.registrations[regIndex].status = 'cancelled';
  saveDbState(state);
  return { success: true };
}

// Cloud Database Synchronization (Cross-Device Data Sync)
export async function syncCloudDb(): Promise<DatabaseState | null> {
  if (typeof window === 'undefined' || isSyncing) return null;
  isSyncing = true;
  try {
    const localState = getDbState();
    // Use BroadcastChannel to immediately sync tab-to-tab & window-to-window
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('college_event_portal_sync');
      channel.postMessage({ type: 'SYNC_STATE', payload: localState });
    }
    isSyncing = false;
    return localState;
  } catch (err) {
    isSyncing = false;
    return null;
  }
}


