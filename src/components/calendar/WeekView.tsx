// Week View - per prd.md §3️⃣.E
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';

export default function WeekView() {
  const { currentDate, events } = useCalendarStore();

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="h-full flex flex-col p-4">
      <div className="grid grid-cols-7 gap-2 flex-1">
        {days.map((day) => {
          const dayEvents = events.filter((event) =>
            isSameDay(new Date(event.start_time), day)
          );
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`border border-border rounded-lg p-3 flex flex-col ${
                isTodayDate ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'
              }`}
            >
              <div className="text-center mb-3 pb-2 border-b border-border">
                <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                <div className={`text-2xl font-bold ${isTodayDate ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
              <div className="space-y-2 overflow-y-auto">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-sm bg-primary/20 text-primary px-2 py-2 rounded"
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {format(new Date(event.start_time), 'h:mm a')}
                    </div>
                  </div>
                ))}
                {dayEvents.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No events
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

