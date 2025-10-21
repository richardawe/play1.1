// Day View - per prd.md §3️⃣.E
import { format, isSameDay } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';

export default function DayView() {
  const { currentDate, events } = useCalendarStore();

  const dayEvents = events.filter((event) =>
    isSameDay(new Date(event.start_time), currentDate)
  );

  // Generate hourly slots
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="min-w-[600px]">
        {/* Day Header */}
        <div className="text-center mb-4 pb-4 border-b border-border">
          <div className="text-sm text-muted-foreground">{format(currentDate, 'EEEE')}</div>
          <div className="text-3xl font-bold">{format(currentDate, 'MMMM d, yyyy')}</div>
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((event) => {
              const eventHour = new Date(event.start_time).getHours();
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex gap-4">
                <div className="w-20 text-sm text-muted-foreground pt-2">
                  {format(new Date().setHours(hour, 0), 'h:mm a')}
                </div>
                <div className="flex-1 min-h-[60px] border border-border rounded-lg p-2">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-primary/20 text-primary p-2 rounded mb-2"
                    >
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs opacity-75">
                        {format(new Date(event.start_time), 'h:mm a')} -{' '}
                        {format(new Date(event.end_time), 'h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

