'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Lock,
  FileText,
  AlertTriangle,
  Minus,
  Plus,
  Save,
  Send,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

interface Criterion {
  _id: string;
  name: string;
  description: string;
  maxMarks: number;
  minMarks: number;
  weight: number;
  required: boolean;
  isRequired: boolean;
  categoryId?: string | null;
  categoryName?: string;
}

interface ProjectData {
  _id: string;
  teamCode: string;
  teamName: string;
  title: string;
  shortDescription: string;
  problemStatement?: string;
  objectives?: string;
  methodology?: string;
  innovation?: string;
  materials?: string;
  technologyUsed?: string;
  files?: { name: string; url: string; type?: string }[];
  stallNumber: string;
  school: string;
  grade: string;
  section: string;
  mentor: string;
  members: { name: string; role: string }[];
  categoryName: string;
  eventName: string;
  eventId: string;
}

interface ExistingEvaluation {
  _id: string;
  status: 'DRAFT' | 'SUBMITTED';
  scores: { criterionId: string; criterionName: string; marks: number; maxMarks: number; comment?: string }[];
  totalScore: number;
  maxPossibleScore: number;
  generalFeedback: string;
  isLocked: boolean;
  submittedAt: string | null;
}

export default function EvaluateProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const teamId = params.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [totalMaxMarks, setTotalMaxMarks] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<ExistingEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbiddenError, setForbiddenError] = useState<string | null>(null);

  // Scoring state
  const [scores, setScores] = useState<Record<string, number | ''>>({});
  const [criterionComments, setCriterionComments] = useState<Record<string, string>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // UI state
  const [showProjectDossier, setShowProjectDossier] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setForbiddenError(null);
    try {
      const res = await fetch(`/api/evaluator/projects/${teamId}`);
      const data = await res.json();

      if (res.status === 403) {
        setForbiddenError(data.error || 'Forbidden: You are not assigned to evaluate this project.');
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load project details');
      }

      setProject(data.project);
      setCriteria(data.criteria || []);
      setTotalMaxMarks(data.totalMaxMarks || 0);

      // Populate existing scores if any
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setGeneralFeedback(data.evaluation.generalFeedback || '');

        const existingScores: Record<string, number | ''> = {};
        const existingComments: Record<string, string> = {};
        data.evaluation.scores?.forEach((s: any) => {
          existingScores[s.criterionId] = s.marks;
          if (s.comment) existingComments[s.criterionId] = s.comment;
        });
        setScores(existingScores);
        setCriterionComments(existingComments);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading project evaluation', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchProjectDetails();
  }, [teamId]);

  // Handle numeric mark change with live bounds clamping
  const handleScoreChange = (criterionId: string, value: string, min: number, max: number) => {
    if (value === '') {
      setScores((prev) => ({ ...prev, [criterionId]: '' }));
      return;
    }

    const num = Number(value);
    if (isNaN(num)) return;

    // Strict boundary enforcement
    const clamped = Math.max(min, Math.min(max, num));
    setScores((prev) => ({ ...prev, [criterionId]: clamped }));
  };

  const handleStepScore = (criterionId: string, delta: number, min: number, max: number) => {
    const current = typeof scores[criterionId] === 'number' ? (scores[criterionId] as number) : min;
    const nextVal = Math.max(min, Math.min(max, current + delta));
    setScores((prev) => ({ ...prev, [criterionId]: nextVal }));
  };

  // Calculate live total marks
  const calculateCurrentTotal = () => {
    return Object.values(scores).reduce<number>((acc, curr) => {
      return acc + (typeof curr === 'number' ? curr : 0);
    }, 0);
  };

  // Count scored criteria
  const scoredCount = criteria.filter((c) => typeof scores[c._id] === 'number').length;
  const isAllMandatoryFilled = criteria
    .filter((c) => c.required ?? c.isRequired ?? true)
    .every((c) => typeof scores[c._id] === 'number');

  // Handle Save Draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const payloadScores = criteria.map((c) => ({
        criterionId: c._id,
        marks: typeof scores[c._id] === 'number' ? (scores[c._id] as number) : 0,
        comment: criterionComments[c._id] || '',
      }));

      const res = await fetch('/api/evaluator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          scores: payloadScores,
          comments: generalFeedback,
          isDraft: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft');

      showToast('Evaluation draft saved successfully', 'success');
      setEvaluation(data.evaluation);
    } catch (err: any) {
      showToast(err.message || 'Draft saving failed', 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Submit Final Evaluation
  const handleFinalSubmit = async () => {
    if (!confirmed) {
      showToast('Please confirm the evaluation accuracy checkbox', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadScores = criteria.map((c) => ({
        criterionId: c._id,
        marks: typeof scores[c._id] === 'number' ? (scores[c._id] as number) : 0,
        comment: criterionComments[c._id] || '',
      }));

      const res = await fetch('/api/evaluator/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          scores: payloadScores,
          comments: generalFeedback,
          isDraft: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit evaluation');

      showToast('Evaluation submitted and locked successfully!', 'success');
      setIsConfirmModalOpen(false);
      setEvaluation(data.evaluation);
    } catch (err: any) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading stall scoring workspace..." />;
  }

  // Security Block: Forbidden
  if (forbiddenError) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-slate-900">403 Forbidden Access</h1>
        <p className="text-xs text-slate-600 leading-relaxed">{forbiddenError}</p>
        <Link href="/evaluator/projects" className="inline-block pt-2">
          <Button variant="primary">Return to My Assigned Projects</Button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Stall Not Found</h1>
        <Link href="/evaluator/projects">
          <Button variant="secondary">Back to My Projects</Button>
        </Link>
      </div>
    );
  }

  const isLocked = Boolean(evaluation?.isLocked || evaluation?.status === 'SUBMITTED');
  const currentTotal = calculateCurrentTotal();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/evaluator/projects"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Projects</span>
        </Link>

        {isLocked ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3" />
            <span>Evaluation Locked</span>
          </span>
        ) : (
          <span className="text-xs font-bold text-slate-500">
            {scoredCount} of {criteria.length} Scored
          </span>
        )}
      </div>

      {/* Project Stall Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              {project.teamCode}
            </span>
            {project.stallNumber && (
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {project.stallNumber}
              </span>
            )}
          </div>
          <Badge variant="primary" size="sm">
            {project.categoryName}
          </Badge>
        </div>

        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {project.title}
          </h1>
          <p className="text-xs font-bold text-slate-700 mt-0.5">{project.teamName}</p>
          {project.school && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {project.school} {project.grade ? `• ${project.grade}` : ''}
            </p>
          )}
        </div>

        {/* Collapsible Dossier Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowProjectDossier(!showProjectDossier)}
            className="w-full flex items-center justify-between text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors py-1"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>{showProjectDossier ? 'Hide Project Synopsis & Roster' : 'View Project Synopsis & Roster'}</span>
            </span>
            {showProjectDossier ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showProjectDossier && (
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-3">
              {project.shortDescription && (
                <div>
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                    Abstract / Summary
                  </span>
                  <p className="leading-relaxed">{project.shortDescription}</p>
                </div>
              )}

              {project.objectives && (
                <div>
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                    Objectives
                  </span>
                  <p className="leading-relaxed">{project.objectives}</p>
                </div>
              )}

              {project.members && project.members.length > 0 && (
                <div>
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Student Team Members
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.members.map((m, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium"
                      >
                        {m.name} ({m.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.files && project.files.length > 0 && (
                <div>
                  <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                    Exhibition Attachments
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {project.files.map((f, idx) => (
                      <a
                        key={idx}
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-white border border-blue-100 rounded-lg px-2.5 py-1"
                      >
                        <span>{f.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Locked Submission Banner */}
      {isLocked && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Evaluation Submitted & Locked</span>
          </div>
          <p className="text-emerald-700">
            Your final assessment was recorded on {formatDate(evaluation?.submittedAt || undefined)}. This evaluation is read-only unless an administrator unlocks it for revisions.
          </p>

        </div>
      )}

      {/* Dynamic Scoring Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Assessment Criteria ({criteria.length})
          </h2>
          <span className="text-xs font-bold text-emerald-700">
            Live Total: {currentTotal} / {totalMaxMarks} pts
          </span>
        </div>

        {criteria.map((c, index) => {
          const scoreVal = scores[c._id];
          const min = c.minMarks ?? 0;
          const max = c.maxMarks;
          const isScored = typeof scoreVal === 'number';

          return (
            <div
              key={c._id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                isScored ? 'border-slate-200' : 'border-amber-200 bg-amber-50/10'
              }`}
            >
              {/* Criterion Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                  </div>
                  {c.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed pl-7">
                      {c.description}
                    </p>
                  )}
                </div>

                <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                  Max: {max} pts
                </span>
              </div>

              {/* Large Touch-Friendly Mobile Scoring Stepper */}
              <div className="pt-2 pl-7 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-600">Marks Awarded:</span>

                {isLocked ? (
                  <div className="font-mono text-xl font-black text-emerald-800 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-200">
                    {scoreVal ?? 0} <span className="text-xs text-emerald-600">/ {max}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Stepper Down */}
                    <button
                      type="button"
                      onClick={() => handleStepScore(c._id, -1, min, max)}
                      disabled={typeof scoreVal === 'number' && scoreVal <= min}
                      className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg transition-colors active:scale-95"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    {/* Numeric Input */}
                    <input
                      type="number"
                      inputMode="numeric"
                      min={min}
                      max={max}
                      value={scoreVal === '' ? '' : scoreVal}
                      onChange={(e) => handleScoreChange(c._id, e.target.value, min, max)}
                      className="w-16 h-10 text-center font-mono text-lg font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />

                    {/* Stepper Up */}
                    <button
                      type="button"
                      onClick={() => handleStepScore(c._id, +1, min, max)}
                      disabled={typeof scoreVal === 'number' && scoreVal >= max}
                      className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center font-bold text-lg transition-colors active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Optional criterion comment */}
              {!isLocked && (
                <div className="pl-7 pt-1">
                  <input
                    type="text"
                    placeholder={`Note for ${c.name} (optional)...`}
                    value={criterionComments[c._id] || ''}
                    onChange={(e) =>
                      setCriterionComments((prev) => ({ ...prev, [c._id]: e.target.value }))
                    }
                    className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* General Feedback / Judge Remarks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            General Feedback & Judge Remarks (Optional)
          </label>
          <textarea
            rows={3}
            disabled={isLocked}
            placeholder="Constructive feedback, notable innovations, or recommendations for the student team..."
            value={generalFeedback}
            onChange={(e) => setGeneralFeedback(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:text-slate-600"
          />
        </div>

        {/* Confirmation Checkbox (When not locked) */}
        {!isLocked && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-start gap-3">
            <input
              type="checkbox"
              id="confirmEval"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="confirmEval" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
              <strong>Confirmation:</strong> I confirm that I have evaluated this project in person and these marks reflect my objective assessment based on the rubric criteria.
            </label>
          </div>
        )}
      </div>

      {/* Sticky Mobile Bottom Bar */}
      {!isLocked && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 p-3 sm:p-4 shadow-lg">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="leading-tight">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Score</div>
              <div className="text-lg font-black text-emerald-700 font-mono">
                {currentTotal} <span className="text-xs text-slate-500">/ {totalMaxMarks}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                {isSavingDraft ? 'Saving...' : 'Save Draft'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={!isAllMandatoryFilled || isSubmitting}
                onClick={() => setIsConfirmModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
                icon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Evaluation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Final Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Finalize & Lock Evaluation?"
        description="Please confirm your final scores before submitting."
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Finality Notice</span>
            </div>
            <p>
              You are about to submit your evaluation. You will not be able to edit it unless an administrator unlocks it.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Project Stall:</span>
              <span className="font-bold text-slate-800">{project.teamCode} &bull; {project.stallNumber || 'No Stall'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Team:</span>
              <span className="font-bold text-slate-800">{project.teamName}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
              <span className="text-slate-700">Total Awarded Marks:</span>
              <span className="text-emerald-700 font-mono text-sm">
                {currentTotal} / {totalMaxMarks} pts
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleFinalSubmit}
            >
              {isSubmitting ? 'Finalizing...' : 'Yes, Submit Evaluation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
