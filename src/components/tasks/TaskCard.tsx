// Task Card - per prd.md §3️⃣.D and test-spec.md TC-P4.1.x
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, AlertCircle, MoreHorizontal } from 'lucide-react';
import { Task } from '../../types/task';
import { formatRelativeTime } from '../../lib/utils';
import { useState } from 'react';
import LinkManager from '../linking/LinkManager';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityColors = {
  low: 'border-l-gray-400',
  medium: 'border-l-blue-500',
  high: 'border-l-red-500',
};

export default function TaskCard({ task, isDragging }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border-2 border-l-4 ${priorityColors[task.priority as keyof typeof priorityColors]} rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow ${!showDetails ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Drag Handle */}
      <div className="flex items-start gap-2" {...(!showDetails ? attributes : {})} {...(!showDetails ? listeners : {})}>
        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm mb-1 flex-1">{task.title}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="p-1 hover:bg-accent rounded"
              title="Show links"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>

          {/* Task Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Task Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            {/* Priority Badge */}
            <span
              className={`px-2 py-0.5 rounded ${
                task.priority === 'high'
                  ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                  : task.priority === 'medium'
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-500/20 text-gray-700 dark:text-gray-300'
              }`}
            >
              {task.priority}
            </span>

            {/* Due Date */}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatRelativeTime(task.due_date)}
              </span>
            )}

            {/* Reminder */}
            {task.reminder_time && (
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Reminder set
              </span>
            )}
          </div>

          {/* Link Manager */}
          {showDetails && (
            <LinkManager itemType="task" itemId={task.id} />
          )}
        </div>
      </div>
    </div>
  );
}

