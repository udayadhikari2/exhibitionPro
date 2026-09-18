'use client';

import React, { useState } from 'react';
import { EventStatus, EVENT_STATUS_FLOW } from '@/types';
import { CheckCircle2, ChevronRight, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface LifecycleStepperProps {
  currentStatus: EventStatus;
  eventId: string;
  onStatusChange?: (newStatus: EventStatus) => void;
}

const STAGE_LABELS: Record<EventStatus, { title: string; desc: string }> = {
  DRAFT: { title: 'Drafting', desc: 'Setup categories & criteria' },
  REGISTRATION_OPEN: { title: 'Registration Open', desc: 'Accepting student teams' },
  REGISTRATION_CLOSED: { title: 'Registration Closed', desc: 'Submissions closed' },
  EVALUATION_READY: { title: 'Evaluation Ready', desc: 'Assigning evaluators' },
  EVALUATION_RUNNING: { title: 'Evaluation Live', desc: 'Evaluators scoring projects' },
  EVALUATION_COMPLETED: { title: 'Evaluation Closed', desc: 'All scores locked' },
  RESULT_REVIEW: { title: 'Result Review', desc: 'Admin auditing rankings' },
  RESULT_APPROVED: { title: 'Result Approved', desc: 'Finalized by committee' },
  RESULT_PUBLISHED: { title: 'Result Published', desc: 'Live to public & students' },
  COMPLETED: { title: 'Completed', desc: 'Event concluded' },
  ARCHIVED: { title: 'Archived', desc: 'Event archived' },
};

export default function LifecycleStepper({ currentStatus, eventId, onStatusChange }: LifecycleStepperProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentIndex = EVENT_STATUS_FLOW.indexOf(currentStatus);
  const nextStatus = currentIndex < EVENT_STATUS_FLOW.length - 1 ? EVENT_STATUS_FLOW[currentIndex + 1] : null;

  const handleAdvance = async (targetStatus: EventStatus) => {
    if (!confirm(`Are you sure you want to transition this event to "${STAGE_LABELS[targetStatus]?.title || targetStatus}"?`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/events/${eventId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      if (onStatusChange) {
        onStatusChange(targetStatus);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Event Lifecycle Controller
          </div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            Current Phase: {STAGE_LABELS[currentStatus]?.title}
          </div>
        </div>

        {nextStatus && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAdvance(nextStatus)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-xs shadow-xs transition disabled:opacity-50"
            >
              <span>Advance to: {STAGE_LABELS[nextStatus]?.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Horizontal Scrollable Stepper */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center min-w-[760px] gap-1">
          {EVENT_STATUS_FLOW.map((status, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;

            return (
              <React.Fragment key={status}>
                <div
                  className={`flex-1 p-2.5 rounded-xl border text-center transition ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-xs'
                      : isCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-white border-dashed border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] font-bold truncate">{STAGE_LABELS[status]?.title}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{STAGE_LABELS[status]?.desc}</div>
                </div>

                {idx < EVENT_STATUS_FLOW.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
