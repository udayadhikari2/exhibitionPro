'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  ExternalLink,
  Edit,
  Archive,
  Eye,
  Sliders,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { IEvent, EventStatus, EVENT_STATUS_FLOW } from '@/types';
import { getStatusBadge, formatDate } from '@/lib/utils';

const EVENT_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'Science', label: 'Science' },
  { value: 'IT', label: 'IT & Technology' },
  { value: 'Cultural', label: 'Cultural' },
  { value: 'Dance', label: 'Dance' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Art', label: 'Art' },
  { value: 'Innovation', label: 'Innovation' },
  { value: 'Other', label: 'Other / Custom' },
];

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REGISTRATION_OPEN', label: 'Registration Open' },
  { value: 'REGISTRATION_CLOSED', label: 'Registration Closed' },
  { value: 'EVALUATION_READY', label: 'Evaluation Ready' },
  { value: 'EVALUATION_RUNNING', label: 'Evaluation Running' },
  { value: 'EVALUATION_COMPLETED', label: 'Evaluation Completed' },
  { value: 'RESULT_REVIEW', label: 'Result Review' },
  { value: 'RESULT_APPROVED', label: 'Result Approved' },
  { value: 'RESULT_PUBLISHED', label: 'Result Published' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function AdminEventsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Archive dialog state
  const [archiveTarget, setArchiveTarget] = useState<IEvent | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (selectedType !== 'ALL') params.set('eventType', selectedType);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (includeArchived || selectedStatus === 'ARCHIVED') params.set('includeArchived', 'true');

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
      } else {
        showToast(data.error || 'Failed to fetch events', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error fetching events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedStatus, selectedType, includeArchived]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`/api/events/${archiveTarget._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`"${archiveTarget.name}" has been archived`, 'success');
        setEvents((prev) =>
          prev.map((e) => (e._id === archiveTarget._id ? { ...e, status: 'ARCHIVED' as EventStatus } : e))
        );
      } else {
        showToast(data.error || 'Failed to archive event', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error archiving event', 'error');
    } finally {
      setIsArchiving(false);
      setArchiveTarget(null);
    }
  };

  const getStatusBadgeStyle = (status: EventStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'REGISTRATION_OPEN':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'REGISTRATION_CLOSED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'EVALUATION_READY':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'EVALUATION_RUNNING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'EVALUATION_COMPLETED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RESULT_REVIEW':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'RESULT_APPROVED':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'RESULT_PUBLISHED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'ARCHIVED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Page Header */}
      <PageHeader
        badge="Phase 2 • Event Lifecycle"
        title="Event & Category Management"
        description="Configure events, custom exhibition disciplines, status flows, and public portals."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/events')}
              icon={<ExternalLink className="w-4 h-4" />}
            >
              Public Catalog
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/admin/events/create')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Event
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="Search by event title, venue, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button type="submit" variant="primary" icon={<Search className="w-4 h-4" />}>
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={STATUS_FILTER_OPTIONS}
              />
            </div>
            <div className="w-44">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={EVENT_TYPE_OPTIONS}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Include Archived Events</span>
          </label>
        </div>
      </div>

      {/* Event List */}
      {loading ? (
        <LoadingState message="Fetching events and lifecycle statuses..." />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No events found"
          description={
            searchQuery || selectedStatus !== 'ALL' || selectedType !== 'ALL'
              ? 'Try clearing filters or search query to see other exhibitions and competitions.'
              : 'Get started by creating your first exhibition or competition.'
          }
          action={
            <Button
              variant="primary"
              onClick={() => router.push('/admin/events/create')}
              icon={<Plus className="w-4 h-4" />}
            >
              Create New Event
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => {
            const isArchived = evt.status === 'ARCHIVED';
            return (
              <div
                key={evt._id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isArchived ? 'border-rose-200 opacity-80 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Banner or Header */}
                  {evt.banner ? (
                    <div className="h-36 w-full overflow-hidden relative bg-slate-100">
                      <img
                        src={evt.banner}
                        alt={evt.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${getStatusBadgeStyle(
                            evt.status
                          )}`}
                        >
                          {evt.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur">
                          {evt.eventType}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 pb-0 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        {evt.eventType}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeStyle(
                          evt.status
                        )}`}
                      >
                        {evt.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {evt.name}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        slug: /{evt.slug}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {evt.description || 'No description provided.'}
                    </p>

                    <div className="pt-2 flex flex-col gap-1.5 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {formatDate(evt.startDate)} &mdash; {formatDate(evt.endDate)}
                        </span>
                      </div>
                      {evt.organizer && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Organizer: <span className="font-semibold text-slate-600">{evt.organizer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => router.push(`/admin/events/${evt._id}`)}
                      icon={<Sliders className="w-3.5 h-3.5" />}
                    >
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/admin/events/${evt._id}/edit`)}
                      icon={<Edit className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/events/${evt.slug}`}
                      target="_blank"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition-colors"
                      title="Open Public Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    {!isArchived && (
                      <button
                        onClick={() => setArchiveTarget(evt)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Archive Event"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Event?"
        description={`Are you sure you want to archive "${archiveTarget?.name}"? Archived events are hidden from public directories and registration flows.`}
        confirmText={isArchiving ? 'Archiving...' : 'Archive Event'}
        variant="danger"
      />
    </div>
  );
}
