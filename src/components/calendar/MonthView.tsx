// Month View - per prd.md §3️⃣.E
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';

export default function MonthView() {
  const { currentDate, events } = useCalendarStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Pad start to align with correct day of week
  const startDay = monthStart.getDay();
  const paddingDays = Array(startDay).fill(null);

  return (
    <div className="h-full flex flex-col p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 flex-1">
        {paddingDays.map((_, i) => (
          <div key={`padding-${i}`} className="border border-border/50 rounded-lg bg-muted/20" />
        ))}
        {days.map((day) => {
          const dayEvents = events.filter((event) =>
            isSameDay(new Date(event.start_time), day)
          );
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`border border-border rounded-lg p-2 ${
                isCurrentMonth ? 'bg-card' : 'bg-muted/20'
              } ${isTodayDate ? 'ring-2 ring-primary' : ''} hover:bg-accent/50 transition-colors`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isTodayDate ? 'text-primary font-bold' : ''
                } ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs bg-primary/20 text-primary px-2 py-1 rounded truncate"
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

