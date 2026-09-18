'use client';

import React, { useState, useMemo } from 'react';
import { IEvaluationCriterion, ITeam, IEvent, IEvaluation } from '@/lib/types';
import { CheckCircle, AlertTriangle, Lock, ShieldCheck, Sparkles, Send, Info } from 'lucide-react';

interface DynamicRubricFormProps {
  event: IEvent;
  team: ITeam;
  criteria: IEvaluationCriterion[];
  existingEvaluation: IEvaluation | null;
  onSubmitted?: () => void;
}

export default function DynamicRubricForm({
  event,
  team,
  criteria,
  existingEvaluation,
  onSubmitted,
}: DynamicRubricFormProps) {
  // Initialize state with existing scores or defaults
  const [scores, setScores] = useState<Record<string, { marks: number; comment: string }>>(() => {
    const map: Record<string, { marks: number; comment: string }> = {};
    criteria.forEach((c) => {
      const prev = existingEvaluation?.scores?.find((s) => s.criterionId === c._id);
      map[c._id] = {
        marks: prev ? prev.marks : c.minMarks,
        comment: prev?.comment || '',
      };
    });
    return map;
  });

  const [generalFeedback, setGeneralFeedback] = useState(existingEvaluation?.generalFeedback || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isLocked = existingEvaluation?.isLocked || false;

  // Real-time calculation of total marks and max marks
  const { totalScore, maxPossibleScore } = useMemo(() => {
    let tot = 0;
    let max = 0;
    criteria.forEach((c) => {
      tot += Number(scores[c._id]?.marks || 0);
      max += Number(c.maxMarks || 0);
    });
    return { totalScore: tot, maxPossibleScore: max };
  }, [criteria, scores]);

  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  const handleMarkChange = (critId: string, val: number, max: number, min: number) => {
    if (isLocked) return;
    const clamped = Math.max(min, Math.min(max, isNaN(val) ? min : val));
    setScores((prev) => ({
      ...prev,
      [critId]: {
        ...prev[critId],
        marks: clamped,
      },
    }));
    setError('');
  };

  const handleCommentChange = (critId: string, text: string) => {
    if (isLocked) return;
    setScores((prev) => ({
      ...prev,
      [critId]: {
        ...prev[critId],
        comment: text,
      },
    }));
  };

  const validateAll = () => {
    for (const c of criteria) {
      const val = scores[c._id]?.marks;
      if (val === undefined || isNaN(val)) {
        setError(`Please assign a score for "${c.name}"`);
        return false;
      }
      if (val > c.maxMarks) {
        setError(`Score for "${c.name}" cannot exceed ${c.maxMarks}`);
        return false;
      }
      if (val < c.minMarks) {
        setError(`Score for "${c.name}" cannot be below ${c.minMarks}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      setShowConfirmModal(false);
      return;
    }

    setSubmitting(true);
    setError('');

    const formattedScores = criteria.map((c) => ({
      criterionId: c._id,
      marks: scores[c._id]?.marks || 0,
      comment: scores[c._id]?.comment || '',
    }));

    try {
      const res = await fetch('/api/evaluator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event._id,
          teamId: team._id,
          scores: formattedScores,
          generalFeedback,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit evaluation');
      }

      setSuccessMsg('Evaluation submitted successfully and securely locked!');
      setShowConfirmModal(false);
      if (onSubmitted) onSubmitted();
    } catch (err: any) {
      setError(err.message);
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Locked Status Banner if already submitted */}
      {isLocked ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-emerald-900">Evaluation Locked & Recorded</div>
            <div className="text-emerald-700 mt-0.5">
              Your evaluation of {team.title} was submitted on{' '}
              {new Date(existingEvaluation?.submittedAt || '').toLocaleString()}. Modifications can only be made with admin authorization.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/70 border border-blue-200/60 rounded-2xl p-3.5 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Scores are confidential and directly sent to the evaluation committee.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Dynamic Criteria List */}
      <div className="space-y-4">
        {criteria.map((c, index) => {
          const currentMarks = scores[c._id]?.marks ?? c.minMarks;
          const currentComment = scores[c._id]?.comment ?? '';

          return (
            <div
              key={c._id}
              className={`bg-white rounded-2xl border transition-all p-5 ${
                isLocked ? 'border-slate-200 opacity-90' : 'border-slate-200 hover:border-blue-400 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                  </div>
                  {c.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{c.description}</p>
                  )}
                </div>

                <div className="shrink-0 text-right font-mono text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 self-start">
                  Max: {c.maxMarks} pts
                </div>
              </div>

              {/* Touch-Friendly Number Entry and Quick Adjustment Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-medium text-slate-600">Assigned Marks:</div>

                <div className="flex items-center gap-2">
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleMarkChange(c._id, currentMarks - 1, c.maxMarks, c.minMarks)}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-base flex items-center justify-center transition select-none"
                    >
                      -
                    </button>
                  )}

                  <input
                    type="number"
                    min={c.minMarks}
                    max={c.maxMarks}
                    value={currentMarks}
                    disabled={isLocked}
                    onChange={(e) =>
                      handleMarkChange(c._id, parseInt(e.target.value, 10), c.maxMarks, c.minMarks)
                    }
                    className="w-16 h-10 text-center text-lg font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                  />

                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => handleMarkChange(c._id, currentMarks + 1, c.maxMarks, c.minMarks)}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-base flex items-center justify-center transition select-none"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>

              {/* Optional criterion comment */}
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Optional note for this criterion..."
                  value={currentComment}
                  disabled={isLocked}
                  onChange={(e) => handleCommentChange(c._id, e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 disabled:bg-slate-50 text-slate-700"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* General Project Feedback */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <label className="block text-xs font-bold text-slate-800 mb-2">
          Overall Evaluator Remarks & Constructive Advice (Optional)
        </label>
        <textarea
          rows={3}
          value={generalFeedback}
          disabled={isLocked}
          onChange={(e) => setGeneralFeedback(e.target.value)}
          placeholder="E.g. Great hardware demonstration, suggest testing with more edge sensors..."
          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 disabled:bg-slate-50 text-slate-700"
        />
      </div>

      {/* Sticky Bottom Assessment Bar (Mobile First) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Score</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{totalScore}</span>
              <span className="text-xs font-semibold text-slate-400">/ {maxPossibleScore}</span>
              <span className="text-xs font-bold text-blue-600 ml-1">({percentage}%)</span>
            </div>
          </div>

          <div>
            {isLocked ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Locked</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (validateAll()) setShowConfirmModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition"
              >
                <Send className="w-4 h-4" />
                <span>Submit Score</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Lock & Confirm Evaluation?</h3>
              <p className="text-xs text-slate-500">
                You are submitting <strong className="text-slate-900">{totalScore} / {maxPossibleScore}</strong> for{' '}
                <span className="text-slate-800 font-medium">{team.title}</span>. Once submitted, your evaluation is locked.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 text-slate-600 font-mono">
              <div className="flex justify-between">
                <span>Stall:</span>
                <span className="font-bold text-slate-900">{team.tableNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Code:</span>
                <span className="font-bold text-slate-900">{team.teamCode}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Edit Marks
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs transition"
              >
                {submitting ? 'Submitting...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
