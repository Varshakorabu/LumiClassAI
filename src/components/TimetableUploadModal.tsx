import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Plus,
  X,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { ClassItem, DayOfWeek } from '../types';
import { DAYS_OF_WEEK } from '../utils/timeUtils';
import { SAMPLE_TIMETABLES } from '../utils/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTimetableImported: (classes: ClassItem[], summary: string) => void;
  onAddSingleClass: (item: ClassItem) => void;
}

export const TimetableUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onTimetableImported,
  onAddSingleClass,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'manual' | 'samples'>('upload');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text input state
  const [textInput, setTextInput] = useState(`MONDAY
9-10       DBMS       Room 201
10-11      AI         Lab 2
11-12      CN         Room 305

WEDNESDAY
10-11:30   AI         Lab 2
2-3:30     SE         Lab 5`);

  // Manual class form state
  const [manualSubject, setManualSubject] = useState('');
  const [manualDay, setManualDay] = useState<DayOfWeek>('Monday');
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualEndTime, setManualEndTime] = useState('10:00');
  const [manualRoom, setManualRoom] = useState('');
  const [manualFaculty, setManualFaculty] = useState('');
  const [manualType, setManualType] = useState<'lecture' | 'lab' | 'tutorial' | 'seminar'>('lecture');

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      setError('Please select an image or PDF file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      const res = await fetch('/api/ai/parse-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: selectedFile.type,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to parse timetable.');
      }

      onTimetableImported(data.classes, data.summary);
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error processing timetable with AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessText = async () => {
    if (!textInput.trim()) {
      setError('Please enter your timetable text.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/parse-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textInput: textInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.details || data.error || 'Failed to parse timetable.');
      }

      onTimetableImported(data.classes, data.summary);
      onClose();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error processing timetable text with AI.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubject) {
      setError('Subject name is required.');
      return;
    }

    const newClass: ClassItem = {
      id: `cls_man_${Date.now()}`,
      day: manualDay,
      startTime: manualStartTime,
      endTime: manualEndTime,
      subject: manualSubject,
      room: manualRoom,
      faculty: manualFaculty,
      type: manualType,
      color: manualType === 'lab' ? '#8b5cf6' : '#3b82f6',
    };

    onAddSingleClass(newClass);
    onClose();
  };

  const handleLoadSample = (sampleClasses: ClassItem[], title: string) => {
    onTimetableImported(sampleClasses, `Loaded ${title}`);
    onClose();
  };

  return (
    <div
      id="timetable-upload-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="timetable-upload-modal"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white relative">
          <button
            id="close-upload-btn"
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Add / Upload Timetable</h2>
              <p className="text-blue-100 text-xs">
                Upload image, screenshot, or PDF. AI automatically extracts days, times, rooms, and faculty.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              id="tab-upload-file"
              onClick={() => {
                setActiveTab('upload');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload' ? 'bg-white text-blue-800' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Image / PDF (OCR)
            </button>
            <button
              id="tab-upload-text"
              onClick={() => {
                setActiveTab('text');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'text' ? 'bg-white text-blue-800' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Paste Text
            </button>
            <button
              id="tab-upload-manual"
              onClick={() => {
                setActiveTab('manual');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'manual' ? 'bg-white text-blue-800' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Single Class
            </button>
            <button
              id="tab-upload-samples"
              onClick={() => {
                setActiveTab('samples');
                setError(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'samples' ? 'bg-white text-blue-800' : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Presets
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                id="file-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/bmp, application/pdf"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    {filePreviewUrl ? (
                      <div className="max-w-xs mx-auto rounded-xl overflow-hidden shadow-md border border-slate-200 max-h-48">
                        <img
                          src={filePreviewUrl}
                          alt="Timetable Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                      </p>
                    </div>
                    <span className="inline-block text-xs text-blue-600 font-medium group-hover:underline">
                      Click to choose a different file
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Drag and drop your timetable image or PDF
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports screenshots, photos of physical timetables, and college PDF sheets
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-xs group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                      Browse Computer
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> PNG, JPG, WebP, PDF
                </span>
                <span>Powered by Gemini 3.8 Flash Vision OCR</span>
              </div>

              <div className="pt-2">
                <button
                  id="process-file-ai-btn"
                  onClick={handleProcessFile}
                  disabled={!selectedFile || isProcessing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>AI Document OCR in Progress...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extract & Understand Timetable</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paste Raw Schedule Text / Table
                </label>
                <textarea
                  id="timetable-text-input"
                  rows={8}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your timetable here..."
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              <button
                id="process-text-ai-btn"
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Parsing Timetable Text...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Convert to Structured Timetable</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
                <input
                  id="manual-subject-input"
                  type="text"
                  placeholder="e.g. Artificial Intelligence (AI)"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                  <select
                    id="manual-day-select"
                    value={manualDay}
                    onChange={(e) => setManualDay(e.target.value as DayOfWeek)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    id="manual-start-time"
                    type="time"
                    value={manualStartTime}
                    onChange={(e) => setManualStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    id="manual-end-time"
                    type="time"
                    value={manualEndTime}
                    onChange={(e) => setManualEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Venue</label>
                  <input
                    id="manual-room-input"
                    type="text"
                    placeholder="e.g. Lab 2, Room 305"
                    value={manualRoom}
                    onChange={(e) => setManualRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty / Professor</label>
                  <input
                    id="manual-faculty-input"
                    type="text"
                    placeholder="e.g. Prof. Alan Thorne"
                    value={manualFaculty}
                    onChange={(e) => setManualFaculty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type</label>
                <div className="flex gap-2">
                  {(['lecture', 'lab', 'tutorial', 'seminar'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setManualType(t)}
                      className={`px-3 py-1.5 rounded-lg capitalize border font-medium transition-colors ${
                        manualType === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="submit-manual-class-btn"
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors mt-2"
              >
                Add Class to Timetable
              </button>
            </form>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Instantly load ready-to-test sample timetables to verify OCR, scheduling, and notifications:
              </p>
              {SAMPLE_TIMETABLES.map((sample) => (
                <div
                  key={sample.id}
                  className="p-3.5 border border-slate-200 rounded-xl hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{sample.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sample.description}</p>
                    <span className="text-[10px] text-blue-700 font-mono font-medium">
                      {sample.classes.length} classes defined
                    </span>
                  </div>
                  <button
                    onClick={() => handleLoadSample(sample.classes, sample.title)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
                  >
                    Load Timetable
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
