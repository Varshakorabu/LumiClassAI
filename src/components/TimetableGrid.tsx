import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  HelpCircle,
  Search,
  Filter,
  Grid3X3,
  List,
  Users
} from 'lucide-react';
import { ClassItem, DayOfWeek, ScheduleConflict, MissingInfoItem } from '../types';
import {
  DAYS_OF_WEEK,
  formatTimeDisplay,
  getBatchFromClass,
  isClassForBatch,
  getAvailableBatches,
  detectDivision,
  getBatchesSummary,
  getBatchBadgeStyle,
} from '../utils/timeUtils';

interface Props {
  classes: ClassItem[];
  conflicts: ScheduleConflict[];
  missingInfo: MissingInfoItem[];
  selectedDay: DayOfWeek | 'All';
  selectedBatch?: string;
  onSelectBatch?: (batch: string) => void;
  onSelectDay: (day: DayOfWeek | 'All') => void;
  onDeleteClass: (classId: string) => void;
  onEditClass: (item: ClassItem) => void;
  onOpenAddModal: () => void;
}

export const TimetableGrid: React.FC<Props> = ({
  classes,
  conflicts,
  missingInfo,
  selectedDay,
  selectedBatch = 'All',
  onSelectBatch,
  onSelectDay,
  onDeleteClass,
  onEditClass,
  onOpenAddModal,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if a class has conflict
  const isConflicting = (classId: string) => {
    return conflicts.some((c) => c.classes.some((item) => item.id === classId));
  };

  // Check if a class has missing info
  const getMissingInfo = (classId: string) => {
    return missingInfo.filter((m) => m.classId === classId);
  };

  // Filter classes by day, batch, and search query
  const filteredClasses = classes.filter((c) => {
    const matchesDay = selectedDay === 'All' || c.day === selectedDay;
    const matchesBatch = isClassForBatch(c, selectedBatch);
    const query = searchQuery.toLowerCase();
    const batchTag = (c.batch || getBatchFromClass(c)).toLowerCase();
    const matchesSearch =
      !query ||
      c.subject.toLowerCase().includes(query) ||
      c.room.toLowerCase().includes(query) ||
      c.faculty.toLowerCase().includes(query) ||
      c.day.toLowerCase().includes(query) ||
      batchTag.includes(query);
    return matchesDay && matchesBatch && matchesSearch;
  });

  // Available batches and division detected dynamically from classes
  const detectedBatches = getAvailableBatches(classes);
  const detectedDivisionName = detectDivision(classes);
  const batchSummary = getBatchesSummary(detectedBatches);

  // Group by day for structured display
  const daysToShow: DayOfWeek[] =
    selectedDay === 'All'
      ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      : [selectedDay];

  return (
    <div id="timetable-grid-section" className="space-y-4">
      {/* Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              id="day-tab-all"
              onClick={() => onSelectDay('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedDay === 'All'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Week
            </button>
            {DAYS_OF_WEEK.slice(0, 5).map((day) => {
              const count = classes.filter((c) => c.day === day && isClassForBatch(c, selectedBatch)).length;
              return (
                <button
                  key={day}
                  id={`day-tab-${day.toLowerCase()}`}
                  onClick={() => onSelectDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    selectedDay === day
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{day}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedDay === day ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, View Switcher & Add Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-timetable-input"
                type="text"
                placeholder="Search classes, rooms, batches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="view-mode-grid"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                id="view-mode-list"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              id="open-add-class-btn"
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>
        </div>

        {/* Batch Filter Bar */}
        {onSelectBatch && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-500 flex items-center gap-1 text-[11px]">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                {detectedDivisionName ? `${detectedDivisionName} Batches:` : 'Batches:'}
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-wrap gap-0.5">
                <button
                  onClick={() => onSelectBatch('All')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    selectedBatch === 'All'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Batches
                </button>
                {detectedBatches.map((b) => {
                  const style = getBatchBadgeStyle(b);
                  const isSelected = selectedBatch === b;
                  return (
                    <button
                      key={b}
                      onClick={() => onSelectBatch(b)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : style.dot
                        }`}
                      ></span>
                      Batch {b}
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="text-[11px] text-slate-500 italic">
              {selectedBatch === 'All'
                ? detectedBatches.length > 0
                  ? `Showing all batches (${batchSummary} parallel labs labeled)`
                  : 'Showing all sessions for the division'
                : `Showing timetable filtered for Batch ${selectedBatch}`}
            </span>
          </div>
        )}
      </div>

      {/* Main Schedule Content */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No classes found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No classes scheduled for the selected filter {selectedBatch !== 'All' ? `(Batch ${selectedBatch})` : ''}. Upload an image or add classes manually.
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Timetable Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Day Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {daysToShow.map((day) => {
            const dayClasses = filteredClasses
              .filter((c) => c.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={day}
                className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-xs flex flex-col min-h-[300px]"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{day}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                      {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>
                </div>

                {/* Day Class Cards */}
                <div className="space-y-2.5 flex-1">
                  {dayClasses.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Free day (No classes)
                    </div>
                  ) : (
                    dayClasses.map((item) => {
                      const conflict = isConflicting(item.id);
                      const missing = getMissingInfo(item.id);
                      const batchTag = item.batch || getBatchFromClass(item);

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl p-3 border transition-all relative group text-xs ${
                            conflict
                              ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                              : 'bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-sm border-slate-200'
                          }`}
                          style={{ borderLeftWidth: '4px', borderLeftColor: conflict ? '#ef4444' : item.color || '#3b82f6' }}
                        >
                          {/* Badges */}
                          <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-700 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                              {formatTimeDisplay(item.startTime)} - {formatTimeDisplay(item.endTime)}
                            </span>

                            <div className="flex items-center gap-1">
                              {batchTag && (
                                <span
                                  className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                    getBatchBadgeStyle(batchTag).bg
                                  } ${getBatchBadgeStyle(batchTag).text} ${
                                    getBatchBadgeStyle(batchTag).border
                                  }`}
                                >
                                  Batch {batchTag}
                                </span>
                              )}

                              {item.type && (
                                <span className="text-[9px] uppercase font-extrabold tracking-wider bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded">
                                  {item.type}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Subject */}
                          <h4 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                            {item.subject}
                          </h4>

                          {/* Room & Faculty */}
                          <div className="mt-2 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {item.room ? (
                                <span className="font-semibold text-slate-800">{item.room}</span>
                              ) : (
                                <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded flex items-center gap-0.5">
                                  <HelpCircle className="w-3 h-3 text-amber-500" />
                                  Room unavailable
                                </span>
                              )}
                            </div>

                            {item.faculty ? (
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{item.faculty}</span>
                              </div>
                            ) : (
                              <div className="text-slate-400 text-[10px] italic">
                                Faculty TBA
                              </div>
                            )}
                          </div>

                          {/* Conflict Alert Flag */}
                          {conflict && (
                            <div className="mt-2 pt-1.5 border-t border-rose-200 flex items-center gap-1 text-[10px] font-bold text-rose-700">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Double Booking Conflict!</span>
                            </div>
                          )}

                          {/* Actions Hover Strip */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditClass(item)}
                              className="text-slate-400 hover:text-blue-600 p-1 rounded transition-colors"
                              title="Edit Class"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteClass(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              title="Delete Class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Agenda View */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs divide-y divide-slate-100">
          {filteredClasses.map((item) => {
            const conflict = isConflicting(item.id);
            const batchTag = item.batch || getBatchFromClass(item);

            return (
              <div
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors hover:bg-slate-50/70 ${
                  conflict ? 'bg-rose-50/50' : ''
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className="w-2.5 h-12 rounded-full shrink-0"
                    style={{ backgroundColor: conflict ? '#ef4444' : item.color || '#3b82f6' }}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {item.day}
                      </span>
                      <span className="font-mono text-slate-600">
                        {formatTimeDisplay(item.startTime)} - {formatTimeDisplay(item.endTime)}
                      </span>
                      {batchTag && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            getBatchBadgeStyle(batchTag).bg
                          } ${getBatchBadgeStyle(batchTag).text} ${
                            getBatchBadgeStyle(batchTag).border
                          }`}
                        >
                          Batch {batchTag}
                        </span>
                      )}
                      {conflict && (
                        <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Conflict Detected
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">{item.subject}</h4>
                    <div className="flex items-center gap-4 text-slate-500 mt-1 flex-wrap">
                      <span>📍 {item.room || 'Room information unavailable'}</span>
                      {item.faculty && <span>👤 {item.faculty}</span>}
                      {item.type && <span className="uppercase text-[10px]">{item.type}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onEditClass(item)}
                    className="px-2.5 py-1 text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteClass(item.id)}
                    className="px-2.5 py-1 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
