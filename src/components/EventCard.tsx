import React, { useState, useEffect } from 'react';
import { CollegeEvent, Registration, User, EventReview } from '../types';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  QrCode, 
  Sparkles, 
  AlertTriangle, 
  Share2, 
  CalendarPlus, 
  TrendingUp, 
  Star, 
  MessageSquare, 
  Download, 
  X, 
  Copy, 
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getEventReviews, addEventReview } from '../utils/db';

interface EventCardProps {
  event: CollegeEvent;
  user: User | null;
  registration: Registration | null;
  onRegister: (eventId: string, reminderSet?: boolean) => void;
  onCancelRegistration: (eventId: string) => void;
  onEdit?: (event: CollegeEvent) => void;
  onDelete?: (eventId: string) => void;
  onShowTicket?: (registration: Registration, event: CollegeEvent) => void;
  onToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  isFavorited?: boolean;
  onToggleFavorite?: (eventId: string) => void;
}

export default function EventCard({
  event,
  user,
  registration,
  onRegister,
  onCancelRegistration,
  onEdit,
  onDelete,
  onShowTicket,
  onToast,
  isFavorited = false,
  onToggleFavorite,
}: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [copiedStandalone, setCopiedStandalone] = useState(false);
  
  // Reviews & Rating states
  const [reviews, setReviews] = useState<EventReview[]>([]);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  // Copy status
  const [copied, setCopied] = useState(false);

  // Modals & interactive states
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isConfirmRegOpen, setIsConfirmRegOpen] = useState(false);
  const [getReminders, setGetReminders] = useState(true);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isGoogleCalendarAdded, setIsGoogleCalendarAdded] = useState(false);

  // Load reviews on mount & update when event changes
  useEffect(() => {
    setReviews(getEventReviews(event.id));
  }, [event.id]);

  const isDeadlinePassed = new Date(event.deadline) < new Date(new Date().toISOString().split('T')[0]);
  const isFull = event.seatsLeft <= 0;
  const isRegistered = registration !== null && registration.status === 'confirmed';
  const isAdmin = user?.role === 'admin';

  // Check if current user already reviewed
  const hasReviewed = user ? reviews.some(r => r.userId === user.id) : false;

  // Calculate Average Rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Category Color Config
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Technical':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50';
      case 'Cultural':
        return 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/50';
      case 'Sports':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50';
      case 'Workshop':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50';
      case 'Academic':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700';
    }
  };

  // Seat occupancy math
  const seatsBooked = event.capacity - event.seatsLeft;
  const occupancyPercentage = (seatsBooked / event.capacity) * 100;

  // Format Date to nice human readable
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // Deep Link Creation
  const getDeepLink = () => {
    return `${window.location.origin}?event=${event.id}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getDeepLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLinkStandalone = () => {
    navigator.clipboard.writeText(getDeepLink());
    setCopiedStandalone(true);
    if (onToast) {
      onToast('success', 'Link Copied', `Deep link to "${event.title}" has been copied to your clipboard!`);
    }
    setTimeout(() => setCopiedStandalone(false), 2000);
  };

  const getBuildingDetails = () => {
    const v = event.venue.toLowerCase();
    if (v.includes('seminar') || v.includes('cse') || v.includes('annex')) {
      return {
        name: 'Main Seminar & CSE Block',
        id: 'academic',
        x: 30, y: 30, w: 110, h: 60,
        desc: 'The academic core hosting computer science laboratories, modern lecture halls, and executive seminar spaces.',
        gates: 'Main Campus East Gate'
      };
    }
    if (v.includes('theater') || v.includes('oat')) {
      return {
        name: 'Open Air Theater (OAT)',
        id: 'oat',
        x: 180, y: 210, w: 140, h: 60,
        desc: 'A grand outdoor amphitheater hosting student festivals, concerts, live dramas, and cultural performances.',
        gates: 'South Pedestrian Arch'
      };
    }
    if (v.includes('lecture') || v.includes('block c') || v.includes('auditorium')) {
      return {
        name: 'Lecture Hall Block C',
        id: 'lecture',
        x: 30, y: 110, w: 110, h: 60,
        desc: 'Multidisciplinary smart auditoriums equipped with audio-visual setups for symposiums and lectures.',
        gates: 'Main Campus East Gate'
      };
    }
    if (v.includes('sports') || v.includes('basketball') || v.includes('complex') || v.includes('indoor')) {
      return {
        name: 'Indoor Sports Complex',
        id: 'sports',
        x: 360, y: 110, w: 110, h: 90,
        desc: 'State-of-the-art sports facilities containing basketball courts, gymnastics arenas, and indoor tracking lanes.',
        gates: 'West Gate Entrance'
      };
    }
    if (v.includes('conference') || v.includes('senate') || v.includes('admin') || v.includes('administrative')) {
      return {
        name: 'Central Administrative Block',
        id: 'admin',
        x: 360, y: 30, w: 110, h: 60,
        desc: 'The administrative heart of the university, containing dean suites, administrative offices, and Senate Hall.',
        gates: 'Front Main Entrance Gantry'
      };
    }
    if (v.includes('mechanical') || v.includes('engineering') || v.includes('workshop') || v.includes('bay')) {
      return {
        name: 'Engineering Workshops (Bay 3)',
        id: 'workshop',
        x: 30, y: 210, w: 120, h: 60,
        desc: 'Heavy machinery, robotics, battlebots arena, and mechanical workshop suites for student engineers.',
        gates: 'North Industrial Gate'
      };
    }
    if (v.includes('sac') || v.includes('lawn') || v.includes('activity') || v.includes('student') || v.includes('symphony')) {
      return {
        name: 'Student Activity Center (SAC)',
        id: 'sac',
        x: 180, y: 110, w: 140, h: 60,
        desc: 'The buzzing hub of student life containing club offices, open lounges, music rooms, and lawns.',
        gates: 'South Pedestrian Arch'
      };
    }
    if (v.includes('athletic') || v.includes('track') || v.includes('run') || v.includes('loop')) {
      return {
        name: 'Main Athletic Track & Field',
        id: 'track',
        x: 180, y: 30, w: 140, h: 60,
        desc: 'The stadium-sized athletic track, synthetic football fields, and outer running trail.',
        gates: 'West Gate Entrance'
      };
    }
    return {
      name: 'Central Cafeteria & Quad',
      id: 'quad',
      x: 360, y: 210, w: 110, h: 60,
      desc: 'The central square of the university, featuring culinary hubs, active social clusters, and shaded rest quads.',
      gates: 'Main Campus East Gate'
    };
  };

  const handleConfirmBooking = () => {
    if (getReminders) {
      setIsBookingLoading(true);
      if (onToast) {
        onToast('info', 'Asynchronous Job Initiated', 'Scheduling automatic background SMS/Email dispatch triggers via worker pool...');
      }
      setTimeout(() => {
        setIsBookingLoading(false);
        setIsConfirmRegOpen(false);
        onRegister(event.id, true);
      }, 1500);
    } else {
      setIsConfirmRegOpen(false);
      onRegister(event.id, false);
    }
  };

  const getGoogleCalendarUrl = () => {
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

  // Export to ICS helper
  const handleExportICS = () => {
    const title = event.title;
    const description = event.description.replace(/\n/g, '\\n');
    const venue = event.venue;
    
    // date: YYYY-MM-DD, time: HH:MM (e.g. 14:00)
    const datePart = event.date.replace(/-/g, ''); // YYYYMMDD
    const timePart = event.time.replace(/:/g, '') + '00'; // HHMMSS
    
    const startDateTime = `${datePart}T${timePart}`;
    // Add 2 hours for end time
    const [hours, minutes] = event.time.split(':').map(Number);
    let endHours = hours + 2;
    let endMinutes = minutes;
    if (endHours >= 24) endHours = 23; // cap it
    const endHoursStr = String(endHours).padStart(2, '0');
    const endMinutesStr = String(endMinutes).padStart(2, '0');
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
  };

  // Generate and Download Canvas Flyer Pass
  const handleDownloadFlyer = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gradient styling based on category
    let gradStart = '#0f172a';
    let gradEnd = '#1e1b4b';
    let accentColor = '#3b82f6';
    
    if (event.category === 'Technical') {
      gradStart = '#020617';
      gradEnd = '#1e1b4b';
      accentColor = '#38bdf8';
    } else if (event.category === 'Cultural') {
      gradStart = '#020617';
      gradEnd = '#4c0519';
      accentColor = '#f472b6';
    } else if (event.category === 'Sports') {
      gradStart = '#020617';
      gradEnd = '#022c22';
      accentColor = '#34d399';
    } else if (event.category === 'Workshop') {
      gradStart = '#020617';
      gradEnd = '#2e1065';
      accentColor = '#c084fc';
    } else if (event.category === 'Academic') {
      gradStart = '#020617';
      gradEnd = '#451a03';
      accentColor = '#fbbf24';
    }

    // Gradient Fill
    const grad = ctx.createLinearGradient(0, 0, 0, 1000);
    grad.addColorStop(0, gradStart);
    grad.addColorStop(1, gradEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 1000);

    // Decorative Rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(400, 500, 300, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(400, 500, 450, 0, Math.PI * 2);
    ctx.stroke();

    // Top Brand Title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('METROPOLITAN UNIVERSITY • CAMPUS PASS', 400, 80);

    // Category
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(event.category.toUpperCase(), 400, 130);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    const words = event.title.split(' ');
    let line = '';
    let y = 200;
    const maxWidth = 700;
    const lineHeight = 55;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), 400, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 400, y);

    // Separator line
    y += 60;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, y);
    ctx.lineTo(700, y);
    ctx.stroke();

    // Box
    y += 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(100, y, 600, 250, 16);
    ctx.fill();
    ctx.stroke();

    // Details Content
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('DATE', 140, y + 55);
    ctx.font = '22px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 140, y + 90);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('TIME', 140, y + 160);
    ctx.fillText('VENUE', 440, y + 160);

    ctx.font = '22px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(`${event.time} Hrs`, 140, y + 195);
    let venueText = event.venue;
    if (venueText.length > 20) venueText = venueText.substring(0, 18) + '...';
    ctx.fillText(venueText, 440, y + 195);

    // Decorative Ticket notches
    y += 320;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(100, y);
    ctx.lineTo(700, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Notch cut circles
    ctx.fillStyle = gradStart;
    ctx.beginPath();
    ctx.arc(80, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(720, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Footer barcode/QR section
    y += 40;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('SCAN TO CHECK-IN / DIGITAL GATEWAY', 400, y);

    y += 30;
    const qrX = 350;
    const qrY = y;
    const qrSize = 100;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    
    // Draw visual QR blocks
    ctx.fillStyle = '#090d16';
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if ((r + c) % 2 === 0 || (r * c) % 3 === 0) {
          ctx.fillRect(qrX + c * 10, qrY + r * 10, 10, 10);
        }
      }
    }
    // Anchor squares
    ctx.fillStyle = '#090d16';
    ctx.fillRect(qrX, qrY, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX + 10, qrY + 10, 10, 10);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(qrX + qrSize - 30, qrY, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX + qrSize - 20, qrY + 10, 10, 10);

    ctx.fillStyle = '#090d16';
    ctx.fillRect(qrX, qrY + qrSize - 30, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX + 10, qrY + qrSize - 20, 10, 10);

    // ID caption
    y += 140;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '13px monospace';
    ctx.fillText(`GATE PASS ID: ${event.id.toUpperCase()}-${event.category.substring(0,3).toUpperCase()}`, 400, y);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_pass.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit rating review handler
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!commentInput.trim()) {
      setReviewError('Please write a short review.');
      return;
    }

    const res = addEventReview(event.id, user.id, ratingInput, commentInput.trim());
    if (res.success) {
      setReviewSuccess(true);
      setCommentInput('');
      setReviewError(null);
      // Refresh local reviews
      setReviews(getEventReviews(event.id));
      setTimeout(() => {
        setReviewSuccess(false);
      }, 3000);
    } else {
      setReviewError(res.error || 'Failed to submit feedback.');
    }
  };

  // High Demand calculation
  // Show high-demand badge if seats left <= 35% of capacity or <= 15 seats
  const isHighDemand = (event.seatsLeft <= event.capacity * 0.35 || event.seatsLeft <= 15) && event.seatsLeft > 0;

  return (
    <>
      <motion.div
        layout
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
      >
        {/* Banner Image */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={event.bannerImage}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80';
            }}
          />
          
          {/* Category Tag */}
          <div className="absolute top-4 left-4 z-10">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getCategoryStyles(event.category)}`}>
              {event.category}
            </span>
          </div>

          {/* Favorite Toggle Button */}
          <button
            id={`btn-favorite-${event.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite && onToggleFavorite(event.id);
            }}
            title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
            className="absolute top-4 right-4 z-20 p-2 bg-white/90 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-900 text-rose-500 rounded-full shadow-md transition-all duration-200 hover:scale-110 active:scale-95 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center cursor-pointer"
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-400 dark:text-slate-500'}`} />
          </button>

          {/* High Demand Trending Badge */}
          {isHighDemand && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0.9 }}
              animate={{
                scale: [0.95, 1.05, 0.95],
                opacity: [0.9, 1, 0.9],
                boxShadow: [
                  "0 4px 6px -1px rgba(225, 29, 72, 0.1), 0 2px 4px -2px rgba(225, 29, 72, 0.1)",
                  "0 10px 15px -3px rgba(225, 29, 72, 0.4), 0 4px 6px -4px rgba(225, 29, 72, 0.4)",
                  "0 4px 6px -1px rgba(225, 29, 72, 0.1), 0 2px 4px -2px rgba(225, 29, 72, 0.1)"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-4 right-14 z-10 bg-rose-600 dark:bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-md"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>HIGH DEMAND</span>
            </motion.div>
          )}

          {/* Fallback Fills Fast Badge if not high demand but under 5 seats */}
          {!isHighDemand && event.seatsLeft <= 5 && event.seatsLeft > 0 && !isRegistered && (
            <div className="absolute top-4 right-14 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 shadow-sm">
              <AlertTriangle className="h-3 w-3" />
              <span>Fills Fast!</span>
            </div>
          )}

          {/* Registered Badge Overlay */}
          {isRegistered && (
            <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-xs flex items-center justify-center">
              <div className="bg-white/95 dark:bg-slate-900/95 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center space-x-2 shadow-sm">
                <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>You are Registered!</span>
              </div>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-5 flex-grow flex flex-col justify-between">
          <div className="space-y-3">
            {/* Title & Metadata */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {event.title}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center space-x-1">
                <span>Deadline: {formatDate(event.deadline)}</span>
                {isDeadlinePassed && <span className="text-rose-500 dark:text-rose-400 font-semibold">(Closed)</span>}
              </p>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {event.description}
            </p>

            {/* Logistics details */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
              <div className="flex items-center space-x-2.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{event.time} Hrs</span>
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center space-x-2.5 min-w-0 flex-grow text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="line-clamp-1 truncate">{event.venue}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
                >
                  <MapPin className="h-3 w-3" />
                  <span>Show Map</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {/* Seats occupancy track line */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span>{event.seatsLeft} of {event.capacity} seats left</span>
                </span>
                <span>{Math.round(occupancyPercentage)}% Booked</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? 'bg-rose-500' : occupancyPercentage > 85 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${occupancyPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Collapsible Reviews and Ratings Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsReviewsExpanded(!isReviewsExpanded)}
                className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
              >
                <div className="flex items-center space-x-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>
                    {reviews.length > 0 
                      ? `${reviews.length} Feedback Review${reviews.length > 1 ? 's' : ''}` 
                      : 'No reviews yet'}
                  </span>
                  {averageRating > 0 && (
                    <div className="flex items-center space-x-0.5 text-amber-500 font-semibold ml-1.5 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{averageRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div>
                  {isReviewsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </button>

              <AnimatePresence>
                {isReviewsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-2 space-y-2.5 text-xs text-slate-600 dark:text-slate-400"
                  >
                    {/* Reviews list */}
                    {reviews.length > 0 ? (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {reviews.map((r) => (
                          <div key={r.id} className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{r.userName}</span>
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-3 w-3 ${i < r.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-750'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-350 leading-relaxed italic text-[11px]">"{r.comment}"</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">No student reviews yet. Registered users can leave feedback below.</p>
                    )}

                    {/* Feedback Submission form */}
                    {isRegistered ? (
                      hasReviewed ? (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1.5 rounded-lg flex items-center space-x-1">
                          <Check className="h-3.5 w-3.5" />
                          <span>You have submitted your feedback review!</span>
                        </div>
                      ) : (
                        <form onSubmit={handleReviewSubmit} className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-2.5 space-y-2">
                          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Share your Feedback</div>
                          
                          {/* Star picker */}
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-slate-400 mr-1.5">Rating:</span>
                            {Array.from({ length: 5 }).map((_, i) => {
                              const starVal = i + 1;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setRatingInput(starVal)}
                                  onMouseEnter={() => setHoveredStar(starVal)}
                                  onMouseLeave={() => setHoveredStar(null)}
                                  className="text-amber-400 hover:scale-110 transition-transform"
                                >
                                  <Star 
                                    className={`h-4.5 w-4.5 ${
                                      starVal <= (hoveredStar ?? ratingInput) 
                                        ? 'fill-current' 
                                        : 'text-slate-300 dark:text-slate-700'
                                    }`} 
                                  />
                                </button>
                              );
                            })}
                          </div>

                          {/* Comment input */}
                          <div className="flex space-x-1.5">
                            <input
                              type="text"
                              maxLength={120}
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              placeholder="Write a short review..."
                              className="flex-grow text-[11px] px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg transition-colors shrink-0"
                            >
                              Submit
                            </button>
                          </div>

                          {reviewError && <div className="text-[10px] text-rose-500">{reviewError}</div>}
                          {reviewSuccess && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                              <Check className="h-3 w-3" />
                              <span>Feedback posted successfully!</span>
                            </div>
                          )}
                        </form>
                      )
                    ) : (
                      user && user.role !== 'admin' && (
                        <div className="text-[10px] text-slate-400 italic bg-slate-50 dark:bg-slate-850 p-1.5 rounded-md">
                          🔒 Only registered students can submit feedback.
                        </div>
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions Footer row */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
              
              {/* Share and ICS Buttons (Left Side aligned) */}
              <div className="flex items-center space-x-1 shrink-0">
                <button
                  id={`btn-share-${event.id}`}
                  onClick={() => setIsShareModalOpen(true)}
                  title="Share Event Flyer"
                  className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                <button
                  id={`btn-copy-link-${event.id}`}
                  onClick={handleCopyLinkStandalone}
                  title={copiedStandalone ? "Copied!" : "Copy Event Deep Link"}
                  className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0"
                >
                  {copiedStandalone ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                
                <button
                  id={`btn-ics-${event.id}`}
                  onClick={handleExportICS}
                  title="Export to Calendar (.ics)"
                  className="p-2 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0"
                >
                  <CalendarPlus className="h-4 w-4" />
                </button>

                {isAdmin && (
                  <div className="flex space-x-1">
                    {onEdit && (
                      <button
                        id={`btn-edit-event-${event.id}`}
                        onClick={() => onEdit(event)}
                        title="Edit Event"
                        className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        id={`btn-delete-event-${event.id}`}
                        onClick={() => onDelete(event.id)}
                        title="Delete Event"
                        className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex-grow flex justify-end">
                {isRegistered ? (
                  <div className="flex space-x-1 w-full justify-end">
                    {onShowTicket && (
                      <button
                        id={`btn-ticket-${event.id}`}
                        onClick={() => onShowTicket(registration!, event)}
                        className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-blue-400 text-xs font-semibold rounded-lg transition-all border border-blue-100/30 dark:border-blue-950 flex items-center space-x-1 shrink-0"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Ticket</span>
                      </button>
                    )}
                    <button
                      id={`btn-cancel-reg-${event.id}`}
                      onClick={() => onCancelRegistration(event.id)}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/30 dark:text-rose-400 text-xs font-semibold rounded-lg transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : isDeadlinePassed ? (
                  <button
                    disabled
                    className="w-full sm:w-auto px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-semibold rounded-lg cursor-not-allowed border border-transparent"
                  >
                    Deadline Passed
                  </button>
                ) : isFull ? (
                  <button
                    disabled
                    className="w-full sm:w-auto px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-rose-500 dark:text-rose-400 text-xs font-semibold rounded-lg cursor-not-allowed border border-transparent"
                  >
                    Fully Booked
                  </button>
                ) : !user ? (
                  <button
                    disabled
                    className="w-full sm:w-auto px-4 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-400 dark:text-blue-600 text-xs font-semibold rounded-lg cursor-not-allowed border border-dashed border-blue-200"
                  >
                    Log In
                  </button>
                ) : user.role === 'admin' ? (
                  <div className="text-[10px] text-slate-400 italic flex items-center space-x-1">
                    <ShieldCheck className="h-3 w-3 text-blue-500" />
                    <span>Admin Mode</span>
                  </div>
                ) : (
                  <button
                    id={`btn-register-${event.id}`}
                    onClick={() => {
                      if (!user) {
                        onRegister(event.id);
                      } else {
                        setIsConfirmRegOpen(true);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center space-x-1 shadow-xs group/btn cursor-pointer"
                  >
                    <span>Register</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Share & Custom Event Card Flyer Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Share Event</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Copy invitation link or generate dynamic event flyer</p>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content body */}
              <div className="p-5 space-y-4">
                
                {/* 1. Deep Link Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Invitation Link</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={getDeepLink()}
                      className="flex-grow px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl focus:outline-hidden text-slate-600 dark:text-slate-350 select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors min-w-24 justify-center"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. Visual Flyer Ticket Preview */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Visual Event Flyer Card</label>
                  
                  {/* Miniature Digital ticket layout */}
                  <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-4 rounded-xl border border-indigo-500/20 text-white space-y-3 shadow-lg overflow-hidden">
                    {/* Ring decals */}
                    <div className="absolute -right-10 -bottom-10 w-28 h-28 border border-white/5 rounded-full pointer-events-none" />
                    <div className="absolute -left-10 -top-10 w-28 h-28 border border-white/5 rounded-full pointer-events-none" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono tracking-wider text-slate-400 uppercase">MU Event Pass</span>
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full uppercase ${getCategoryStyles(event.category)}`}>
                        {event.category}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">{event.title}</h4>
                      <p className="text-[10px] text-slate-300 line-clamp-1">{event.venue}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-white/10 pt-2.5">
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Date</span>
                        <span className="font-semibold text-slate-100">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase">Time</span>
                        <span className="font-semibold text-slate-100">{event.time} Hours</span>
                      </div>
                    </div>

                    {/* QR and decorative ticket holes */}
                    <div className="border-t border-dashed border-white/20 pt-2.5 flex justify-between items-center">
                      <span className="text-[8px] text-slate-400 font-mono tracking-wider">SECURE PASS: {event.id.toUpperCase()}</span>
                      <div className="w-8 h-8 bg-white p-0.5 rounded-xs shrink-0 flex items-center justify-center">
                        <div className="w-full h-full bg-slate-900 flex flex-wrap p-0.5">
                          {/* visual barcode effect */}
                          <div className="w-1/2 h-full border-r border-white" />
                          <div className="w-1/4 h-full border-r border-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download option */}
                <button
                  onClick={handleDownloadFlyer}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download High-Res Flyer (PNG)</span>
                </button>

                <button
                  onClick={handleExportICS}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-350 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all border border-slate-200/50 dark:border-slate-800/80 cursor-pointer"
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Export Offline Calendar (.ics)</span>
                </button>

                <a
                  href={getGoogleCalendarUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setIsGoogleCalendarAdded(true);
                    if (onToast) onToast('success', 'Syncing Event', `Generating Google Calendar invite for "${event.title}"!`);
                    setTimeout(() => setIsGoogleCalendarAdded(false), 4000);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs text-center active:scale-95"
                >
                  <AnimatePresence mode="wait">
                    {isGoogleCalendarAdded ? (
                      <motion.span
                        key="added-flyer"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center justify-center space-x-1"
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
                        key="add-flyer"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center justify-center space-x-1.5"
                      >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        <span>Add to Google Calendar</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Campus Map Modal */}
      <AnimatePresence>
        {isMapOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full relative z-10 text-slate-900 dark:text-white"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Campus Venue Map</h4>
                  <p className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-1">
                    <span className="text-indigo-600 dark:text-indigo-400">📍 {event.venue}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsMapOpen(false)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Map Layout split */}
              <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80">
                
                {/* Left column: SVG Canvas */}
                <div className="md:col-span-3 p-5 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col items-center justify-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3 self-start flex items-center space-x-1">
                    <span>🗺️ Interactive Campus Grid</span>
                    <span className="text-blue-500 font-bold">• click blocks to explore</span>
                  </div>
                  
                  <div className="relative w-full max-w-[420px] aspect-[5/3] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-inner overflow-hidden p-2">
                    {/* SVG Map */}
                    <svg viewBox="0 0 500 300" className="w-full h-full select-none">
                      {/* Grid Lines */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-900/60" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />

                      {/* Pathways & Roads */}
                      <path d="M 150 0 L 150 300 M 340 0 L 340 300 M 0 95 L 500 95 M 0 185 L 500 185" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-900/60" strokeWidth="16" strokeLinecap="round" />
                      <path d="M 150 0 L 150 300 M 340 0 L 340 300 M 0 95 L 500 95 M 0 185 L 500 185" fill="none" stroke="currentColor" className="text-white dark:text-slate-950" strokeWidth="12" strokeLinecap="round" strokeDasharray="3,3" />

                      {/* Building Blocks */}
                      {[
                        { id: 'academic', label: 'CSE & Seminar Block', x: 25, y: 25, w: 110, h: 55, color: 'fill-indigo-500/10 stroke-indigo-500' },
                        { id: 'lecture', label: 'Lecture Block C', x: 25, y: 110, w: 110, h: 55, color: 'fill-sky-500/10 stroke-sky-500' },
                        { id: 'workshop', label: 'Engineering Workshop', x: 25, y: 210, w: 120, h: 55, color: 'fill-amber-500/10 stroke-amber-500' },
                        
                        { id: 'track', label: 'Track & Athletics', x: 175, y: 25, w: 140, h: 55, color: 'fill-emerald-500/10 stroke-emerald-500' },
                        { id: 'sac', label: 'SAC & Club Lawns', x: 175, y: 110, w: 140, h: 55, color: 'fill-teal-500/10 stroke-teal-500' },
                        { id: 'oat', label: 'Open Air Theater', x: 175, y: 210, w: 140, h: 55, color: 'fill-purple-500/10 stroke-purple-500' },
                        
                        { id: 'admin', label: 'Admin Headquarters', x: 355, y: 25, w: 120, h: 55, color: 'fill-rose-500/10 stroke-rose-500' },
                        { id: 'sports', label: 'Indoor Sports Arena', x: 355, y: 110, w: 120, h: 55, color: 'fill-cyan-500/10 stroke-cyan-500' },
                        { id: 'quad', label: 'Central Quad Cafe', x: 355, y: 210, w: 120, h: 55, color: 'fill-pink-500/10 stroke-pink-500' }
                      ].map((b) => {
                        const isTarget = getBuildingDetails().id === b.id;
                        return (
                          <g
                            key={b.id}
                            className="cursor-pointer group"
                          >
                            <rect
                              x={b.x}
                              y={b.y}
                              width={b.w}
                              height={b.h}
                              rx="8"
                              className={`transition-all duration-300 ${
                                isTarget 
                                  ? 'fill-indigo-600/20 stroke-indigo-600 stroke-[3px] filter drop-shadow-md' 
                                  : `${b.color} stroke-[1.5px] hover:fill-slate-100 dark:hover:fill-slate-800`
                              }`}
                            />
                            {/* Pulsing indicator on the target venue block */}
                            {isTarget && (
                              <circle
                                cx={b.x + b.w / 2}
                                cy={b.y + b.h / 2}
                                r="4"
                                className="fill-indigo-600 animate-ping"
                              />
                            )}
                            <text
                              x={b.x + b.w / 2}
                              y={b.y + b.h / 2 + 3}
                              textAnchor="middle"
                              className={`text-[8px] font-bold tracking-tight select-none pointer-events-none transition-colors ${
                                isTarget 
                                  ? 'fill-indigo-800 dark:fill-indigo-300 font-extrabold' 
                                  : 'fill-slate-500 dark:fill-slate-400 group-hover:fill-slate-800 dark:group-hover:fill-slate-200'
                              }`}
                            >
                              {b.id === getBuildingDetails().id ? '★ YOU ARE HERE' : b.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 mt-2.5 text-[9px] text-slate-400">
                    <span className="w-2.5 h-2.5 bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-600 rounded-sm"></span>
                    <span>Highlighted block is the resolved venue building</span>
                  </div>
                </div>

                {/* Right column: Building details */}
                <div className="md:col-span-2 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center space-x-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                      <span>Venue Resolved</span>
                    </div>

                    <h5 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                      {getBuildingDetails().name}
                    </h5>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {getBuildingDetails().desc}
                    </p>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-[11px]">
                      <div>
                        <span className="block font-bold text-slate-400 uppercase text-[9px]">Event Location</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{event.venue}</span>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-400 uppercase text-[9px]">Access Gate</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{getBuildingDetails().gates}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMapOpen(false)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Got It, Close Map
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Registration Confirmation Modal */}
      <AnimatePresence>
        {isConfirmRegOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isBookingLoading) setIsConfirmRegOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-md w-full relative z-10 p-6 text-slate-900 dark:text-white space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold uppercase text-[9px] tracking-wider">
                    {event.category}
                  </span>
                  <h4 className="text-lg font-black text-slate-950 dark:text-white mt-1">Confirm Registration</h4>
                </div>
                <button
                  onClick={() => setIsConfirmRegOpen(false)}
                  disabled={isBookingLoading}
                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 disabled:opacity-40 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Event card minimal preview */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{event.title}</p>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{event.time} Hrs</span>
                  </div>
                  <div className="flex items-center space-x-1.5 col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                </div>
              </div>

              {/* Get SMS/Email Reminder Checkbox option */}
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl space-y-2">
                <label className="flex items-start space-x-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={getReminders}
                    onChange={(e) => setGetReminders(e.target.checked)}
                    disabled={isBookingLoading}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0 transition-all cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center space-x-1">
                      <Megaphone className="h-3.5 w-3.5 animate-pulse" />
                      <span>Get SMS/Email Reminder Alerts</span>
                    </span>
                    <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-500/80 leading-normal">
                      Receive automated notifications 24 hours and 1 hour before the schedule starts. Uses offline messaging worker grids.
                    </span>
                  </div>
                </label>
              </div>

              {/* Simulated Loading trigger state */}
              {isBookingLoading && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3.5 bg-blue-500/5 border border-blue-500/15 rounded-2xl flex items-center space-x-3 text-xs text-blue-600 dark:text-blue-400"
                >
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-semibold animate-pulse">Simulating background reminder queue worker registration...</span>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmRegOpen(false)}
                  disabled={isBookingLoading}
                  className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isBookingLoading}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isBookingLoading ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Confirm & Book Seat</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
