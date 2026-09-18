'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Layers,
  Users,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  Filter,
  UserCheck,
  FolderKanban,
  CheckSquare,
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
import { IAssignment, IEvent, ICategory, IEvaluatorWithStats, ITeam } from '@/types';

type ViewMode = 'BY_PROJECT' | 'BY_EVALUATOR';

export default function AssignmentsPage() {
  const { showToast } = useToast();

  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [evaluators, setEvaluators] = useState<IEvaluatorWithStats[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('BY_PROJECT');

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalType, setAssignModalType] = useState<'ONE_EVAL_MANY_PROJECTS' | 'ONE_PROJECT_MANY_EVALS'>(
    'ONE_EVAL_MANY_PROJECTS'
  );
  const [modalEvaluatorId, setModalEvaluatorId] = useState('');
  const [modalTeamId, setModalTeamId] = useState('');
  const [modalSelectedTeamIds, setModalSelectedTeamIds] = useState<string[]>([]);
  const [modalSelectedEvalIds, setModalSelectedEvalIds] = useState<string[]>([]);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [evtRes, evalRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/evaluators'),
      ]);

      const evtData = await evtRes.json();
      const evalData = await evalRes.json();

      if (evtRes.ok && evtData.events?.length > 0) {
        setEvents(evtData.events);
        setSelectedEventId(evtData.events[0]._id);
      }
      if (evalRes.ok) {
        setEvaluators(evalData.evaluators || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading initial filters', 'error');
    }
  };

  const fetchEventDetailsAndAssignments = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const [catRes, teamsRes, asgRes] = await Promise.all([
        fetch(`/api/events/${selectedEventId}/categories`),
        fetch(`/api/teams?eventId=${selectedEventId}`),
        fetch(
          `/api/assignments?eventId=${selectedEventId}${
            selectedCategoryId !== 'ALL' ? `&categoryId=${selectedCategoryId}` : ''
          }${selectedEvaluatorId !== 'ALL' ? `&evaluatorId=${selectedEvaluatorId}` : ''}${
            statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''
          }`
        ),
      ]);

      const catData = await catRes.json();
      const teamsData = await teamsRes.json();
      const asgData = await asgRes.json();

      if (catRes.ok) setCategories(catData.categories || []);
      if (teamsRes.ok) setTeams(teamsData.teams || []);
      if (asgRes.ok) setAssignments(asgData.assignments || []);
    } catch (err: any) {
      showToast(err.message || 'Error fetching assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventDetailsAndAssignments();
    }
  }, [selectedEventId, selectedCategoryId, selectedEvaluatorId, statusFilter]);

  const handleUnassign = async (id: string) => {
    if (!confirm('Unassign this project from the evaluator?')) return;
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to unassign');
      showToast('Assignment removed', 'success');
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      showToast(err.message || 'Unassign failed', 'error');
    }
  };

  const openAssignForProject = (teamId: string) => {
    setAssignModalType('ONE_PROJECT_MANY_EVALS');
    setModalTeamId(teamId);
    // Preselect existing evaluators
    const existing = assignments.filter((a) => a.teamId === teamId).map((a) => a.evaluatorId);
    setModalSelectedEvalIds(existing);
    setIsAssignModalOpen(true);
  };

  const openAssignForEvaluator = (evalId: string) => {
    setAssignModalType('ONE_EVAL_MANY_PROJECTS');
    setModalEvaluatorId(evalId);
    const existing = assignments.filter((a) => a.evaluatorId === evalId).map((a) => a.teamId);
    setModalSelectedTeamIds(existing);
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAssign(true);
    try {
      if (assignModalType === 'ONE_EVAL_MANY_PROJECTS') {
        if (!modalEvaluatorId || modalSelectedTeamIds.length === 0) {
          showToast('Please pick an evaluator and at least one project', 'error');
          return;
        }
        const res = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: selectedEventId,
            evaluatorId: modalEvaluatorId,
            teamIds: modalSelectedTeamIds,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Assignment failed');
        showToast(data.message || 'Assignments created', 'success');
      } else {
        if (!modalTeamId || modalSelectedEvalIds.length === 0) {
          showToast('Please pick a team and at least one evaluator', 'error');
          return;
        }
        const res = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: selectedEventId,
            teamId: modalTeamId,
            evaluatorIds: modalSelectedEvalIds,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Assignment failed');
        showToast(data.message || 'Judges assigned', 'success');
      }

      setIsAssignModalOpen(false);
      fetchEventDetailsAndAssignments();
    } catch (err: any) {
      showToast(err.message || 'Error saving assignment', 'error');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Grouping for "BY_PROJECT" view:
  // Show all teams in current event (filtered by category if selected) with their assigned judges
  const filteredTeams = teams.filter((t) => {
    if (selectedCategoryId !== 'ALL' && t.categoryId !== selectedCategoryId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.teamName.toLowerCase().includes(q) ||
        t.teamCode.toLowerCase().includes(q) ||
        (t.project?.title && t.project.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Grouping for "BY_EVALUATOR" view:
  const filteredEvaluators = evaluators.filter((ev) => {
    if (selectedEvaluatorId !== 'ALL' && ev._id !== selectedEvaluatorId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ev.name.toLowerCase().includes(q) || ev.email.toLowerCase().includes(q);
    }
    return true;
  });

  const catMap = new Map(categories.map((c) => [c._id, c.name]));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        badge="Evaluator Coordination"
        title="Assignment Command Center"
        description="Assign single or multiple judges to competition stalls, manage evaluation workloads, and ensure comprehensive project scoring."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={fetchEventDetailsAndAssignments}
            >
              Sync
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setAssignModalType('ONE_EVAL_MANY_PROJECTS');
                setModalEvaluatorId(evaluators[0]?._id || '');
                setModalSelectedTeamIds([]);
                setIsAssignModalOpen(true);
              }}
            >
              New Assignment
            </Button>
          </div>
        }
      />

      {/* Control & Filter Strip */}
      <Card className="p-4 bg-white space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Event Selector */}
            <div className="w-56">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Active Event
              </label>
              <Select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={events.map((evt) => ({ value: evt._id, label: evt.name }))}
              />
            </div>

            {/* Category Selector */}
            <div className="w-44">
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

            {/* Evaluator Selector */}
            <div className="w-44">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Judge / Evaluator
              </label>
              <Select
                value={selectedEvaluatorId}
                onChange={(e) => setSelectedEvaluatorId(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Judges' },
                  ...evaluators.map((ev) => ({ value: ev._id, label: ev.name })),
                ]}
              />
            </div>

            {/* Status Selector */}
            <div className="w-36">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Scoring Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'PENDING', label: 'Pending Review' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Scoring Complete' },
                ]}
              />
            </div>
          </div>

          {/* View Mode Toggle Switch */}
          <div className="self-end md:self-center">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Grouping Perspective
            </label>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('BY_PROJECT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'BY_PROJECT'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>By Project</span>
              </button>
              <button
                onClick={() => setViewMode('BY_EVALUATOR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'BY_EVALUATOR'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>By Judge</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick filter project title, team code, or judge name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Main Assignment Content */}
      {loading ? (
        <LoadingState message="Calculating judge assignment matrix..." />
      ) : viewMode === 'BY_PROJECT' ? (
        /* ================= PERSPECTIVE: BY PROJECT ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Showing {filteredTeams.length} Exhibition Projects</span>
            <span>Total Assigned Evaluator Slots: {assignments.length}</span>
          </div>

          {filteredTeams.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No Projects Found"
              description="There are no approved teams matching this category or search filter in the selected event."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTeams.map((team) => {
                const teamAssignments = assignments.filter((a) => a.teamId === team._id);
                const categoryName = catMap.get(team.categoryId) || 'General';

                return (
                  <div
                    key={team._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {team.teamCode}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {categoryName}
                          </span>
                          {team.stallNumber && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {team.stallNumber}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{team.teamName}</h3>
                        <p className="text-xs text-slate-600 font-medium">
                          {team.project?.title || team.title || 'Untitled Project'}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => openAssignForProject(team._id)}
                      >
                        Assign Judges
                      </Button>
                    </div>

                    {/* Assigned Judges Row */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Assigned Judges ({teamAssignments.length})
                      </div>

                      {teamAssignments.length === 0 ? (
                        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-amber-800 text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            No evaluators currently assigned to score this stall.
                          </span>
                          <button
                            onClick={() => openAssignForProject(team._id)}
                            className="font-bold underline text-amber-900 hover:text-amber-700 text-xs"
                          >
                            Assign Now
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {teamAssignments.map((asg) => (
                            <div
                              key={asg._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                                  {asg.evaluatorName?.charAt(0) || 'E'}
                                </div>
                                <div className="truncate max-w-[150px]">
                                  <Link
                                    href={`/admin/evaluators/${asg.evaluatorId}`}
                                    className="font-bold text-xs text-slate-800 hover:text-blue-600 truncate block"
                                  >
                                    {asg.evaluatorName}
                                  </Link>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {asg.evaluatorEmail}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge
                                  size="sm"
                                  variant={
                                    asg.status === 'COMPLETED'
                                      ? 'success'
                                      : asg.status === 'IN_PROGRESS'
                                      ? 'primary'
                                      : 'neutral'
                                  }
                                >
                                  {asg.status || 'PENDING'}
                                </Badge>
                                <button
                                  onClick={() => handleUnassign(asg._id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Unassign judge"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= PERSPECTIVE: BY EVALUATOR ================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Showing {filteredEvaluators.length} Evaluators</span>
            <span>Total Assigned Evaluator Slots: {assignments.length}</span>
          </div>

          {filteredEvaluators.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No Evaluators Found"
              description="No judges match the selected criteria."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvaluators.map((evaluator) => {
                const evalAssignments = assignments.filter((a) => a.evaluatorId === evaluator._id);
                const completedCount = evalAssignments.filter((a) => a.status === 'COMPLETED').length;

                return (
                  <div
                    key={evaluator._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-xs">
                          {evaluator.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/evaluators/${evaluator._id}`}
                              className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {evaluator.name}
                            </Link>
                            <Badge variant={evaluator.status === 'ACTIVE' ? 'success' : 'neutral'}>
                              {evaluator.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {evaluator.email} &bull; {evaluator.institution || 'Faculty Judge'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="text-right mr-2 hidden sm:block">
                          <span className="text-xs font-bold text-slate-800">
                            {completedCount} / {evalAssignments.length} Scored
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => openAssignForEvaluator(evaluator._id)}
                        >
                          Assign Stalls
                        </Button>
                      </div>
                    </div>

                    {/* Stalls Assigned Row */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Assigned Stalls ({evalAssignments.length})
                      </div>

                      {evalAssignments.length === 0 ? (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs flex items-center justify-between">
                          <span>No stalls assigned to this judge yet.</span>
                          <button
                            onClick={() => openAssignForEvaluator(evaluator._id)}
                            className="font-bold underline text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Assign Stalls
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {evalAssignments.map((asg) => (
                            <div
                              key={asg._id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70"
                            >
                              <div className="space-y-0.5 truncate max-w-[180px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-100">
                                    {asg.teamCode}
                                  </span>
                                  {asg.stallNumber && (
                                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                                      {asg.stallNumber}
                                    </span>
                                  )}
                                </div>
                                <span className="font-bold text-xs text-slate-800 truncate block">
                                  {asg.teamName}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate block">
                                  {asg.projectTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <Badge
                                  size="sm"
                                  variant={
                                    asg.status === 'COMPLETED'
                                      ? 'success'
                                      : asg.status === 'IN_PROGRESS'
                                      ? 'primary'
                                      : 'neutral'
                                  }
                                >
                                  {asg.status || 'PENDING'}
                                </Badge>
                                <button
                                  onClick={() => handleUnassign(asg._id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="Remove assignment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={
          assignModalType === 'ONE_EVAL_MANY_PROJECTS'
            ? 'Assign Judge to Projects'
            : 'Assign Judges to Project'
        }
        description="Configure evaluation scoring pairings for this exhibition."
      >
        <form onSubmit={handleSaveAssignments} className="space-y-4">
          {/* Perspective selector inside modal */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAssignModalType('ONE_EVAL_MANY_PROJECTS')}
              className={`flex-1 py-1.5 rounded text-center transition ${
                assignModalType === 'ONE_EVAL_MANY_PROJECTS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              1 Judge &rarr; Multiple Stalls
            </button>
            <button
              type="button"
              onClick={() => setAssignModalType('ONE_PROJECT_MANY_EVALS')}
              className={`flex-1 py-1.5 rounded text-center transition ${
                assignModalType === 'ONE_PROJECT_MANY_EVALS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              1 Stall &rarr; Multiple Judges
            </button>
          </div>

          {assignModalType === 'ONE_EVAL_MANY_PROJECTS' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Judge *</label>
                <Select
                  value={modalEvaluatorId}
                  onChange={(e) => setModalEvaluatorId(e.target.value)}
                  options={evaluators.map((ev) => ({
                    value: ev._id,
                    label: `${ev.name} (${ev.institution || 'Evaluator'})`,
                  }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Select Projects to Assign ({teams.length} available)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setModalSelectedTeamIds(
                        modalSelectedTeamIds.length === teams.length ? [] : teams.map((t) => t._id)
                      )
                    }
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    {modalSelectedTeamIds.length === teams.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
                  {teams.map((t) => {
                    const isChecked = modalSelectedTeamIds.includes(t._id);
                    return (
                      <div
                        key={t._id}
                        onClick={() =>
                          setModalSelectedTeamIds((prev) =>
                            prev.includes(t._id) ? prev.filter((id) => id !== t._id) : [...prev, t._id]
                          )
                        }
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <div>
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-100 mr-1.5">
                              {t.teamCode}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{t.teamName}</span>
                          </div>
                        </div>
                        {t.stallNumber && (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                            {t.stallNumber}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Project Stall *</label>
                <Select
                  value={modalTeamId}
                  onChange={(e) => setModalTeamId(e.target.value)}
                  options={teams.map((t) => ({
                    value: t._id,
                    label: `${t.teamCode} - ${t.teamName} (${t.stallNumber || 'No Stall'})`,
                  }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Select Judges ({evaluators.length} available)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setModalSelectedEvalIds(
                        modalSelectedEvalIds.length === evaluators.length ? [] : evaluators.map((e) => e._id)
                      )
                    }
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    {modalSelectedEvalIds.length === evaluators.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
                  {evaluators.map((ev) => {
                    const isChecked = modalSelectedEvalIds.includes(ev._id);
                    return (
                      <div
                        key={ev._id}
                        onClick={() =>
                          setModalSelectedEvalIds((prev) =>
                            prev.includes(ev._id) ? prev.filter((id) => id !== ev._id) : [...prev, ev._id]
                          )
                        }
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{ev.name}</span>
                            <span className="text-[11px] text-slate-500">{ev.email}</span>
                          </div>
                        </div>
                        <Badge size="sm" variant={ev.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {ev.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submittingAssign}>
              {submittingAssign ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
