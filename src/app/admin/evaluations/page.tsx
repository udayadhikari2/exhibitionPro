'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Lock,
  Unlock,
  Users,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Filter,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { IEvent, ICategory } from '@/types';
import { formatDate } from '@/lib/utils';

interface EvaluatorSlot {
  assignmentId: string;
  evaluatorId: string;
  evaluatorName: string;
  status: 'PENDING' | 'DRAFT' | 'SUBMITTED';
  evaluationId: string | null;
  totalScore: number | null;
  maxPossibleScore: number | null;
  submittedAt: string | null;
  isLocked: boolean;
}

interface ProjectProgress {
  teamId: string;
  teamCode: string;
  teamName: string;
  title: string;
  stallNumber: string;
  categoryName: string;
  totalAssigned: number;
  completedCount: number;
  pendingCount: number;
  averageScore: number | null;
  evaluators: EvaluatorSlot[];
}

export default function AdminEvaluationsPage() {
  const { showToast } = useToast();

  const [events, setEvents] = useState<IEvent[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');

  const [projects, setProjects] = useState<ProjectProgress[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalAssignedSlots: 0,
    totalSubmittedReviews: 0,
    pendingReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Unlock Modal
  const [unlockTarget, setUnlockTarget] = useState<EvaluatorSlot | null>(null);
  const [unlockReason, setUnlockReason] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Fetch initial events
  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length > 0) {
          setEvents(data.events);
          setSelectedEventId(data.events[0]._id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch categories when event changes
  useEffect(() => {
    if (!selectedEventId) return;
    fetch(`/api/events/${selectedEventId}/categories`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
      })
      .catch(console.error);
  }, [selectedEventId]);

  // Fetch evaluations overview
  const fetchOverview = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const url = `/api/admin/evaluations?eventId=${selectedEventId}${
        selectedCategoryId !== 'ALL' ? `&categoryId=${selectedCategoryId}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setProjects(data.projects || []);
        setStats({
          totalProjects: data.totalProjects || 0,
          totalAssignedSlots: data.totalAssignedSlots || 0,
          totalSubmittedReviews: data.totalSubmittedReviews || 0,
          pendingReviews: data.pendingReviews || 0,
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch evaluation progress', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedEventId, selectedCategoryId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockTarget?.evaluationId) return;

    setUnlocking(true);
    try {
      const res = await fetch(`/api/admin/evaluations/${unlockTarget.evaluationId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: unlockReason || 'Administrator authorized scoring revisions' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unlock evaluation');

      showToast(`Evaluation for ${unlockTarget.evaluatorName} unlocked`, 'success');
      setUnlockTarget(null);
      setUnlockReason('');
      fetchOverview();
    } catch (err: any) {
      showToast(err.message || 'Unlock failed', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.teamName.toLowerCase().includes(q) ||
      p.teamCode.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.stallNumber && p.stallNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        badge="Evaluation Operations"
        title="Live Evaluation Monitoring"
        description="Track live judge scoring progress across stalls, inspect multi-judge consensus, and manage evaluation locks."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/assignments">
              <Button variant="secondary" size="sm" icon={<Users className="w-4 h-4" />}>
                Assignments Matrix
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchOverview}
            >
              Sync
            </Button>
          </div>
        }
      />

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Stalls</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalProjects}</div>
          <div className="text-xs text-slate-500 mt-0.5">Approved projects</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Slots</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats.totalAssignedSlots}</div>
          <div className="text-xs text-slate-500 mt-0.5">Judge pairings</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Submitted Reviews</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.totalSubmittedReviews}</div>
          <div className="text-xs text-emerald-700 font-semibold mt-0.5">
            {stats.totalAssignedSlots > 0
              ? `${Math.round((stats.totalSubmittedReviews / stats.totalAssignedSlots) * 100)}% overall completion`
              : '0%'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending Reviews</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.pendingReviews}</div>
          <div className="text-xs text-amber-600 mt-0.5">Awaiting submission</div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="w-56">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Active Exhibition
              </label>
              <Select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={events.map((evt) => ({ value: evt._id, label: evt.name }))}
              />
            </div>

            <div className="w-48">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Category Scope
              </label>
              <Select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  ...categories.map((cat) => ({ value: cat._id, label: cat.name })),
                ]}
              />
            </div>
          </div>

          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Search Stall
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search team, code, or stall..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Monitoring Table */}
      {loading ? (
        <LoadingState message="Loading evaluation progress..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Evaluation Projects"
          description="There are no projects or judge assignments found for this event scope."
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Stall & Project</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Assigned Judges & Status</th>
                    <th className="px-4 py-3.5 text-center">Consensus Progress</th>
                    <th className="px-4 py-3.5 text-right">Average Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((p) => {
                    const percent = p.totalAssigned > 0 ? Math.round((p.completedCount / p.totalAssigned) * 100) : 0;
                    return (
                      <tr key={p.teamId} className="hover:bg-slate-50/70 transition-colors">
                        {/* Stall & Project */}
                        <td className="px-5 py-3.5 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {p.teamCode}
                            </span>
                            {p.stallNumber && (
                              <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                                {p.stallNumber}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 block">{p.teamName}</span>
                          <span className="text-[11px] text-slate-500 truncate block">{p.title}</span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {p.categoryName}
                        </td>

                        {/* Assigned Evaluators Pill Matrix */}
                        <td className="px-4 py-3.5">
                          {p.evaluators.length === 0 ? (
                            <span className="text-[11px] text-amber-600 italic">No judges assigned</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {p.evaluators.map((ev) => (
                                <div
                                  key={ev.assignmentId}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                                    ev.status === 'SUBMITTED'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                      : ev.status === 'DRAFT'
                                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className="font-bold">{ev.evaluatorName}</span>
                                  {ev.status === 'SUBMITTED' && ev.totalScore !== null && (
                                    <span className="font-mono font-bold text-emerald-700">
                                      ({ev.totalScore} pts)
                                    </span>
                                  )}

                                  {/* Unlock button if submitted */}
                                  {ev.status === 'SUBMITTED' && ev.evaluationId && (
                                    <button
                                      onClick={() => setUnlockTarget(ev)}
                                      className="p-0.5 hover:bg-emerald-200 rounded text-emerald-800 ml-0.5"
                                      title="Unlock evaluation for revisions"
                                    >
                                      <Unlock className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="font-bold text-xs text-slate-800">
                              {p.completedCount} / {p.totalAssigned}
                            </span>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Average Score */}
                        <td className="px-4 py-3.5 text-right font-mono">
                          {p.averageScore !== null ? (
                            <span className="font-black text-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {p.averageScore} pts
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Unlock Modal */}
      <Modal
        isOpen={!!unlockTarget}
        onClose={() => setUnlockTarget(null)}
        title={`Unlock Evaluation: ${unlockTarget?.evaluatorName}`}
        description="Allow this judge to revise their submitted scores. This action is permanently recorded in the audit trail."
      >
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Administrative Override</span>
            </div>
            <p>
              Unlocking reverts this evaluation to DRAFT status and permits the judge to update and re-submit scores.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason for Unlocking *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Judge requested re-scoring after reviewing working prototype demo"
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUnlockTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={unlocking}
              icon={<Unlock className="w-3.5 h-3.5" />}
            >
              {unlocking ? 'Unlocking...' : 'Confirm Unlock'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
