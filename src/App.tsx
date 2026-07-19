import React, { useState, useEffect } from 'react';
import { User, CollegeEvent, Registration, Announcement, ToastMessage } from './types';
import { getDbState, saveDbState, registerForEvent, cancelRegistration, createEvent, updateEvent, deleteEvent, createAnnouncement, deleteAnnouncement, updateUserProfile } from './utils/db';
import AuthModal from './components/AuthModal';
import EventCard from './components/EventCard';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AnnouncementsList from './components/AnnouncementsList';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';
import EventBackground from './components/EventBackground';
import {
  Calendar as CalendarIcon,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Search,
  BookOpen,
  Filter,
  Megaphone,
  TrendingUp,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Ticket,
  Printer,
  MapPin,
  Clock,
  QrCode,
  X,
  Compass,
  Heart,
  CalendarPlus,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EVENTS_PER_PAGE = 4;

const getGoogleCalendarUrl = (event: CollegeEvent) => {
  const cleanTitle = encodeURIComponent(event.title);
  const cleanDetails = encodeURIComponent(event.description);
  const cleanLocation = encodeURIComponent(event.venue);
  
  // Format dates: YYYYMMDDTHHMMSS
  const dateStr = event.date.replace(/-/g, ''); // "20260720"
  const timeStr = event.time.replace(/:/g, ''); // "1430"
  
  // Format as basic ISO format: YYYYMMDDTHHMMSS
  const startDateTime = `${dateStr}T${timeStr}00`;
  
  // End date-time (default: 2 hours later)
  const [hours, minutes] = event.time.split(':').map(Number);
  const endHours = hours + 2;
  const endHoursStr = String(endHours % 24).padStart(2, '0');
  let endDateStr = dateStr;
  if (endHours >= 24) {
    // If it rolls over to next day, simple next day calculation
    const d = new Date(event.date);
    d.setDate(d.getDate() + 1);
    endDateStr = d.toISOString().split('T')[0].replace(/-/g, '');
  }
  const endDateTime = `${endDateStr}T${endHoursStr}${String(minutes || 0).padStart(2, '0')}00`;
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${cleanTitle}&dates=${startDateTime}/${endDateTime}&details=${cleanDetails}&location=${cleanLocation}`;
};

export default function App() {
  // 1. Core Database State
  const [db, setDb] = useState(getDbState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshDbState = () => {
    setDb(getDbState());
  };
  
  // 2. Navigation State
  const [activeTab, setActiveTab] = useState<'discover' | 'calendar' | 'announcements' | 'analytics' | 'profile' | 'admin' | 'favorites'>('discover');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<{ reg: Registration; event: CollegeEvent } | null>(null);

  // 3. Filtering and Searching Events
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'full'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // 4. Favorites State
  const [favoritedEventIds, setFavoritedEventIds] = useState<string[]>([]);

  // 5. Global UI State
  const [theme, setTheme] = useState<'light' | 'dark' | 'neon' | 'forest' | 'sepia'>('light');
  const [isAutoTimeTheme, setIsAutoTimeTheme] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isTicketCalendarAdded, setIsTicketCalendarAdded] = useState(false);
  const [deepLinkedEventId, setDeepLinkedEventId] = useState<string | null>(null);

  // Handle deep-linked event from ?event=<id> URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('event');
    if (eventId) {
      setActiveTab('discover');
      setDeepLinkedEventId(eventId);
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
      // Scroll to event card after a short delay for render
      setTimeout(() => {
        const el = document.getElementById(`event-card-${eventId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'), 3000);
        }
      }, 600);
    }
  }, []);

  // Synchronize favorites on user session change
  useEffect(() => {
    const key = currentUser ? `college_portal_favorites_${currentUser.id}` : 'college_portal_favorites_guest';
    const saved = localStorage.getItem(key);
    setFavoritedEventIds(saved ? JSON.parse(saved) : []);
  }, [currentUser]);

  const handleToggleFavorite = (eventId: string) => {
    const key = currentUser ? `college_portal_favorites_${currentUser.id}` : 'college_portal_favorites_guest';
    setFavoritedEventIds(prev => {
      const isAlreadyFavorited = prev.includes(eventId);
      const next = isAlreadyFavorited ? prev.filter(id => id !== eventId) : [...prev, eventId];
      localStorage.setItem(key, JSON.stringify(next));
      
      const targetEvent = db.events.find(e => e.id === eventId);
      const title = targetEvent ? targetEvent.title : 'Event';
      if (isAlreadyFavorited) {
        showToast('warning', 'Removed from Favorites', `"${title}" has been removed from your saved list.`);
      } else {
        showToast('success', 'Added to Favorites', `"${title}" is now saved to your Favorites list!`);
      }
      return next;
    });
  };

  // Synchronize state and sessions on mount & across windows/tabs
  useEffect(() => {
    // Session restoration
    const savedUserId = localStorage.getItem('college_portal_user_id');
    if (savedUserId) {
      const state = getDbState();
      const user = state.users.find(u => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }

    // Theme restoration
    const savedTheme = localStorage.getItem('college_portal_theme') as any;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    const isDarkBase = initialTheme === 'dark' || initialTheme === 'neon';
    if (isDarkBase) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Real-time synchronization for newly registered users & bookings across tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'college_event_portal_db') {
        setDb(getDbState());
      }
    };
    window.addEventListener('storage', handleStorageChange);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('college_event_portal_sync');
      channel.onmessage = () => {
        setDb(getDbState());
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, []);

  // Time of Day Auto-Theme shift logic
  useEffect(() => {
    if (!isAutoTimeTheme) return;

    const applyTimeBasedTheme = () => {
      const hour = new Date().getHours();
      // Nighttime: 6 PM (18) to 6 AM (6) -> Midnight Neon / Dark
      // Daytime: 6 AM to 6 PM -> Light / Forest
      if (hour >= 18 || hour < 6) {
        changeTheme('neon');
        showToast('info', '⏰ Nighttime Shift', 'Automatically switched to Midnight Neon theme for nighttime viewing.');
      } else {
        changeTheme('light');
        showToast('info', '⏰ Daytime Shift', 'Automatically switched to Light theme for daytime viewing.');
      }
    };

    applyTimeBasedTheme();
  }, [isAutoTimeTheme]);

  // 5. Mock Push Notification System
  // Automatically scans registered events and triggers a simulated browser toast notification
  // 1 hour before an upcoming registered event starts (simulated shortly after loading/login)
  useEffect(() => {
    if (!currentUser) return;

    // Filter confirmed registrations for this user
    const confirmedRegs = db.registrations.filter(
      r => r.userId === currentUser.id && r.status === 'confirmed'
    );

    if (confirmedRegs.length === 0) return;

    // Find the first registered event that's upcoming
    const registeredEvents = confirmedRegs
      .map(r => db.events.find(e => e.id === r.eventId))
      .filter((e): e is CollegeEvent => e !== undefined)
      // Sort so the earliest upcoming one is targeted
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (registeredEvents.length === 0) return;

    const nextEvent = registeredEvents[0];

    // Trigger a simulated "Push Notification" 1 hour before the event after 2.5 seconds
    const timer = setTimeout(() => {
      showToast(
        'info',
        '🔔 Mock Push Notification Alert (1 Hour Before)',
        `REMINDER: Your registered event "${nextEvent.title}" starts in 1 hour at ${nextEvent.time} Hrs! Venue: ${nextEvent.venue}. Please ensure you have your digital ticket pass ready.`
      );
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentUser, db.registrations, db.events]);

  // Sync DB back state updates
  const reloadDb = () => {
    setDb(getDbState());
  };

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => {
    const id = `toast_${Math.random().toString(36).substring(2, 9)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Theme Setter
  const changeTheme = (newTheme: 'light' | 'dark' | 'neon' | 'forest' | 'sepia') => {
    setTheme(newTheme);
    localStorage.setItem('college_portal_theme', newTheme);
    
    const isDarkBase = newTheme === 'dark' || newTheme === 'neon';
    if (isDarkBase) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Session Handlers
  const handleLoginSuccess = (user: User) => {
    reloadDb(); // Immediately refresh database state in React memory
    setCurrentUser(user);
    localStorage.setItem('college_portal_user_id', user.id);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('college_portal_user_id');
    setActiveTab('discover');
    showToast('info', 'Logged Out', 'You have been securely signed out. See you soon!');
  };

  // Registration Transactions
  const handleRegisterEvent = (eventId: string, reminderSet?: boolean) => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('info', 'Authentication Required', 'Please sign in to register for college events.');
      return;
    }

    const result = registerForEvent(currentUser.id, eventId, reminderSet);
    if (result.success && result.registration) {
      reloadDb();
      if (reminderSet) {
        showToast('success', 'Registration & Reminder Set!', `Seat reserved for ${result.registration.eventTitle}! An asynchronous background scheduler has successfully programmed SMS & Email reminders.`);
      } else {
        showToast('success', 'Registration Confirmed!', `Seat reserved successfully for ${result.registration.eventTitle}! Your ticket has been generated.`);
      }
    } else {
      showToast('error', 'Registration Failed', result.error || 'Unable to book seat.');
    }
  };

  const handleCancelRegistration = (eventId: string) => {
    if (!currentUser) return;

    const result = cancelRegistration(currentUser.id, eventId);
    if (result.success) {
      reloadDb();
      showToast('warning', 'Booking Cancelled', 'Your ticket reservation has been cancelled. Seat returned to general pool.');
      if (selectedTicket?.event.id === eventId) {
        setSelectedTicket(null);
      }
    } else {
      showToast('error', 'Cancellation Error', result.error || 'Failed to cancel reservation.');
    }
  };

  // Admin CRUD Handlers
  const handleCreateEvent = (eventData: Omit<CollegeEvent, 'id' | 'seatsLeft' | 'createdAt'>) => {
    createEvent(eventData);
    reloadDb();
  };

  const handleUpdateEvent = (eventId: string, updatedFields: Partial<CollegeEvent>) => {
    updateEvent(eventId, updatedFields);
    reloadDb();
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    reloadDb();
    showToast('warning', 'Event Deleted', 'The event was removed from the schedule. Associated registrations cancelled.');
  };

  const handleCreateAnnouncement = (annData: Omit<Announcement, 'id' | 'createdAt'>) => {
    createAnnouncement(annData);
    reloadDb();
  };

  const handleDeleteAnnouncement = (id: string) => {
    deleteAnnouncement(id);
    reloadDb();
    showToast('info', 'Notice Archiving', 'Announcement has been taken down.');
  };

  const handleUpdateProfile = (userId: string, updatedFields: Partial<User>) => {
    const result = updateUserProfile(userId, updatedFields);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      reloadDb();
    }
  };

  // Recommendation System Logic
  const getRecommendedEvents = () => {
    if (!currentUser) return [];

    // Confirmed registrations for current student
    const confirmedRegs = db.registrations.filter(
      r => r.userId === currentUser.id && r.status === 'confirmed'
    );
    const registeredEventIds = confirmedRegs.map(r => r.eventId);

    // 1. Preferred Categories from previous registrations
    const attendedEvents = db.events.filter(e => registeredEventIds.includes(e.id));
    const preferredCategories = Array.from(new Set(attendedEvents.map(e => e.category)));

    // 2. Department Affiliation
    const dept = currentUser.department || '';

    // Consider unpublished or already registered events out
    const candidateEvents = db.events.filter(
      e => e.published && !registeredEventIds.includes(e.id)
    );

    // Score events
    const scoredCandidates = candidateEvents.map(event => {
      let score = 0;

      // Match previously attended categories
      if (preferredCategories.includes(event.category)) {
        score += 3;
      }

      // Match department keyword in title, description, category or tags
      if (dept) {
        const lowerDept = dept.toLowerCase();
        const inTitle = event.title.toLowerCase().includes(lowerDept);
        const inDesc = event.description.toLowerCase().includes(lowerDept);
        const inCategory = event.category.toLowerCase().includes(lowerDept);
        const inTags = event.tags && event.tags.some(tag => tag.toLowerCase().includes(lowerDept));

        if (inTitle) score += 4;
        if (inDesc) score += 2;
        if (inCategory) score += 3;
        if (inTags) score += 4;
      }

      // Match custom tags of previously attended events
      const attendedTags = Array.from(new Set(attendedEvents.flatMap(e => e.tags || [])));
      if (event.tags && event.tags.some(tag => attendedTags.includes(tag))) {
        score += 2;
      }

      return { event, score };
    });

    // Return only candidate events with positive recommendation scores, sorted descending
    return scoredCandidates
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.event);
  };

  // Event Searching and Sorting Logic
  const filteredEvents = db.events.filter(event => {
    if (!event.published) return false;

    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          event.venue.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    
    let matchesAvailability = true;
    if (availabilityFilter === 'available') {
      matchesAvailability = event.seatsLeft > 0;
    } else if (availabilityFilter === 'full') {
      matchesAvailability = event.seatsLeft <= 0;
    }

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  // Active user's registrations mapped for quick lookup
  const userRegistrationMap = db.registrations.reduce((acc, r) => {
    if (currentUser && r.userId === currentUser.id && r.status === 'confirmed') {
      acc[r.eventId] = r;
    }
    return acc;
  }, {} as Record<string, Registration>);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50/10 dark:bg-slate-950/10 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative theme-${theme}`}>
      
      {/* Dynamic Immersive Background Related to College Events */}
      <EventBackground activeCategory={activeTab === 'discover' ? categoryFilter : 'all'} theme={theme} />
      
      {/* 1. NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors h-14 flex items-center shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between h-14 items-center">
            
            {/* Logo Group */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('discover')}>
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-xs">
                U
              </div>
              <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-white">
                UniPortal
              </span>
              <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-wider font-mono">
                Academic
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-1.5">
              {[
                { id: 'discover', label: 'Discover Events', icon: Compass },
                { id: 'calendar', label: 'College Calendar', icon: CalendarIcon },
                { id: 'favorites', label: 'Saved Favorites', icon: Heart },
                { id: 'announcements', label: 'Notice Board', icon: Megaphone },
                { id: 'analytics', label: 'Insight Charts', icon: TrendingUp }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    id={`nav-tab-${tab.id}`}
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Side Tools & Session Panel */}
            <div className="flex items-center space-x-3">
              {/* Multi-mode Theme Menu Selector */}
              <div className="relative">
                <button
                  id="theme-select-toggle-btn"
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  title="Choose Style Theme"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md transition-colors flex items-center space-x-1"
                >
                  {theme === 'light' && <Sun className="h-4.5 w-4.5 text-amber-500 animate-in duration-500" />}
                  {theme === 'dark' && <Moon className="h-4.5 w-4.5 text-blue-400 animate-in duration-500" />}
                  {theme === 'neon' && <Sparkles className="h-4.5 w-4.5 text-pink-500 animate-pulse" />}
                  {theme === 'forest' && <span className="text-sm">🍃</span>}
                  {theme === 'sepia' && <span className="text-sm">📜</span>}
                  <span className="text-[10px] hidden sm:inline font-mono uppercase tracking-tight text-slate-400">
                    {theme}
                  </span>
                </button>

                {showThemeMenu && (
                  <>
                    {/* Backdrop to dismiss */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 text-xs text-slate-900 dark:text-white">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-800 mb-1">
                        Select Theme
                      </div>
                      {[
                        { id: 'light', name: 'Light Mode', icon: Sun, color: 'bg-amber-500', emoji: null, desc: 'Default light theme' },
                        { id: 'dark', name: 'Slate Dark', icon: Moon, color: 'bg-slate-850', emoji: null, desc: 'Default dark theme' },
                        { id: 'neon', name: 'Midnight Neon', icon: Sparkles, color: 'bg-pink-500', emoji: null, desc: 'Electric cyber glow' },
                        { id: 'forest', name: 'Green Campus', icon: null, emoji: '🍃', color: 'bg-emerald-600', desc: 'Tranquil organic forest' },
                        { id: 'sepia', name: 'Warm Editorial', icon: null, emoji: '📜', color: 'bg-amber-700', desc: 'Classic vintage paper' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setIsAutoTimeTheme(false);
                            changeTheme(item.id as any);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-start space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                            theme === item.id && !isAutoTimeTheme ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.color} text-white text-[10px]`}>
                            {item.icon ? <item.icon className="h-3 w-3" /> : <span>{item.emoji}</span>}
                          </div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-[9px] text-slate-400 leading-tight font-normal">{item.desc}</div>
                          </div>
                        </button>
                      ))}

                      <div className="p-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAutoTimeTheme(!isAutoTimeTheme);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold flex items-center justify-between transition-colors ${
                            isAutoTimeTheme ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center space-x-1.5">
                            <span>⏰ Auto Time-of-Day</span>
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isAutoTimeTheme ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {isAutoTimeTheme ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Session Buttons */}
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  {currentUser.role === 'admin' && (
                    <button
                      id="nav-tab-admin"
                      onClick={() => setActiveTab('admin')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center space-x-1 transition-all ${
                        activeTab === 'admin'
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Admin Cockpit</span>
                    </button>
                  )}

                  <button
                    id="nav-tab-profile"
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center space-x-2 p-1 pr-3 rounded-full border transition-all ${
                      activeTab === 'profile'
                        ? 'border-blue-500 bg-blue-50/10 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full ${currentUser.avatarColor || 'bg-blue-600'} flex items-center justify-center text-white text-xs font-bold uppercase`}>
                      {currentUser.name.slice(0, 2)}
                    </div>
                    <span className="text-xs font-bold hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
                  </button>

                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    title="Log Out"
                    className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="nav-signin-btn"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Sign In
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Nav Sticky Rail for smaller devices */}
      <div className="flex md:hidden sticky top-14 z-30 bg-white/90 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 px-4 py-2 select-none scrollbar-none">
        {[
          { id: 'discover', label: 'Discover', icon: Compass },
          { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
          { id: 'favorites', label: 'Favorites', icon: Heart },
          { id: 'announcements', label: 'Notices', icon: Megaphone },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              id={`nav-mob-${tab.id}`}
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
              className={`px-3.5 py-1 text-xs font-bold rounded-full flex items-center space-x-1 flex-shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 bg-slate-50 dark:bg-slate-800/40 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. HERO HEADER SECTION (Only visible on Events Discover stream) */}
      {activeTab === 'discover' && (
        <div className="relative overflow-hidden bg-slate-900 dark:bg-black py-16 px-4 text-center border-b border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.15),transparent_50%)]"></div>
          
          <div className="max-w-3xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-xs text-blue-400 font-semibold mb-2">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
              <span>Academic Year 2026/2027 Portal</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Campus Events & Discoveries
            </h1>
            
            <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              Discover student club hackathons, annual sports, guest academic webinars, and cultural fusion nights. Book your ticket instantly.
            </p>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <main className="flex-grow container-xl max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* TAB 1: DISCOVER EVENTS LIST */}
        {activeTab === 'discover' && (
          <div className="space-y-6">

            {/* RECOMMENDED FOR YOU SECTION */}
            <div className="bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 dark:from-amber-500/10 dark:via-transparent dark:to-blue-500/10 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/80 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl shadow-xs border border-amber-100/50 dark:border-amber-950/50">
                    <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest font-mono">Recommended For You</h2>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Hyper-personalized campus matches based on your major department & previous events</p>
                  </div>
                </div>
              </div>

              {!currentUser ? (
                <div className="bg-white/80 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                    Log in to automatically match with student groups, required lectures, major hackathons, and activities matching your academic goals.
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-md active:scale-95"
                  >
                    <span>Sign In to Unlock Recommendations</span>
                  </button>
                </div>
              ) : (() => {
                const recommended = getRecommendedEvents();
                if (recommended.length > 0) {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                      {recommended.map(event => (
                        <div key={`rec-${event.id}`} className="relative group rounded-3xl border border-amber-200/40 dark:border-amber-900/30 overflow-hidden shadow-xs bg-white dark:bg-slate-900">
                          {/* Recommended Ribbon Overlay */}
                          <div className="absolute top-3.5 left-3.5 z-10 px-2.5 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[8px] uppercase tracking-widest flex items-center space-x-1 shadow-sm">
                            <Sparkles className="h-2.5 w-2.5 animate-bounce" />
                            <span>Department & Category Match</span>
                          </div>
                          
                          <EventCard
                            event={event}
                            user={currentUser}
                            registration={userRegistrationMap[event.id] || null}
                            onRegister={handleRegisterEvent}
                            onCancelRegistration={handleCancelRegistration}
                            onDelete={currentUser?.role === 'admin' ? handleDeleteEvent : undefined}
                            onShowTicket={(reg, evt) => setSelectedTicket({ reg, event: evt })}
                            onToast={showToast}
                            isFavorited={favoritedEventIds.includes(event.id)}
                            onToggleFavorite={handleToggleFavorite}
                          />
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-white/80 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Unlock Smarter Activity Matches</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-xl">
                          Register for your first campus event or head to your profile to specify your department major. Our matching engine will instantly scan active timetables.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
                      >
                        Configure Major Dept
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
            
            {/* Faceted Filtering & Search Panel */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center">
              
              {/* Search Bar */}
              <div className="relative w-full md:flex-grow">
                <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="event-search-input"
                  type="text"
                  placeholder="Search events by name, location, keyword..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                />
              </div>

              {/* Advanced Filter Slates */}
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                {/* Category Dropdown */}
                <div className="relative">
                  <select
                    id="event-category-filter"
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-44 px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white font-medium"
                  >
                    <option value="all">📁 All Categories</option>
                    <option value="Technical">💻 Technical</option>
                    <option value="Cultural">🎭 Cultural</option>
                    <option value="Sports">🏀 Sports</option>
                    <option value="Workshop">🛠️ Workshops</option>
                    <option value="Academic">📚 Academic</option>
                    <option value="Seminar">🎤 Seminars</option>
                  </select>
                </div>

                {/* Seating Availability filter */}
                <div className="relative">
                  <select
                    id="event-avail-filter"
                    value={availabilityFilter}
                    onChange={(e) => { setAvailabilityFilter(e.target.value as any); setCurrentPage(1); }}
                    className="w-full sm:w-40 px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white font-medium"
                  >
                    <option value="all">👥 Seat Availability</option>
                    <option value="available">Seats Available</option>
                    <option value="full">Fully Booked</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Events Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {paginatedEvents.map(event => (
                <div key={event.id} id={`event-card-${event.id}`} className="transition-all duration-300 rounded-2xl">
                  <EventCard
                    event={event}
                    user={currentUser}
                    registration={userRegistrationMap[event.id] || null}
                    onRegister={handleRegisterEvent}
                    onCancelRegistration={handleCancelRegistration}
                    onDelete={currentUser?.role === 'admin' ? handleDeleteEvent : undefined}
                    onShowTicket={(reg, evt) => setSelectedTicket({ reg, event: evt })}
                    onToast={showToast}
                    isFavorited={favoritedEventIds.includes(event.id)}
                    onToggleFavorite={handleToggleFavorite}
                    isHighlighted={deepLinkedEventId === event.id}
                  />
                </div>
              ))}
            </div>

            {/* Empty Search Fallback */}
            {filteredEvents.length === 0 && (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Search className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No events matched your filters</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Try adjusting your search criteria, selecting another category, or reset filters to view all listings.
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-3 pt-4 border-t border-slate-100 dark:border-slate-900">
                <button
                  id="pagination-prev-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 text-slate-500 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-slate-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  id="pagination-next-btn"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 text-slate-500 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 1.5: SAVED FAVORITES */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <div className="space-y-1 mb-2">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Your Saved Favorites</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Quickly monitor schedule changes and fast bookings for your shortlisted campus events.</p>
            </div>

            {db.events.filter(e => e.published && favoritedEventIds.includes(e.id)).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {db.events
                  .filter(event => event.published && favoritedEventIds.includes(event.id))
                  .map(event => (
                    <div key={event.id}>
                      <EventCard
                        event={event}
                        user={currentUser}
                        registration={userRegistrationMap[event.id] || null}
                        onRegister={handleRegisterEvent}
                        onCancelRegistration={handleCancelRegistration}
                        onDelete={currentUser?.role === 'admin' ? handleDeleteEvent : undefined}
                        onShowTicket={(reg, evt) => setSelectedTicket({ reg, event: evt })}
                        onToast={showToast}
                        isFavorited={true}
                        onToggleFavorite={handleToggleFavorite}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Heart className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-bold">No saved events yet</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto mb-4 font-medium">
                  Tap the heart icon on any event card to save it here for fast monitoring.
                </p>
                <button
                  id="go-discover-btn"
                  onClick={() => setActiveTab('discover')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Explore Campus Events
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="space-y-1 mb-2">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Academic & Social Calendar</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Select any day to browse what is scheduled or check timings.</p>
            </div>
            <CalendarView
              events={db.events}
              onSelectEvent={(evt) => {
                setActiveTab('discover');
                setSearchTerm(evt.title);
              }}
            />
          </div>
        )}

        {/* TAB 3: CAMPUS NOTICE BOARD */}
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            <div className="space-y-1 mb-2">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Dean notice Board</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Official, verified campus updates, examination notices, and sports logs.</p>
            </div>
            <AnnouncementsList
              announcements={db.announcements}
              isAdmin={currentUser?.role === 'admin'}
              onDeleteAnnouncement={handleDeleteAnnouncement}
            />
          </div>
        )}

        {/* TAB 4: METRIC CHARTS & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="space-y-1 mb-2">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Campus Portal Statistics</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Real-time attendance ratio, category distribution, and sports booking spikes.</p>
            </div>
            <AnalyticsDashboard
              events={db.events}
              registrations={db.registrations}
              users={db.users}
              announcements={db.announcements}
            />
          </div>
        )}

        {/* TAB 5: STUDENT PROFILE */}
        {activeTab === 'profile' && currentUser && (
          <UserProfile
            user={currentUser}
            registrations={db.registrations}
            events={db.events}
            onUpdateProfile={handleUpdateProfile}
            onCancelRegistration={handleCancelRegistration}
            onToast={showToast}
          />
        )}

        {/* TAB 6: ADMIN COCKPIT */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="space-y-4">
            <div className="space-y-1 mb-2">
              <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Administrator Dashboard</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium text-rose-500">Full control panel to program lectures, sports meets, and verify registrants.</p>
            </div>
            <AdminPanel
              events={db.events}
              announcements={db.announcements}
              registrations={db.registrations}
              users={db.users}
              loginLogs={db.loginLogs}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onCreateAnnouncement={handleCreateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onAdminCancelRegistration={refreshDbState}
              onToast={showToast}
            />
          </div>
        )}

      </main>

      {/* FOOTER METADATA */}
      <footer className="mt-auto border-t border-slate-100 dark:border-slate-900 py-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div>© 2026 Campus Tech Inc. All rights reserved.</div>
        </div>
      </footer>

      {/* --- FLOATING TOASTS NOTIFIER --- */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className={`p-4 rounded-xl border shadow-lg flex flex-col text-left cursor-pointer ${
                toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-850 dark:text-emerald-400' :
                toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40 text-rose-850 dark:text-rose-400' :
                toast.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40 text-amber-850 dark:text-amber-400' :
                'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-350'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider">{toast.title}</span>
                <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-slate-400 hover:text-slate-600">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-[11px] font-semibold mt-1 opacity-90">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- AUTH MODAL OVERLAY --- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md"
            >
              {/* Close Button on top of Auth */}
              <button
                id="close-auth-modal-btn"
                onClick={() => setShowAuthModal(false)}
                className="absolute right-4 top-4 z-20 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <AuthModal
                onLoginSuccess={handleLoginSuccess}
                onToast={showToast}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DETAILED FLOATING TICKET RECEIPT OVERLAY --- */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 overflow-hidden shadow-2xl p-6 space-y-6 text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Ticket className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-slate-950 dark:text-white">Active Boarding Pass</span>
                </div>
                <button
                  id="close-ticket-overlay-btn"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Boarding Pass layout */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/30 flex flex-col">
                <div className="p-5 space-y-4 flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] uppercase">
                      {selectedTicket.event.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">UNIPORTAL TICKET</span>
                  </div>

                  <h3 className="text-lg font-black text-slate-950 dark:text-white leading-snug">
                    {selectedTicket.event.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Scheduled Date</span>
                      <p className="font-semibold text-slate-950 dark:text-white">{new Date(selectedTicket.event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Time Clock</span>
                      <p className="font-semibold text-slate-950 dark:text-white">{selectedTicket.event.time} Hrs</p>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Campus Venue</span>
                      <p className="font-semibold text-slate-950 dark:text-white">{selectedTicket.event.venue}</p>
                    </div>
                  </div>
                </div>

                {/* Tear outline */}
                <div className="relative flex py-1 items-center">
                  <div className="absolute left-[-8px] w-4 h-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-full z-10"></div>
                  <div className="flex-grow border-t-2 border-dashed border-slate-200 dark:border-slate-800"></div>
                  <div className="absolute right-[-8px] w-4 h-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-full z-10"></div>
                </div>

                {/* Bottom Pass tear details with Mock QR code */}
                <div className="p-5 flex flex-col sm:flex-row items-center justify-between bg-slate-100/30 dark:bg-slate-950/50 gap-4">
                  <div className="space-y-1.5 text-center sm:text-left">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Attendee student</span>
                      <p className="text-xs font-bold text-slate-950 dark:text-white">{currentUser?.name}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Branch affiliation</span>
                      <p className="text-xs font-medium text-slate-500">{currentUser?.department || 'General department'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-1">
                    <svg className="w-14 h-14 text-slate-900 dark:text-slate-100" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="0" y="0" width="6" height="6" />
                      <rect x="18" y="0" width="6" height="6" />
                      <rect x="0" y="18" width="6" height="6" />
                      <rect x="8" y="8" width="8" height="8" />
                      <rect x="2" y="8" width="2" height="4" />
                      <rect x="14" y="2" width="2" height="4" />
                      <rect x="20" y="8" width="2" height="4" />
                      <rect x="8" y="20" width="4" height="2" />
                    </svg>
                    <span className="text-[9px] font-mono text-slate-400">{selectedTicket.reg.ticketQRValue}</span>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap justify-end gap-2">
                <a
                  id="add-to-google-calendar-btn"
                  href={getGoogleCalendarUrl(selectedTicket.event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setIsTicketCalendarAdded(true);
                    showToast('success', 'Syncing Event', 'Generating Google Calendar pre-filled invite...');
                    setTimeout(() => setIsTicketCalendarAdded(false), 4000);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <AnimatePresence mode="wait">
                    {isTicketCalendarAdded ? (
                      <motion.span
                        key="added"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center space-x-1"
                      >
                        <motion.span
                          initial={{ rotate: -90, scale: 0.5 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        >
                          <Check className="h-4 w-4 stroke-[3px]" />
                        </motion.span>
                        <span>Added to Calendar!</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="add"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center space-x-1.5"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        <span>Add to Calendar</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </a>
                <button
                  id="print-pass-btn"
                  onClick={() => {
                    showToast('info', 'Exporting Pass', 'Formatting boarding ticket and initializing PDF dispatch...');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Download Pass</span>
                </button>
                <button
                  id="cancel-pass-btn"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
