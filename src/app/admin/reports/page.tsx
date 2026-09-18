'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  Printer,
  Trophy,
  Users,
  Building2,
  Medal,
  Sparkles,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IReportSummary {
  totalEvents: number;
  totalTeams: number;
  approvedTeams: number;
  pendingTeams: number;
  totalEvaluators: number;
  totalEvaluations: number;
  completedEvaluations: number;
  evaluationCoverageRate: number;
  overallAverageScore: number;
}

interface ICategoryBreakdown {
  categoryId: string;
  categoryName: string;
  totalTeams: number;
  evaluatedTeams: number;
  averageScore: number;
  topScore: number;
  topProject: string;
}

interface IInstitutionalTally {
  institution: string;
  totalTeams: number;
  gold: number;
  silver: number;
  bronze: number;
  averageScore: number;
  points: number;
}

interface IRankedTeam {
  rank: number;
  teamCode: string;
  title: string;
  tableNumber: string;
  category: string;
  averageScore: number;
  evaluationsCount: number;
}

export default function AdminReportsPage() {
  const [data, setData] = useState<{
    selectedEvent: any;
    allEvents: { _id: string; title: string; status: string }[];
    summary: IReportSummary;
    categoriesBreakdown: ICategoryBreakdown[];
    institutionalTally: IInstitutionalTally[];
    rankedTeams: IRankedTeam[];
  } | null>(null);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadReport = (eventId?: string) => {
    setLoading(true);
    const url = eventId ? `/api/admin/reports?eventId=${eventId}` : '/api/admin/reports';
    fetch(url)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        if (d?.selectedEvent?._id && !selectedEventId) {
          setSelectedEventId(d.selectedEvent._id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReport(selectedEventId);
  }, [selectedEventId]);

  const handleDownloadCSV = (type: 'results' | 'teams' | 'evaluations') => {
    const url = `/api/admin/reports/export?eventId=${selectedEventId || ''}&type=${type}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
            <Link href="/admin" className="hover:text-blue-600 transition">
              Admin
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Executive Reports &amp; Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            <span>Exhibition Intelligence &amp; Exports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time score tabulations, institutional medal tallies, and official CSV publication exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {data?.allEvents && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
            >
              {data.allEvents.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({evt.status})
                </option>
              ))}
            </select>
          )}

          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadReport(selectedEventId)}
            isLoading={loading}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-black text-white"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50/40 to-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-600">
                <span>Total Projects</span>
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-slate-900">{data.summary.totalTeams}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <span className="text-emerald-600 font-bold">{data.summary.approvedTeams} Approved</span>
                <span>&bull; {data.summary.pendingTeams} In Review</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600">
                <span>Evaluation Coverage</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-slate-900">{data.summary.evaluationCoverageRate}%</div>
              <div className="text-[11px] text-slate-500 font-medium">
                {data.summary.completedEvaluations} of {data.summary.totalEvaluations} submissions finalized
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 bg-gradient-to-br from-amber-50/40 to-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-600">
                <span>Grand Average Score</span>
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-slate-900">{data.summary.overallAverageScore} <span className="text-sm font-normal text-slate-400">/ 100</span></div>
              <div className="text-[11px] text-slate-500 font-medium">
                Computed across all evaluated stalls
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white">
            <CardContent className="p-5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-600">
                <span>Active Judges</span>
                <Users className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-slate-900">{data.summary.totalEvaluators}</div>
              <div className="text-[11px] text-slate-500 font-medium">
                Assigned across {data.categoriesBreakdown.length} competition tracks
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CSV Export Studio Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <Download className="w-3.5 h-3.5" />
            <span>Official Data Export Center</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Generate Clean Tabulated Exports</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Download institutional scorecards, committee audit records, or student project registries in universally compatible CSV format.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleDownloadCSV('results')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Results (CSV)
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDownloadCSV('teams')}
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-semibold"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Teams (CSV)
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleDownloadCSV('evaluations')}
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 font-semibold"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Judge Marks (CSV)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Institutional Leaderboard & Medal Standings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>Institutional Standings &amp; Medal Tally</span>
                </CardTitle>
                <CardDescription>
                  Ranked by cumulative medal points (Gold: 3pts, Silver: 2pts, Bronze: 1pt).
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Institution / Department</th>
                      <th className="py-2.5 px-3 text-center">Gold</th>
                      <th className="py-2.5 px-3 text-center">Silver</th>
                      <th className="py-2.5 px-3 text-center">Bronze</th>
                      <th className="py-2.5 px-3 text-center">Teams</th>
                      <th className="py-2.5 px-3 text-right">Avg Score</th>
                      <th className="py-2.5 px-3 text-right font-black text-slate-900">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {data?.institutionalTally && data.institutionalTally.length > 0 ? (
                      data.institutionalTally.map((inst, index) => (
                        <tr key={inst.institution} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 font-bold text-slate-900">
                              <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                                {index + 1}
                              </span>
                              <span>{inst.institution}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-600">
                            {inst.gold > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                                🥇 {inst.gold}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-600">
                            {inst.silver > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                🥈 {inst.silver}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-700">
                            {inst.bronze > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50/80 border border-amber-300/60">
                                🥉 {inst.bronze}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">{inst.totalTeams}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-800">
                            {inst.averageScore > 0 ? `${inst.averageScore.toFixed(1)}` : '—'}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-blue-600 text-sm">
                            {inst.points}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          No institutional standings tabulated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Ranked Projects Podium Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>Overall Top 10 Project Leaderboard</span>
                </CardTitle>
                <CardDescription>
                  Combined standings across all event categories based on audited evaluator marks.
                </CardDescription>
              </div>
              <Link href="/admin/results">
                <Button size="sm" variant="secondary">
                  Open Results Engine
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Project &amp; Code</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Stall</th>
                      <th className="py-2.5 px-3 text-center">Judges</th>
                      <th className="py-2.5 px-3 text-right">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {data?.rankedTeams && data.rankedTeams.length > 0 ? (
                      data.rankedTeams.map((team) => (
                        <tr key={team.teamCode} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-3 font-bold">
                            {team.rank === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black">
                                🥇
                              </span>
                            ) : team.rank === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black">
                                🥈
                              </span>
                            ) : team.rank === 3 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center text-xs font-black">
                                🥉
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">#{team.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{team.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{team.teamCode}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">{team.category}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-700">
                              {team.tableNumber || 'Stall A'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">{team.evaluationsCount}</td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                            {team.averageScore > 0 ? `${team.averageScore.toFixed(1)}` : 'Pending'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No ranked teams found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Category Benchmarks</span>
              </CardTitle>
              <CardDescription>
                Track performance averages and leading projects by discipline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.categoriesBreakdown && data.categoriesBreakdown.length > 0 ? (
                data.categoriesBreakdown.map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{cat.categoryName}</span>
                      <Badge variant="primary" size="sm">
                        {cat.evaluatedTeams}/{cat.totalTeams} Evaluated
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-slate-400 block text-[10px]">Track Average</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {cat.averageScore > 0 ? `${cat.averageScore.toFixed(1)} / 100` : '—'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-slate-400 block text-[10px]">Peak Score</span>
                        <span className="font-bold text-amber-600 text-sm">
                          {cat.topScore > 0 ? `${cat.topScore.toFixed(1)}` : '—'}
                        </span>
                      </div>
                    </div>

                    {cat.topProject !== 'N/A' && (
                      <div className="text-[10px] text-slate-500 truncate pt-0.5">
                        <span className="font-semibold text-slate-700">Top Project: </span>
                        {cat.topProject}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No categories configured.</p>
              )}
            </CardContent>
          </Card>

          {/* Verification & Compliance Badge */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Audit &amp; Deployment Verified</span>
            </div>
            <p className="text-[11px] text-emerald-800/80 leading-relaxed">
              All evaluation submissions are cryptographically associated with evaluator sessions, validated against max rubric limits, and ready for public certificate generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
