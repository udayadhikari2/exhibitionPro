'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  Medal,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Globe,
  ArrowLeft,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  UserCheck,
  AlertCircle,
  Search,
  Layers,
  Sparkles,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { IEventResult, ITeamResult, ResultStatus, IEvaluationCriterion, ICategory } from '@/types';

export default function EventResultsStudioPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const [event, setEvent] = useState<any>(null);
  const [result, setResult] = useState<IEventResult | null>(null);
  const [criteria, setCriteria] = useState<IEvaluationCriterion[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expanded Evaluator Breakdown Rows
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Tie Breaker Configurator State
  const [showTieBreakModal, setShowTieBreakModal] = useState(false);
  const [tieBreakOrder, setTieBreakOrder] = useState<string[]>([]);

  // Status Action Dialog
  const [statusConfirmAction, setStatusConfirmAction] = useState<ResultStatus | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadResultsData();
  }, [eventId]);

  const loadResultsData = async (forceRecalculate = false) => {
    try {
      if (!forceRecalculate) setLoading(true);
      else setRefreshing(true);

      const url = `/api/results/${eventId}${forceRecalculate ? '?recalculate=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setEvent(data.event);
        setResult(data.result);
        setCriteria(data.criteria || []);
        setCategories(data.categories || []);

        if (data.result?.tieBreakCriteriaOrder?.length > 0) {
          setTieBreakOrder(data.result.tieBreakCriteriaOrder);
        } else if (data.criteria?.length > 0) {
          setTieBreakOrder(data.criteria.map((c: any) => c._id));
        }
      }
    } catch (err) {
      console.error('Failed to load event result details', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleRowExpansion = (teamId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));
  };

  const handleStatusChange = async (targetStatus: ResultStatus) => {
    try {
      setStatusUpdating(true);
      setStatusMessage(null);
      const res = await fetch(`/api/results/${eventId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.result);
        setStatusMessage({ type: 'success', text: `Result status upgraded to ${targetStatus}!` });
        setStatusConfirmAction(null);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update result status' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating status' });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveTieBreakOrder = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/results/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tieBreakOrder }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setShowTieBreakModal(false);
        setStatusMessage({ type: 'success', text: 'Tie-break criteria rules saved and ranks updated!' });
      }
    } catch (err) {
      console.error('Failed to save tie-break rules', err);
    } finally {
      setRefreshing(false);
    }
  };

  const moveCriterion = (index: number, direction: 'UP' | 'DOWN') => {
    const nextOrder = [...tieBreakOrder];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextOrder.length) return;
    const temp = nextOrder[index];
    nextOrder[index] = nextOrder[targetIdx];
    nextOrder[targetIdx] = temp;
    setTieBreakOrder(nextOrder);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingState message="Tabulating multi-judge scores, rankings, and tie-breakers..." />
      </div>
    );
  }

  if (!event || !result) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <EmptyState
          icon={<AlertCircle className="w-8 h-8 text-rose-500" />}
          title="Result Data Not Found"
          description="Could not load result calculations for this event."
          action={
            <Link href="/admin/results">
              <Button variant="secondary">Return to Results Directory</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Filter and search
  const filteredTeams: ITeamResult[] = (result.results || []).filter((team) => {
    if (selectedCategory !== 'ALL' && team.categoryId !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = team.teamName.toLowerCase().includes(q);
      const matchCode = team.teamCode.toLowerCase().includes(q);
      const matchTitle = team.projectTitle.toLowerCase().includes(q);
      return matchName || matchCode || matchTitle;
    }
    return true;
  });

  const getRankBadge = (rank: number, isTied: boolean) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1">
          <span className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-xs">
            1
          </span>
          <Medal className="w-4 h-4 text-amber-500 fill-amber-400" />
          {isTied && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 rounded">TIED</span>}
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1">
          <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-black text-xs shadow-xs">
            2
          </span>
          <Medal className="w-4 h-4 text-slate-400 fill-slate-300" />
          {isTied && <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1 rounded">TIED</span>}
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1">
          <span className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
            3
          </span>
          <Medal className="w-4 h-4 text-amber-700 fill-amber-700" />
          {isTied && <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1 rounded">TIED</span>}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
          {rank}
        </span>
        {isTied && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded">TIED</span>}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Header Navigation */}
      <div>
        <Link
          href="/admin/results"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Results Directory
        </Link>

        <PageHeader
          badge={`Event Result Studio &bull; ${event.eventType}`}
          title={`${event.name} — Tabulation Console`}
          description="Review aggregate marks across judges, adjust tie-breaker priority criteria, audit scores, and publish official standings."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => loadResultsData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Recalculate
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTieBreakModal(true)}
              >
                <Sliders className="w-3.5 h-3.5 mr-1" />
                Tie-Breakers ({tieBreakOrder.length})
              </Button>

              <Link href={`/admin/results/${eventId}/review`}>
                <Button variant="secondary" size="sm">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  Audit Dossier
                </Button>
              </Link>

              {result.status === 'PUBLISHED' && (
                <Link href={`/events/${event.slug}/results`} target="_blank">
                  <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                    <Globe className="w-3.5 h-3.5 mr-1" />
                    Live Public Page
                  </Button>
                </Link>
              )}
            </div>
          }
        />
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Lifecycle Progress and Action Control Panel */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Current Lifecycle State
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black tracking-tight">{result.status}</span>
                {result.approvedBy && (
                  <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                    Certified by: {result.approvedBy}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons based on state */}
            <div className="flex flex-wrap items-center gap-2">
              {result.status === 'DRAFT' && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
                  onClick={() => setStatusConfirmAction('REVIEW')}
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Submit to Committee Review
                </Button>
              )}

              {result.status === 'REVIEW' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                    onClick={() => setStatusConfirmAction('DRAFT')}
                  >
                    Revert to Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold border-none"
                    onClick={() => setStatusConfirmAction('APPROVED')}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Approve Official Standings
                  </Button>
                </>
              )}

              {result.status === 'APPROVED' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                    onClick={() => setStatusConfirmAction('REVIEW')}
                  >
                    Revert to Review
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-none shadow-md shadow-emerald-900/30"
                    onClick={() => setStatusConfirmAction('PUBLISHED')}
                  >
                    <Globe className="w-3.5 h-3.5 mr-1" />
                    Publish to Public Website
                  </Button>
                </>
              )}

              {result.status === 'PUBLISHED' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border-rose-500/30"
                  onClick={() => setStatusConfirmAction('APPROVED')}
                >
                  Unpublish / Revert to Approved
                </Button>
              )}
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
            <div className={`p-2.5 rounded-xl border ${result.status === 'DRAFT' ? 'bg-white/20 border-white/30 text-white font-bold' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <div className="text-[10px] text-slate-400">Step 1</div>
              <div>DRAFT TABULATION</div>
            </div>
            <div className={`p-2.5 rounded-xl border ${result.status === 'REVIEW' ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 font-bold' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <div className="text-[10px] text-slate-400">Step 2</div>
              <div>COMMITTEE REVIEW</div>
            </div>
            <div className={`p-2.5 rounded-xl border ${result.status === 'APPROVED' ? 'bg-blue-500/20 border-blue-400/40 text-blue-200 font-bold' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <div className="text-[10px] text-slate-400">Step 3</div>
              <div>SIGNED &amp; APPROVED</div>
            </div>
            <div className={`p-2.5 rounded-xl border ${result.status === 'PUBLISHED' ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200 font-bold' : 'bg-white/5 border-white/5 text-slate-400'}`}>
              <div className="text-[10px] text-slate-400">Step 4</div>
              <div>PUBLICLY LIVE</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Approved Teams</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{result.totalTeams}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Participating in competition</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Submitted Evaluations</div>
          <div className="text-xl font-extrabold text-blue-600 mt-1">{result.totalEvaluations}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Locked &amp; tabulated</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tie-Breaker Rubrics</div>
          <div className="text-xl font-extrabold text-indigo-600 mt-1">{tieBreakOrder.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Priority evaluation criteria</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tied Standings</div>
          <div className="text-xl font-extrabold text-amber-600 mt-1">
            {(result.results || []).filter((r) => r.isTied).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Projects sharing identical marks</div>
        </div>
      </div>

      {/* Leaderboard Table Workspace */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base text-slate-900">Official Leaderboard Standings</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Sorted by average marks with tie-breaker criterion chain resolution. Click any row to inspect individual judge score sheets.
              </CardDescription>
            </div>

            {/* Category Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search team or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Team &amp; Stall</th>
                  <th className="py-3 px-4">Project Dossier</th>
                  <th className="py-3 px-4">Category Rank</th>
                  <th className="py-3 px-4 text-center">Judges</th>
                  <th className="py-3 px-4 text-right">Average Score</th>
                  <th className="py-3 px-4 text-right">Percentage</th>
                  <th className="py-3 px-4 text-center w-16">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No teams match the current query or filter.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((t) => {
                    const isExpanded = expandedRows[t.teamId];
                    return (
                      <React.Fragment key={t.teamId}>
                        <tr
                          onClick={() => toggleRowExpansion(t.teamId)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                            isExpanded ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-extrabold">
                            {getRankBadge(t.rankOverall, t.isTied)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{t.teamName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono font-medium text-slate-600">{t.teamCode}</span>
                              {t.stallNumber && (
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                                  Stall {t.stallNumber}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 line-clamp-1">{t.projectTitle}</div>
                            <div className="text-[11px] text-slate-500">{t.categoryName}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                              #{t.rankInCategory} in {t.categoryName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                t.evaluationsCount > 0
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              <UserCheck className="w-3 h-3" />
                              {t.evaluationsCount} / {t.assignedCount || t.evaluationsCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-sm font-black text-slate-900">
                              {t.averageScore.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">/ {t.maxPossibleScore}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-blue-600">
                            {t.percentage}%
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                              aria-label="Toggle details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible Admin Multi-Judge Score Audit */}
                        {isExpanded && (
                          <tr className="bg-blue-50/30">
                            <td colSpan={8} className="p-4 border-t border-blue-100/60">
                              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                                    Administrative Multi-Judge Scorecard Breakdown
                                  </div>
                                  <span className="text-[11px] text-slate-500 italic">
                                    (Hidden from public view to protect judge confidentiality)
                                  </span>
                                </div>

                                {(!t.evaluatorScores || t.evaluatorScores.length === 0) ? (
                                  <div className="text-xs text-slate-500 italic py-2">
                                    No completed evaluator marksheets recorded yet for this project.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {t.evaluatorScores.map((ev, idx) => (
                                      <div
                                        key={idx}
                                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2"
                                      >
                                        <div className="flex items-center justify-between font-bold text-slate-800">
                                          <span>{ev.evaluatorName}</span>
                                          <span className="text-blue-600">
                                            {ev.totalScore} / {ev.maxScore} pts
                                          </span>
                                        </div>

                                        {ev.criteriaBreakdown && ev.criteriaBreakdown.length > 0 && (
                                          <div className="space-y-1 pt-1 border-t border-slate-200/60 text-[11px]">
                                            {ev.criteriaBreakdown.map((cb, cIdx) => (
                                              <div
                                                key={cIdx}
                                                className="flex items-center justify-between text-slate-600"
                                              >
                                                <span className="truncate pr-2">{cb.criterionName}</span>
                                                <span className="font-semibold text-slate-800">
                                                  {cb.marks}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tie-Breaker Priority Configurator Modal */}
      {showTieBreakModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Tie-Breaking Criteria Order</h3>
              </div>
              <button
                onClick={() => setShowTieBreakModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              When two or more teams finish with an identical average mark, the portal compares criteria scores
              in this exact sequence. If scores remain tied across all criteria, teams will officially share rank.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tieBreakOrder.map((cId, idx) => {
                const criterion = criteria.find((c) => c._id === cId);
                return (
                  <div
                    key={cId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">
                          {criterion?.name || `Criterion ${cId}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Max Marks: {criterion?.maxMarks || 20}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={idx === 0}
                        onClick={() => moveCriterion(idx, 'UP')}
                        className="h-7 w-7 p-0"
                      >
                        &uarr;
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={idx === tieBreakOrder.length - 1}
                        onClick={() => moveCriterion(idx, 'DOWN')}
                        className="h-7 w-7 p-0"
                      >
                        &darr;
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowTieBreakModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={refreshing}
                onClick={handleSaveTieBreakOrder}
              >
                Apply &amp; Re-Rank Standings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Status Transitions */}
      {statusConfirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setStatusConfirmAction(null)}
          onConfirm={() => handleStatusChange(statusConfirmAction)}
          title={`Confirm Transition to ${statusConfirmAction}`}
          description={
            statusConfirmAction === 'PUBLISHED'
              ? 'Are you sure you want to PUBLISH official results? This will make rankings, total scores, and winner standings accessible to students, visitors, and the public.'
              : statusConfirmAction === 'APPROVED'
              ? 'Are you sure you want to officially APPROVE these standings? This will stamp the result with your administrator signature.'
              : `Proceed with moving results to ${statusConfirmAction}?`
          }
          confirmText={`Yes, Set to ${statusConfirmAction}`}
          variant={statusConfirmAction === 'PUBLISHED' ? 'primary' : 'primary'}
        />
      )}

    </div>
  );
}
