import React, { useState } from 'react';
import { User, Registration, CollegeEvent } from '../types';
import { User as UserIcon, Mail, ShieldAlert, Award, Calendar, QrCode, BookOpen, Edit2, CheckCircle2, Ticket, Printer, MapPin, Clock, CalendarPlus, Share2, Check, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileProps {
  user: User;
  registrations: Registration[];
  events: CollegeEvent[];
  onUpdateProfile: (userId: string, updatedFields: Partial<User>) => void;
  onCancelRegistration: (eventId: string) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export default function UserProfile({
  user,
  registrations,
  events,
  onUpdateProfile,
  onCancelRegistration,
  onToast,
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [department, setDepartment] = useState(user.department || '');
  const [studentId, setStudentId] = useState(user.studentId || '');
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  const activeRegistrations = registrations.filter(r => r.userId === user.id && r.status === 'confirmed');
  const pastEventsCount = registrations.filter(r => r.userId === user.id && r.status === 'confirmed').length; // Simplification

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        onToast('error', 'File Too Large', 'Please upload an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('error', 'Required Field', 'Name cannot be empty.');
      return;
    }

    onUpdateProfile(user.id, {
      name: name.trim(),
      department: department.trim(),
      studentId: studentId.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl,
    });

    setIsEditing(false);
    onToast('success', 'Profile Updated', 'Your profile details have been securely updated!');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Mock a beautiful responsive QR-code SVG grid representation of the ticket!
  const renderMockQR = (value: string, svgId: string) => {
    return (
      <svg id={svgId} className="w-16 h-16 text-slate-800 dark:text-slate-100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="6" height="6" />
        <rect x="18" y="0" width="6" height="6" />
        <rect x="0" y="18" width="6" height="6" />
        <rect x="8" y="8" width="8" height="8" />
        <rect x="2" y="8" width="2" height="4" />
        <rect x="14" y="2" width="2" height="4" />
        <rect x="20" y="8" width="2" height="4" />
        <rect x="8" y="20" width="4" height="2" />
        <rect x="2" y="14" width="4" height="2" />
        <rect x="18" y="18" width="2" height="2" />
        <rect x="22" y="22" width="2" height="2" />
      </svg>
    );
  };

  // Download the QR code as a PNG image
  const downloadQRCode = (svgId: string, ticketValue: string, eventTitle: string) => {
    const svgEl = document.getElementById(svgId) as SVGSVGElement | null;
    if (!svgEl) return;

    const size = 300;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size + 60; // extra space for label
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Serialize SVG and draw to canvas
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      // Draw ticket value label below
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ticketValue, size / 2, size + 20);

      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(eventTitle, size / 2, size + 40);

      // Trigger download
      const link = document.createElement('a');
      link.download = `${ticketValue}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Profile Card & Bio Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit space-y-6">
        <div className="flex flex-col items-center text-center">
          {/* Avatar Sphere */}
          <div className={`relative w-24 h-24 rounded-full ${!user.avatarUrl ? (user.avatarColor || 'bg-blue-600') : 'bg-transparent'} flex items-center justify-center text-white text-3xl font-bold uppercase shadow-inner overflow-hidden border-4 border-white dark:border-slate-800`}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user.name.slice(0, 2)
            )}
          </div>

          <h3 className="text-lg font-bold text-slate-950 dark:text-white mt-4">{user.name}</h3>
          
          <div className="flex items-center space-x-1.5 mt-1 text-slate-400 dark:text-slate-500">
            <Mail className="h-3.5 w-3.5" />
            <span className="text-xs">{user.email}</span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase mt-3">
            {user.role} role
          </span>
        </div>

        {/* Profile Statistics Dashboard */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-xl">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{activeRegistrations.length}</div>
            <div className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">Active Tickets</div>
          </div>
          <div className="text-center border-l border-slate-200/60 dark:border-slate-800">
            <div className="text-lg font-bold text-emerald-500">{pastEventsCount}</div>
            <div className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">All Bookings</div>
          </div>
        </div>

        {/* Bio Edit Section */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Affiliation & Contact</h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {user.department ? `${user.department}` : 'Department not configured'}
                </p>
                {user.studentId && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Roll ID: {user.studentId}</p>
                )}
                {user.phone && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Phone: {user.phone}</p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">About Me</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  {user.bio || '"No bio written yet. Introduce yourself to the college club!"'}
                </p>
              </div>

              <button
                id="btn-edit-profile"
                onClick={() => setIsEditing(true)}
                className="w-full py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Configure Profile</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profile Image</label>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 ${!avatarUrl ? (user.avatarColor || 'bg-blue-600') : 'bg-transparent'} flex items-center justify-center text-white text-sm font-bold uppercase overflow-hidden border border-slate-200 dark:border-slate-700`}>
                    {avatarUrl ? <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" /> : name.slice(0, 2)}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Display Name</label>
                <input
                  id="profile-name-edit"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                <input
                  id="profile-phone-edit"
                  type="tel"
                  value={phone}
                  placeholder="+1 (234) 567-8900"
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              {user.role === 'student' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">College Roll / ID</label>
                    <input
                      id="profile-roll-edit"
                      type="text"
                      value={studentId}
                      placeholder="e.g. CS-2024-048"
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department Branch</label>
                    <input
                      id="profile-dept-edit"
                      type="text"
                      value={department}
                      placeholder="e.g. Mechanical Engineering"
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Student Bio</label>
                <textarea
                  id="profile-bio-edit"
                  rows={3}
                  value={bio}
                  placeholder="Tell us about yourself..."
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  id="profile-save-btn"
                  type="submit"
                  className="flex-grow py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md transition-colors"
                >
                  Save Profile
                </button>
                <button
                  id="profile-cancel-edit-btn"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right 2 Columns: Tickets & Registered Event passes */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center space-x-2">
          <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span>My Registered Event Tickets</span>
        </h3>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {activeRegistrations.map((reg) => {
              const event = events.find(e => e.id === reg.eventId);
              if (!event) return null;

              return (
                <motion.div
                  key={reg.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col md:flex-row bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs relative"
                >
                  {/* Left Side: Ticket Event Banner Info */}
                  <div className="p-5 flex-grow space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold uppercase">
                        {event.category}
                      </span>
                      <span className="text-slate-400 font-semibold">TICKET ID: {reg.ticketQRValue.slice(-8)}</span>
                      {reg.reminderSet && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider text-[8px] border border-emerald-100/50 dark:border-emerald-900/30">
                          <Megaphone className="h-2.5 w-2.5" />
                          <span>Reminder Set</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-950 dark:text-white">{event.title}</h4>

                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>{event.time} Hrs</span>
                      </div>
                      <div className="flex items-center space-x-2 col-span-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400">
                      <div>
                        Attendee: <span className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</span>
                      </div>
                      <div className="flex items-center space-x-1 font-semibold text-blue-600 dark:text-blue-400">
                        <Clock className="h-3 w-3" />
                        <span>Booked On: {new Date(reg.registeredAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {/* Share button */}
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}?event=${event.id}`;
                            navigator.clipboard.writeText(url);
                            onToast('success', 'Link Copied', 'Deep link to this event has been copied to your clipboard!');
                          }}
                          title="Copy Link"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-all"
                        >
                          <Share2 className="h-3 w-3" />
                          Share
                        </button>

                        {/* Add to Calendar button */}
                        <button
                          onClick={() => {
                            const title = event.title;
                            const description = event.description.replace(/\n/g, '\\n');
                            const venue = event.venue;
                            const datePart = event.date.replace(/-/g, '');
                            const timePart = event.time.replace(/:/g, '') + '00';
                            const startDateTime = `${datePart}T${timePart}`;
                            const [hours, minutes] = event.time.split(':').map(Number);
                            let endHours = hours + 2;
                            if (endHours >= 24) endHours = 23;
                            const endHoursStr = String(endHours).padStart(2, '0');
                            const endMinutesStr = String(minutes).padStart(2, '0');
                            const endDateTime = `${datePart}T${endHoursStr}${endMinutesStr}00`;

                            const icsContent = [
                              'BEGIN:VCALENDAR',
                              'VERSION:2.0',
                              'PRODID:-//College Event Portal//EN',
                              'BEGIN:VEVENT',
                              `UID:${event.id}@collegeportal.com`,
                              `DTSTAMP:${startDateTime}`,
                              `DTSTART:${startDateTime}`,
                              `DTEND:${endDateTime}`,
                              `SUMMARY:${title}`,
                              `DESCRIPTION:${description}`,
                              `LOCATION:${venue}`,
                              'END:VEVENT',
                              'END:VCALENDAR'
                            ].join('\r\n');

                            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                            const link = document.createElement('a');
                            link.href = window.URL.createObjectURL(blob);
                            link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            onToast('success', 'Calendar Exported', 'Downloaded .ics file for your calendar!');
                          }}
                          title="Add to Calendar (.ics)"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition-all"
                        >
                          <CalendarPlus className="h-3 w-3" />
                          Add to Calendar
                        </button>

                        {/* Cancel Reservation button */}
                        <button
                          id={`btn-cancel-ticket-${event.id}`}
                          onClick={() => onCancelRegistration(event.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-[10px] font-semibold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-400 transition-all"
                        >
                          Cancel Reservation
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mid Dot Border Cut */}
                  <div className="hidden md:flex flex-col justify-between py-3">
                    <div className="w-4 h-4 bg-slate-50 dark:bg-slate-950 rounded-full -mt-5 -ml-2"></div>
                    <div className="border-l-2 border-dashed border-slate-200 dark:border-slate-800 h-full"></div>
                    <div className="w-4 h-4 bg-slate-50 dark:bg-slate-950 rounded-full -mb-5 -ml-2"></div>
                  </div>

                  {/* Right Side: QR Code Area */}
                  <div className="p-5 bg-slate-50/40 dark:bg-slate-900/40 md:w-48 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 text-center space-y-2">
                    {renderMockQR(reg.ticketQRValue, `qr-svg-${reg.id}`)}
                    <div className="text-[9px] font-mono font-semibold tracking-wider text-slate-500">{reg.ticketQRValue}</div>
                    
                    <button
                      id={`btn-print-${reg.id}`}
                      onClick={() => downloadQRCode(`qr-svg-${reg.id}`, reg.ticketQRValue, event.title)}
                      className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Download QR Pass</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {activeRegistrations.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Ticket className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No Active Bookings Found</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                Discover upcoming lectures, sports matches, and coding hackathons from the "Events" stream and register!
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
