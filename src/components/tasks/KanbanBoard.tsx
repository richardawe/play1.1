// Kanban Board - per prd.md §3️⃣.D and test-spec.md TC-P4.1.x
import { useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useTaskStore } from '../../store/useTaskStore';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import { useState } from 'react';
import { Task } from '../../types/task';

interface KanbanBoardProps {
  filters?: {
    status: 'all' | 'todo' | 'in_progress' | 'done';
    priority: 'all' | 'low' | 'medium' | 'high';
  };
}

export default function KanbanBoard({ filters }: KanbanBoardProps) {
  const { tasks, loadTasks, moveTask } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    if (filters) {
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }
      // Status filter applied at column level
    }
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as 'todo' | 'in_progress' | 'done';

    // Find the task's current status
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveTask(taskId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto">
        <KanbanColumn
          id="todo"
          title="To Do"
          tasks={todoTasks}
          count={todoTasks.length}
        />
        <KanbanColumn
          id="in_progress"
          title="In Progress"
          tasks={inProgressTasks}
          count={inProgressTasks.length}
        />
        <KanbanColumn
          id="done"
          title="Done"
          tasks={doneTasks}
          count={doneTasks.length}
        />
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

