import React, { useState } from 'react';
import { CollegeEvent, Announcement, Registration, User, LoginLog } from '../types';
import { getDbState, adminCancelRegistration } from '../utils/db';
import { PlusCircle, Megaphone, Edit3, Trash2, Users, Search, Calendar, MapPin, Tag, Sparkles, Filter, CheckCircle2, XCircle, X, Clock, UserCheck, ShieldAlert, UserX, Eye, BookOpen, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  events: CollegeEvent[];
  announcements: Announcement[];
  registrations: Registration[];
  users?: User[];
  loginLogs?: LoginLog[];
  onCreateEvent: (eventData: Omit<CollegeEvent, 'id' | 'seatsLeft' | 'createdAt'>) => void;
  onUpdateEvent: (eventId: string, updatedFields: Partial<CollegeEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
  onCreateAnnouncement: (announcementData: Omit<Announcement, 'id' | 'createdAt'>) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAdminCancelRegistration?: (registrationId: string) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

// Preset banner images that fit the categories perfectly
const PRESET_BANNERS = [
  { name: 'Hackathon / Coding', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Concert / Fest / Cultural', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
  { name: 'AI / Tech Workshop', url: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Sports / Court', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Seminar / Academic / Study', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Creative Arts / Drama', url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80' }
];

const PRESET_TAGS = ['Required', 'Fundraiser', 'Social', 'Free Food', 'Networking', 'Volunteering', 'Competition', 'Seminar', 'Interactive'];

export default function AdminPanel({
  events,
  announcements,
  registrations,
  users = [],
  loginLogs = [],
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onAdminCancelRegistration,
  onToast,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'announcements' | 'registrations' | 'roster'>('events');

  // Event creation form state
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventCategory, setEventCategory] = useState<'Technical' | 'Cultural' | 'Sports' | 'Academic' | 'Workshop' | 'Seminar'>('Technical');
  const [eventDeadline, setEventDeadline] = useState('');
  const [eventCapacity, setEventCapacity] = useState(100);
  const [eventBanner, setEventBanner] = useState(PRESET_BANNERS[0].url);
  const [eventTags, setEventTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Announcement form state
  const [isAnnFormOpen, setIsAnnFormOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'important' | 'general' | 'academic' | 'sports' | 'culture'>('general');

  // Registrations table search & filter
  const [regSearch, setRegSearch] = useState('');
  const [regEventFilter, setRegEventFilter] = useState('all');

  // Student Roster & Logins state
  const [rosterSearch, setRosterSearch] = useState('');
  const [selectedStudentProfile, setSelectedStudentProfile] = useState<User | null>(null);

  // Tag helper functions
  const handleAddPresetTag = (tag: string) => {
    if (!eventTags.includes(tag)) {
      setEventTags([...eventTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    // Capitalize first letter for visual consistency
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (!eventTags.includes(formatted)) {
      setEventTags([...eventTags, formatted]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEventTags(eventTags.filter(t => t !== tagToRemove));
  };

  const handleEditClick = (event: CollegeEvent) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDesc(event.description);
    setEventDate(event.date);
    setEventTime(event.time);
    setEventVenue(event.venue);
    setEventCategory(event.category);
    setEventDeadline(event.deadline);
    setEventCapacity(event.capacity);
    setEventBanner(event.bannerImage);
    setEventTags(event.tags || []);
    setIsEventFormOpen(true);
  };

  const handleEventFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDesc || !eventDate || !eventTime || !eventVenue || !eventDeadline) {
      onToast('error', 'Missing Data', 'Please fill in all the required event fields.');
      return;
    }

    if (eventDeadline > eventDate) {
      onToast('error', 'Invalid Deadline', 'Registration deadline must be before or equal to the event date.');
      return;
    }

    const eventPayload = {
      title: eventTitle,
      description: eventDesc,
      date: eventDate,
      time: eventTime,
      venue: eventVenue,
      category: eventCategory,
      deadline: eventDeadline,
      capacity: Number(eventCapacity),
      bannerImage: eventBanner,
      organizerId: 'usr_admin',
      published: true,
      tags: eventTags,
    };

    if (editingEventId) {
      onUpdateEvent(editingEventId, eventPayload);
      onToast('success', 'Event Updated', 'Event edited successfully!');
    } else {
      onCreateEvent(eventPayload);
      onToast('success', 'Event Created', 'New college event published successfully!');
    }

    resetEventForm();
  };

  const resetEventForm = () => {
    setIsEventFormOpen(false);
    setEditingEventId(null);
    setEventTitle('');
    setEventDesc('');
    setEventDate('');
    setEventTime('');
    setEventVenue('');
    setEventCategory('Technical');
    setEventDeadline('');
    setEventCapacity(100);
    setEventBanner(PRESET_BANNERS[0].url);
    setEventTags([]);
    setTagInput('');
  };

  const handleAnnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      onToast('error', 'Fields Required', 'Please enter a headline and context for the notice.');
      return;
    }

    onCreateAnnouncement({
      title: annTitle,
      content: annContent,
      category: annCategory,
      date: new Date().toISOString().split('T')[0],
      postedBy: 'Dean of Student Affairs',
    });

    onToast('success', 'Announcement Published', 'Notification dispatched to student board!');
    setAnnTitle('');
    setAnnContent('');
    setAnnCategory('general');
    setIsAnnFormOpen(false);
  };

  // Filter registrations
  const filteredRegs = registrations.filter(reg => {
    const matchesSearch = reg.userName.toLowerCase().includes(regSearch.toLowerCase()) || 
                          reg.userEmail.toLowerCase().includes(regSearch.toLowerCase()) ||
                          reg.eventTitle.toLowerCase().includes(regSearch.toLowerCase());
    const matchesEvent = regEventFilter === 'all' || reg.eventId === regEventFilter;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation Headers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex space-x-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          <button
            id="admin-tab-events"
            onClick={() => setActiveTab('events')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'events'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Manage Events
          </button>
          <button
            id="admin-tab-announcements"
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'announcements'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Notice Board
          </button>
          <button
            id="admin-tab-registrations"
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'registrations'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Attendee Registers ({registrations.filter(r => r.status === 'confirmed').length})
          </button>
          <button
            id="admin-tab-roster"
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'roster'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Students & Logins ({users.filter(u => u.role === 'student').length})</span>
          </button>
        </div>

        {activeTab === 'events' && (
          <button
            id="btn-add-event-toggle"
            onClick={() => { resetEventForm(); setIsEventFormOpen(true); }}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Event</span>
          </button>
        )}

        {activeTab === 'announcements' && (
          <button
            id="btn-add-ann-toggle"
            onClick={() => setIsAnnFormOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Megaphone className="h-4 w-4" />
            <span>Publish Notice</span>
          </button>
        )}
      </div>

      {/* --- Tab Content: EVENTS --- */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Create / Edit Form Overlay */}
          <AnimatePresence>
            {isEventFormOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingEventId ? 'Edit College Event' : 'Publish New College Event'}
                  </h3>
                </div>

                <form onSubmit={handleEventFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Event Name / Title</label>
                      <input
                        id="form-event-title"
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="e.g. Annual Chess Championship"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Category Domain</label>
                      <select
                        id="form-event-category"
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white font-medium"
                      >
                        <option value="Technical">💻 Technical Event</option>
                        <option value="Cultural">🎭 Cultural Fusion / Fest</option>
                        <option value="Sports">🏀 Sports Tournament</option>
                        <option value="Workshop">🛠️ Hands-on Workshop</option>
                        <option value="Academic">📚 Lecture / Seminar</option>
                        <option value="Seminar">🎤 Research Colloquium</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Detailed Description</label>
                    <textarea
                      id="form-event-desc"
                      rows={3}
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder="Explain event activities, requirements, timeline, pre-requisites..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white resize-none"
                      required
                    />
                  </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Scheduled Date</label>
                        <input
                          id="form-event-date"
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Time (HH:MM)</label>
                        <input
                          id="form-event-time"
                          type="time"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Venue Location</label>
                        <input
                          id="form-event-venue"
                          type="text"
                          value={eventVenue}
                          onChange={(e) => setEventVenue(e.target.value)}
                          placeholder="e.g. Auditorium C"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Capacity Seats</label>
                        <input
                          id="form-event-capacity"
                          type="number"
                          min={5}
                          max={1000}
                          value={eventCapacity}
                          onChange={(e) => setEventCapacity(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Registration Cut-off Deadline</label>
                        <input
                          id="form-event-deadline"
                          type="date"
                          value={eventDeadline}
                          onChange={(e) => setEventDeadline(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Select Theme Banner Image</label>
                        <select
                          id="form-event-banner-select"
                          value={eventBanner}
                          onChange={(e) => setEventBanner(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                        >
                        {PRESET_BANNERS.map(banner => (
                          <option key={banner.url} value={banner.url}>{banner.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Event Tags Multi-select / Custom Tagging System */}
                  <div className="space-y-2 border-t border-dashed border-slate-200 dark:border-slate-800 pt-3">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">Event Tags & Keywords</label>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Add custom tags (e.g., 'Required', 'Fundraiser', 'Social') to help students search and filter campus events.</p>
                    
                    {/* Selected tags */}
                    <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                      {eventTags.length > 0 ? (
                        eventTags.map(tag => (
                          <span key={tag} className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase rounded-full border border-blue-100/35 dark:border-blue-950/50">
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors rounded-full focus:outline-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No tags selected yet. Pick from recommendations below or type a custom tag.</span>
                      )}
                    </div>

                    {/* Custom Add tag input & Preset Quick Picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Custom Input */}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Type custom tag (e.g. Social, Required)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomTag();
                            }
                          }}
                          className="flex-grow px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-950 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomTag}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-350 rounded-lg text-xs font-semibold shrink-0 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          Add Tag
                        </button>
                      </div>

                      {/* Preset recommendations */}
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">Suggestions:</span>
                        {PRESET_TAGS.map(tag => {
                          const isSelected = eventTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              disabled={isSelected}
                              onClick={() => handleAddPresetTag(tag)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                isSelected 
                                  ? 'bg-slate-150 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-400 dark:hover:text-blue-400 cursor-pointer'
                              }`}
                            >
                              +{tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <button
                      id="form-event-submit"
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
                    >
                      {editingEventId ? 'Save Event Settings' : 'Publish College Event'}
                    </button>
                    <button
                      id="form-event-cancel"
                      type="button"
                      onClick={resetEventForm}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick list of events for Admin controls */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="p-4">Title / Event Details</th>
                  <th className="p-4">Logistics</th>
                  <th className="p-4">Seating Capacity</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-slate-950 dark:text-white">{event.title}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">{event.date}</span>
                        <span className="text-[10px] text-slate-400">{event.venue}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">
                      {event.capacity - event.seatsLeft} / {event.capacity} seats taken
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium text-[10px]">
                          {event.category}
                        </span>
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {event.tags.map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 rounded bg-blue-50/60 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold text-[8px] uppercase tracking-wider">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-1.5">
                        <button
                          id={`btn-table-edit-${event.id}`}
                          onClick={() => handleEditClick(event)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                          title="Edit Event"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-table-delete-${event.id}`}
                          onClick={() => onDeleteEvent(event.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Delete Event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">
                      No events currently created on the college server. Click "Create Event" to publish.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Tab Content: ANNOUNCEMENTS --- */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <AnimatePresence>
            {isAnnFormOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish Notice Board Announcement</h3>
                </div>

                <form onSubmit={handleAnnSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Notice Headline</label>
                      <input
                        id="form-ann-title"
                        type="text"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="e.g. library Closure for Renovation"
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Signatory Section</label>
                      <select
                        id="form-ann-category"
                        value={annCategory}
                        onChange={(e) => setAnnCategory(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white font-medium"
                      >
                        <option value="general">📢 General Notice</option>
                        <option value="important">🚨 EMERGENCY / Urgent Notice</option>
                        <option value="academic">📚 Academic & Examinations</option>
                        <option value="sports">🏀 Sports Board news</option>
                        <option value="culture">🎭 Cultural Society notice</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Notification Context</label>
                    <textarea
                      id="form-ann-content"
                      rows={4}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Write complete notice brief, instructions, contact details..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      id="form-ann-submit"
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg"
                    >
                      Publish Notice
                    </button>
                    <button
                      id="form-ann-cancel"
                      type="button"
                      onClick={() => setIsAnnFormOpen(false)}
                      className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="p-4">Notice Headline</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Date Posted</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                {announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-slate-950 dark:text-white max-w-xs truncate">{ann.title}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                        ann.category === 'important' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {ann.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-500">{ann.date}</td>
                    <td className="p-4 text-right">
                      <button
                        id={`btn-notice-delete-${ann.id}`}
                        onClick={() => onDeleteAnnouncement(ann.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-slate-400">
                      No notices posted. Click "Publish Notice" to pin an alert.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Tab Content: REGISTRATIONS --- */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                id="reg-search-filter"
                type="text"
                placeholder="Search attendees, email, or event title..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                id="reg-event-select-filter"
                value={regEventFilter}
                onChange={(e) => setRegEventFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 dark:text-white"
              >
                <option value="all">All Events</option>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="p-4">Student Attendee</th>
                  <th className="p-4">Event Details</th>
                  <th className="p-4">Registration Code</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Date Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                {filteredRegs.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-950 dark:text-white">{reg.userName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{reg.userEmail}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-950 dark:text-white">{reg.eventTitle}</span>
                        <span className="text-[10px] text-slate-400">{reg.eventVenue} • {reg.eventDate}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-500">{reg.ticketQRValue}</td>
                    <td className="p-4">
                      {reg.status === 'confirmed' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold text-[9px] uppercase flex items-center space-x-1 w-fit">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 font-bold text-[9px] uppercase flex items-center space-x-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          <span>Cancelled</span>
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      {new Date(reg.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}

                {filteredRegs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">
                      No matching registrants found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- Tab Content: STUDENT ROSTER & LOGIN LOGS --- */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Header Search */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                id="roster-search-input"
                type="text"
                placeholder="Search students by name, email, department, or roll number..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Students Roster & Activity</h3>
              </div>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="p-3">Student Info</th>
                    <th className="p-3">Department & Roll</th>
                    <th className="p-3">Last Logged In</th>
                    <th className="p-3">Registered Events & Admin Revoke</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {users
                    .filter(u => u.role === 'student')
                    .filter(u => 
                      u.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                      (u.department && u.department.toLowerCase().includes(rosterSearch.toLowerCase())) ||
                      (u.studentId && u.studentId.toLowerCase().includes(rosterSearch.toLowerCase()))
                    )
                    .map((student) => {
                      const studentRegs = registrations.filter(r => r.userId === student.id && r.status === 'confirmed');
                      
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          {/* Student Info */}
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full ${student.avatarColor || 'bg-blue-600'} flex items-center justify-center text-white text-xs font-bold uppercase shrink-0`}>
                                {student.name.slice(0, 2)}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-950 dark:text-white">{student.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{student.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Department & Roll */}
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{student.department || 'General'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{student.studentId || 'N/A'}</span>
                            </div>
                          </td>

                          {/* Last Login Time */}
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5 text-[11px]">
                              <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Never logged in'}
                              </span>
                            </div>
                          </td>

                          {/* Registered Events with Admin Remove button */}
                          <td className="p-3">
                            {studentRegs.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {studentRegs.map(reg => (
                                  <div key={reg.id} className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 rounded-lg text-[10px]">
                                    <span className="font-semibold truncate max-w-[120px]">{reg.eventTitle}</span>
                                    <button
                                      type="button"
                                      title="Remove Student from Event"
                                      onClick={() => {
                                        const res = adminCancelRegistration(reg.id);
                                        if (res.success) {
                                          if (onAdminCancelRegistration) onAdminCancelRegistration(reg.id);
                                          onToast('success', 'Student Removed', `Revoked ${student.name}'s seat for "${reg.eventTitle}". Seat returned to venue pool.`);
                                        } else {
                                          onToast('error', 'Action Failed', res.error || 'Could not remove student');
                                        }
                                      }}
                                      className="p-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950 rounded transition-colors"
                                    >
                                      <UserX className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No active event registrations</span>
                            )}
                          </td>

                          {/* Action Profile Inspector */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedStudentProfile(student)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1 ml-auto"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Inspect Profile</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                  {users.filter(u => u.role === 'student').length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-slate-400">
                        No students enrolled in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Login History Audit Log Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Smartphone className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Recent Login Audit Logs</h4>
            </div>

            <div className="max-h-60 overflow-x-auto overflow-y-auto pr-1">
              {loginLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No login logs recorded yet.</p>
              ) : (
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider rounded-tl-lg">S.No</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider">Role</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider">Mail ID</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider">Device Type</th>
                      <th className="px-3 py-2 font-bold uppercase tracking-wider rounded-tr-lg">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {loginLogs.map((log, index) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{index + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${log.userRole === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}>
                            {log.userRole}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">{log.userName}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">{log.userEmail}</td>
                        <td className="px-3 py-2.5 text-slate-500">{log.deviceInfo || 'Web App'}</td>
                        <td className="px-3 py-2.5 font-semibold text-blue-600 dark:text-blue-400">
                          {new Date(log.loginTime).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Inspector Modal */}
      <AnimatePresence>
        {selectedStudentProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4 text-slate-900 dark:text-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full ${selectedStudentProfile.avatarColor || 'bg-blue-600'} flex items-center justify-center text-white text-lg font-bold uppercase`}>
                    {selectedStudentProfile.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{selectedStudentProfile.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedStudentProfile.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentProfile(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-850 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Department</span>
                  <span className="font-semibold">{selectedStudentProfile.department || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Roll ID</span>
                  <span className="font-semibold font-mono">{selectedStudentProfile.studentId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Enrolled Date</span>
                  <span className="font-semibold">{new Date(selectedStudentProfile.registeredAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Last Active Login</span>
                  <span className="font-semibold">{selectedStudentProfile.lastLoginAt ? new Date(selectedStudentProfile.lastLoginAt).toLocaleString() : 'Never'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bio Brief</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-850 p-3 rounded-xl">
                  {selectedStudentProfile.bio || 'No bio provided yet.'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Event Bookings History</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {registrations.filter(r => r.userId === selectedStudentProfile.id).map(r => (
                    <div key={r.id} className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between text-xs border border-slate-100 dark:border-slate-800">
                      <div className="space-y-0.5">
                        <span className="font-bold block text-slate-950 dark:text-white">{r.eventTitle}</span>
                        <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400">
                          <span>📍 {r.eventVenue}</span>
                          <span>•</span>
                          <span>📅 Scheduled: {r.eventDate}</span>
                        </div>
                        <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-1 pt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>Booked On: {new Date(r.registeredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}

                  {registrations.filter(r => r.userId === selectedStudentProfile.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic">No bookings recorded.</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                Close Profile Inspector
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
