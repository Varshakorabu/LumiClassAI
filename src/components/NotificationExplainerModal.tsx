import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';
import { NotificationSettings, TriggeredNotification } from '../types';
import { playNotificationChime, speakNotification } from '../utils/timeUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  onTriggerTestNotification: (subject?: string, room?: string, faculty?: string) => void;
  notificationHistory: TriggeredNotification[];
}

export const NotificationExplainerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onTriggerTestNotification,
  notificationHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'howItWorks' | 'settings' | 'history'>('howItWorks');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const requestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      setTestStatus('Browser notifications are not supported in this environment.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      onUpdateSettings({ ...settings, browserNotifications: true });
      setTestStatus('Browser notifications permission granted!');
      new Notification('LumiClass AI: Permission Granted', {
        body: 'You will now receive 5-minute class alerts directly on your screen.',
        icon: '/favicon.ico',
      });
    } else {
      setTestStatus('Permission was denied or dismissed.');
    }
  };

  const handleTestChime = () => {
    playNotificationChime();
    setTestStatus('Playing dual-tone campus chime via Web Audio API...');
  };

  const handleTestSpeech = () => {
    speakNotification('Upcoming Class: Artificial Intelligence starts in 5 minutes at Lab 2.');
    setTestStatus('Speech synthesis: "Artificial Intelligence starts in 5 minutes at Lab 2"');
  };

  const handleFull5MinTest = () => {
    onTriggerTestNotification('Artificial Intelligence (AI)', 'Lab 2', 'Prof. Alan Thorne');
    setTestStatus('Dispatched simulated 5-minute class alert!');
  };

  return (
    <div
      id="notification-explainer-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="notification-explainer-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-6 relative">
          <button
            id="close-explainer-btn"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">How You Get Notifications</h2>
              <p className="text-blue-100 text-sm">
                Understand the 5-minute intelligent notification pipeline and delivery channels
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/15">
            <button
              id="tab-how-it-works"
              onClick={() => setActiveTab('howItWorks')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'howItWorks'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              Pipeline & Delivery Channels
            </button>
            <button
              id="tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              Alert Channels & Test
            </button>
            <button
              id="tab-history"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              Trigger Log ({notificationHistory.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'howItWorks' && (
            <div className="space-y-6">
              {/* Step-by-Step Pipeline */}
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  The 4-Stage Notification Workflow
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-left">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      Step 1 • Sync
                    </span>
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">OCR & Schedule</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      AI parses your timetable document into structured day, time, room, and faculty records.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                      Step 2 • Polling
                    </span>
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">Smart Scheduler</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Background scheduler inspects current day and calculates delta: <br />
                      <code className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded">
                        Δ = ClassStart - Now
                      </code>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block mb-1">
                      Step 3 • Trigger
                    </span>
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">5-Minute Trigger</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      When <span className="font-semibold text-blue-800">Δ ≤ 5 min</span>, the system fires the
                      alert, checks room location, and locks duplicate triggers.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                      Step 4 • Delivery
                    </span>
                    <h4 className="font-semibold text-slate-800 text-sm mb-1">Multi-Channel</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Dispatches to Web Push, In-App interactive toast, chime bell, and optional voice readout.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Channels Explained */}
              <div>
                <h3 className="text-base font-semibold text-slate-900 mb-3">
                  How Students Receive Notifications in Production
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">
                          1. Web Push & Desktop / Phone System Notification
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                          Active in App
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Uses standard W3C <code>Notification API</code> and Service Worker Push. Even if the student
                        has their browser minimized or phone screen locked, a native notification banners on their
                        lockscreen with subject, room, and start time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">
                          2. Interactive In-App Toast & Audio Chime
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                          Built-in
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        When the tab is active, an animated priority card drops down with sound effect, highlighting
                        room number (e.g. 📍 Lab 2) and faculty details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                      <Volume2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900 text-sm">
                          3. Voice / Text-to-Speech Announcement
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                          Hands-Free
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Speaks aloud in natural cadence: <em>"Artificial Intelligence starts in 5 minutes in Lab 2"</em>,
                        ideal when walking across campus with headphones on.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Try-It Button */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Want to test the exact 5-minute notification?</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Click the button below to trigger the prompt example: "10:00 AM — AI, 📍 Lab 2".
                  </p>
                </div>
                <button
                  id="trigger-example-alert-btn"
                  onClick={handleFull5MinTest}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 shrink-0 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Trigger 5-Min Alert Now
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Customize your notification channels below. You can toggle browser system popups, sound chimes, and
                  speech readouts.
                </p>
              </div>

              <div className="space-y-3">
                {/* Lead time */}
                <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl">
                  <div>
                    <label htmlFor="lead-time-select" className="text-sm font-semibold text-slate-800">
                      Notification Lead Time
                    </label>
                    <p className="text-xs text-slate-500">How many minutes before class to send the alert</p>
                  </div>
                  <select
                    id="lead-time-select"
                    value={settings.leadMinutes}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, leadMinutes: parseInt(e.target.value, 10) })
                    }
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={3}>3 minutes before</option>
                    <option value={5}>5 minutes before (Recommended)</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                  </select>
                </div>

                {/* System Browser Push */}
                <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Browser System Notifications</div>
                    <p className="text-xs text-slate-500">
                      Shows native OS alerts outside the browser tab
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="request-permission-btn"
                      onClick={requestBrowserPermission}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                    >
                      Request Permission
                    </button>
                    <input
                      type="checkbox"
                      id="toggle-browser-notifications"
                      checked={settings.browserNotifications}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, browserNotifications: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                </div>

                {/* Sound Chime */}
                <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Campus Bell Chime (Web Audio)</div>
                    <p className="text-xs text-slate-500">Plays dual-frequency chime when alert triggers</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="test-chime-btn"
                      onClick={handleTestChime}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Test Sound
                    </button>
                    <input
                      type="checkbox"
                      id="toggle-sound-chime"
                      checked={settings.soundEnabled}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, soundEnabled: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                </div>

                {/* Speech Synthesis */}
                <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Voice Announcement (Text-to-Speech)</div>
                    <p className="text-xs text-slate-500">Reads out class name & room number automatically</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="test-speech-btn"
                      onClick={handleTestSpeech}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Test Voice
                    </button>
                    <input
                      type="checkbox"
                      id="toggle-speech-synthesis"
                      checked={settings.speechAudio}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, speechAudio: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                </div>
              </div>

              {testStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{testStatus}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {notificationHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No notification triggers recorded yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Notifications appear here automatically 5 minutes before scheduled classes, or when you trigger a test.
                  </p>
                  <button
                    onClick={handleFull5MinTest}
                    className="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Trigger Test Alert
                  </button>
                </div>
              ) : (
                notificationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-700">{item.body}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-slate-500 text-[11px]">
                        <span>📍 {item.room || 'Room TBA'}</span>
                        {item.faculty && <span>👤 {item.faculty}</span>}
                        <span>🕒 Starts at {item.startTime}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[10px] shrink-0">
                      Delivered
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Background scheduler active (checking every second)</span>
          </div>
          <button
            id="close-explainer-footer-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
};
