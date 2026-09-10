import React from 'react';
import {
  Bell,
  Clock,
  MapPin,
  User,
  FastForward,
  Play,
  RotateCcw
} from 'lucide-react';
import { ClassItem, DayOfWeek } from '../types';
import { formatTimeDisplay } from '../utils/timeUtils';

interface Props {
  ongoingClass?: ClassItem | null;
  nextClass: ClassItem | null;
  minutesRemaining: number | null;
  currentDay: DayOfWeek;
  currentTimeStr: string;
  isSimulatedTime: boolean;
  onToggleSimulatedTime: (simulated: boolean) => void;
  onSetSimulatedTime: (day: DayOfWeek, timeStr: string) => void;
  onTriggerTestNotification: () => void;
  onOpenExplainer: () => void;
}

export const UpcomingClassBanner: React.FC<Props> = ({
  ongoingClass,
  nextClass,
  minutesRemaining,
  currentDay,
  currentTimeStr,
  isSimulatedTime,
  onToggleSimulatedTime,
  onSetSimulatedTime,
  onTriggerTestNotification,
  onOpenExplainer,
}) => {
  const is5MinWindow = minutesRemaining !== null && minutesRemaining <= 5 && minutesRemaining > 0;

  return (
    <div
      id="upcoming-class-banner"
      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Next Class Status */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3.5 rounded-2xl shrink-0 flex items-center justify-center transition-all ${
              is5MinWindow
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200 animate-pulse'
                : ongoingClass
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                : 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
            }`}
          >
            <Bell className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Live Scheduler
              </span>

              {is5MinWindow ? (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 rounded-full animate-bounce">
                  🔔 {minutesRemaining}-Min Class Alert Active!
                </span>
              ) : ongoingClass ? (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Class In Session Right Now
                </span>
              ) : nextClass ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                  Upcoming Class Detected
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded-full">
                  No more classes today
                </span>
              )}

              <button
                id="banner-how-it-works-btn"
                onClick={onOpenExplainer}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 ml-1"
              >
                How notifications work ↗
              </button>
            </div>

            {/* Currently in session alert if applicable */}
            {ongoingClass && (
              <div className="mb-2 p-2 px-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 flex-wrap">
                <span className="font-bold text-emerald-800">Ongoing:</span>
                <span className="font-semibold">{ongoingClass.subject}</span>
                <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  {formatTimeDisplay(ongoingClass.startTime)} - {formatTimeDisplay(ongoingClass.endTime)}
                </span>
                {ongoingClass.room && (
                  <span className="text-[11px] text-emerald-800 bg-white border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                    📍 {ongoingClass.room}
                  </span>
                )}
              </div>
            )}

            {nextClass ? (
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  {ongoingClass ? `Next: ${nextClass.subject}` : nextClass.subject}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs flex-wrap text-slate-600">
                  <div className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {formatTimeDisplay(nextClass.startTime)} - {formatTimeDisplay(nextClass.endTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{nextClass.room || 'Room TBA'}</span>
                  </div>

                  {nextClass.faculty && (
                    <div className="flex items-center gap-1 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{nextClass.faculty}</span>
                    </div>
                  )}

                  {minutesRemaining !== null && minutesRemaining > 0 && (
                    <span
                      className={`font-bold ${
                        minutesRemaining <= 5 ? 'text-rose-600 font-extrabold' : 'text-blue-700'
                      }`}
                    >
                      (Starts in {minutesRemaining} min)
                    </span>
                  )}
                </div>
              </div>
            ) : !ongoingClass ? (
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  You are all caught up for {currentDay}!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  No upcoming classes remaining today. Check your schedule for upcoming days below.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right: Simulation Controls & Trigger Test */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {/* Clock Mode Controller */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <FastForward className="w-3.5 h-3.5 text-indigo-600" />
                Clock Mode:
              </span>
              <button
                id="toggle-sim-clock-btn"
                onClick={() => onToggleSimulatedTime(!isSimulatedTime)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                  isSimulatedTime
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isSimulatedTime ? 'Time Travel (SIM)' : 'Live System Time'}
              </button>
            </div>

            {isSimulatedTime ? (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    id="sim-jump-955-btn"
                    onClick={() => onSetSimulatedTime('Monday', '09:55')}
                    className="px-2 py-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded text-[11px] font-semibold transition-colors"
                    title="Jump to Monday 9:55 AM (5 min before 10 AM class)"
                  >
                    ⚡ Mon 9:55 AM (Demo)
                  </button>
                  <button
                    id="sim-jump-1055-btn"
                    onClick={() => onSetSimulatedTime('Monday', '10:55')}
                    className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded text-[11px] transition-colors"
                    title="Jump to Mon 10:55 AM (before 11 AM class)"
                  >
                    Mon 10:55 AM
                  </button>
                </div>
                <button
                  onClick={() => onToggleSimulatedTime(false)}
                  className="w-full text-center text-[10px] text-amber-800 font-semibold underline underline-offset-2 pt-0.5"
                >
                  Return to Live Real-Time Clock ↻
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Live: {currentDay} {formatTimeDisplay(currentTimeStr)}
              </div>
            )}
          </div>

          {/* Trigger Alert Now Button */}
          <button
            id="quick-trigger-test-btn"
            onClick={onTriggerTestNotification}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
            title="Fire a realistic 5-minute upcoming class chime based on current time"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test 5-Min Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};
