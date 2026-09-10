import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { UpcomingClassBanner } from './components/UpcomingClassBanner';
import { ScheduleIntelligenceCard } from './components/ScheduleIntelligenceCard';
import { TimetableGrid } from './components/TimetableGrid';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { AuthModal } from './components/AuthModal';
import { TimetableUploadModal } from './components/TimetableUploadModal';
import { NotificationExplainerModal } from './components/NotificationExplainerModal';
import { NotificationToast } from './components/NotificationToast';
import {
  ClassItem,
  DayOfWeek,
  UserProfile,
  NotificationSettings,
  TriggeredNotification
} from './types';
import { INITIAL_CLASSES, DEFAULT_USER } from './utils/initialData';
import {
  DAYS_OF_WEEK,
  timeToMinutes,
  minutesToTimeStr,
  detectScheduleConflicts,
  detectParallelBatches,
  detectMissingInfo,
  formatTimeDisplay,
  isClassForBatch,
  getBatchFromClass,
  getAvailableBatches,
  detectDivision
} from './utils/timeUtils';

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('smartclass_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (
          !u.name ||
          u.name.toLowerCase() === 'varshakorabu56' ||
          u.name.toLowerCase().startsWith('varshakorabu') ||
          u.email?.toLowerCase().includes('varshakorabu')
        ) {
          u.name = 'Varsha Korabu';
          localStorage.setItem('smartclass_user', JSON.stringify(u));
        }
        return u;
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER;
  });

  // Timetable Classes State
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const saved = localStorage.getItem('smartclass_classes');
    return saved ? JSON.parse(saved) : INITIAL_CLASSES;
  });

  // Persist classes
  useEffect(() => {
    localStorage.setItem('smartclass_classes', JSON.stringify(classes));
  }, [classes]);

  // Persist user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('smartclass_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('smartclass_user');
    }
  }, [currentUser]);

  // Selected Day View Tab
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'All'>('All');

  // Selected Student Batch (All, C1, C2)
  const [selectedBatch, setSelectedBatch] = useState<string>(() => {
    const saved = localStorage.getItem('smartclass_batch');
    return saved || 'All';
  });

  // Persist batch preference
  useEffect(() => {
    localStorage.setItem('smartclass_batch', selectedBatch);
  }, [selectedBatch]);

  // Dynamic Batch & Division Detection
  const availableBatches = useMemo(() => getAvailableBatches(classes), [classes]);
  const detectedDivisionName = useMemo(() => detectDivision(classes), [classes]);

  // Synchronize batch selection when timetable division changes
  useEffect(() => {
    if (
      selectedBatch !== 'All' &&
      availableBatches.length > 0 &&
      !availableBatches.includes(selectedBatch)
    ) {
      setSelectedBatch('All');
    }
  }, [availableBatches, selectedBatch]);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExplainerModalOpen, setIsExplainerModalOpen] = useState(false);

  // Notification Settings State
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    leadMinutes: 5,
    soundEnabled: true,
    browserNotifications: false,
    inAppBanner: true,
    speechAudio: true,
  });

  // Active Toast & Notification History
  const [activeToast, setActiveToast] = useState<TriggeredNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<TriggeredNotification[]>([]);
  const [notifiedClassesSet, setNotifiedClassesSet] = useState<Set<string>>(new Set());

  // Clock state (Real-Time vs Simulated Time Machine)
  // Default to false (Live real-time system clock) so it matches actual clock at 10:33 AM
  const [isSimulatedTime, setIsSimulatedTime] = useState<boolean>(() => {
    const saved = localStorage.getItem('lumiclass_simulated_mode');
    return saved === 'true';
  });
  const [simulatedDay, setSimulatedDay] = useState<DayOfWeek>('Monday');
  const [simulatedTimeStr, setSimulatedTimeStr] = useState<string>('09:55'); // 9:55 AM demo preset
  const [realClock, setRealClock] = useState<Date>(new Date());

  // Update real-time clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRealClock(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulatedTime = (sim: boolean) => {
    setIsSimulatedTime(sim);
    localStorage.setItem('lumiclass_simulated_mode', sim ? 'true' : 'false');
  };

  // Compute active day and time
  const currentDay: DayOfWeek = useMemo(() => {
    if (isSimulatedTime) return simulatedDay;
    const dayIndex = realClock.getDay();
    // Sunday is 0, Monday is 1, etc.
    const map: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return map[dayIndex];
  }, [isSimulatedTime, simulatedDay, realClock]);

  const currentTimeStr: string = useMemo(() => {
    if (isSimulatedTime) return simulatedTimeStr;
    const h = realClock.getHours().toString().padStart(2, '0');
    const m = realClock.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }, [isSimulatedTime, simulatedTimeStr, realClock]);

  // Conflicts, Parallel Batches, and Missing Info
  const conflicts = useMemo(() => detectScheduleConflicts(classes, selectedBatch), [classes, selectedBatch]);
  const parallelBatches = useMemo(() => detectParallelBatches(classes), [classes]);
  const missingInfo = useMemo(() => detectMissingInfo(classes), [classes]);

  // Find ongoing class and nearest upcoming class for current day (respecting selected batch)
  const { ongoingClass, nextClass, minutesRemaining } = useMemo(() => {
    const todayClasses = classes
      .filter((c) => c.day === currentDay && isClassForBatch(c, selectedBatch))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const currentMinutes = timeToMinutes(currentTimeStr);

    let ongoing: ClassItem | null = null;
    let next: ClassItem | null = null;
    let remaining: number | null = null;

    for (const c of todayClasses) {
      const startMin = timeToMinutes(c.startTime);
      const endMin = timeToMinutes(c.endTime);

      // Check if currently ongoing (in session)
      if (currentMinutes >= startMin && currentMinutes < endMin && !ongoing) {
        ongoing = c;
      }

      // Check if starting strictly in the future
      if (startMin > currentMinutes && !next) {
        next = c;
        remaining = startMin - currentMinutes;
      }
    }

    return { ongoingClass: ongoing, nextClass: next, minutesRemaining: remaining };
  }, [classes, currentDay, currentTimeStr, selectedBatch]);

  // Dispatch a notification
  const triggerNotificationAlert = useCallback(
    (subject: string, room: string, faculty: string, startTime: string, minutes: number) => {
      const formattedStart = formatTimeDisplay(startTime);
      const formattedCurrent = formatTimeDisplay(currentTimeStr);
      const notification: TriggeredNotification = {
        id: `notif_${Date.now()}`,
        timestamp: formattedCurrent,
        title: minutes === 0 ? `Class Starting Now: ${subject}` : `Upcoming Class: ${subject}`,
        body: minutes === 0
          ? `${subject} is starting now at ${room || 'assigned hall'}.`
          : `${subject} starts in ${minutes} minute${minutes === 1 ? '' : 's'} at ${room || 'assigned hall'}.`,
        subject,
        room,
        faculty,
        startTime: formattedStart,
        minutesRemaining: minutes,
        read: false,
      };

      setActiveToast(notification);
      setNotificationHistory((prev) => [notification, ...prev.slice(0, 19)]);

      // Browser Push Notification if granted
      if (settings.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.body,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore if denied in iframe
        }
      }
    },
    [currentTimeStr, settings.browserNotifications]
  );

  // Background scheduler: check for 5-minute threshold
  useEffect(() => {
    if (!settings.enabled || !nextClass || minutesRemaining === null) return;

    // Target lead minutes (default 5): must be strictly positive (> 0) and <= leadMinutes
    if (minutesRemaining <= settings.leadMinutes && minutesRemaining > 0) {
      const key = `${currentDay}_${nextClass.id}_${nextClass.startTime}_${minutesRemaining}min`;
      if (!notifiedClassesSet.has(key)) {
        triggerNotificationAlert(
          nextClass.subject,
          nextClass.room,
          nextClass.faculty,
          nextClass.startTime,
          minutesRemaining
        );
        setNotifiedClassesSet((prev) => new Set(prev).add(key));
      }
    }
  }, [nextClass, minutesRemaining, currentDay, settings.enabled, settings.leadMinutes, notifiedClassesSet, triggerNotificationAlert]);

  // Quick test notification trigger: calculates realistic 5-min alert from current clock
  const handleTriggerTest = (customSub?: string, customRoom?: string, customFac?: string) => {
    const currentMins = timeToMinutes(currentTimeStr);
    const testStartMins = (currentMins + 5) % (24 * 60);
    const testStartTime = minutesToTimeStr(testStartMins);

    const sub = customSub || (nextClass ? nextClass.subject : ongoingClass ? `${ongoingClass.subject}` : 'Parallel Computing');
    const rm = customRoom || (nextClass ? nextClass.room : ongoingClass ? ongoingClass.room : 'A 215');
    const fac = customFac || (nextClass ? nextClass.faculty : ongoingClass ? ongoingClass.faculty : 'Mrs. Nazeera Madam');

    triggerNotificationAlert(sub, rm, fac, testStartTime, 5);
  };

  // Timetable modifications
  const handleTimetableImported = (importedClasses: ClassItem[], summary: string) => {
    setClasses(importedClasses);
    setSelectedBatch('All'); // Reset batch filter so all batches of newly imported division are visible
    setNotifiedClassesSet(new Set()); // Reset trigger locks
    triggerNotificationAlert(
      'Timetable Imported Successfully',
      summary || 'AI Timetable Analysis Complete',
      'LumiClass Scheduler',
      currentTimeStr,
      0
    );
  };

  const handleAddSingleClass = (item: ClassItem) => {
    setClasses((prev) => [...prev, item]);
  };

  const handleDeleteClass = (classId: string) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  const handleEditClass = (item: ClassItem) => {
    const newRoom = prompt('Update Classroom / Lab (e.g. Narendra Karmakar Lab, Lab 2):', item.room);
    if (newRoom === null) return;
    const currentBatch = item.batch || getBatchFromClass(item) || 'All';
    const newBatch = prompt('Assign Student Batch (e.g. C1, C2, All):', currentBatch);
    setClasses((prev) =>
      prev.map((c) =>
        c.id === item.id
          ? {
              ...c,
              room: newRoom,
              batch: newBatch && newBatch !== 'All' ? newBatch.trim().toUpperCase() : undefined,
            }
          : c
      )
    );
  };

  const handleTimetableUpdatedByAi = (updatedClasses: ClassItem[], note: string) => {
    setClasses(updatedClasses);
    setNotifiedClassesSet(new Set());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenExplainer={() => setIsExplainerModalOpen(true)}
        notifications={notificationHistory}
        currentDay={currentDay}
        currentTimeStr={currentTimeStr}
        isSimulatedTime={isSimulatedTime}
        onToggleSimulatedTime={handleToggleSimulatedTime}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Banner: Upcoming Class & Live Scheduler Clock */}
        <UpcomingClassBanner
          ongoingClass={ongoingClass}
          nextClass={nextClass}
          minutesRemaining={minutesRemaining}
          currentDay={currentDay}
          currentTimeStr={currentTimeStr}
          isSimulatedTime={isSimulatedTime}
          onToggleSimulatedTime={handleToggleSimulatedTime}
          onSetSimulatedTime={(day, timeStr) => {
            setIsSimulatedTime(true);
            setSimulatedDay(day);
            setSimulatedTimeStr(timeStr);
            localStorage.setItem('lumiclass_simulated_mode', 'true');
          }}
          onTriggerTestNotification={() => handleTriggerTest()}
          onOpenExplainer={() => setIsExplainerModalOpen(true)}
        />

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column (8 cols): Conflicts, Audits, & Timetable Grid */}
          <div className="lg:col-span-8 space-y-6">
            {/* Schedule Intelligence & Conflict Auditor */}
            <ScheduleIntelligenceCard
              conflicts={conflicts}
              missingInfo={missingInfo}
              parallelBatches={parallelBatches}
              availableBatches={availableBatches}
              division={detectedDivisionName}
              selectedBatch={selectedBatch}
              onSelectBatch={setSelectedBatch}
            />

            {/* Timetable Grid & View Controller */}
            <TimetableGrid
              classes={classes}
              conflicts={conflicts}
              missingInfo={missingInfo}
              selectedDay={selectedDay}
              selectedBatch={selectedBatch}
              onSelectBatch={setSelectedBatch}
              onSelectDay={setSelectedDay}
              onDeleteClass={handleDeleteClass}
              onEditClass={handleEditClass}
              onOpenAddModal={() => setIsUploadModalOpen(true)}
            />
          </div>

          {/* Sidebar Column (4 cols): AI Assistant */}
          <div className="lg:col-span-4 space-y-6">
            {/* Natural-Language Schedule Assistant */}
            <AiAssistantPanel
              classes={classes}
              currentDay={currentDay}
              currentTimeStr={currentTimeStr}
              selectedBatch={selectedBatch}
              onTimetableUpdatedByAi={handleTimetableUpdatedByAi}
            />
          </div>
        </div>
      </main>

      {/* Floating Active 5-Minute Notification Toast */}
      <NotificationToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        soundEnabled={settings.soundEnabled}
        speechEnabled={settings.speechAudio}
        onOpenSchedule={() => {
          setSelectedDay(currentDay);
          setActiveToast(null);
        }}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(null)}
      />

      <TimetableUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTimetableImported={handleTimetableImported}
        onAddSingleClass={handleAddSingleClass}
      />

      <NotificationExplainerModal
        isOpen={isExplainerModalOpen}
        onClose={() => setIsExplainerModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onTriggerTestNotification={handleTriggerTest}
        notificationHistory={notificationHistory}
      />
    </div>
  );
}
