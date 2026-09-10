import { ClassItem, DayOfWeek, ScheduleConflict, MissingInfoItem, ParallelBatchGroup } from '../types';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function getBatchFromClass(c: ClassItem): string {
  if (c.batch && c.batch.trim()) {
    const trimmed = c.batch.trim();
    if (trimmed.toUpperCase() === 'ALL') return '';
    return trimmed.toUpperCase();
  }
  const text = `${c.subject || ''} ${c.notes || ''} ${c.room || ''}`;

  // Match any letter + number batch e.g. A1, A2, B1, B2, C1, C2, D1, D2
  const match = text.match(/\b(?:batch\s*[:\-]?)?([A-Za-z]\d+)\b/i);
  if (match) return match[1].toUpperCase();

  // Match "Batch 1", "Batch 2" etc.
  const numMatch = text.match(/\bbatch\s*[:\-]?\s*(\d+)\b/i);
  if (numMatch) return `B${numMatch[1]}`;

  return '';
}

export function getAvailableBatches(classes: ClassItem[]): string[] {
  const set = new Set<string>();
  for (const c of classes) {
    const b = getBatchFromClass(c);
    if (b && b !== 'ALL') {
      set.add(b);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function detectDivision(classes: ClassItem[]): string {
  // 1. Check if any class explicitly mentions division/sec in notes, subject, or room
  for (const c of classes) {
    const combined = `${c.notes || ''} ${c.subject || ''} ${c.division || ''}`;
    const divMatch = combined.match(/\b(?:div(?:ision)?|sec(?:tion)?)\s*[:\-]?\s*([A-Za-z])\b/i);
    if (divMatch) {
      return `Division ${divMatch[1].toUpperCase()}`;
    }
    if (c.division && c.division.trim()) {
      return c.division.trim();
    }
  }

  // 2. Infer from detected batches (e.g. A1/A2 -> Division A, B1/B2 -> Division B, C1/C2 -> Division C)
  const batches = getAvailableBatches(classes);
  if (batches.length > 0) {
    const letterCounts: Record<string, number> = {};
    for (const b of batches) {
      const firstLetter = b.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstLetter)) {
        letterCounts[firstLetter] = (letterCounts[firstLetter] || 0) + 1;
      }
    }
    const mostCommon = Object.entries(letterCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (mostCommon) {
      return `Division ${mostCommon}`;
    }
  }

  return 'Division C';
}

export function getBatchesSummary(batches: string[]): string {
  if (!batches || batches.length === 0) return '';
  if (batches.length === 1) return `Batch ${batches[0]}`;
  if (batches.length === 2) return `${batches[0]} & ${batches[1]}`;
  return batches.join(' & ');
}

export function getBatchBadgeStyle(batch: string): { bg: string; text: string; border: string; dot: string } {
  const b = (batch || '').toUpperCase();
  if (b.endsWith('1') || b.startsWith('A')) {
    return {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    };
  }
  if (b.endsWith('2') || b.startsWith('B')) {
    return {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
    };
  }
  if (b.endsWith('3') || b.startsWith('C')) {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    };
  }
  return {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  };
}

export function isClassForBatch(c: ClassItem, selectedBatch?: string): boolean {
  if (!selectedBatch || selectedBatch === 'All') return true;
  const batch = getBatchFromClass(c);
  if (!batch || batch === 'ALL') return true; // Lecture attended by all batches
  return batch.toUpperCase() === selectedBatch.toUpperCase();
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  // Handle formats like "09:00", "9:00", "09:00 AM", "2:30 PM", "14:00"
  const clean = timeStr.trim();
  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);
  const parts = clean.replace(/am|pm/gi, '').trim().split(':');
  let hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTimeDisplay(timeStr: string): string {
  const mins = timeToMinutes(timeStr);
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function detectScheduleConflicts(classes: ClassItem[], selectedBatch?: string): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  // Filter by batch if a student has selected a specific batch
  const activeClasses = selectedBatch && selectedBatch !== 'All'
    ? classes.filter((c) => isClassForBatch(c, selectedBatch))
    : classes;

  // Group by day
  const byDay: Record<string, ClassItem[]> = {};
  for (const c of activeClasses) {
    if (!byDay[c.day]) byDay[c.day] = [];
    byDay[c.day].push(c);
  }

  for (const [day, dayClasses] of Object.entries(byDay)) {
    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        const c1 = dayClasses[i];
        const c2 = dayClasses[j];

        const start1 = timeToMinutes(c1.startTime);
        const end1 = timeToMinutes(c1.endTime);
        const start2 = timeToMinutes(c2.startTime);
        const end2 = timeToMinutes(c2.endTime);

        // Overlap condition: start1 < end2 && start2 < end1
        if (start1 < end2 && start2 < end1) {
          const batch1 = getBatchFromClass(c1);
          const batch2 = getBatchFromClass(c2);

          // 1. If classes belong to distinct batches (e.g. C1 vs C2), they are PARALLEL BATCHES, NOT a conflict!
          if (batch1 && batch2 && batch1.toUpperCase() !== batch2.toUpperCase()) {
            continue; // Not a conflict!
          }

          // 2. If both are lab practicals in DIFFERENT rooms, they are parallel batches (e.g. C1 and C2 in separate labs)
          const isLab1 = c1.type === 'lab' || /lab/i.test(c1.subject) || /lab/i.test(c1.room);
          const isLab2 = c2.type === 'lab' || /lab/i.test(c2.subject) || /lab/i.test(c2.room);
          const differentRooms =
            c1.room &&
            c2.room &&
            c1.room.trim().toLowerCase() !== c2.room.trim().toLowerCase();

          if (isLab1 && isLab2 && differentRooms) {
            // Parallel lab sessions in separate labs (e.g. C1 & C2) - not a double booking!
            continue;
          }

          // True conflict: same batch or same student cohort double booked in time
          conflicts.push({
            id: `conflict-${c1.id}-${c2.id}`,
            day: day as DayOfWeek,
            timeSlot: `${formatTimeDisplay(c1.startTime)} - ${formatTimeDisplay(c1.endTime)} vs ${formatTimeDisplay(c2.startTime)} - ${formatTimeDisplay(c2.endTime)}`,
            classes: [c1, c2],
            description: `Overlap detected between "${c1.subject}" (${c1.room || 'No Room'}) and "${c2.subject}" (${c2.room || 'No Room'})`,
          });
        }
      }
    }
  }

  return conflicts;
}

export function detectParallelBatches(classes: ClassItem[]): ParallelBatchGroup[] {
  const groups: ParallelBatchGroup[] = [];

  const byDay: Record<string, ClassItem[]> = {};
  for (const c of classes) {
    if (!byDay[c.day]) byDay[c.day] = [];
    byDay[c.day].push(c);
  }

  for (const [day, dayClasses] of Object.entries(byDay)) {
    for (let i = 0; i < dayClasses.length; i++) {
      for (let j = i + 1; j < dayClasses.length; j++) {
        const c1 = dayClasses[i];
        const c2 = dayClasses[j];

        const start1 = timeToMinutes(c1.startTime);
        const end1 = timeToMinutes(c1.endTime);
        const start2 = timeToMinutes(c2.startTime);
        const end2 = timeToMinutes(c2.endTime);

        if (start1 < end2 && start2 < end1) {
          const batch1 = getBatchFromClass(c1);
          const batch2 = getBatchFromClass(c2);
          const isLab1 = c1.type === 'lab' || /lab/i.test(c1.subject) || /lab/i.test(c1.room);
          const isLab2 = c2.type === 'lab' || /lab/i.test(c2.subject) || /lab/i.test(c2.room);
          const differentRooms =
            c1.room &&
            c2.room &&
            c1.room.trim().toLowerCase() !== c2.room.trim().toLowerCase();

          if ((batch1 && batch2 && batch1 !== batch2) || (isLab1 && isLab2 && differentRooms)) {
            // Infer division letter if batches aren't fully tagged (e.g. Div B -> B1/B2, Div A -> A1/A2, Div C -> C1/C2)
            const divLetter = (detectDivision(classes).match(/[A-Za-z]$/)?.[0] || 'C').toUpperCase();
            const b1Name = batch1 || `${divLetter}1`;
            const b2Name = batch2 || (b1Name === `${divLetter}1` ? `${divLetter}2` : `${divLetter}1`);
            groups.push({
              id: `parallel-${c1.id}-${c2.id}`,
              day: day as DayOfWeek,
              timeSlot: `${formatTimeDisplay(c1.startTime)} – ${formatTimeDisplay(c1.endTime)}`,
              batches: [b1Name, b2Name],
              classes: [
                { ...c1, batch: b1Name },
                { ...c2, batch: b2Name },
              ],
              description: `Batch ${b1Name} (${c1.subject}) and Batch ${b2Name} (${c2.subject}) running simultaneously in separate venues.`,
            });
          }
        }
      }
    }
  }

  return groups;
}

export function detectMissingInfo(classes: ClassItem[]): MissingInfoItem[] {
  const items: MissingInfoItem[] = [];

  for (const c of classes) {
    const roomClean = (c.room || '').trim().toLowerCase();
    if (!roomClean || roomClean === 'tba' || roomClean === 'unknown' || roomClean === 'na' || roomClean === '-') {
      items.push({
        classId: c.id,
        subject: c.subject,
        day: c.day,
        timeSlot: `${formatTimeDisplay(c.startTime)} - ${formatTimeDisplay(c.endTime)}`,
        missingField: 'room',
        description: `Room information unavailable for ${c.subject} (${c.day} at ${formatTimeDisplay(c.startTime)})`,
      });
    }

    const facClean = (c.faculty || '').trim().toLowerCase();
    if (!facClean || facClean === 'tba' || facClean === 'unknown' || facClean === 'na' || facClean === '-') {
      items.push({
        classId: c.id,
        subject: c.subject,
        day: c.day,
        timeSlot: `${formatTimeDisplay(c.startTime)} - ${formatTimeDisplay(c.endTime)}`,
        missingField: 'faculty',
        description: `Faculty not assigned for ${c.subject} (${c.day})`,
      });
    }
  }

  return items;
}

/**
 * Play a professional notification chime using Web Audio API
 */
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth dual-tone pleasant campus bell (880Hz A5 -> 1318.5Hz E6)
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.9);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 1.2);
  } catch {
    // AudioContext blocked by browser autoplay policy until user gesture
  }
}

/**
 * Speak notification text using speech synthesis
 */
export function speakNotification(text: string) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  } catch {
    // ignore
  }
}
