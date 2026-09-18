'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
  Edit,
  Archive,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Users,
  Award,
  Trophy,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Info,
  Sliders,
  ChevronRight,
  QrCode,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { IEvent, ICategory, EventStatus, EVENT_STATUS_FLOW } from '@/types';
import { formatDate } from '@/lib/utils';

const CATEGORY_PRESETS: Record<string, { name: string; description: string }[]> = {
  Science: [
    { name: 'Physics & Applied Sciences', description: 'Mechanics, optics, thermodynamics, and energy systems.' },
    { name: 'Biology & Life Sciences', description: 'Botany, zoology, biochemistry, and biomedical models.' },
    { name: 'Environmental Science', description: 'Renewable resources, conservation, waste management.' },
    { name: 'Robotics & Automation', description: 'Automated machines, sensor systems, and robotic prototypes.' },
  ],
  Dance: [
    { name: 'Solo Performance', description: 'Individual choreographies across any approved style.' },
    { name: 'Group Performance', description: 'Synchronized ensemble choreographies (3-12 performers).' },
    { name: 'Classical Dance', description: 'Traditional classical repertoire and costume compliance.' },
    { name: 'Contemporary & Fusion', description: 'Modern expressive dance and creative choreography.' },
  ],
  IT: [
    { name: 'Artificial Intelligence & ML', description: 'Machine learning models, neural networks, predictive algorithms.' },
    { name: 'Web & Mobile Applications', description: 'Full-stack software platforms, responsive design, APIs.' },
    { name: 'Cybersecurity & Networks', description: 'Information security, encryption protocols, network defense.' },
    { name: 'IoT & Smart Hardware', description: 'Connected microcontrollers, smart home, ambient computing.' },
  ],
  Cultural: [
    { name: 'Dramatic Arts & Skit', description: 'Short plays, mono-acts, and theatrical presentations.' },
    { name: 'Folk Heritage', description: 'Regional folklore, indigenous art, and cultural representation.' },
    { name: 'Vocal Ensemble', description: 'Choral singing, folk melodies, and harmonic acoustics.' },
  ],
};

type ActiveTab = 'OVERVIEW' | 'CATEGORIES' | 'REGISTRATION' | 'EVALUATION' | 'RESULTS' | 'FEEDBACK';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<ActiveTab>('OVERVIEW');
  const [event, setEvent] = useState<IEvent | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<EventStatus | ''>('');
  const [transitioning, setTransitioning] = useState(false);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catOrder, setCatOrder] = useState<number>(1);
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [savingCat, setSavingCat] = useState(false);

  // Delete Category confirmation
  const [deletingCat, setDeletingCat] = useState<ICategory | null>(null);

  // Archive Event confirmation
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [eventTeams, setEventTeams] = useState<any[]>([]);
  const [eventCriteria, setEventCriteria] = useState<any[]>([]);
  const [eventTotalMarks, setEventTotalMarks] = useState<number>(0);
  const [eventAssignments, setEventAssignments] = useState<any[]>([]);

  const fetchEventData = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Event not found');
      setEvent(data.event);

      // fetch categories
      const catRes = await fetch(`/api/events/${eventId}/categories`);
      const catData = await catRes.json();
      if (catRes.ok) {
        setCategories(catData.categories || []);
      }

      // fetch teams for this event
      const teamsRes = await fetch(`/api/teams?eventId=${eventId}`);
      const teamsData = await teamsRes.json();
      if (teamsRes.ok) {
        setEventTeams(teamsData.teams || []);
      }

      // fetch criteria for this event
      const critRes = await fetch(`/api/criteria?eventId=${eventId}`);
      const critData = await critRes.json();
      if (critRes.ok) {
        setEventCriteria(critData.criteria || []);
        setEventTotalMarks(critData.totalMaxMarks || 0);
      }

      // fetch assignments for this event
      const asgRes = await fetch(`/api/assignments?eventId=${eventId}`);
      const asgData = await asgRes.json();
      if (asgRes.ok) {
        setEventAssignments(asgData.assignments || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Error loading event', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchEventData();
  }, [eventId]);

  // Handle status transition
  const handleStatusChange = async (newStatus: EventStatus) => {
    if (!event) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/events/${event._id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }
      setEvent(data.event);
      showToast(`Event lifecycle status updated to ${newStatus}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Status transition rejected', 'error');
    } finally {
      setTransitioning(false);
    }
  };

  // Open Category Create
  const openCreateCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
    setCatOrder(categories.length + 1);
    setCatStatus('ACTIVE');
    setCatModalOpen(true);
  };

  // Open Category Edit
  const openEditCategory = (cat: ICategory) => {
    setEditingCatId(cat._id);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setCatOrder(cat.order || 1);
    setCatStatus(cat.status || 'ACTIVE');
    setCatModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setSavingCat(true);
    try {
      if (editingCatId) {
        // PUT
        const res = await fetch(`/api/categories/${editingCatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catName.trim(),
            description: catDesc.trim(),
            order: Number(catOrder),
            status: catStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update category');
        setCategories((prev) =>
          prev.map((c) => (c._id === editingCatId ? data.category : c)).sort((a, b) => (a.order || 0) - (b.order || 0))
        );
        showToast('Category updated', 'success');
      } else {
        // POST
        const res = await fetch(`/api/events/${eventId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: catName.trim(),
            description: catDesc.trim(),
            order: Number(catOrder),
            status: catStatus,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create category');
        setCategories((prev) => [...prev, data.category].sort((a, b) => (a.order || 0) - (b.order || 0)));
        showToast('Category added', 'success');
      }
      setCatModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error saving category', 'error');
    } finally {
      setSavingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!deletingCat) return;
    try {
      const res = await fetch(`/api/categories/${deletingCat._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      setCategories((prev) => prev.filter((c) => c._id !== deletingCat._id));
      showToast('Category removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error deleting category', 'error');
    } finally {
      setDeletingCat(null);
    }
  };

  // Quick Preset Add
  const handleAddPreset = async (preset: { name: string; description: string }) => {
    try {
      const res = await fetch(`/api/events/${eventId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preset.name,
          description: preset.description,
          order: categories.length + 1,
          status: 'ACTIVE',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add preset');
      setCategories((prev) => [...prev, data.category].sort((a, b) => (a.order || 0) - (b.order || 0)));
      showToast(`Added "${preset.name}"`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add preset', 'error');
    }
  };

  // Archive Event
  const handleArchiveEvent = async () => {
    if (!event) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/events/${event._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to archive event');
      setEvent(data.event);
      showToast('Event archived', 'success');
      setArchiveModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Error archiving event', 'error');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <LoadingState message="Loading event and lifecycle status..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <EmptyState
          title="Event Not Found"
          description="The requested exhibition or competition ID does not exist or has been removed."
          action={
            <Button variant="primary" onClick={() => router.push('/admin/events')}>
              Back to Events
            </Button>
          }
        />
      </div>
    );
  }

  const currentStatusIdx = EVENT_STATUS_FLOW.indexOf(event.status);
  const nextStatus = currentStatusIdx >= 0 && currentStatusIdx < EVENT_STATUS_FLOW.length - 1
    ? EVENT_STATUS_FLOW[currentStatusIdx + 1]
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top back navigation and primary actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/results/${event._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>Results &amp; Leaderboard</span>
          </Link>
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Public Page</span>
          </Link>
          <Link
            href={`/admin/events/${event._id}/qr`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/50 text-xs font-bold text-blue-700 hover:bg-blue-100/60 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>QR Placards</span>
          </Link>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/admin/events/${event._id}/edit`)}
            icon={<Edit className="w-3.5 h-3.5" />}
          >
            Edit Event
          </Button>
          {event.status !== 'ARCHIVED' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setArchiveModalOpen(true)}
              icon={<Archive className="w-3.5 h-3.5" />}
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Header Banner & Title Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {event.banner && (
          <div className="h-44 sm:h-56 w-full relative bg-slate-900">
            <img
              src={event.banner}
              alt={event.name}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur border border-white/30">
                {event.eventType}
              </span>
              <span className="text-xs font-mono text-white/80 bg-slate-900/60 px-2.5 py-1 rounded-lg backdrop-blur">
                /{event.slug}
              </span>
            </div>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {event.eventType}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs text-slate-500 font-mono">ID: {event._id}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {event.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <Badge
                variant={
                  event.status === 'REGISTRATION_OPEN'
                    ? 'success'
                    : event.status === 'ARCHIVED'
                    ? 'danger'
                    : event.status === 'DRAFT'
                    ? 'neutral'
                    : 'primary'
                }
                size="md"
              >
                {event.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
            {event.description || 'No description added yet.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Venue</div>
                <div className="font-semibold text-slate-800 truncate">{event.venue}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Event Dates</div>
                <div className="font-semibold text-slate-800">
                  {formatDate(event.startDate)} &mdash; {formatDate(event.endDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Registration Period</div>
                <div className="font-semibold text-slate-800 truncate">
                  {event.registrationStart ? formatDate(event.registrationStart) : 'Not configured'} &rarr;{' '}
                  {event.registrationEnd ? formatDate(event.registrationEnd) : 'Open'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto pb-px">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Info },
            { id: 'CATEGORIES', label: `Categories (${categories.length})`, icon: Layers },
            { id: 'REGISTRATION', label: `Registration (${eventTeams.length})`, icon: Users },
            { id: 'EVALUATION', label: `Evaluation (${eventCriteria.length})`, icon: Award },
            { id: 'RESULTS', label: 'Results', icon: Trophy },
            { id: 'FEEDBACK', label: 'Feedback', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Lifecycle Status Stepper and Controller */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Lifecycle Status Transitions</CardTitle>
                  <CardDescription>
                    Sequential 10-stage pipeline control. Transitions are validated on server.
                  </CardDescription>
                </div>
                {nextStatus && event.status !== 'ARCHIVED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={transitioning}
                    onClick={() => handleStatusChange(nextStatus)}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Advance to: {nextStatus.replace(/_/g, ' ')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Stepper bubbles */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {EVENT_STATUS_FLOW.map((st, idx) => {
                  const isCurrent = event.status === st;
                  const isPassed = currentStatusIdx > idx;
                  const isNext = currentStatusIdx + 1 === idx;

                  return (
                    <div
                      key={st}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                          : isPassed
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
                          : isNext
                          ? 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 cursor-pointer'
                          : 'border-slate-100 bg-slate-50/60 text-slate-400'
                      }`}
                      onClick={() => isNext && handleStatusChange(st)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-slate-400">0{idx + 1}</span>
                        {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {isCurrent && <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />}
                      </div>
                      <div className="text-[11px] font-semibold leading-snug">
                        {st.replace(/_/g, ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {event.status === 'ARCHIVED' && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    This event is <strong>ARCHIVED</strong> and inaccessible from active public registration catalogs.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Organizer & Contact</CardTitle>
                <CardDescription>Administrative entities managing this competition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Organizer</span>
                  <span className="text-slate-800 font-semibold">{event.organizer || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Inquiries</span>
                  <span className="text-slate-800 font-semibold">{event.contact || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Configured By</span>
                  <span className="text-slate-800 font-mono">{event.createdBy || 'Super Admin'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Links & Assets</CardTitle>
                <CardDescription>Direct navigation and associated media URLs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Public URL</span>
                  <Link
                    href={`/events/${event.slug}`}
                    target="_blank"
                    className="text-blue-600 hover:underline font-mono inline-flex items-center gap-1"
                  >
                    <span>/events/{event.slug}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Discipline / Type</span>
                  <span className="font-semibold text-slate-800">{event.eventType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Configured Categories</span>
                  <span className="font-semibold text-slate-800">
                    {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Event Categories & Disciplines</h2>
              <p className="text-xs text-slate-500">
                Group projects and teams under specialized categories (e.g. Physics, Robotics, Classical Solo).
              </p>
            </div>
            <Button
              variant="primary"
              onClick={openCreateCategory}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Category
            </Button>
          </div>

          {/* Quick preset recommendations if empty or suggestions available */}
          {CATEGORY_PRESETS[event.eventType] && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Recommended Presets for {event.eventType}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_PRESETS[event.eventType].map((preset) => {
                  const alreadyExists = categories.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
                  if (alreadyExists) return null;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => handleAddPreset(preset)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Categories Listing */}
          {categories.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No categories configured"
              description="Each event can have one or more categories for student entries and judging divisions."
              action={
                <Button variant="primary" onClick={openCreateCategory} icon={<Plus className="w-4 h-4" />}>
                  Create First Category
                </Button>
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {categories.map((cat, idx) => (
                  <div
                    key={cat._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {cat.order || idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              cat.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {cat.status}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEditCategory(cat)}
                        icon={<Edit className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => setDeletingCat(cat)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: REGISTRATION */}
      {activeTab === 'REGISTRATION' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registered Teams & Projects</h2>
              <p className="text-xs text-slate-500">
                Manage team submissions, review proposals, allocate stall numbers, and verify QR codes.
              </p>
            </div>
            <Link href={`/admin/registration?eventId=${event._id}`}>
              <Button variant="primary" icon={<Users className="w-4 h-4" />}>
                Open Registration Console
              </Button>
            </Link>
          </div>

          {eventTeams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Teams Registered Yet"
              description="Teams submitting projects under this event will appear here for administrative review and stall allocation."
              action={
                <Link href={`/admin/registration`}>
                  <Button variant="secondary" size="sm">
                    View All Portal Submissions
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Team & Code</th>
                      <th className="px-4 py-3.5">Project Title</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Institution / Grade</th>
                      <th className="px-4 py-3.5">Roster</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eventTeams.map((t) => {
                      const cat = categories.find((c) => c._id === t.categoryId);
                      const statusVariant =
                        t.status === 'APPROVED'
                          ? 'success'
                          : t.status === 'REJECTED'
                          ? 'danger'
                          : t.status === 'CORRECTION_REQUIRED' || t.status === 'NEEDS_CORRECTION'
                          ? 'warning'
                          : t.status === 'SUBMITTED'
                          ? 'primary'
                          : 'neutral';

                      return (
                        <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5">
                            <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 block w-max mb-1">
                              {t.teamCode}
                            </span>
                            <span className="font-bold text-slate-900 block">{t.teamName}</span>
                            {t.stallNumber && (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                {t.stallNumber}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800 max-w-[220px] truncate">
                            {t.project?.title || t.title || 'Untitled Project'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-medium">
                            {cat?.name || 'General'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">
                            <div>{t.school || t.institution || '—'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {t.class || t.grade || ''} {t.section ? `Sec ${t.section}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-medium">
                            {t.members?.length || 1} members
                          </td>
                          <td className="px-4 py-3.5">
                            <Badge variant={statusVariant}>{t.status}</Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link href={`/admin/registration/teams/${t._id}`}>
                              <Button size="sm" variant="secondary" icon={<ChevronRight className="w-3.5 h-3.5" />}>
                                Review
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: EVALUATION */}
      {activeTab === 'EVALUATION' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dynamic Rubric & Evaluator Assignments</h2>
              <p className="text-xs text-slate-500">
                Configure scoring criteria, load competition presets, and assign judges to project stalls.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/admin/assignments?eventId=${event._id}`}>
                <Button variant="secondary" size="sm" icon={<Users className="w-4 h-4" />}>
                  Assignments Hub
                </Button>
              </Link>
              <Link href={`/admin/criteria?eventId=${event._id}`}>
                <Button variant="primary" size="sm" icon={<Sliders className="w-4 h-4" />}>
                  Criteria Studio
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Rubric Score</div>
              <div className="text-2xl font-black text-blue-600 mt-1">{eventTotalMarks} Marks</div>
              <div className="text-xs text-slate-500 mt-0.5">{eventCriteria.length} evaluation criteria</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Judge Stall Assignments</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">{eventAssignments.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">Scoring pairings configured</div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">Scoring Progress</div>
              <div className="text-2xl font-black text-purple-600 mt-1">
                {eventAssignments.filter((a) => a.status === 'COMPLETED').length} / {eventAssignments.length || 0}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Completed evaluations</div>
            </div>
          </div>

          {/* Criteria & Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Criteria List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Scoring Rubric ({eventCriteria.length})</CardTitle>
                  <CardDescription>Rules and mark boundaries for this event</CardDescription>
                </div>
                <Link href={`/admin/criteria?eventId=${event._id}`}>
                  <Button size="sm" variant="secondary">Configure</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {eventCriteria.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No criteria defined. Click Configure to add criteria or load a preset.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {eventCriteria.map((c, idx) => (
                      <div
                        key={c._id || idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <span className="text-[10px] text-slate-400">
                            {c.categoryId ? 'Category Specific' : 'Event-Wide Universal'}
                          </span>
                        </div>
                        <div className="text-right font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-100">
                          {c.maxMarks} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Judge Assignments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Assigned Evaluators ({eventAssignments.length})</CardTitle>
                  <CardDescription>Active stall pairings and scoring quotas</CardDescription>
                </div>
                <Link href={`/admin/assignments?eventId=${event._id}`}>
                  <Button size="sm" variant="secondary">Manage</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {eventAssignments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No assignments made yet. Click Manage to pair judges with stalls.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {eventAssignments.slice(0, 8).map((asg) => (
                      <div
                        key={asg._id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{asg.evaluatorName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            &rarr; {asg.teamCode || asg.teamName}
                          </span>
                        </div>
                        <Badge
                          size="sm"
                          variant={
                            asg.status === 'COMPLETED'
                              ? 'success'
                              : asg.status === 'IN_PROGRESS'
                              ? 'primary'
                              : 'neutral'
                          }
                        >
                          {asg.status || 'PENDING'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 5: RESULTS (Empty State) */}
      {activeTab === 'RESULTS' && (
        <EmptyState
          icon={Trophy}
          title="Results Module"
          description="Tabulation, tie-breaking, merit list review, and final result publication will be managed here once evaluation completes."
          action={
            <div className="flex items-center gap-2">
              <Badge variant="primary">Phase 5 Pipeline</Badge>
            </div>
          }
        />
      )}

      {/* Tab 6: FEEDBACK (Empty State) */}
      {activeTab === 'FEEDBACK' && (
        <EmptyState
          icon={MessageSquare}
          title="Visitor Feedback Module"
          description="Public visitor stall ratings, crowd-favorite voting, and exhibition reviews will appear here after exhibition gates open."
          action={
            <div className="flex items-center gap-2">
              <Badge variant="primary">Phase 6 Pipeline</Badge>
            </div>
          }
        />
      )}

      {/* Modal: Add/Edit Category */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCatId ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="e.g. Robotics & Embedded Systems"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <Textarea
              rows={3}
              placeholder="Brief guidelines or project scope for this category..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Order</label>
              <Input
                type="number"
                min={1}
                value={catOrder}
                onChange={(e) => setCatOrder(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <Select
                value={catStatus}
                onChange={(e) => setCatStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCatModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingCat}
            >
              {savingCat ? 'Saving...' : editingCatId ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Category */}
      <ConfirmDialog
        isOpen={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category?"
        description={`Are you sure you want to delete the category "${deletingCat?.name}"? Any linked teams will need category reassignment.`}
        confirmText="Delete Category"
        variant="danger"
      />

      {/* Confirm Archive Event */}
      <ConfirmDialog
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchiveEvent}
        title="Archive Event?"
        description={`Are you sure you want to archive "${event.name}"? It will be removed from active public catalogs.`}
        confirmText={archiving ? 'Archiving...' : 'Archive Event'}
        variant="danger"
      />
    </div>
  );
}
