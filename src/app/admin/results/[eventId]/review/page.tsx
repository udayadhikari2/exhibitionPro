'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { IEventResult, ITeamResult, ICategory } from '@/types';

export default function CommitteeReviewDossierPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const [event, setEvent] = useState<any>(null);
  const [result, setResult] = useState<IEventResult | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDossierData();
  }, [eventId]);

  const loadDossierData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/results/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setResult(data.result);
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load dossier data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      const res = await fetch(`/api/results/${eventId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setFeedbackMsg({ type: 'success', text: 'Results officially APPROVED by steering committee!' });
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to approve results' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error updating status' });
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <LoadingState message="Generating committee pre-publication audit dossier..." />
      </div>
    );
  }

  if (!event || !result) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8 text-amber-500" />}
          title="Dossier Not Available"
          description="Could not generate evaluation audit dossier for this event."
        />
      </div>
    );
  }

  const teams = result.results || [];
  const incompleteTeams = teams.filter((t) => t.evaluationsCount === 0);
  const tiedTeams = teams.filter((t) => t.isTied);

  // Group winners by category
  const categoryWinners: Record<string, ITeamResult[]> = {};
  for (const cat of categories) {
    const catTeams = teams.filter((t) => t.categoryId === cat._id);
    categoryWinners[cat.name] = catTeams.slice(0, 3);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div>
        <Link
          href={`/admin/results/${eventId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Results Studio
        </Link>

        <PageHeader
          badge="Steering Committee Audit"
          title="Pre-Publication Results Dossier"
          description={`Formal compliance audit and certification record for ${event.name}.`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Dossier
              </Button>
            </div>
          }
        />
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Audit Readiness Check Notice */}
      {incompleteTeams.length > 0 ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-amber-900">
              Incomplete Evaluations Warning: {incompleteTeams.length} Team(s) with Zero Recorded Scores
            </div>
            <p className="text-amber-700 leading-relaxed">
              Some approved projects have not received judge scorecards yet. You may still review the current standings,
              but publication is discouraged until all assigned evaluations are submitted and locked.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-emerald-900">
              Evaluation Readiness: 100% of Participating Projects Have Been Evaluated
            </div>
            <p className="text-emerald-700 leading-relaxed">
              All participating teams have completed multi-evaluator score sheets. Standings are ready for steering committee sign-off.
            </p>
          </div>
        </div>
      )}

      {/* Formal Certification Paperwork Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="p-6 sm:p-8 space-y-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="text-[11px] font-bold text-blue-600 tracking-widest uppercase">
                Official Certification Record
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">{event.name}</h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Venue: {event.venue || 'Exhibition Grand Hall'} &bull; Type: {event.eventType}
              </div>
            </div>

            <div className="text-right">
              <Badge variant={result.status === 'APPROVED' || result.status === 'PUBLISHED' ? 'primary' : 'neutral'} size="md">
                Status: {result.status}
              </Badge>
              <div className="text-[11px] text-slate-400 mt-1">
                Ref ID: RES-{eventId.substring(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Key Tabulation Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-400">Total Projects</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">{teams.length}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-400">Locked Evaluations</div>
              <div className="text-lg font-black text-blue-600 mt-0.5">{result.totalEvaluations}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-400">Tie-Breaker Rules</div>
              <div className="text-lg font-black text-indigo-600 mt-0.5">{result.tieBreakCriteriaOrder?.length || 0} active</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-slate-400">Resolved Ties</div>
              <div className="text-lg font-black text-amber-600 mt-0.5">{tiedTeams.length} teams</div>
            </div>
          </div>

          {/* Top Category Winners Table */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Category Winner Standings
            </h3>

            <div className="space-y-4">
              {Object.entries(categoryWinners).map(([catName, winners]) => (
                <div key={catName} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Category: {catName}</span>
                    <span className="text-[11px] text-slate-500 font-normal">{winners.length} podium finalists</span>
                  </div>

                  {winners.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No evaluated projects in this category.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {winners.map((w, idx) => (
                        <div
                          key={w.teamId}
                          className="p-3 bg-white rounded-lg border border-slate-200/70 shadow-2xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[11px] text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-blue-600">{w.averageScore} pts</span>
                          </div>
                          <div className="font-bold text-slate-900 line-clamp-1">{w.teamName}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{w.projectTitle}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sign-off Box */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Steering Committee Sign-off &amp; Authorization
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              I hereby certify that all evaluator scores have been verified in compliance with event evaluation guidelines.
              Tie-breaking algorithms and category rankings have been tabulated accurately.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-500">
                {result.approvedBy ? (
                  <div>
                    Signed by: <strong className="text-slate-800">{result.approvedBy}</strong>
                    <div className="text-[11px] text-slate-400">
                      Approved at: {result.approvedAt ? new Date(result.approvedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                ) : (
                  <div>Pending steering committee signature</div>
                )}
              </div>

              {result.status === 'REVIEW' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={approving}
                  onClick={handleApprove}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Sign &amp; Approve Official Standings
                </Button>
              )}

              {result.status === 'APPROVED' && (
                <Link href={`/admin/results/${eventId}`}>
                  <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                    Proceed to Publication &rarr;
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
