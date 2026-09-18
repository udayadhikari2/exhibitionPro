'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  ShieldCheck,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

interface IEventResultSummary {
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventType: string;
  eventStatus: string;
  resultStatus: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';
  publishedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  totalTeams: number;
  totalEvaluations: number;
  topWinner?: {
    teamCode: string;
    teamName: string;
    averageScore: number;
    percentage: number;
  } | null;
}

export default function AdminResultsDirectoryPage() {
  const [events, setEvents] = useState<IEventResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchResultsOverview();
  }, []);

  const fetchResultsOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/results');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to load results summary', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PUBLISHED
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            APPROVED
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            UNDER REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            DRAFT TABULATION
          </span>
        );
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterStatus === 'ALL') return true;
    return e.resultStatus === filterStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <PageHeader
        badge="Phase 6 — Result Management"
        title="Result & Leaderboard Hub"
        description="Tabulate multi-evaluator score sheets, resolve ties, approve committee dossiers, and publish official public leaderboards."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/evaluations">
              <Button variant="secondary" size="sm">
                Evaluator Matrix
              </Button>
            </Link>
            <Link href="/admin/events">
              <Button variant="secondary" size="sm">
                Events Studio
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stage Progression Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Controlled Publication Pipeline
            </div>
            <h2 className="text-base font-bold">Confidentiality & Committee Approval Protocol</h2>
            <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
              Individual judge scores remain administrative-only. Results stay hidden from the public until
              officially certified and published by authorized committee admins.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl p-2 text-xs font-medium border border-white/10">
            <span className="px-2 py-1 rounded bg-white/20 text-white font-bold">1. DRAFT</span>
            <span>&rarr;</span>
            <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-200 font-bold">2. REVIEW</span>
            <span>&rarr;</span>
            <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-200 font-bold">3. APPROVED</span>
            <span>&rarr;</span>
            <span className="px-2 py-1 rounded bg-emerald-500/30 text-emerald-200 font-bold">4. PUBLISHED</span>
          </div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['ALL', 'DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All Events' : st}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredEvents.length}</span> competition events
        </div>
      </div>

      {loading ? (
        <LoadingState message="Tabulating multi-judge scores and publication statuses..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8 text-slate-400" />}
          title="No events found for this filter"
          description="Adjust your filter or create events to start evaluating."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((ev) => (
            <Card key={ev.eventId} className="hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="primary" size="sm">
                      {ev.eventType}
                    </Badge>
                    {getStatusBadge(ev.resultStatus)}
                  </div>
                  <CardTitle className="text-lg text-slate-900">{ev.eventName}</CardTitle>
                  <CardDescription className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Lifecycle: <strong className="text-slate-700">{ev.eventStatus}</strong></span>
                    {ev.approvedBy && (
                      <span>&bull; Approved by {ev.approvedBy}</span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Evaluation Metrics */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <div className="text-slate-500">Participating Teams</div>
                      <div className="text-base font-bold text-slate-900">{ev.totalTeams}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Completed Evaluations</div>
                      <div className="text-base font-bold text-blue-600">{ev.totalEvaluations}</div>
                    </div>
                  </div>

                  {/* Winner Preview */}
                  {ev.topWinner ? (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          #1
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{ev.topWinner.teamName}</div>
                          <div className="text-[11px] text-amber-800">Code: {ev.topWinner.teamCode}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-amber-900">{ev.topWinner.averageScore} pts</div>
                        <div className="text-[11px] text-amber-700">{ev.topWinner.percentage}%</div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      No evaluations recorded yet
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/results/${ev.eventId}`}>
                    <Button size="sm" variant="primary">
                      <BarChart3 className="w-3.5 h-3.5 mr-1" />
                      Leaderboard &amp; Tabulation
                    </Button>
                  </Link>

                  <Link href={`/admin/results/${ev.eventId}/review`}>
                    <Button size="sm" variant="secondary">
                      Audit Dossier
                    </Button>
                  </Link>
                </div>

                {ev.resultStatus === 'PUBLISHED' ? (
                  <Link href={`/events/${ev.eventSlug}/results`} target="_blank">
                    <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Public View
                    </Button>
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Unpublished</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
