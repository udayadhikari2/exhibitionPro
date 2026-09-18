'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ExternalLink,
  Plus,
  Users,
  Search,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ITeam } from '@/types';
import { formatDate } from '@/lib/utils';

export default function StudentSubmissionsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<ITeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/teams?myTeams=true');
        const data = await res.json();
        if (res.ok) {
          setTeams(data.teams || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
        return <Clock className="w-5 h-5 text-amber-500 animate-spin" />;
      case 'CORRECTION_REQUIRED':
      case 'NEEDS_CORRECTION':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'SUBMITTED':
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">Under Review</Badge>;
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        badge="Submissions Pipeline"
        title="Project Submissions Tracker"
        description="Monitor verification progress, review committee feedback, and stall assignments."
        actions={
          <Button
            variant="primary"
            onClick={() => router.push('/student/teams/create')}
            icon={<Plus className="w-4 h-4" />}
          >
            New Submission
          </Button>
        }
      />

      {loading ? (
        <LoadingState message="Loading submissions pipeline..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No submissions found"
          description="You haven't submitted any competition projects yet. Register a team to begin."
          action={
            <Button
              variant="primary"
              onClick={() => router.push('/student/teams/create')}
              icon={<Plus className="w-4 h-4" />}
            >
              Register Team
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {teams.map((t) => {
            const needsCorrection =
              t.status === 'CORRECTION_REQUIRED' || t.status === 'NEEDS_CORRECTION';
            const isApproved = t.status === 'APPROVED';

            return (
              <div
                key={t._id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4 ${
                  needsCorrection
                    ? 'border-amber-300 bg-amber-50/10'
                    : isApproved
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 shrink-0">
                      {getStatusIcon(t.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {t.teamCode}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{t.teamName}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => router.push(`/student/teams/${t._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {t.project?.title || t.project?.shortDescription || 'No description provided.'}
                </p>

                {needsCorrection && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Committee Remarks:</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      {t.correctionRemarks || 'Please review requirements and update your project synopsis.'}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>
                      School: <strong className="text-slate-700">{t.school || 'Institute'}</strong>
                    </span>
                    <span>
                      Members: <strong className="text-slate-700">{t.members?.length || 1}</strong>
                    </span>
                  </div>

                  {t.stallNumber && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Allocated Stall: {t.stallNumber}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
