export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ClassItem {
  id: string;
  day: DayOfWeek;
  startTime: string; // "HH:MM" 24h format
  endTime: string;   // "HH:MM" 24h format
  subject: string;
  subjectCode?: string;
  faculty: string;
  room: string;
  color: string;
  type?: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  batch?: string;    // e.g. "A1", "A2", "B1", "B2", "C1", "C2", "All"
  division?: string; // e.g. "Division A", "Division B", "Division C"
  notes?: string;
}

export interface ParallelBatchGroup {
  id: string;
  day: DayOfWeek;
  timeSlot: string;
  classes: ClassItem[];
  description: string;
  batches?: string[]; // e.g. ["B1", "B2"] or ["A1", "A2"]
}

export interface ScheduleConflict {
  id: string;
  day: DayOfWeek;
  timeSlot: string;
  classes: ClassItem[];
  description: string;
  isBatchParallel?: boolean;
}

export interface MissingInfoItem {
  classId: string;
  subject: string;
  day: DayOfWeek;
  timeSlot: string;
  missingField: 'room' | 'faculty' | 'time';
  description: string;
}

export interface TimetableParseResult {
  classes: ClassItem[];
  conflicts: ScheduleConflict[];
  parallelBatches?: ParallelBatchGroup[];
  missingInfoAlerts: MissingInfoItem[];
  summary: string;
  rawExtractedCount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department: string;
  semester: string;
  studentId: string;
  selectedBatch?: string; // 'All' | 'C1' | 'C2'
}

export interface NotificationSettings {
  enabled: boolean;
  leadMinutes: number; // e.g. 5 minutes before class
  soundEnabled: boolean;
  browserNotifications: boolean;
  inAppBanner: boolean;
  speechAudio: boolean;
}

export interface TriggeredNotification {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  subject: string;
  room: string;
  faculty: string;
  startTime: string;
  minutesRemaining: number;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
  timetableUpdated?: boolean;
}
