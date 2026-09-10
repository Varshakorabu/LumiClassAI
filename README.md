# LumiClass AI — Smart Timetable & Notification Companion 🎓⚡

> **Intelligent, AI-powered academic schedule companion** featuring multimodal timetable OCR extraction, batch & division recognition, natural-language schedule queries with **Lumi AI**, automated conflict auditing, and 5-minute smart class notifications.

---

## 🌟 Key Features

### 1. 📷 Multimodal Timetable Ingestion (OCR & Vision)
- **Upload Any Format**: Drop in images (`.png`, `.jpg`, `.jpeg`, `.webp`), PDFs, or paste raw schedule text.
- **Intelligent Schedule Extraction**: Powered by Gemini Flash to extract days, start/end times, course titles, course codes, professors, and classroom/lab locations.
- **Dynamic Division & Batch Detection**: Automatically identifies class divisions (*Division A, B, C*) and parallel laboratory cohorts (*A1/A2, B1/B2, C1/C2*).
- **Parallel Lab Heuristics**: Distinguishes between genuine schedule conflicts and parallel lab sessions occurring concurrently in separate rooms.

### 2. 💬 Lumi AI Schedule Assistant
- **Natural Language Inquiries**: Ask questions like:
  - *"What is my next class?"*
  - *"Are C1 and C2 labs double-booked?"*
  - *"Do I have any lectures after 3 PM on Thursday?"*
  - *"Who teaches DBMS and in which room?"*
- **Conversational Schedule Modifications**: Reschedule or modify timetable slots conversationally (e.g., *"Move Friday's AI lecture to 2:00 PM in Room 402"*).

### 3. 📅 Interactive Timetable & Batch Filtering
- **Weekly & Daily Views**: Toggle between an all-week grid and day-specific schedule cards.
- **Dynamic Batch Filtering**: Filter timetable views by specific student batches (*All Batches*, *Batch 1*, *Batch 2*) to focus strictly on your personal track.
- **Live Class Tracking**: Real-time status indicators showing currently ongoing classes with elapsed time bars and upcoming class countdowns.
- **Time Simulation Controls**: Fast-forward or simulate any day and time to verify alert behaviors and upcoming classes.

### 4. 🛡️ Schedule Intelligence & Conflict Auditing
- **Zero-Conflict Validation**: Automatically flags overlapping lectures in the same room or batch.
- **Missing Information Detection**: Highlights missing room numbers, unspecified faculty, or incomplete class details.
- **One-Click Resolvers**: Suggestions and quick actions to remediate scheduling issues.

### 5. 🔔 5-Minute Class Notification System
- **Timely Alerts**: Automated sound chime and visual alerts triggered exactly 5 minutes before your next class begins.
- **Context-Rich Details**: Notifications include the exact subject, room number, faculty name, and walking reminder.
- **Notification Testing Studio**: Test sound chimes and alert banners on-demand.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Motion](https://motion.dev/), [Lucide React](https://lucide.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript (tsx)](https://github.com/privatenumber/tsx)
- **AI & Multimodal Vision**: [@google/genai SDK](https://www.npmjs.com/package/@google/genai) (Gemini 2.5 Flash)
- **Bundling & Build Tools**: [Vite](https://vitejs.dev/), [esbuild](https://esbuild.github.io/)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** / **yarn**
- **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/lumiclass-ai.git
   cd lumiclass-ai

   ├── server.ts                    # Express server, Gemini AI integration & API routes
├── index.html                   # HTML entry point with metadata & responsive viewport
├── metadata.json                # Project identity and capabilities configuration
├── package.json                 # Project dependencies and lifecycle scripts
├── src/
│   ├── main.tsx                 # React application mount point
│   ├── App.tsx                  # Core application dashboard & state orchestration
│   ├── index.css                # Global Tailwind CSS styling
│   ├── types.ts                 # TypeScript data contracts (ClassItem, Conflicts, etc.)
│   ├── components/
│   │   ├── Header.tsx           # App header, time simulator, and batch status
│   │   ├── TimetableGrid.tsx    # Weekly & daily grid views with batch filtering
│   │   ├── ScheduleIntelligenceCard.tsx # Conflict auditing & parallel batch banner
│   │   ├── AiAssistantPanel.tsx # Lumi AI conversational drawer & suggestions
│   │   ├── NotificationBanner.tsx # 5-minute class alert toast & audio chime
│   │   ├── TimetableUploadModal.tsx # OCR & multimodal schedule ingestion modal
│   │   ├── AddClassModal.tsx    # Manual class creation & editing modal
│   │   └── AuthModal.tsx        # User authentication dialog
│   └── utils/
│       ├── timeUtils.ts         # Time calculation, conflict auditing & batch detectors
│       └── initialData.ts       # Preloaded academic timetable templates

