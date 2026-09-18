'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  FolderGit2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  QrCode,
  Calendar,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ITeam, ISessionUser } from '@/types';
import { formatDate } from '@/lib/utils';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<ISessionUser | null>(null);
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [authRes, teamsRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/teams?myTeams=true'),
        ]);

        const authData = await authRes.json();
        if (authData?.user) setUser(authData.user);

        const teamsData = await teamsRes.json();
        if (teamsData?.teams) setTeams(teamsData.teams);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const approvedCount = teams.filter((t) => t.status === 'APPROVED').length;
  const pendingCount = teams.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'PENDING_APPROVAL'
  ).length;
  const correctionCount = teams.filter(
    (t) => t.status === 'CORRECTION_REQUIRED' || t.status === 'NEEDS_CORRECTION'
  ).length;

  const teamsNeedingCorrection = teams.filter(
    (t) => t.status === 'CORRECTION_REQUIRED' || t.status === 'NEEDS_CORRECTION'
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CORRECTION_REQUIRED':
      case 'NEEDS_CORRECTION':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse';
      case 'REJECTED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Phase 3 • Student Hub"
        title="Student Registration Dashboard"
        description="Register competition teams, submit project synopses, and monitor evaluation approvals."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/student/teams')}
              icon={<Users className="w-4 h-4" />}
            >
              My Teams
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/student/teams/create')}
              icon={<Plus className="w-4 h-4" />}
            >
              Register Team &amp; Project
            </Button>
          </div>
        }
      />

      {/* Student Identity Card */}
      {user && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500">
                {user.email} &bull; {user.institution || 'Academic Institution'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active Participant</span>
            </span>
          </div>
        </div>
      )}

      {/* Urgent Action Banner for Corrections */}
      {teamsNeedingCorrection.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Action Required: Correction Requested</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The exhibition review committee has requested revisions on {teamsNeedingCorrection.length} team(s).
                Please review the remarks and update your submission.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {teamsNeedingCorrection.map((t) => (
              <div
                key={t._id}
                className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{t.teamName}</div>
                  <div className="text-[11px] text-amber-700 truncate max-w-xs">
                    {t.correctionRemarks || 'See remarks in team detail.'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push(`/student/teams/${t._id}`)}
                >
                  Revise Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Teams</div>
          <div className="text-2xl font-black text-slate-900">{teams.length}</div>
          <div className="text-[11px] text-slate-500">Under your student profile</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Review</div>
          <div className="text-2xl font-black text-amber-700">{pendingCount}</div>
          <div className="text-[11px] text-slate-500">Awaiting committee review</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Approved &amp; Stalled</div>
          <div className="text-2xl font-black text-emerald-700">{approvedCount}</div>
          <div className="text-[11px] text-slate-500">Ready with stall &amp; QR code</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Corrections</div>
          <div className="text-2xl font-black text-rose-700">{correctionCount}</div>
          <div className="text-[11px] text-slate-500">Requires updates</div>
        </div>
      </div>

      {/* Recent Teams Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Registered Teams</h2>
            <p className="text-xs text-slate-500">Manage project submissions, members, and exhibition stalls.</p>
          </div>
          <Link
            href="/student/teams"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All ({teams.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingState message="Loading your teams and submission status..." />
        ) : teams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No registered teams yet"
            description="Start by registering your first student project team for an upcoming exhibition or competition."
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.slice(0, 4).map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {t.teamCode}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{t.teamName}</h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(
                        t.status
                      )}`}
                    >
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {t.project?.title || t.project?.shortDescription || 'No project description added.'}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.members?.length || 1} Members</span>
                    </span>

                    {t.stallNumber && (
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <span>Stall: {t.stallNumber}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => router.push(`/student/teams/${t._id}`)}
                  >
                    View Team &amp; Stall
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          href="/student/teams/create"
          className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 hover:border-blue-300 transition-colors space-y-2 block group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            New Registration
          </h4>
          <p className="text-xs text-slate-500">
            6-step guided wizard for entering team roster, synopsis, and slide decks.
          </p>
        </Link>

        <Link
          href="/student/submissions"
          className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 hover:border-purple-300 transition-colors space-y-2 block group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
            Submissions Pipeline
          </h4>
          <p className="text-xs text-slate-500">
            Track approval milestones, correction feedback, and evaluator allocations.
          </p>
        </Link>

        <Link
          href="/events"
          className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:border-emerald-300 transition-colors space-y-2 block group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
            Browse Exhibitions
          </h4>
          <p className="text-xs text-slate-500">
            Discover active science, robotics, IT, cultural, and sports competitions.
          </p>
        </Link>
      </div>
    </div>
  );
}
