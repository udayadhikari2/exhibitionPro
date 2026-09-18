'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Sliders,
  MapPin,
  Building,
  QrCode,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { ITeam, IEvent, TeamStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Pending Review (Submitted)' },
  { value: 'CORRECTION_REQUIRED', label: 'Correction Required' },
  { value: 'APPROVED', label: 'Approved & Stalled' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DRAFT', label: 'Draft' },
];

export default function AdminRegistrationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [teams, setTeams] = useState<ITeam[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const [eventsRes, teamsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/teams'),
      ]);

      const eventsData = await eventsRes.json();
      if (eventsData?.events) setEvents(eventsData.events);

      const teamsData = await teamsRes.json();
      if (teamsData?.teams) setTeams(teamsData.teams);
    } catch (err: any) {
      showToast(err.message || 'Error fetching registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filteredTeams = teams.filter((t) => {
    if (selectedEventId !== 'ALL' && t.eventId !== selectedEventId) return false;
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.teamName?.toLowerCase().includes(q);
      const matchCode = t.teamCode?.toLowerCase().includes(q);
      const matchSchool = (t.school || t.institution)?.toLowerCase().includes(q);
      const matchLeader = t.teamLeader?.name?.toLowerCase().includes(q);
      const matchTitle = t.project?.title?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchSchool && !matchLeader && !matchTitle) {
        return false;
      }
    }
    return true;
  });

  const submittedCount = teams.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'PENDING_APPROVAL'
  ).length;
  const correctionCount = teams.filter(
    (t) => t.status === 'CORRECTION_REQUIRED' || t.status === 'NEEDS_CORRECTION'
  ).length;
  const approvedCount = teams.filter((t) => t.status === 'APPROVED').length;
  const rejectedCount = teams.filter((t) => t.status === 'REJECTED').length;

  const getStatusBadge = (status: TeamStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'CORRECTION_REQUIRED':
      case 'NEEDS_CORRECTION':
        return <Badge variant="danger">Correction Required</Badge>;
      case 'REJECTED':
        return <Badge variant="neutral">Rejected</Badge>;
      default:
        return <Badge variant="neutral">Draft</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Phase 3 • Steering Committee"
        title="Registration Review Console"
        description="Verify project submissions, request revisions, allocate exhibition stalls, and issue QR entry badges."
        actions={
          <div className="flex items-center gap-2">
            {(selectedEventId !== 'ALL' || events.length > 0) && (
              <Button
                variant="secondary"
                onClick={() =>
                  router.push(
                    `/admin/events/${selectedEventId !== 'ALL' ? selectedEventId : events[0]?._id}/qr`
                  )
                }
                icon={<QrCode className="w-4 h-4 text-blue-600" />}
              >
                Print Stall QRs
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => router.push('/admin/events')}
              icon={<Sliders className="w-4 h-4" />}
            >
              Event Hub
            </Button>
            <Button
              variant="primary"
              onClick={fetchRegistrations}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Metric summary counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedStatus('SUBMITTED')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Review</div>
          <div className="text-2xl font-black text-amber-700">{submittedCount}</div>
          <div className="text-[11px] text-slate-500">Requires verification</div>
        </div>

        <div
          onClick={() => setSelectedStatus('CORRECTION_REQUIRED')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-rose-400 transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Correction Requested</div>
          <div className="text-2xl font-black text-rose-700">{correctionCount}</div>
          <div className="text-[11px] text-slate-500">Awaiting student update</div>
        </div>

        <div
          onClick={() => setSelectedStatus('APPROVED')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-emerald-400 transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Approved &amp; Stalled</div>
          <div className="text-2xl font-black text-emerald-700">{approvedCount}</div>
          <div className="text-[11px] text-slate-500">QR active &amp; ready</div>
        </div>

        <div
          onClick={() => setSelectedStatus('REJECTED')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 cursor-pointer hover:border-slate-400 transition-colors"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rejected</div>
          <div className="text-2xl font-black text-slate-700">{rejectedCount}</div>
          <div className="text-[11px] text-slate-500">Declined entries</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by team name, code, school, or project..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Exhibitions' },
                ...events.map((e) => ({ value: e._id, label: e.name })),
              ]}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Registrations List */}
      {loading ? (
        <LoadingState message="Loading registered teams and project entries..." />
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No registrations found"
          description="No teams match the selected event, status, or search query."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedEventId('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="divide-y divide-slate-100">
            {filteredTeams.map((team) => {
              const matchedEvent = events.find((e) => e._id === team.eventId);

              return (
                <div
                  key={team._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                        {team.teamCode}
                      </span>
                      {getStatusBadge(team.status)}
                      {matchedEvent && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          &bull; {matchedEvent.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {team.teamName}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-1">
                      {team.project?.title || team.project?.shortDescription || 'No project description.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{team.school || team.institution || 'Academic Institute'}</span>
                      </span>

                      <span>
                        Leader: <strong className="text-slate-700">{team.teamLeader?.name || 'Student'}</strong>
                      </span>

                      <span>
                        Members: <strong className="text-slate-700">{team.members?.length || 1}</strong>
                      </span>

                      {team.stallNumber && (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Stall: {team.stallNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => router.push(`/admin/registration/teams/${team._id}`)}
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Review &amp; Decide
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
