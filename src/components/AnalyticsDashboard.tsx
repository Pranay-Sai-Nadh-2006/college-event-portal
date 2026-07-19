import React from 'react';
import { CollegeEvent, Registration, User, Announcement } from '../types';
import { Award, Users, Calendar, Megaphone, CheckCircle, Flame, PieChart, TrendingUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  events: CollegeEvent[];
  registrations: Registration[];
  users: User[];
  announcements: Announcement[];
}

export default function AnalyticsDashboard({ events, registrations, users, announcements }: AnalyticsDashboardProps) {
  // 1. Calculations
  const activeEventsCount = events.filter(e => e.published).length;
  const activeRegistrations = registrations.filter(r => r.status === 'confirmed');
  const activeRegistrationsCount = activeRegistrations.length;
  const totalStudentsCount = users.filter(u => u.role === 'student').length;

  // Calculate Average Occupancy Rate
  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const seatsBooked = events.reduce((sum, e) => sum + (e.capacity - e.seatsLeft), 0);
  const averageOccupancy = totalCapacity > 0 ? (seatsBooked / totalCapacity) * 100 : 0;

  // 2. Event categories breakdown
  const categoriesList = ['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar'] as const;
  const categoryCounts = categoriesList.reduce((acc, cat) => {
    acc[cat] = events.filter(e => e.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

  // 3. Top booked events
  const sortedEventsByBookings = [...events]
    .map(e => {
      const bookings = e.capacity - e.seatsLeft;
      const rate = e.capacity > 0 ? (bookings / e.capacity) * 100 : 0;
      return { ...e, bookings, rate };
    })
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 4);

  // 4. Registration trends by day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayRegistrations = activeRegistrations.reduce((acc, r) => {
    const dayName = daysOfWeek[new Date(r.registeredAt).getDay()];
    acc[dayName] = (acc[dayName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxDayCount = Math.max(...Object.values(dayRegistrations), 1);

  return (
    <div className="space-y-6">
      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Published Events</span>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{activeEventsCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold">Active</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Bookings</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{activeRegistrationsCount}</span>
            <span className="text-[10px] text-emerald-500 font-semibold">Confirmed</span>
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Fill Ratio</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{Math.round(averageOccupancy)}%</span>
            <span className="text-[10px] text-slate-400">Avg. Seat Fill</span>
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Students</span>
            <span className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{totalStudentsCount}</span>
            <span className="text-[10px] text-slate-400">Enrolled Users</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Custom Category Bar Chart & Active Day spikes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-850 dark:text-white">Event Distribution by Category</h3>
          </div>

          <div className="space-y-4">
            {categoriesList.map(cat => {
              const count = categoryCounts[cat];
              const percent = (count / maxCategoryCount) * 100;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-400">{count} {count === 1 ? 'event' : 'events'}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-50 dark:bg-slate-800/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Popularity and Ticket occupancy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Flame className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-850 dark:text-white">Trending / Highly Booked Events</h3>
            </div>

            <div className="space-y-4">
              {sortedEventsByBookings.map((event, index) => (
                <div
                  key={event.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white truncate">{event.title}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{event.category} • {event.venue}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-xs font-bold text-slate-800 dark:text-white">{event.bookings} Booked</div>
                    <div className="text-[10px] font-semibold text-emerald-500">{Math.round(event.rate)}% capacity</div>
                  </div>
                </div>
              ))}

              {sortedEventsByBookings.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">
                  Create events to see tracking performance.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Full Row: Custom SVG Registrations Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-850 dark:text-white">Weekly Booking Activity Spikes</h3>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Auto-aggregated by registration date</span>
        </div>

        {/* SVG Responsive chart representation */}
        <div className="grid grid-cols-7 gap-3 pt-4 text-center items-end h-44">
          {daysOfWeek.map(day => {
            const count = dayRegistrations[day] || 0;
            const barHeight = (count / maxDayCount) * 100;
            
            return (
              <div key={day} className="flex flex-col items-center h-full justify-end group">
                <div className="w-full max-w-[32px] bg-slate-50 dark:bg-slate-800 rounded-t-lg h-full flex items-end relative overflow-hidden">
                  <div
                    className="w-full bg-blue-600 group-hover:bg-blue-500 dark:bg-blue-500 dark:group-hover:bg-blue-400 rounded-t-lg transition-all duration-300"
                    style={{ height: `${Math.max(barHeight, 4)}%` }} // Minimum height to look nice
                  >
                    {count > 0 && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
                        {count} regs
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 truncate max-w-full">
                  {day.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
