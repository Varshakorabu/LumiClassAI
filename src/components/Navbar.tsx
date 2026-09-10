import React from 'react';
import {
  Bell,
  Sparkles,
  Calendar,
  User,
  UploadCloud,
  HelpCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, TriggeredNotification } from '../types';

interface Props {
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenUpload: () => void;
  onOpenExplainer: () => void;
  notifications: TriggeredNotification[];
  currentDay: string;
  currentTimeStr: string;
  isSimulatedTime: boolean;
  onToggleSimulatedTime?: (simulated: boolean) => void;
}

export function getUserDisplayName(user: UserProfile | null): string {
  if (!user) return 'Sign In';
  const rawName = user.name?.trim();
  if (rawName) {
    if (rawName.toLowerCase() === 'varshakorabu56' || rawName.toLowerCase().startsWith('varshakorabu')) {
      return 'Varsha Korabu';
    }
    if (rawName.includes('@')) {
      const part = rawName.split('@')[0].replace(/[0-9_.-]+/g, ' ').trim();
      return part.replace(/\b\w/g, (c) => c.toUpperCase()) || rawName;
    }
    if (/^[a-z]+[0-9]+$/i.test(rawName)) {
      const letters = rawName.replace(/[0-9]+/g, ' ').trim();
      return letters.replace(/\b\w/g, (c) => c.toUpperCase()) || rawName;
    }
    return rawName;
  }
  if (user.email) {
    if (user.email.toLowerCase().includes('varshakorabu')) {
      return 'Varsha Korabu';
    }
    const part = user.email.split('@')[0].replace(/[0-9_.-]+/g, ' ').trim();
    return part.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Student';
  }
  return 'Student';
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  onOpenAuth,
  onOpenUpload,
  onOpenExplainer,
  notifications,
  currentDay,
  currentTimeStr,
  isSimulatedTime,
  onToggleSimulatedTime,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = getUserDisplayName(currentUser);
  const avatarInitial = displayName !== 'Sign In' ? displayName[0].toUpperCase() : null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 relative">
            <Calendar className="w-5 h-5" />
            <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                LumiClass <span className="text-indigo-600 font-black">AI</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                Class &amp; Lab Companion
              </span>
            </div>
          </div>
        </div>

        {/* Live Clock & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Clock Display Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-xs font-mono text-slate-700 border border-slate-200">
            <Clock className={`w-3.5 h-3.5 ${isSimulatedTime ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}`} />
            <span className="font-semibold">{currentDay}</span>
            <span className="font-bold text-slate-900">{currentTimeStr}</span>
            {isSimulatedTime ? (
              <button
                id="nav-reset-sim-btn"
                onClick={() => onToggleSimulatedTime && onToggleSimulatedTime(false)}
                className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-bold uppercase transition-colors"
                title="Simulation Active. Click to sync to Real-Time Clock"
              >
                SIM • Reset ↻
              </button>
            ) : (
              <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded uppercase font-bold">
                Live
              </span>
            )}
          </div>

          {/* Add Timetable Button */}
          <button
            id="nav-add-timetable-btn"
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Add Timetable</span>
            <span className="sm:hidden">Upload</span>
          </button>

          {/* Notification Explainer / Bell Button */}
          <button
            id="nav-notification-bell-btn"
            onClick={onOpenExplainer}
            className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Notification Center & How Alerts Work"
            aria-label="Notification Center"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile / Auth Button */}
          <button
            id="nav-auth-profile-btn"
            onClick={onOpenAuth}
            className="flex items-center gap-2 p-1.5 pr-3 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl transition-colors text-xs font-semibold"
            title={currentUser ? `Signed in as ${displayName}` : 'Sign In'}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
              {avatarInitial ? avatarInitial : <User className="w-4 h-4" />}
            </div>
            <span className="max-w-[130px] truncate hidden md:inline">
              {displayName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
