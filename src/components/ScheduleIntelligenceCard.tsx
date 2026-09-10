import React from 'react';
import {
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  Users
} from 'lucide-react';
import { ScheduleConflict, MissingInfoItem, ParallelBatchGroup } from '../types';
import { getBatchFromClass, getBatchesSummary } from '../utils/timeUtils';

interface Props {
  conflicts: ScheduleConflict[];
  missingInfo: MissingInfoItem[];
  parallelBatches?: ParallelBatchGroup[];
  availableBatches?: string[];
  division?: string;
  selectedBatch?: string;
  onSelectBatch?: (batch: string) => void;
  onResolveConflict?: (conflict: ScheduleConflict) => void;
  onFixMissingInfo?: (item: MissingInfoItem) => void;
}

export const ScheduleIntelligenceCard: React.FC<Props> = ({
  conflicts,
  missingInfo,
  parallelBatches = [],
  availableBatches = [],
  division,
  selectedBatch = 'All',
  onSelectBatch,
  onResolveConflict,
  onFixMissingInfo,
}) => {
  const hasIssues = conflicts.length > 0 || missingInfo.length > 0;

  // Derive dynamic batch summary
  const distinctBatches = availableBatches.length > 0
    ? availableBatches
    : Array.from(
        new Set(
          parallelBatches
            .flatMap((pb) => pb.batches || pb.classes.map((c) => c.batch || getBatchFromClass(c)))
            .filter((b): b is string => Boolean(b && b !== 'ALL'))
        )
      );

  const batchSummary = getBatchesSummary(distinctBatches);

  return (
    <div
      id="schedule-intelligence-card"
      className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs"
    >
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              hasIssues ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {hasIssues ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Schedule Intelligence & Auditing</h3>
              {division && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  {division}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Automated conflict checking, batch recognition & missing info alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {parallelBatches.length > 0 && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {parallelBatches.length} Parallel Batch Session{parallelBatches.length > 1 ? 's' : ''}{' '}
              {batchSummary ? `(${batchSummary})` : ''}
            </span>
          )}
          {conflicts.length > 0 && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200">
              {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
            </span>
          )}
          {missingInfo.length > 0 && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              {missingInfo.length} Missing Info
            </span>
          )}
          {!hasIssues && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> No Conflicts
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Parallel Batches Verified Info Banner */}
        {parallelBatches.length > 0 && (
          <div className="space-y-2">
            {parallelBatches.map((pb) => {
              const pbBatches = pb.batches && pb.batches.length > 0
                ? pb.batches.join(' & ')
                : getBatchesSummary(pb.classes.map((c) => c.batch || getBatchFromClass(c)).filter(Boolean));

              return (
                <div
                  key={pb.id}
                  className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950">
                      <Users className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Parallel Lab Batches: {pb.day} ({pb.timeSlot})</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                      Batches {pbBatches || batchSummary || 'Parallel'} • Not Double Booked
                    </span>
                  </div>

                  <div className="pl-5 space-y-1.5 text-slate-700">
                    {pb.classes.map((cls, idx) => {
                      const batchTag = cls.batch || getBatchFromClass(cls) || (distinctBatches[idx] || `Batch ${idx + 1}`);
                      return (
                        <div key={cls.id || idx} className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-blue-400">├──</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white border border-blue-300 text-blue-800">
                            Batch {batchTag}
                          </span>
                          <span className="font-bold text-slate-900">{cls.subject}</span>
                          <span className="text-slate-600">📍 {cls.room || 'Dedicated Lab'}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pl-5 pt-1 flex items-center justify-between gap-2 text-[11px] text-blue-800 flex-wrap">
                    <span>
                      💡 These labs run simultaneously in separate rooms for {pbBatches ? `Batches ${pbBatches}` : batchSummary ? `Batches ${batchSummary}` : 'parallel batches'}.
                    </span>
                    {onSelectBatch && distinctBatches.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">View as:</span>
                        {distinctBatches.map((b) => (
                          <button
                            key={b}
                            onClick={() => onSelectBatch(b)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                              selectedBatch === b
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-blue-200 hover:bg-blue-100 text-blue-700'
                            }`}
                          >
                            Batch {b}
                          </button>
                        ))}
                        <button
                          onClick={() => onSelectBatch('All')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            selectedBatch === 'All'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-blue-200 hover:bg-blue-100 text-blue-700'
                          }`}
                        >
                          All
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hasIssues ? (
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Your schedule is fully validated! {batchSummary ? `Batch tracks (${batchSummary})` : 'All batch tracks'} and lecture sessions have zero conflicting time slots.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 font-mono">100% Validated</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Conflicts List */}
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Timetable Conflict: {c.day} ({c.timeSlot})</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                    Double Booked
                  </span>
                </div>

                <div className="pl-5 space-y-1 text-slate-700">
                  {c.classes.map((cls, idx) => (
                    <div key={cls.id || idx} className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">├──</span>
                      <span className="font-semibold text-slate-900">{cls.subject}</span>
                      <span className="text-slate-500">📍 {cls.room || 'Room TBA'}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-rose-800 italic pl-5">
                  → Suggestion: Ask the AI Assistant below to &ldquo;Move my {c.classes[0]?.subject.split(' ')[0]} class to a different slot&rdquo; or assign parallel batches.
                </p>
              </div>
            ))}

            {/* Missing Info List */}
            {missingInfo.map((m, idx) => (
              <div
                key={`${m.classId}-${idx}`}
                className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-900">
                      ⚠️ {m.missingField === 'room' ? 'Room information unavailable' : 'Faculty not assigned'}
                    </span>
                    <span className="text-slate-600 ml-1.5">
                      for <strong>{m.subject}</strong> ({m.day}, {m.timeSlot})
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded shrink-0">
                  Action Recommended
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
