import React, { useState } from 'react';
import { CollegeEvent, Announcement, Registration } from '../types';
import { PlusCircle, Megaphone, Edit3, Trash2, Users, Search, Calendar, MapPin, Tag, Sparkles, Filter, CheckCircle2, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  events: CollegeEvent[];
  announcements: Announcement[];
  registrations: Registration[];
  onCreateEvent: (eventData: Omit<CollegeEvent, 'id' | 'seatsLeft' | 'createdAt'>) => void;
  onUpdateEvent: (eventId: string, updatedFields: Partial<CollegeEvent>) => void;
  onDeleteEvent: (eventId: string) => void;
  onCreateAnnouncement: (announcementData: Omit<Announcement, 'id' | 'createdAt'>) => void;
  onDeleteAnnouncement: (id: string) => void;
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
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onToast,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'announcements' | 'registrations'>('events');

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

    </div>
  );
}
