'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Search,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  ExternalLink,
  Users,
  Trophy,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { IEvent, EventStatus } from '@/types';
import { formatDate } from '@/lib/utils';

const EVENT_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Disciplines' },
  { value: 'Science', label: 'Science' },
  { value: 'IT', label: 'IT & Technology' },
  { value: 'Cultural', label: 'Cultural' },
  { value: 'Dance', label: 'Dance' },
  { value: 'Sports', label: 'Sports' },
  { value: 'Art', label: 'Art & Design' },
  { value: 'Innovation', label: 'Innovation' },
  { value: 'Other', label: 'Other / Custom' },
];

export default function PublicEventsDirectoryPage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'UPCOMING' | 'CONCLUDED'>('ALL');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (res.ok) {
          // Public catalog excludes DRAFT and ARCHIVED events by default
          const publicList = (data.events || []).filter(
            (e: IEvent) => e.status !== 'ARCHIVED' && e.status !== 'DRAFT'
          );
          // If no non-draft events exist in local demo, show non-archived
          setEvents(publicList.length > 0 ? publicList : (data.events || []).filter((e: IEvent) => e.status !== 'ARCHIVED'));
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Type match
      if (selectedType !== 'ALL' && evt.eventType.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // Status quick filter
      if (statusFilter === 'OPEN' && evt.status !== 'REGISTRATION_OPEN') return false;
      if (statusFilter === 'UPCOMING' && evt.status !== 'DRAFT' && evt.status !== 'REGISTRATION_CLOSED') return false;
      if (statusFilter === 'CONCLUDED' && evt.status !== 'COMPLETED' && evt.status !== 'RESULT_PUBLISHED') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = evt.name?.toLowerCase().includes(q);
        const matchVenue = evt.venue?.toLowerCase().includes(q);
        const matchDesc = evt.description?.toLowerCase().includes(q);
        const matchType = evt.eventType?.toLowerCase().includes(q);
        if (!matchName && !matchVenue && !matchDesc && !matchType) return false;
      }

      return true;
    });
  }, [events, selectedType, statusFilter, searchQuery]);

  const getStatusBadgeStyle = (status: EventStatus) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return 'bg-emerald-500 text-white shadow-emerald-500/20';
      case 'REGISTRATION_CLOSED':
        return 'bg-amber-600 text-white';
      case 'EVALUATION_RUNNING':
        return 'bg-indigo-600 text-white animate-pulse';
      case 'RESULT_PUBLISHED':
        return 'bg-blue-600 text-white';
      case 'COMPLETED':
        return 'bg-slate-700 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Directory Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Public Exhibition & Competition Catalog
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Explore Exhibitions & Competitions
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Discover multidisciplinary student showcases, science expos, robotics challenges, cultural festivals, and athletic tournaments.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by event name, venue, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={EVENT_TYPE_OPTIONS}
            />
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {[
            { id: 'ALL', label: 'All Active Events' },
            { id: 'OPEN', label: 'Registration Open' },
            { id: 'UPCOMING', label: 'Upcoming / Scheduled' },
            { id: 'CONCLUDED', label: 'Concluded & Published' },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Grid */}
      {loading ? (
        <LoadingState message="Loading upcoming exhibitions and competitions..." />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No events matching criteria"
          description="Try broadening your search term or switching to another category filter."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
                setStatusFilter('ALL');
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <Link
              key={evt._id}
              href={`/events/${evt.slug}`}
              className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Banner / Poster */}
                <div className="h-44 w-full relative bg-slate-900 overflow-hidden">
                  {evt.banner ? (
                    <img
                      src={evt.banner}
                      alt={evt.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-indigo-800 flex items-center justify-center text-white/40">
                      <Trophy className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-slate-900 backdrop-blur shadow-xs">
                      {evt.eventType}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-xs tracking-wider uppercase ${getStatusBadgeStyle(
                        evt.status
                      )}`}
                    >
                      {evt.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {evt.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {evt.description || 'Join this exciting exhibition and competition showcase.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
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
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-4 sm:p-5 pt-0">
                <div className="w-full py-2.5 px-4 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 text-xs font-bold flex items-center justify-between transition-colors">
                  <span>Explore Exhibition</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
