// Event Modal - per prd.md §3️⃣.E
import { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { useCalendarStore } from '../../store/useCalendarStore';
import { CreateEvent } from '../../types/event';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EventModal({ isOpen, onClose, onSave }: EventModalProps) {
  const { createEvent, currentDate } = useCalendarStore();
  const [formData, setFormData] = useState<CreateEvent>({
    title: '',
    description: '',
    start_time: format(currentDate, "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(currentDate.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"), // +1 hour
    reminder_time: null,
    recurrence: null,
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      await createEvent(formData);
      setFormData({
        title: '',
        description: '',
        start_time: format(currentDate, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(currentDate.getTime() + 3600000), "yyyy-MM-dd'T'HH:mm"),
        reminder_time: null,
        recurrence: null,
      });
      onSave();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">New Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
              className="w-full p-2 border border-border rounded-lg bg-background"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details..."
              className="w-full p-2 border border-border rounded-lg bg-background resize-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Start</label>
              <input
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End</label>
              <input
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || saving}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

