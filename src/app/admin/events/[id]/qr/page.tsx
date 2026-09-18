'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  Download,
  QrCode,
  Search,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import QRBadge from '@/components/qr-badge';
import { IEvent, ICategory, ITeam } from '@/types';

export default function AdminEventQRStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = use(params);
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [teams, setTeams] = useState<ITeam[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'EVENT'>('PROJECTS');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evRes, catRes, teamRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/categories`),
        fetch(`/api/teams?eventId=${eventId}`),
      ]);

      const [evData, catData, teamData] = await Promise.all([
        evRes.json(),
        catRes.json(),
        teamRes.json(),
      ]);

      if (!evRes.ok) throw new Error(evData.error || 'Event not found');

      setEvent(evData.event);
      setCategories(catData.categories || []);
      setTeams(teamData.teams || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load QR studio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c._id, c.name));
    return map;
  }, [categories]);

  const filteredTeams = React.useMemo(() => {
    return teams.filter((t) => {
      if (selectedCategory !== 'ALL' && t.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pTitle = (t.project?.title || t.title || '').toLowerCase();
        const tName = (t.teamName || '').toLowerCase();
        const tCode = (t.teamCode || '').toLowerCase();
        const stall = (t.stallNumber || t.tableNumber || '').toLowerCase();
        if (!pTitle.includes(q) && !tName.includes(q) && !tCode.includes(q) && !stall.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [teams, selectedCategory, searchQuery]);

  const handlePrintAll = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20">
        <LoadingState message="Loading event and project QR placards..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          title="Event Not Found"
          description="Unable to find event records."
          action={
            <Button variant="primary" onClick={() => router.push('/admin/events')}>
              Back to Events
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <Link
          href={`/admin/events/${event._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Event Studio</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setActiveTab(activeTab === 'PROJECTS' ? 'EVENT' : 'PROJECTS')}
            icon={<QrCode className="w-3.5 h-3.5" />}
          >
            {activeTab === 'PROJECTS' ? 'View Event Gateway QR' : 'View Booth Placards'}
          </Button>

          {activeTab === 'PROJECTS' && filteredTeams.length > 0 && (
            <Button
              size="sm"
              variant="primary"
              onClick={handlePrintAll}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print All Placards ({filteredTeams.length})
            </Button>
          )}
        </div>
      </div>

      {/* Title & Scope Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {event.eventType}
            </span>
            <span className="text-slate-300">&bull;</span>
            <Badge variant="primary" size="sm">
              QR Studio &amp; Stall Cards
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {event.name}
          </h1>
          <p className="text-xs text-slate-500">
            Generate and print official booth placards with camera-scannable QR codes for exhibition tables.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 shrink-0">
          <button
            onClick={() => setActiveTab('PROJECTS')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'PROJECTS'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Booth Placards ({teams.length})
          </button>
          <button
            onClick={() => setActiveTab('EVENT')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'EVENT'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Event Gateway QR
          </button>
        </div>
      </div>

      {/* EVENT GATEWAY QR VIEW */}
      {activeTab === 'EVENT' ? (
        <div className="max-w-xl mx-auto py-4">
          <QRBadge
            eventTitle={event.name}
            eventSlug={event.slug}
            isEventQR={true}
          />
        </div>
      ) : (
        /* PROJECT PLACARDS VIEW */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name, team, stall number..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 shrink-0">Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="ALL">All Categories ({teams.length})</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredTeams.length === 0 ? (
            <Card className="no-print">
              <CardContent className="p-12 text-center">
                <EmptyState
                  title="No Placards Found"
                  description="No teams match your search or filter parameters."
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('ALL');
                      }}
                    >
                      Reset Filters
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:space-y-12">
              {filteredTeams.map((team) => (
                <div key={team._id} className="print:break-after-page print:pt-4">
                  <QRBadge
                    teamCode={team.teamCode}
                    stallNumber={team.stallNumber || team.tableNumber}
                    projectTitle={team.project?.title || team.title || team.teamName}
                    teamName={team.teamName}
                    categoryName={categoryMap.get(team.categoryId)}
                    institution={team.school || team.institution}
                    eventTitle={event.name}
                    eventSlug={event.slug}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
