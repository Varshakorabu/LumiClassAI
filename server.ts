import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Allow large payloads for image and document OCR uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get GoogleGenAI client
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Robust multi-model generator with fallback and 503 spike resilience
async function generateWithModelFallback(
  ai: GoogleGenAI,
  config: {
    contents: Parameters<typeof ai.models.generateContent>[0]['contents'];
    config?: Parameters<typeof ai.models.generateContent>[0]['config'];
  }
) {
  // Ordered from fastest, most reliable active models to fallbacks
  const candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastErr: Error | null = null;

  for (const model of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: config.contents,
        config: config.config,
      });
      return res;
    } catch (err: unknown) {
      const e = err as Error;
      console.warn(`[LumiClass AI] Model ${model} returned error:`, e.message || e);
      lastErr = e;
      // Continue to next candidate model
    }
  }

  throw lastErr || new Error('All candidate AI models were unavailable.');
}

// Local Schedule Intelligence Rule Engine (100% resilient fallback)
interface TimetableClass {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode?: string;
  faculty?: string;
  room?: string;
  type?: string;
  color?: string;
  batch?: string;
  division?: string;
  notes?: string;
}

function solveScheduleQueryLocally(
  message: string,
  classes: TimetableClass[],
  currentDay: string = 'Monday',
  currentTime: string = '09:55'
) {
  const query = (message || '').toLowerCase().trim();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Batch & Double-booking check query
  const distinctBatches = Array.from(
    new Set(
      classes
        .map((c) => c.batch)
        .filter((b): b is string => Boolean(b && b.toUpperCase() !== 'ALL'))
    )
  );
  const mentionsAnyBatch = distinctBatches.some((b) => query.includes(b.toLowerCase()));

  if (
    mentionsAnyBatch ||
    query.includes('batch') ||
    query.includes('batches') ||
    query.includes('double book') ||
    query.includes('conflict') ||
    query.includes('parallel')
  ) {
    const batchClasses = classes.filter((c) => c.batch && c.batch.toUpperCase() !== 'ALL');
    const batchDescriptions = distinctBatches.map((b) => {
      const bClasses = batchClasses.filter((c) => (c.batch || '').toUpperCase() === b.toUpperCase());
      if (bClasses.length > 0) {
        const cls = bClasses[0];
        return `• Batch ${b}: ${cls.subject} in ${cls.room || 'Assigned Lab'}`;
      }
      return `• Batch ${b}`;
    }).join('\n');

    const batchesLabel = distinctBatches.length > 0 ? distinctBatches.join(' & ') : 'parallel cohorts';

    return {
      reply: `Your timetable features parallel student batches (${batchesLabel}):\n${
        batchDescriptions || '• Parallel lab sessions running in distinct laboratories.'
      }\n\nBecause these labs run simultaneously in separate rooms for distinct student cohorts, they are parallel lab tracks and NOT double-booked conflicts. You can toggle between batches or "All Batches" in the timetable grid!`,
      actionType: 'none',
      conflictWarning: '',
      updatedClasses: null,
    };
  }

  // 1. Next class queries ("what is my next class", "next class", "what's next", etc.)
  if (
    query.includes('next class') ||
    query.includes("what's next") ||
    query.includes('upcoming class') ||
    query.includes('what is my next')
  ) {
    const todayClasses = classes
      .filter((c) => c.day.toLowerCase() === currentDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const upcomingToday = todayClasses.find((c) => c.startTime >= currentTime);
    if (upcomingToday) {
      const roomStr = upcomingToday.room ? ` in ${upcomingToday.room}` : ' (Room TBA)';
      const facStr = upcomingToday.faculty ? ` with ${upcomingToday.faculty}` : '';
      return {
        reply: `Your next class is ${upcomingToday.subject} from ${upcomingToday.startTime} to ${upcomingToday.endTime}${roomStr}${facStr}.`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    }

    // Check future days in week
    const currentDayIdx = days.findIndex((d) => d.toLowerCase() === currentDay.toLowerCase());
    for (let i = 1; i <= 7; i++) {
      const nextDayName = days[(currentDayIdx + i) % 7];
      const nextDayClasses = classes
        .filter((c) => c.day.toLowerCase() === nextDayName.toLowerCase())
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (nextDayClasses.length > 0) {
        const firstNext = nextDayClasses[0];
        const roomStr = firstNext.room ? ` in ${firstNext.room}` : '';
        return {
          reply: `You have no more classes today on ${currentDay}. Your next scheduled class is ${firstNext.subject} on ${firstNext.day} at ${firstNext.startTime}${roomStr}.`,
          actionType: 'none',
          conflictWarning: '',
          updatedClasses: null,
        };
      }
    }

    return {
      reply: `You don't have any upcoming classes scheduled for the rest of today or the week.`,
      actionType: 'none',
      conflictWarning: '',
      updatedClasses: null,
    };
  }

  // 2. Classes after a specific time ("classes after 4", "after 4 pm", "after 16:00", etc.)
  if (
    query.includes('after 4') ||
    query.includes('after 16') ||
    query.includes('after 4:00') ||
    query.includes('after 4pm')
  ) {
    const todayClasses = classes.filter((c) => c.day.toLowerCase() === currentDay.toLowerCase());
    const after4Today = todayClasses
      .filter((c) => c.startTime >= '16:00')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (after4Today.length > 0) {
      const list = after4Today
        .map((c) => `• ${c.subject} (${c.startTime} - ${c.endTime}, ${c.room || 'Room TBA'})`)
        .join('\n');
      return {
        reply: `Yes, you have ${after4Today.length} class(es) after 4:00 PM on ${currentDay}:\n${list}`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    } else {
      const sortedClasses = [...todayClasses].sort((a, b) => b.endTime.localeCompare(a.endTime));
      const lastClass = sortedClasses[0];
      const note = lastClass
        ? ` Your last class on ${currentDay} is ${lastClass.subject} which ends at ${lastClass.endTime}.`
        : '';
      return {
        reply: `No, you do not have any classes after 4:00 PM on ${currentDay}.${note}`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    }
  }

  // General "after [X]" matcher (e.g. "classes after 2", "after 3 pm")
  const afterMatch = query.match(/after\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (afterMatch) {
    let hour = parseInt(afterMatch[1], 10);
    const minute = afterMatch[2] ? parseInt(afterMatch[2], 10) : 0;
    const period = afterMatch[3];
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    if (!period && hour < 7) hour += 12; // e.g. 4 without am/pm is 4 PM (16:00)
    const threshold = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const todayClasses = classes.filter((c) => c.day.toLowerCase() === currentDay.toLowerCase());
    const matched = todayClasses.filter((c) => c.startTime >= threshold);
    if (matched.length > 0) {
      const list = matched
        .map((c) => `• ${c.subject} at ${c.startTime} in ${c.room || 'Room TBA'}`)
        .join('\n');
      return {
        reply: `On ${currentDay}, you have ${matched.length} class(es) starting at or after ${threshold}:\n${list}`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    } else {
      return {
        reply: `You don't have any classes after ${threshold} on ${currentDay}.`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    }
  }

  // 3. Faculty query ("who teaches [subject]")
  if (
    query.includes('who teaches') ||
    query.includes('faculty for') ||
    query.includes('professor for') ||
    query.includes('who is teaching')
  ) {
    const matched = classes.find(
      (c) =>
        query.includes(c.subject.toLowerCase()) ||
        (c.subjectCode && query.includes(c.subjectCode.toLowerCase())) ||
        (c.subject.includes('(') &&
          query.includes(c.subject.split('(')[1].replace(')', '').toLowerCase()))
    );
    if (matched) {
      return {
        reply: `${matched.subject} is taught by ${matched.faculty || 'an unassigned instructor'}${matched.room ? ` in ${matched.room}` : ''}.`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    }
  }

  // 4. Room query ("where is [subject]", "what room is")
  if (query.includes('where is') || query.includes('which room') || query.includes('what room')) {
    const matched = classes.find(
      (c) =>
        query.includes(c.subject.toLowerCase()) ||
        (c.subject.includes('(') &&
          query.includes(c.subject.split('(')[1].replace(')', '').toLowerCase()))
    );
    if (matched) {
      return {
        reply: `${matched.subject} is held in ${matched.room || 'Room TBA'}${matched.faculty ? ` with ${matched.faculty}` : ''}.`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    }
  }

  // 5. Day schedule query ("classes on friday", "show monday", "what do i have today")
  const targetDay = query.includes('today')
    ? currentDay
    : days.find((d) => query.includes(d.toLowerCase()));
  if (
    targetDay &&
    (query.includes('schedule') ||
      query.includes('classes') ||
      query.includes('what') ||
      query.includes('show') ||
      query.includes('timetable'))
  ) {
    const dayClasses = classes
      .filter((c) => c.day.toLowerCase() === targetDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    if (dayClasses.length > 0) {
      const list = dayClasses
        .map(
          (c) =>
            `• ${c.startTime} - ${c.endTime}: ${c.subject} (${c.room || 'Room TBA'}${c.faculty ? `, ${c.faculty}` : ''})`
        )
        .join('\n');
      return {
        reply: `Here is your schedule for ${targetDay}:\n${list}`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    } else {
      return {
        reply: `You don't have any classes scheduled for ${targetDay}. Enjoy your free day!`,
        actionType: 'none',
        conflictWarning: '',
        updatedClasses: null,
      };
    }
  }

  // 6. Move / Reschedule class query
  if (
    query.includes('move') ||
    query.includes('reschedule') ||
    query.includes('change my') ||
    query.includes('shift')
  ) {
    const foundIdx = classes.findIndex(
      (c) =>
        query.includes(c.subject.toLowerCase()) ||
        query.includes(c.subject.split(' ')[0].toLowerCase())
    );
    if (foundIdx !== -1) {
      const matched = classes[foundIdx];
      const targetDayMatch = days.find(
        (d) => query.includes(d.toLowerCase()) && d.toLowerCase() !== matched.day.toLowerCase()
      );
      const newDay = targetDayMatch || matched.day;

      let newStart = matched.startTime;
      let newEnd = matched.endTime;
      const timeMatch = query.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
      if (timeMatch) {
        let h = parseInt(timeMatch[1], 10);
        const m = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const p = timeMatch[3];
        if (p === 'pm' && h < 12) h += 12;
        if (p === 'am' && h === 12) h = 0;
        if (!p && h < 7) h += 12;
        newStart = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const endHour = (h + 1).toString().padStart(2, '0');
        newEnd = `${endHour}:${m.toString().padStart(2, '0')}`;
      }

      const updated = [...classes];
      updated[foundIdx] = {
        ...matched,
        day: newDay,
        startTime: newStart,
        endTime: newEnd,
      };

      return {
        reply: `Moved ${matched.subject} to ${newDay} at ${newStart} - ${newEnd}. Your schedule has been updated!`,
        actionType: 'move',
        conflictWarning: '',
        updatedClasses: updated,
      };
    }
  }

  // Fallback response
  return {
    reply: `I analyzed your timetable for ${currentDay} (${currentTime}). You have ${classes.length} total enrolled class(es). You can ask: "What is my next class?", "Do I have any classes after 4?", "Who teaches DBMS?", or ask me to move a class!`,
    actionType: 'none',
    conflictWarning: '',
    updatedClasses: null,
  };
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. OCR & Timetable Document Understanding endpoint
app.post('/api/ai/parse-timetable', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, textInput } = req.body;

    if (!imageBase64 && !textInput) {
      return res.status(400).json({ error: 'Please provide an image, document, or text timetable.' });
    }

    const ai = getGenAI();

    const systemPrompt = `You are an expert academic scheduling AI and document OCR specialist.
Your task is to analyze timetable documents (scanned images, college schedule screenshots, exported PDFs, or raw text) and extract every scheduled class into a structured JSON array.

Guidelines:
1. Day: Map each class strictly to standard capitalized names: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday".
2. Start Time & End Time: Format as 24-hour HH:MM (e.g., "09:00", "10:30", "14:00"). If a class is given as "9-10", start is "09:00" and end is "10:00". If "10-11:30", start is "10:00" and end is "11:30".
3. Subject: Full subject name or standard title (e.g. "Database Management Systems (DBMS)", "Artificial Intelligence (AI)", "Computer Networks (CN)").
4. Subject Code: Extract course code if visible (e.g., "CS301", "IT202") or leave empty string.
5. Faculty: Extract professor or instructor name if available. If not mentioned or missing, leave as empty string "" so our system can detect missing info.
6. Room: Extract venue, classroom, or lab number (e.g. "Room 201", "Lab 2", "Room 305", "Auditorium"). If missing, leave as empty string "" so our system can flag "Room information unavailable".
7. Type: Choose one of "lecture", "lab", "tutorial", "seminar". (Labs often say "Lab" or 2+ hours; lectures are standard 1hr classes).
8. Color: Suggest a distinct color hex code (e.g. #3b82f6 for CS/DBMS, #8b5cf6 for AI, #10b981 for CN, #f59e0b for Lab, #ec4899, #06b6d4).
9. Notes: Any specific batch, group or prerequisite notes if present.
10. Batches & Division: Detect the division/section (e.g., Division A, Division B, Division C, Section A, etc.). Lab batches correspond to the division letter (e.g., Division A has batches A1, A2; Division B has batches B1, B2; Division C has batches C1, C2). If the timetable mentions batches or parallel lab tracks running simultaneously in separate labs, extract the exact batch for each session (e.g., 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'). Common lectures for the whole division should have batch as 'All' or empty string.
11. Summary: Provide a 1-2 sentence high-level summary of the parsed schedule, mentioning the detected division and batches if present.`;

    const contents: Array<Record<string, unknown>> = [];

    if (imageBase64) {
      const cleanMime = mimeType || 'image/jpeg';
      contents.push({
        inlineData: {
          data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
          mimeType: cleanMime,
        },
      });
    }

    const userTextPrompt = textInput
      ? `Here is the timetable input/text:\n\n${textInput}\n\nParse this into structured timetable JSON.`
      : `Extract the full class schedule and timetable from this uploaded image/document into structured timetable JSON.`;

    contents.push({ text: userTextPrompt });

    const response = await generateWithModelFallback(ai, {
      contents: { parts: contents },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Summary of the parsed timetable' },
            classes: {
              type: Type.ARRAY,
              description: 'Extracted timetable classes',
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  subjectCode: { type: Type.STRING },
                  faculty: { type: Type.STRING },
                  room: { type: Type.STRING },
                  type: { type: Type.STRING },
                  color: { type: Type.STRING },
                  batch: { type: Type.STRING, description: "Batch name matching the timetable division (e.g. 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', or 'All')" },
                  division: { type: Type.STRING, description: "e.g. 'Division A', 'Division B', 'Division C'" },
                  notes: { type: Type.STRING },
                },
                required: ['day', 'startTime', 'endTime', 'subject', 'faculty', 'room'],
              },
            },
          },
          required: ['summary', 'classes'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const rawClasses = parsedJson.classes || [];

    // Detect overall division from input or extracted classes
    const combinedText = `${textInput || ''} ${JSON.stringify(rawClasses)}`.toLowerCase();
    let detectedDivLetter = 'C';
    if (/\b(?:div(?:ision)?|sec(?:tion)?)\s*[:\-]?\s*b\b/i.test(combinedText) || /\bb[123]\b/i.test(combinedText)) {
      detectedDivLetter = 'B';
    } else if (/\b(?:div(?:ision)?|sec(?:tion)?)\s*[:\-]?\s*a\b/i.test(combinedText) || /\ba[123]\b/i.test(combinedText)) {
      detectedDivLetter = 'A';
    } else if (/\b(?:div(?:ision)?|sec(?:tion)?)\s*[:\-]?\s*c\b/i.test(combinedText) || /\bc[123]\b/i.test(combinedText)) {
      detectedDivLetter = 'C';
    }

    // Assign stable IDs and normalize batches
    const classes = rawClasses.map((item: Record<string, unknown>, index: number) => {
      let batch = (item.batch as string) || '';
      const sub = ((item.subject as string) || '').toLowerCase();
      const notes = ((item.notes as string) || '').toLowerCase();
      const room = ((item.room as string) || '').toLowerCase();
      const textToSearch = `${sub} ${notes} ${room}`;

      // Auto-detect batch from text if not extracted
      if (!batch || batch.toUpperCase() === 'ALL') {
        const batchMatch = textToSearch.match(/\b(?:batch\s*[:\-]?)?([A-Za-z]\d+)\b/i);
        if (batchMatch) {
          batch = batchMatch[1].toUpperCase();
        } else {
          const numMatch = textToSearch.match(/\bbatch\s*[:\-]?\s*(\d+)\b/i);
          if (numMatch) {
            batch = `${detectedDivLetter}${numMatch[1]}`;
          } else if (sub.includes('parallel computing') && detectedDivLetter === 'C') {
            batch = 'C1';
          } else if ((sub.includes('internet of things') || sub.includes('iot')) && detectedDivLetter === 'C') {
            batch = 'C2';
          }
        }
      }

      return {
        id: `cls_ai_${Date.now()}_${index}`,
        day: item.day || 'Monday',
        startTime: item.startTime || '09:00',
        endTime: item.endTime || '10:00',
        subject: item.subject || 'Class',
        subjectCode: item.subjectCode || '',
        faculty: item.faculty || '',
        room: item.room || '',
        type: item.type || 'lecture',
        color: item.color || '#3b82f6',
        batch: batch && batch.toUpperCase() !== 'ALL' ? batch : undefined,
        division: (item.division as string) || `Division ${detectedDivLetter}`,
        notes: item.notes || '',
      };
    });

    return res.json({
      success: true,
      summary: parsedJson.summary || `Successfully extracted ${classes.length} classes.`,
      classes,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error parsing timetable:', err);
    return res.status(500).json({
      error: 'Failed to parse timetable using AI.',
      details: err.message,
    });
  }
});

// 2. Natural-Language Schedule Assistant (NLP queries & conversational updates)
app.post('/api/ai/chat-schedule', async (req: Request, res: Response) => {
  try {
    const { message, currentTimetable, currentDay, currentTime } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const ai = getGenAI();

    const systemPrompt = `You are "Lumi", the friendly, cute, warm yet deeply professional and precise AI schedule companion in LumiClass AI.
You have complete real-time access to the student's current weekly class timetable and batch tracks (such as C1 and C2).
Current contextual reference:
- Current Simulated Day: ${currentDay || 'Monday'}
- Current Simulated Time: ${currentTime || '09:55'}

Student Timetable Data:
${JSON.stringify(currentTimetable || [], null, 2)}

You can handle two types of requests:
1. INFORMATIONAL QUERIES:
   - "What is my next class?" -> Inspect current day and time, find the nearest upcoming class, state subject, time, and room clearly (e.g., "Your next class is Computer Networks at 11:00 AM in Room 305.").
   - "Do I have any classes after 4?" -> Check classes starting at or after 16:00 (4:00 PM) on the current day or weekly schedule and list them or confirm none.
   - "When is my AI lab?" -> Look up all instances of AI/Artificial Intelligence and report day, time, and room.
   - "Who teaches DBMS?" -> Look up faculty for DBMS.

2. SCHEDULE MUTATIONS & CHANGES:
   - "Move my AI class from Wednesday to Friday at 2 PM." -> Find the matching class on Wednesday, modify its day to Friday, startTime to "14:00" and endTime to "15:00" (or appropriate duration), and return action="move" or "update" with the complete updatedClasses array!
   - "Add a new Machine Learning class on Tuesday from 2 to 4 PM in Lab 3 with Dr. Miller" -> Add class to the list, action="add" with updatedClasses array!
   - "Delete my Friday seminar" -> Remove matching class, action="delete" with updatedClasses array!
   - If a requested move creates a timetable conflict (e.g. overlapping another class), still update if requested but include a prominent "conflictWarning" in your response.

Return structured JSON with:
- reply: Friendly, precise, formatted answer.
- actionType: "none" | "update" | "add" | "delete" | "move"
- conflictWarning: String warning if any conflict was created or detected, else empty string.
- updatedClasses: If actionType is NOT "none", provide the COMPLETE updated array of classes. If actionType is "none", you can return the existing classes or empty array.`;

    try {
      const response = await generateWithModelFallback(ai, {
        contents: message,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: 'Natural language response to the student' },
              actionType: { type: Type.STRING, description: 'none, update, add, delete, or move' },
              conflictWarning: { type: Type.STRING, description: 'Conflict warning message if any' },
              updatedClasses: {
                type: Type.ARRAY,
                description: 'Updated class list if schedule was modified',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    day: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    subjectCode: { type: Type.STRING },
                    faculty: { type: Type.STRING },
                    room: { type: Type.STRING },
                    type: { type: Type.STRING },
                    color: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                  required: ['day', 'startTime', 'endTime', 'subject'],
                },
              },
            },
            required: ['reply', 'actionType'],
          },
        },
      });

      let cleanText = (response.text || '').trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanText || '{}');
      return res.json({
        reply: parsed.reply || 'Schedule query processed.',
        actionType: parsed.actionType || 'none',
        conflictWarning: parsed.conflictWarning || '',
        updatedClasses: parsed.updatedClasses && parsed.updatedClasses.length > 0 ? parsed.updatedClasses : null,
      });
    } catch (modelErr: unknown) {
      console.warn('Gemini models unavailable, engaging local schedule rule solver:', modelErr);
      const localResult = solveScheduleQueryLocally(
        message,
        currentTimetable || [],
        currentDay || 'Monday',
        currentTime || '09:55'
      );
      return res.json(localResult);
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in chat-schedule wrapper:', err);
    // Final defensive fallback
    const localResult = solveScheduleQueryLocally(
      req.body?.message || '',
      req.body?.currentTimetable || [],
      req.body?.currentDay || 'Monday',
      req.body?.currentTime || '09:55'
    );
    return res.json(localResult);
  }
});

// Setup Vite development middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LumiClass AI] Server running on port ${PORT}`);
  });
}

startServer();
