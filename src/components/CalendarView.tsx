import React, { useState } from 'react';
import { CollegeEvent, Registration } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, Sparkles } from 'lucide-react';

interface CalendarViewProps {
  events: CollegeEvent[];
  onSelectEvent?: (event: CollegeEvent) => void;
}

export default function CalendarView({ events, onSelectEvent }: CalendarViewProps) {
  // Hardcode starting calendar point around mock events to optimize demonstration
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 18)); // July 18, 2026 (matching time metadata)

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Total days in current month
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  // Day index of the first day of the month (e.g. 0 for Sun, 1 for Mon)
  const getFirstDayOfMonth = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Selected Day Details
  const [selectedDayEvents, setSelectedDayEvents] = useState<CollegeEvent[] | null>(null);
  const [selectedDayNum, setSelectedDayNum] = useState<number | null>(null);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayEvents(null);
    setSelectedDayNum(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayEvents(null);
    setSelectedDayNum(null);
  };

  // Check category color dots
  const getDotColor = (category: string) => {
    switch (category) {
      case 'Technical': return 'bg-blue-500';
      case 'Cultural': return 'bg-pink-500';
      case 'Sports': return 'bg-emerald-500';
      case 'Workshop': return 'bg-purple-500';
      case 'Academic': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const handleDayClick = (dayNum: number) => {
    const paddedMonth = String(month + 1).padStart(2, '0');
    const paddedDay = String(dayNum).padStart(2, '0');
    const clickedDateStr = `${year}-${paddedMonth}-${paddedDay}`;
    
    const dayEvents = events.filter(e => e.date === clickedDateStr && e.published);
    setSelectedDayEvents(dayEvents.length > 0 ? dayEvents : null);
    setSelectedDayNum(dayNum);
  };

  // Calendar cells generation
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push(i);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Calendar Grid Container (Span 2 columns on lg) */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="flex space-x-1">
            <button
              id="prev-month-btn"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              id="next-month-btn"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Days of Week Headers */}
          {daysOfWeek.map(day => (
            <div key={day} className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-1">
              {day}
            </div>
          ))}

          {/* Grid Cells */}
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/40 dark:bg-slate-950/20 rounded-md"></div>;
            }

            const paddedMonth = String(month + 1).padStart(2, '0');
            const paddedDay = String(day).padStart(2, '0');
            const dateStr = `${year}-${paddedMonth}-${paddedDay}`;
            const dayEvents = events.filter(e => e.date === dateStr && e.published);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = selectedDayNum === day;

            return (
              <button
                id={`calendar-day-${day}`}
                key={`day-${day}`}
                onClick={() => handleDayClick(day)}
                type="button"
                className={`aspect-square p-1 rounded-lg flex flex-col justify-between items-center transition-all relative border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : isToday
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 text-blue-700 dark:text-blue-400'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xs font-medium">{day}</span>

                {/* Event category indicator dots */}
                <div className="flex space-x-0.5 justify-center mt-1 max-w-full overflow-hidden">
                  {dayEvents.map(e => (
                    <span
                      key={e.id}
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : getDotColor(e.category)}`}
                      title={`${e.title} (${e.category})`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Agenda Side Panel */}
      <div className="border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-6 flex flex-col h-full">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 flex items-center space-x-1.5">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Agenda for {selectedDayNum ? `${monthNames[month]} ${selectedDayNum}, ${year}` : 'Selected Date'}</span>
        </h4>

        {selectedDayNum === null ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <CalendarIcon className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Click any calendar day to discover scheduled campus activities.
            </p>
          </div>
        ) : selectedDayEvents === null ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-850">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No events scheduled</p>
            <p className="text-[10px] text-slate-400 mt-0.5">There are no events registered for this date.</p>
          </div>
        ) : (
          <div className="space-y-3 flex-grow overflow-y-auto max-h-[250px] lg:max-h-none pr-1">
            {selectedDayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onSelectEvent?.(event)}
                className="p-3 bg-slate-50 hover:bg-blue-50/40 dark:bg-slate-800/40 dark:hover:bg-slate-850/50 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${getDotColor(event.category)}`} />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{event.category}</span>
                </div>
                <h5 className="text-xs font-bold text-slate-950 dark:text-white mt-1 line-clamp-1">{event.title}</h5>
                
                <div className="flex flex-col mt-2 gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{event.time} Hrs</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
