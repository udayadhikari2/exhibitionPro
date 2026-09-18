'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  Medal,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  Lock,
  Layers,
  Calendar,
  MapPin,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ITeamResult, IEventResult } from '@/types';

export default function PublicEventResultsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [event, setEvent] = useState<any>(null);
  const [result, setResult] = useState<IEventResult | null>(null);
  const [message, setMessage] = useState<string>('');

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchResults();
  }, [slug]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/events/${slug}/results`);
      const data = await res.json();

      setIsPublished(data.isPublished);
      setEvent(data.event || null);
      setResult(data.result || null);
      setMessage(data.message || '');
    } catch (err) {
      console.error('Failed to load public results', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingState message="Fetching official competition standings and podium winners..." />
      </div>
    );
  }

  // If results are NOT published yet:
  if (!isPublished) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Event Overview
        </Link>

        <Card className="border-slate-200 shadow-sm text-center p-8 sm:p-12 space-y-6 bg-gradient-to-b from-white to-slate-50">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <Badge variant="warning" size="md">
              Results Confidential &bull; Not Yet Published
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {event?.name || 'Exhibition Competition'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {message ||
                'Official results for this event are currently undergoing committee review and certification. Standings will be published publicly once certified by the steering committee.'}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href={`/events/${slug}`}>
              <Button variant="primary">Return to Event Page</Button>
            </Link>
            <Link href="/events">
              <Button variant="secondary">Browse Other Competitions</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const teams = result?.results || [];

  // Extract unique categories from results
  const categoriesMap = new Map<string, string>();
  teams.forEach((t) => {
    if (t.categoryId && t.categoryName) {
      categoriesMap.set(t.categoryId, t.categoryName);
    }
  });
  const categoriesList = Array.from(categoriesMap.entries());

  // Filtered teams
  const filteredTeams = teams.filter((team) => {
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

  const podiumTeams = teams.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href={`/events/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Event Overview
        </Link>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-blue-500/30 text-blue-200 border-blue-400/40">
                Official Certified Standings
              </Badge>
              <Badge variant="neutral" size="sm" className="bg-white/10 text-white border-white/20">
                {event.eventType}
              </Badge>
              {result?.publishedAt && (
                <span className="text-xs text-slate-300">
                  Published on {new Date(result.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {event.name} &mdash; Official Results
            </h1>

            <p className="text-sm text-blue-200/90 leading-relaxed">
              Congratulations to all participating innovators, developers, and creators. Standings represent
              the certified aggregate scores tabulated across all assigned judging panels.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-300">
              {event.venue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  {event.venue}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {teams.length} Competing Projects
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Showcase */}
      {podiumTeams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-black text-slate-900">Hall of Champions &mdash; Top Podium</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Rank 2 (Silver) */}
            {podiumTeams[1] && (
              <Card className="order-2 md:order-1 border-slate-200 shadow-xs hover:shadow-md transition-shadow bg-gradient-to-b from-slate-50 to-white flex flex-col justify-between">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mx-auto font-black text-lg shadow-xs">
                    2
                  </div>
                  <Badge variant="neutral" size="sm">
                    1st Runner Up (Silver)
                  </Badge>
                  <div className="pt-1">
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">
                      {podiumTeams[1].teamName}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {podiumTeams[1].projectTitle}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Code: {podiumTeams[1].teamCode} &bull; Category: {podiumTeams[1].categoryName}
                  </div>
                </CardContent>
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Final Score</span>
                  <span className="font-black text-slate-900 text-sm">
                    {podiumTeams[1].averageScore} <span className="text-xs text-slate-400">({podiumTeams[1].percentage}%)</span>
                  </span>
                </div>
              </Card>
            )}

            {/* Rank 1 (Gold - Center) */}
            {podiumTeams[0] && (
              <Card className="order-1 md:order-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-b from-amber-50/60 via-amber-50/20 to-white flex flex-col justify-between relative overflow-hidden scale-102">
                <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  Champion
                </div>
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center mx-auto font-black text-xl shadow-md ring-4 ring-amber-100">
                    1
                  </div>
                  <Badge variant="warning" size="md" className="font-bold">
                    Grand Champion (Gold)
                  </Badge>
                  <div className="pt-1">
                    <h3 className="font-extrabold text-slate-900 text-lg line-clamp-1">
                      {podiumTeams[0].teamName}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium line-clamp-2 mt-1">
                      {podiumTeams[0].projectTitle}
                    </p>
                  </div>
                  <div className="text-[11px] text-amber-900/80 font-mono font-bold">
                    Code: {podiumTeams[0].teamCode} &bull; {podiumTeams[0].categoryName}
                  </div>
                </CardContent>
                <div className="p-4 border-t border-amber-100 bg-amber-50/60 rounded-b-xl flex items-center justify-between text-xs">
                  <span className="text-amber-900 font-bold">Final Average Score</span>
                  <span className="font-black text-amber-950 text-base">
                    {podiumTeams[0].averageScore} <span className="text-xs text-amber-700">({podiumTeams[0].percentage}%)</span>
                  </span>
                </div>
              </Card>
            )}

            {/* Rank 3 (Bronze) */}
            {podiumTeams[2] && (
              <Card className="order-3 md:order-3 border-slate-200 shadow-xs hover:shadow-md transition-shadow bg-gradient-to-b from-amber-50/30 to-white flex flex-col justify-between">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-700 text-white flex items-center justify-center mx-auto font-black text-lg shadow-xs">
                    3
                  </div>
                  <Badge variant="neutral" size="sm">
                    2nd Runner Up (Bronze)
                  </Badge>
                  <div className="pt-1">
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">
                      {podiumTeams[2].teamName}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {podiumTeams[2].projectTitle}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Code: {podiumTeams[2].teamCode} &bull; Category: {podiumTeams[2].categoryName}
                  </div>
                </CardContent>
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Final Score</span>
                  <span className="font-black text-slate-900 text-sm">
                    {podiumTeams[2].averageScore} <span className="text-xs text-slate-400">({podiumTeams[2].percentage}%)</span>
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base text-slate-900">Complete Event Leaderboard</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Official standings computed from all assigned evaluator assessments.
              </CardDescription>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search project or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                {categoriesList.map(([cId, cName]) => (
                  <option key={cId} value={cId}>
                    {cName}
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
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Cat. Rank</th>
                  <th className="py-3 px-4 text-right">Final Score</th>
                  <th className="py-3 px-4 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No teams match your search or filter.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((t) => (
                    <tr key={t.teamId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                              t.rankOverall === 1
                                ? 'bg-amber-400 text-amber-950'
                                : t.rankOverall === 2
                                ? 'bg-slate-200 text-slate-800'
                                : t.rankOverall === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.rankOverall}
                          </span>
                          {t.isTied && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                              TIED
                            </span>
                          )}
                        </div>
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
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {t.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-700">#{t.rankInCategory}</span>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 rounded-b-xl text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              &bull; Individual evaluator marks are kept strictly confidential by portal policy.
            </span>
            <span>
              &bull; Final scores represent the certified arithmetic mean across all assigned judges.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
