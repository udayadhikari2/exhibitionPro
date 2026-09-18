'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { ITeam, TeamStatus } from '@/types';

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'CORRECTION_REQUIRED', label: 'Correction Required' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function StudentTeamsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState<ITeam | null>(null);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ myTeams: 'true' });
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/teams?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTeams(data.teams || []);
      } else {
        showToast(data.error || 'Failed to fetch teams', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching teams', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeams();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/teams/${deleteTarget._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(`Team "${deleteTarget.teamName}" removed`, 'success');
        setTeams((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      } else {
        showToast(data.error || 'Failed to delete team', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting team', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CORRECTION_REQUIRED':
      case 'NEEDS_CORRECTION':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'REJECTED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        badge="Participant Workspaces"
        title="My Teams &amp; Projects"
        description="All exhibition and competition teams submitted or drafted by you."
        actions={
          <Button
            variant="primary"
            onClick={() => router.push('/student/teams/create')}
            icon={<Plus className="w-4 h-4" />}
          >
            Register New Team
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Search by team name, code, or project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>

        <div className="w-full sm:w-52">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <LoadingState message="Fetching your teams..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams found"
          description={
            searchQuery || selectedStatus !== 'ALL'
              ? 'Try resetting the filters or searching with different keywords.'
              : 'You have not registered any project teams yet.'
          }
          action={
            <Button
              variant="primary"
              onClick={() => router.push('/student/teams/create')}
              icon={<Plus className="w-4 h-4" />}
            >
              Register Team &amp; Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map((t) => {
            const needsCorrection =
              t.status === 'CORRECTION_REQUIRED' || t.status === 'NEEDS_CORRECTION';
            const isDraft = t.status === 'DRAFT';

            return (
              <div
                key={t._id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  needsCorrection ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                        {t.teamCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">{t.teamName}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(
                        t.status
                      )}`}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {needsCorrection && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Admin Correction Required:</span>
                      </div>
                      <p className="text-[11px] text-amber-700 leading-relaxed">
                        {t.correctionRemarks || 'Please review and update required project files or details.'}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {t.project?.title || t.project?.shortDescription || 'No description provided.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Institution</span>
                      <span className="text-slate-700 truncate block font-medium">
                        {t.school || t.institution || 'Academic Institution'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Roster</span>
                      <span className="text-slate-700 block font-medium">
                        {t.members?.length || 1} Member(s)
                      </span>
                    </div>

                    {t.stallNumber && (
                      <div className="col-span-2 pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Allocated Stall</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                          {t.stallNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => router.push(`/student/teams/${t._id}`)}
                    >
                      View Team
                    </Button>
                    {t.project && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/student/projects/${t._id}`)}
                      >
                        Project Details
                      </Button>
                    )}
                  </div>

                  {isDraft && (
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Draft Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Draft Registration?"
        description={`Are you sure you want to delete the draft team "${deleteTarget?.teamName}"? This action cannot be undone.`}
        confirmText="Delete Draft"
        variant="danger"
      />
    </div>
  );
}
