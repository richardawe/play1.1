// Task Filters - per prd.md task management
import { Filter } from 'lucide-react';

interface TaskFiltersProps {
  currentFilter: {
    status: 'all' | 'todo' | 'in_progress' | 'done';
    priority: 'all' | 'low' | 'medium' | 'high';
  };
  onFilterChange: (filter: {
    status: 'all' | 'todo' | 'in_progress' | 'done';
    priority: 'all' | 'low' | 'medium' | 'high';
  }) => void;
}

export default function TaskFilters({ currentFilter, onFilterChange }: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
      <Filter className="w-4 h-4 text-muted-foreground" />
      
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Status:</label>
        <select
          value={currentFilter.status}
          onChange={(e) =>
            onFilterChange({
              ...currentFilter,
              status: e.target.value as 'all' | 'todo' | 'in_progress' | 'done',
            })
          }
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background"
        >
          <option value="all">All</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Priority:</label>
        <select
          value={currentFilter.priority}
          onChange={(e) =>
            onFilterChange({
              ...currentFilter,
              priority: e.target.value as 'all' | 'low' | 'medium' | 'high',
            })
          }
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background"
        >
          <option value="all">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
  );
}

