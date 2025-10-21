// Kanban Column - per prd.md §3️⃣.D
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../types/task';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  count: number;
}

const columnColors = {
  todo: 'bg-blue-500/10 border-blue-500/30',
  in_progress: 'bg-yellow-500/10 border-yellow-500/30',
  done: 'bg-green-500/10 border-green-500/30',
};

export default function KanbanColumn({ id, title, tasks, count }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-[300px] flex flex-col">
      {/* Column Header */}
      <div className={`p-4 rounded-t-lg border-2 ${columnColors[id as keyof typeof columnColors] || 'bg-accent'}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm bg-background/50 px-2 py-1 rounded">{count}</span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className="flex-1 p-4 bg-card/50 border-2 border-t-0 border-border rounded-b-lg overflow-y-auto"
        data-column={id}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>No tasks</p>
                <p className="text-xs mt-1">Drag tasks here</p>
              </div>
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

