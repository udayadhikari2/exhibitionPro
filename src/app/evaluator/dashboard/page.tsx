'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  MapPin,
  RefreshCw,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { ISessionUser } from '@/types';

interface DashboardStats {
  activeEventsCount: number;
  assignedCount: number;
  completedCount: number;
  pendingCount: number;
  recentAssignments: {
    _id: string;
    teamId: string;
    teamCode: string;
    teamName: string;
    projectTitle: string;
    stallNumber: string;
    status: 'PENDING' | 'DRAFT' | 'COMPLETED';
  }[];
}

export default function EvaluatorDashboardPage() {
  const { showToast } = useToast();
  const [user, setUser] = useState<ISessionUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [authRes, dashRes] = await Promise.all([
        fetch('/api/auth'),
        fetch('/api/evaluator/dashboard'),
      ]);

      const authData = await authRes.json();
      const dashData = await dashRes.json();

      if (authRes.ok && authData.user) setUser(authData.user);
      if (dashRes.ok) setStats(dashData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading evaluator dashboard..." />;
  }

  const assignedCount = stats?.assignedCount || 0;
  const completedCount = stats?.completedCount || 0;
  const pendingCount = stats?.pendingCount || 0;
  const completionPercentage = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Evaluator Identity Welcome Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 text-white shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur">
              Judge Workspace
            </span>
            <span className="text-xs text-emerald-100 font-medium">Walk-Around Evaluation</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Hello, {user?.name || 'Evaluator'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            {user?.institution ? `${user.institution} • ` : ''}Ready for live scoring and rubric assessment.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link href="/evaluator/projects" className="block">
            <Button
              variant="secondary"
              size="lg"
              className="w-full bg-white text-emerald-900 hover:bg-emerald-50 font-black shadow-xs flex items-center justify-center gap-2 py-3.5"
            >
              <span>View My Assigned Projects ({assignedCount})</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">{assignedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Total Stalls</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-0.5">{pendingCount}</div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">To Score</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-0.5">{completedCount}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{completionPercentage}% Done</div>
        </div>
      </div>

      {/* Progress Bar if assigned */}
      {assignedCount > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Evaluation Progress</span>
            <span className="text-emerald-600">{completedCount} of {assignedCount} Completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent Assigned Stalls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Assigned Stalls</h2>
          <Link href="/evaluator/projects" className="text-xs font-bold text-emerald-700 hover:underline">
            View All &rarr;
          </Link>
        </div>

        {(!stats?.recentAssignments || stats.recentAssignments.length === 0) ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No Projects Assigned"
            description="You currently have no competition stalls assigned for evaluation. The administrator will allocate stalls shortly."
          />
        ) : (
          <div className="space-y-2.5">
            {stats.recentAssignments.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      {item.teamCode}
                    </span>
                    {item.stallNumber && (
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {item.stallNumber}
                      </span>
                    )}
                    <Badge
                      size="sm"
                      variant={
                        item.status === 'COMPLETED'
                          ? 'success'
                          : item.status === 'DRAFT'
                          ? 'primary'
                          : 'neutral'
                      }
                    >
                      {item.status === 'COMPLETED'
                        ? 'Scored'
                        : item.status === 'DRAFT'
                        ? 'Draft Saved'
                        : 'Not Started'}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 truncate">{item.teamName}</h3>
                  <p className="text-xs text-slate-500 truncate">{item.projectTitle}</p>
                </div>

                <div className="shrink-0">
                  <Link href={`/evaluator/projects/${item.teamId}/evaluate`}>
                    <Button
                      size="sm"
                      variant={item.status === 'COMPLETED' ? 'secondary' : 'primary'}
                      className={item.status !== 'COMPLETED' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                    >
                      {item.status === 'COMPLETED' ? 'Review' : item.status === 'DRAFT' ? 'Resume' : 'Score'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
