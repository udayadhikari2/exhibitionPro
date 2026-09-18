'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  Award,
  KeyRound,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { IEvaluatorWithStats, IAssignment, IEvent, ITeam } from '@/types';
import { formatDate } from '@/lib/utils';

export default function EvaluatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const evaluatorId = params.id as string;

  const [evaluator, setEvaluator] = useState<IEvaluatorWithStats | null>(null);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Password reset modal
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('eval123');
  const [isResetting, setIsResetting] = useState(false);

  // Assign Projects Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [availableTeams, setAvailableTeams] = useState<ITeam[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  const fetchEvaluator = async () => {
    try {
      const res = await fetch(`/api/evaluators/${evaluatorId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load evaluator profile');
      setEvaluator(data.evaluator);
      setAssignments(data.assignments || []);
    } catch (err: any) {
      showToast(err.message || 'Error fetching evaluator', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (res.ok && data.events?.length > 0) {
        setEvents(data.events);
        setSelectedEventId(data.events[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (evaluatorId) {
      fetchEvaluator();
      fetchEvents();
    }
  }, [evaluatorId]);

  // Load available teams for selected event when assign modal opens or event changes
  useEffect(() => {
    if (!selectedEventId || !isAssignOpen) return;
    setLoadingTeams(true);
    fetch(`/api/teams?eventId=${selectedEventId}`)
      .then((r) => r.json())
      .then((data) => {
        const teams: ITeam[] = data.teams || [];
        // Filter out teams already assigned to this evaluator
        const assignedTeamIds = new Set(assignments.map((a) => a.teamId));
        setAvailableTeams(teams.filter((t) => !assignedTeamIds.has(t._id)));
        setSelectedTeamIds([]);
      })
      .catch(console.error)
      .finally(() => setLoadingTeams(false));
  }, [selectedEventId, isAssignOpen, assignments]);

  const handleToggleStatus = async () => {
    if (!evaluator) return;
    const nextStatus = evaluator.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/evaluators/${evaluator._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      showToast(`Evaluator marked as ${nextStatus}`, 'success');
      setEvaluator({ ...evaluator, status: nextStatus });
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      const res = await fetch(`/api/evaluators/${evaluatorId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      showToast('Password reset successfully', 'success');
      setIsResetOpen(false);
      setNewPassword('eval123');
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to unassign project');

      showToast('Project unassigned', 'success');
      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId));
    } catch (err: any) {
      showToast(err.message || 'Unassign failed', 'error');
    }
  };

  const handleBatchAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamIds.length === 0) {
      showToast('Please select at least one project to assign', 'error');
      return;
    }

    setIsSavingAssignments(true);
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          evaluatorId,
          teamIds: selectedTeamIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign projects');

      showToast(`Assigned ${data.result?.added || selectedTeamIds.length} projects`, 'success');
      setIsAssignOpen(false);
      fetchEvaluator();
    } catch (err: any) {
      showToast(err.message || 'Assignment failed', 'error');
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const toggleSelectTeam = (id: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <LoadingState message="Loading evaluator dossier..." />;
  }

  if (!evaluator) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <EmptyState
          icon={Award}
          title="Evaluator Not Found"
          description="The requested judge profile does not exist or has been removed."
          action={
            <Link href="/admin/evaluators">
              <Button variant="primary">Back to Directory</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/evaluators"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Evaluators Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={<KeyRound className="w-3.5 h-3.5" />}
            onClick={() => setIsResetOpen(true)}
          >
            Reset Password
          </Button>
          <Button
            size="sm"
            variant={evaluator.status === 'ACTIVE' ? 'danger' : 'secondary'}
            onClick={handleToggleStatus}
          >
            {evaluator.status === 'ACTIVE' ? 'Deactivate Judge' : 'Activate Judge'}
          </Button>
        </div>
      </div>

      {/* Evaluator Profile Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-sm">
              {evaluator.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">{evaluator.name}</h1>
                <Badge variant={evaluator.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {evaluator.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono">Role: {evaluator.role} &bull; ID: {evaluator._id}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {evaluator.email}
                </span>
                {evaluator.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {evaluator.phone}
                  </span>
                )}
                {evaluator.institution && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {evaluator.institution}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge Group */}
          <div className="flex items-center gap-3 self-stretch sm:self-center">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-center min-w-[90px]">
              <div className="text-[10px] uppercase font-bold text-blue-800">Assigned</div>
              <div className="text-xl font-black text-blue-900">{assignments.length}</div>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-center min-w-[90px]">
              <div className="text-[10px] uppercase font-bold text-emerald-800">Scored</div>
              <div className="text-xl font-black text-emerald-900">
                {assignments.filter((a) => a.status === 'COMPLETED').length}
              </div>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl text-center min-w-[90px]">
              <div className="text-[10px] uppercase font-bold text-amber-800">Pending</div>
              <div className="text-xl font-black text-amber-900">
                {assignments.filter((a) => a.status !== 'COMPLETED').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Projects Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Assigned Competition Stalls</h2>
            <p className="text-xs text-slate-500">
              Projects and teams queued for scoring and rubric assessment by this evaluator.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAssignOpen(true)}
          >
            Assign Stalls
          </Button>
        </div>

        {assignments.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Assigned Stalls"
            description="This evaluator currently has no project assignments. Click Assign Stalls to allocate exhibition teams."
            action={
              <Button variant="primary" size="sm" onClick={() => setIsAssignOpen(true)}>
                Allocate Stalls
              </Button>
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Stall & Team</th>
                    <th className="px-4 py-3.5">Project Title</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Evaluation Status</th>
                    <th className="px-4 py-3.5">Assigned Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((asg) => (
                    <tr key={asg._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block w-max mb-1">
                          {asg.teamCode}
                        </span>
                        <span className="font-bold text-slate-900 block">{asg.teamName}</span>
                        {asg.stallNumber && (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            {asg.stallNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 max-w-[240px] truncate">
                        {asg.projectTitle}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {asg.categoryName || 'General'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
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
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {formatDate(asg.assignedAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleUnassign(asg._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Assign Projects Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={`Assign Projects to ${evaluator.name}`}
        description="Select an event and choose unassigned competition stalls for this evaluator."
      >
        <form onSubmit={handleBatchAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Event *</label>
            <Select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              options={events.map((evt) => ({ value: evt._id, label: evt.name }))}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Available Projects ({availableTeams.length})
              </label>
              <button
                type="button"
                onClick={() =>
                  setSelectedTeamIds(
                    selectedTeamIds.length === availableTeams.length
                      ? []
                      : availableTeams.map((t) => t._id)
                  )
                }
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                {selectedTeamIds.length === availableTeams.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {loadingTeams ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading available stalls...</div>
            ) : availableTeams.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                All approved projects for this event are already assigned to this evaluator.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2.5 divide-y divide-slate-100">
                {availableTeams.map((t) => {
                  const isChecked = selectedTeamIds.includes(t._id);
                  return (
                    <div
                      key={t._id}
                      onClick={() => toggleSelectTeam(t._id)}
                      className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-100">
                              {t.teamCode}
                            </span>
                            <span className="font-bold text-xs text-slate-900">{t.teamName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                            {t.project?.title || t.title || 'Untitled'}
                          </div>
                        </div>
                      </div>
                      {t.stallNumber && (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                          {t.stallNumber}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingAssignments || selectedTeamIds.length === 0}
            >
              {isSavingAssignments ? 'Assigning...' : `Assign ${selectedTeamIds.length} Project(s)`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Password for ${evaluator.name}`}
        description="Specify a new password for this judge account."
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
            <Input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isResetting}>
              {isResetting ? 'Saving...' : 'Confirm New Password'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
