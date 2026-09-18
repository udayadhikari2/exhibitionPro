'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle,
  FileEdit,
  Award,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { IEvent, ICategory } from '@/types';

interface AssignedProject {
  _id: string;
  teamCode: string;
  teamName: string;
  title: string;
  shortDescription: string;
  categoryName: string;
  categoryId: string;
  eventName: string;
  eventId: string;
  stallNumber: string;
  school: string;
  grade: string;
  membersCount: number;
  evalStatus: 'PENDING' | 'DRAFT' | 'COMPLETED';
  totalScore: number | null;
  maxPossibleScore: number | null;
  submittedAt: string | null;
}

export default function EvaluatorProjectsPage() {
  const { showToast } = useToast();

  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFilters = async () => {
    try {
      const [evtRes, catRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/categories'),
      ]);
      const evtData = await evtRes.json();
      const catData = await catRes.json();
      if (evtRes.ok) setEvents(evtData.events || []);
      if (catRes.ok) setCategories(catData.categories || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const url = `/api/evaluator/projects?eventId=${selectedEventId}&categoryId=${selectedCategoryId}&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load assigned projects');
      setProjects(data.projects || []);
    } catch (err: any) {
      showToast(err.message || 'Error fetching projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [selectedEventId, selectedCategoryId, statusFilter]);

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.teamName.toLowerCase().includes(q) ||
      p.teamCode.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.stallNumber && p.stallNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/evaluator/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <button
          onClick={fetchProjects}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            Assigned Stalls Roster
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          My Evaluation Projects
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Competition stalls specifically allocated to you for examination and scoring.
        </p>
      </div>

      {/* Mobile Filter & Search Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stall #, team name, or project title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Pill Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold overflow-x-auto">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Not Started' },
            { id: 'DRAFT', label: 'Draft Saved' },
            { id: 'COMPLETED', label: 'Scored' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Event
            </label>
            <Select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Events' },
                ...events.map((evt) => ({ value: evt._id, label: evt.name })),
              ]}
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Category
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
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <LoadingState message="Fetching assigned projects..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Matching Projects Found"
          description="There are no assigned stalls matching the selected filters. Adjust your search or check with the administrator."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>{filteredProjects.length} Projects Allocated</span>
            <span>
              {filteredProjects.filter((p) => p.evalStatus === 'COMPLETED').length} Completed
            </span>
          </div>

          {filteredProjects.map((project) => (
            <div
              key={project._id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                project.evalStatus === 'COMPLETED'
                  ? 'border-slate-200 bg-slate-50/50'
                  : project.evalStatus === 'DRAFT'
                  ? 'border-blue-200 bg-blue-50/20'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              {/* Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {project.teamCode}
                  </span>
                  {project.stallNumber && (
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      {project.stallNumber}
                    </span>
                  )}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {project.categoryName}
                  </span>
                </div>

                <Badge
                  variant={
                    project.evalStatus === 'COMPLETED'
                      ? 'success'
                      : project.evalStatus === 'DRAFT'
                      ? 'primary'
                      : 'neutral'
                  }
                >
                  {project.evalStatus === 'COMPLETED'
                    ? 'Evaluation Finalized'
                    : project.evalStatus === 'DRAFT'
                    ? 'Draft Saved'
                    : 'Not Evaluated'}
                </Badge>
              </div>

              {/* Title & Info */}
              <div>
                <h2 className="text-base font-bold text-slate-900">{project.teamName}</h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5 line-clamp-2">
                  {project.title}
                </p>
                {project.school && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {project.school} {project.grade ? `• ${project.grade}` : ''}
                  </p>
                )}
              </div>

              {/* Score summary if completed */}
              {project.evalStatus === 'COMPLETED' && project.totalScore !== null && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Submitted Score
                  </span>
                  <span className="font-mono font-black text-emerald-900">
                    {project.totalScore} / {project.maxPossibleScore || 100} pts
                  </span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-1">
                <Link href={`/evaluator/projects/${project._id}/evaluate`} className="block">
                  <Button
                    className={`w-full font-bold py-2.5 ${
                      project.evalStatus === 'COMPLETED'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-none'
                        : project.evalStatus === 'DRAFT'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {project.evalStatus === 'COMPLETED'
                      ? 'Review Submitted Evaluation'
                      : project.evalStatus === 'DRAFT'
                      ? 'Resume Scoring (Draft)'
                      : 'Score Stall Now'}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
