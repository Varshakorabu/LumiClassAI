import React, { useEffect } from 'react';
import { Bell, MapPin, User, Clock, X, Volume2 } from 'lucide-react';
import { TriggeredNotification } from '../types';
import { playNotificationChime, speakNotification } from '../utils/timeUtils';

interface Props {
  notification: TriggeredNotification | null;
  onDismiss: () => void;
  soundEnabled: boolean;
  speechEnabled: boolean;
  onOpenSchedule?: () => void;
}

export const NotificationToast: React.FC<Props> = ({
  notification,
  onDismiss,
  soundEnabled,
  speechEnabled,
  onOpenSchedule,
}) => {
  useEffect(() => {
    if (!notification) return;

    if (soundEnabled) {
      playNotificationChime();
    }

    if (speechEnabled) {
      speakNotification(
        `Upcoming class alert. ${notification.subject} starts in ${notification.minutesRemaining} minutes at ${notification.room || 'assigned hall'}.`
      );
    }
  }, [notification, soundEnabled, speechEnabled]);

  if (!notification) return null;

  return (
    <div
      id="notification-toast-container"
      className="fixed top-20 right-4 md:right-8 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300 pointer-events-auto"
      role="alert"
    >
      <div className="bg-white border-2 border-blue-500 rounded-2xl shadow-2xl p-5 relative overflow-hidden backdrop-blur-md">
        {/* Glowing top accent strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-pulse" />

        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shrink-0 animate-bounce">
            <Bell className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                {notification.minutesRemaining === 0
                  ? 'Class Starting Now'
                  : notification.minutesRemaining <= 5
                  ? `${notification.minutesRemaining}-Minute Class Alert`
                  : 'Upcoming Class Alert'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {notification.timestamp}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {notification.subject}
            </h3>

            <p className="text-xs text-slate-600 mt-1">
              {notification.minutesRemaining === 0 ? (
                <span className="font-semibold text-emerald-700">Class has started! Please head to your room.</span>
              ) : (
                <>
                  Starts in <span className="font-bold text-indigo-700">{notification.minutesRemaining} minute{notification.minutesRemaining === 1 ? '' : 's'}</span>. Get your materials ready!
                </>
              )}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{notification.startTime}</span>
              </div>

              <div className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{notification.room || 'Room TBA'}</span>
              </div>

              {notification.faculty && (
                <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-[120px]">{notification.faculty}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  id="replay-toast-sound-btn"
                  onClick={() => playNotificationChime()}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Replay Chime"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {onOpenSchedule && (
                  <button
                    onClick={onOpenSchedule}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View in Timetable
                  </button>
                )}
              </div>

              <button
                id="toast-dismiss-action-btn"
                onClick={onDismiss}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
              >
                I'm On My Way
              </button>
            </div>
          </div>

          <button
            id="toast-close-x-btn"
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            aria-label="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
