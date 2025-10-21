// Calendar View - per prd.md §3️⃣.E and test-spec.md TC-P5.1.x
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Download, Upload } from 'lucide-react';
import { useCalendarStore } from '../../store/useCalendarStore';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import EventModal from './EventModal';
// import ICSManager from './ICSManager';
// import ClearWorkspaceButton from '../common/ClearWorkspaceButton';
import { useTextSelection } from '../../hooks/useTextSelection';
import CrossModuleActions from '../common/CrossModuleActions';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { invoke } from '@tauri-apps/api/tauri';

export default function CalendarView() {
  const { currentView, currentDate, setView, setCurrentDate, loadEvents } = useCalendarStore();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Enable text selection for cross-module actions
  useTextSelection({
    module: 'calendar',
    sourceType: 'calendar-interface'
  });

  // Load events when date or view changes
  useEffect(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    loadEvents(start.toISOString(), end.toISOString());
  }, [currentDate, loadEvents]);

  const handleClearAll = async () => {
    await invoke('clear_all_events');
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    await loadEvents(start.toISOString(), end.toISOString());
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="card-play border-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-orange-500/30">
                <Plus className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {format(currentDate, 'MMMM yyyy')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Plan work sessions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                className="p-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <button
                onClick={handleToday}
                className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl hover:shadow-play-glow transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
              >
                Today
              </button>
              
              <button
                onClick={handleNext}
                className="p-3 bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-xl border border-white/30 dark:border-gray-700/30 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="card-play border-0">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearAll}
                className="group flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 active:scale-95"
                title="Clear all events"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Clear All</span>
              </button>
              
              <button className="group flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 hover:scale-105 active:scale-95">
                <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Export ICS</span>
              </button>
              
              <button className="group flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 active:scale-95">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Import ICS</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-white/50 dark:bg-gray-800/50 rounded-xl p-1 backdrop-blur-sm">
                {(['day', 'week', 'month'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setView(view)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      currentView === view
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-play-glow'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setIsEventModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-hidden">
        <div className="card-play border-0 h-full">
          <div className="p-6 h-full">
            <div className="mb-4">
              <CrossModuleActions
                content=""
                module="calendar"
                variant="compact"
              />
            </div>
            {currentView === 'month' && <MonthView />}
            {currentView === 'week' && <WeekView />}
            {currentView === 'day' && <DayView />}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={() => setIsEventModalOpen(false)}
      />
    </div>
  );
}