import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertTriangle,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { ChatMessage, ClassItem, DayOfWeek } from '../types';
import { getAvailableBatches, detectDivision, getBatchesSummary } from '../utils/timeUtils';

interface Props {
  classes: ClassItem[];
  currentDay: DayOfWeek;
  currentTimeStr: string;
  selectedBatch?: string;
  onTimetableUpdatedByAi: (updatedClasses: ClassItem[], note: string) => void;
}

export const AiAssistantPanel: React.FC<Props> = ({
  classes,
  currentDay,
  currentTimeStr,
  selectedBatch = 'All',
  onTimetableUpdatedByAi,
}) => {
  const availableBatches = getAvailableBatches(classes);
  const detectedDivision = detectDivision(classes);
  const batchSummary = getBatchesSummary(availableBatches);
  const doubleBookedQuestion = batchSummary
    ? `Are ${batchSummary} labs double-booked?`
    : 'Are batch labs double-booked?';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      content:
        `Hi! I'm Lumi, your personal timetable companion. ✨ Feel free to ask about your lectures${
          batchSummary ? `, ${batchSummary} batch tracks` : ''
        }, or ask me to change classes naturally (e.g. "${doubleBookedQuestion}", "What's my next class?").`,
      timestamp: 'Just now',
      suggestedActions: [
        doubleBookedQuestion,
        'What is my next class?',
        'Do I have any classes after 4?',
        'Who teaches DBMS?',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          currentTimetable: classes,
          currentDay,
          currentTime: currentTimeStr,
          selectedBatch,
          division: detectedDivision,
          availableBatches,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Assistant failed to respond');
      }

      let timetableUpdated = false;
      if (data.updatedClasses && Array.isArray(data.updatedClasses) && data.actionType !== 'none') {
        onTimetableUpdatedByAi(data.updatedClasses, `AI Action: ${data.actionType}`);
        timetableUpdated = true;
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: data.reply || 'Schedule query processed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timetableUpdated,
        suggestedActions:
          data.actionType !== 'none'
            ? ['What is my next class?', 'Check conflicts', 'Show Friday schedule']
            : ['What is my next class?', 'Do I have any classes after 4?'],
      };

      if (data.conflictWarning) {
        aiMsg.content += `\n\n⚠️ ${data.conflictWarning}`;
      }

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const e = err as Error;
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'assistant',
          content: `Sorry, I encountered an error: ${e.message || 'Unable to connect to AI engine.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="ai-assistant-card"
      className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all duration-300"
      style={{ height: isMinimized ? '58px' : '480px' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-3.5 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-500/20 border border-indigo-400/30 rounded-lg relative">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wide flex items-center gap-1.5">
              Lumi <span className="text-[10px] text-indigo-200 font-normal">AI Companion</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-blue-200">
              Ready to answer questions &amp; assist your schedule
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="reset-chat-btn"
            onClick={() => {
              setMessages([
                {
                  id: `msg_welcome_${Date.now()}`,
                  sender: 'assistant',
                  content:
                    "Hi! I'm Lumi, your personal timetable companion. ✨ Feel free to ask about your lectures, C1/C2 batches, or ask me to change classes naturally (e.g. \"What is my next class?\", \"Do I have classes after 4?\", or \"Move my AI class to Friday at 2 PM\").",
                  timestamp: 'Just now',
                  suggestedActions: [
                    'Are C1 and C2 labs double-booked?',
                    'What is my next class?',
                    'Do I have any classes after 4?',
                    'Who teaches DBMS?',
                  ],
                },
              ]);
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            id="toggle-minimize-assistant"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            title={isMinimized ? 'Expand Assistant' : 'Minimize Assistant'}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-xs">
                    AI
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                      : m.content.startsWith('Sorry, I encountered an error')
                      ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-bl-none shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {m.content.startsWith('Sorry, I encountered an error') && (
                    <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                      <span className="text-[10px] text-rose-600">The assistant can retry with local intelligence:</span>
                      <button
                        onClick={() => handleSendMessage('What is my next class?')}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {m.timetableUpdated && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Timetable successfully modified in real time!</span>
                    </div>
                  )}

                  {/* Suggested Chips */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {m.suggestedActions.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip)}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-[10px] font-medium transition-colors text-left"
                        >
                          &ldquo;{chip}&rdquo;
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`text-[9px] text-right font-mono ${
                      m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-500 italic p-2 bg-white/70 rounded-xl border border-slate-200 w-fit">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>AI is analyzing your timetable & schedule rules...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Input Form */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="ai-assistant-input"
                type="text"
                placeholder="Ask or command: 'Move AI to Friday at 2 PM'..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 disabled:bg-slate-100"
              />
              <button
                id="ai-assistant-send-btn"
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors shrink-0"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
