import { User, CollegeEvent, Announcement, Registration } from '../types';

// Avatar Colors for users
export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500'
];

export const defaultUsers: User[] = [
  {
    id: 'usr_admin',
    name: 'Prof. Sarah Jenkins',
    email: 'admin@college.edu',
    role: 'admin',
    password: 'admin123', // Clean, clear default password for demo
    avatarColor: 'bg-indigo-500',
    department: 'Computer Science & Engineering',
    bio: 'Dean of Student Affairs and Event Coordinator. Dedicated to building an active and vibrant campus community.',
    registeredAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'usr_student',
    name: 'Alex Rivera',
    email: 'student@college.edu',
    role: 'student',
    password: 'student123', // Clean, clear default password for demo
    avatarColor: 'bg-emerald-500',
    department: 'Information Technology',
    studentId: 'CS-2024-048',
    bio: 'Third-year IT student, tech enthusiast, and lead designer for the College Web Club. Love participating in hackathons!',
    registeredAt: '2026-02-10T10:30:00Z'
  },
  {
    id: 'usr_student2',
    name: 'Emily Chen',
    email: 'emily@college.edu',
    role: 'student',
    password: 'student123',
    avatarColor: 'bg-purple-500',
    department: 'Electronics & Communication',
    studentId: 'EC-2025-112',
    bio: 'Sophomore, classical pianist, and active member of the Cultural Society.',
    registeredAt: '2026-03-01T14:20:00Z'
  }
];

export const defaultEvents: CollegeEvent[] = [
  {
    id: 'evt_1',
    title: 'HackHorizon 2026 Hackathon',
    description: 'The ultimate 24-hour campus hackathon! Team up to build innovative solutions for real-world challenges. Free food, amazing swag, and cash prizes up to $2,500. Open to all departments and skill levels. Mentorship will be provided by top tech professionals.',
    date: '2026-07-24',
    time: '09:00',
    venue: 'Main Seminar Hall & CSE Lab Annex',
    category: 'Technical',
    deadline: '2026-07-22',
    capacity: 120,
    seatsLeft: 84,
    bannerImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-10T08:00:00Z',
    published: true
  },
  {
    id: 'evt_2',
    title: 'Annual Cultural Fusion Night',
    description: 'Celebrate our diverse student community with a night of spectacular music, dance performances, and theatrical acts. Featuring guest rock band "The Overtones" and delicious global food stalls! Don\'t miss out on the biggest entertainment night of the semester.',
    date: '2026-07-29',
    time: '18:00',
    venue: 'Open Air Theater (OAT)',
    category: 'Cultural',
    deadline: '2026-07-28',
    capacity: 500,
    seatsLeft: 312,
    bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-11T12:00:00Z',
    published: true
  },
  {
    id: 'evt_3',
    title: 'AI & Web 3.0 Bootcamp',
    description: 'A 3-day deep-dive workshop on building full-stack applications with AI integration and Web 3.0 tools. Led by industry experts from Google and OpenAI. Learn about Prompt Engineering, Vector Databases, LLM fine-tuning, and decentralized app building.',
    date: '2026-08-05',
    time: '10:00',
    venue: 'Lecture Hall Block C - Auditorium 2',
    category: 'Workshop',
    deadline: '2026-08-02',
    capacity: 80,
    seatsLeft: 12,
    bannerImage: 'https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-12T09:15:00Z',
    published: true
  },
  {
    id: 'evt_4',
    title: 'Inter-College Basketball Championship',
    description: 'Come and cheer for the home team! Our college is hosting the zonal basketball championship. High-energy matches, professional referees, and refreshment stalls are available throughout the tournament. Registration is open for players and cheerleading squads.',
    date: '2026-07-21',
    time: '15:30',
    venue: 'Indoor Sports Complex',
    category: 'Sports',
    deadline: '2026-07-20',
    capacity: 250,
    seatsLeft: 145,
    bannerImage: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-14T11:00:00Z',
    published: true
  },
  {
    id: 'evt_5',
    title: 'Research Methodology Seminar',
    description: 'Essential seminar for senior B.Tech and postgraduate students on how to write impact-factor research papers, reference management with Mendeley, and navigating academic publication cycles. Guest speakers from IEEE and Springer.',
    date: '2026-08-12',
    time: '14:00',
    venue: 'Conference Hall A',
    category: 'Academic',
    deadline: '2026-08-10',
    capacity: 60,
    seatsLeft: 58,
    bannerImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-15T15:30:00Z',
    published: true
  },
  {
    id: 'evt_6',
    title: 'RoboClash Arena: Autonomous Battlebots',
    description: 'Witness the clash of titanium and code! Student-built autonomous battlebots face off in our high-octane custom bulletproof arena. Expect spinning blades, pneumatic flippers, and incredible strategic engineering. Registration is open for competitor teams and spectating passes.',
    date: '2026-07-26',
    time: '13:00',
    venue: 'Mechanical Engineering Workshop - Bay 3',
    category: 'Technical',
    deadline: '2026-07-24',
    capacity: 150,
    seatsLeft: 92,
    bannerImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-16T10:00:00Z',
    published: true
  },
  {
    id: 'evt_7',
    title: 'Symphony & Canvas: Live Art Cafe',
    description: 'An immersive sensory evening where live jazz music meets improvisational charcoal painting. Watch student artists construct grand-scale canvas murals on stage, synchronized to dynamic acoustic harmonies. Free gourmet hot chocolate and sketching materials provided.',
    date: '2026-08-02',
    time: '19:30',
    venue: 'Student Activity Center Lawn',
    category: 'Cultural',
    deadline: '2026-08-01',
    capacity: 200,
    seatsLeft: 164,
    bannerImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-16T14:20:00Z',
    published: true
  },
  {
    id: 'evt_8',
    title: 'National Level Mock United Nations (MUN)',
    description: 'Step into the shoes of global diplomats to debate and solve pressing international crises. This year\'s agenda targets Climate Refugees and Global Digital Privacy Protocols. Designed to sharpen negotiation, research, and public speaking skills. Cash awards for Outstanding Delegate.',
    date: '2026-08-10',
    time: '08:30',
    venue: 'Central Administrative Senate Hall',
    category: 'Academic',
    deadline: '2026-08-06',
    capacity: 100,
    seatsLeft: 42,
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-17T09:00:00Z',
    published: true
  },
  {
    id: 'evt_9',
    title: 'Midnight Neon 5K Marathon',
    description: 'Lace up your running shoes and glow in the dark! Join our annual nocturnal 5-kilometer campus charity run. Every participant receives high-visibility glowsticks, custom neon headbands, and finishing medals. All proceeds go toward local educational charities.',
    date: '2026-07-28',
    time: '21:00',
    venue: 'Main Athletic Track & Outer Loop',
    category: 'Sports',
    deadline: '2026-07-27',
    capacity: 400,
    seatsLeft: 235,
    bannerImage: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-17T11:40:00Z',
    published: true
  },
  {
    id: 'evt_10',
    title: 'UX/UI & Product Design Masterclass',
    description: 'A comprehensive hands-on workshop guiding you from lo-fi wireframes to high-fidelity responsive interactive prototypes in Figma. Learn design systems, grid structures, color theory, spacing hierarchies, micro-interactions, and usability testing protocols.',
    date: '2026-08-08',
    time: '10:00',
    venue: 'Design Studio & Innovation Hub',
    category: 'Workshop',
    deadline: '2026-08-07',
    capacity: 75,
    seatsLeft: 53,
    bannerImage: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-17T15:10:00Z',
    published: true
  },
  {
    id: 'evt_11',
    title: 'Campus Green Energy Expo & Startup Pitch',
    description: 'An interactive seminar and exposition showcasing cutting-edge clean-energy innovations designed by student startup founders. Keynote speakers will cover the integration of AI-driven smart grids and hydrogen fuel cell designs. Seed funding rewards available.',
    date: '2026-08-15',
    time: '11:00',
    venue: 'Technology Incubation & Exhibition Center',
    category: 'Seminar',
    deadline: '2026-08-13',
    capacity: 150,
    seatsLeft: 121,
    bannerImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    organizerId: 'usr_admin',
    createdAt: '2026-07-18T08:30:00Z',
    published: true
  }
];

export const defaultAnnouncements: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Volunteers Needed for HackHorizon 2026',
    content: 'We are looking for enthusiastic student volunteers to assist with HackHorizon 2026 registration, hospitality, lab management, and social media coverage. Volunteers will receive special event t-shirts, food coupons, and official commendation certificates. Apply at the Dean of Student Affairs office before July 21st.',
    category: 'important',
    date: '2026-07-17',
    postedBy: 'Prof. Sarah Jenkins',
    createdAt: '2026-07-17T09:30:00Z'
  },
  {
    id: 'ann_2',
    title: 'Mid-Semester Break and Library Timings',
    content: 'The college will remain closed for the mid-semester break from August 8th to August 12th. However, the Central Library will operate with modified hours (09:00 AM to 05:00 PM) for research scholars and students preparation. Regular schedules will resume on August 13th.',
    category: 'academic',
    date: '2026-07-16',
    postedBy: 'Prof. Sarah Jenkins',
    createdAt: '2026-07-16T11:00:00Z'
  },
  {
    id: 'ann_3',
    title: 'Annual Sports Kit Distribution',
    content: 'All registered college sports team players (Basketball, Football, Cricket, Badminton, Track & Field) are requested to collect their custom-sized jerseys and kits from the Sports Office from July 19th onwards. Please bring your valid College ID Card and Sports Society allotment slip.',
    category: 'sports',
    date: '2026-07-15',
    postedBy: 'Prof. Sarah Jenkins',
    createdAt: '2026-07-15T14:45:00Z'
  }
];

export const defaultRegistrations: Registration[] = [
  {
    id: 'reg_1',
    userId: 'usr_student',
    userName: 'Alex Rivera',
    userEmail: 'student@college.edu',
    eventId: 'evt_1',
    eventTitle: 'HackHorizon 2026 Hackathon',
    eventDate: '2026-07-24',
    eventVenue: 'Main Seminar Hall & CSE Lab Annex',
    registeredAt: '2026-07-15T11:20:00Z',
    ticketQRValue: 'TICKET-EVT1-USRSTUDENT-883921',
    status: 'confirmed'
  },
  {
    id: 'reg_2',
    userId: 'usr_student',
    userName: 'Alex Rivera',
    userEmail: 'student@college.edu',
    eventId: 'evt_4',
    eventTitle: 'Inter-College Basketball Championship',
    eventDate: '2026-07-21',
    eventVenue: 'Indoor Sports Complex',
    registeredAt: '2026-07-16T15:10:00Z',
    ticketQRValue: 'TICKET-EVT4-USRSTUDENT-147823',
    status: 'confirmed'
  }
];
