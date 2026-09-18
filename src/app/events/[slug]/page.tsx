'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  Mail,
  Share2,
  Trophy,
  AlertCircle,
  ExternalLink,
  Search,
  QrCode,
  Star,
  Send,
  MessageSquare,
  Filter,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import QRBadge from '@/components/qr-badge';
import { IEvent, ICategory, IPublicProject } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<IEvent | null>(null);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [projects, setProjects] = useState<IPublicProject[]>([]);
  const [resultSummary, setResultSummary] = useState<{ isPublished: boolean; top3: any[] }>({
    isPublished: false,
    top3: [],
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // QR Modal States
  const [showEventQRModal, setShowEventQRModal] = useState(false);
  const [selectedProjectForQR, setSelectedProjectForQR] = useState<IPublicProject | null>(null);

  // General Event Visitor Feedback Form
  const [visitorName, setVisitorName] = useState('');
  const [visitorType, setVisitorType] = useState('General Visitor');
  const [eventRating, setEventRating] = useState(5);
  const [eventComments, setEventComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [slug]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/events/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Event not found');

      setEvent(data.event);
      setCategories(data.categories || []);
      setProjects(data.projects || []);
      if (data.resultSummary) {
        setResultSummary(data.resultSummary);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load exhibition', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.name || 'Exhibition Portal',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Event link copied to clipboard!', 'success');
    }
  };

  const handleGeneralFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !eventComments.trim()) {
      showToast('Please enter your name and comments', 'warning');
      return;
    }

    try {
      setSubmittingFeedback(true);
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event?._id,
          visitorName,
          visitorType,
          rating: eventRating,
          comments: eventComments,
        }),
      });

      if (res.ok) {
        setFeedbackSubmitted(true);
        setEventComments('');
        showToast('Thank you! Your visitor feedback was recorded.', 'success');
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Failed to submit review');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting review', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Distinct classes for filter dropdown
  const availableClasses = React.useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.class) set.add(p.class);
      if (p.grade) set.add(p.grade);
    });
    return Array.from(set).sort();
  }, [projects]);

  // Filtered projects
  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category.id !== selectedCategory) {
        return false;
      }
      // Class filter
      if (selectedClass !== 'ALL') {
        const pClass = p.class || p.grade;
        if (pClass !== selectedClass) return false;
      }
      // Search term
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim();
        const matchesName = p.projectTitle.toLowerCase().includes(term);
        const matchesTeam = p.teamName.toLowerCase().includes(term);
        const matchesCode = p.teamCode.toLowerCase().includes(term);
        const matchesCat = p.category.name.toLowerCase().includes(term);
        const matchesClass = (p.class || p.grade || '').toLowerCase().includes(term);
        const matchesStall = (p.stallNumber || '').toLowerCase().includes(term);
        if (!matchesName && !matchesTeam && !matchesCode && !matchesCat && !matchesClass && !matchesStall) {
          return false;
        }
      }
      return true;
    });
  }, [projects, selectedCategory, selectedClass, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20">
        <LoadingState message="Loading exhibition portal &amp; project catalog..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <EmptyState
          title="Exhibition Not Found"
          description="We couldn't find the requested exhibition or competition. It may have expired or been moved."
          action={
            <Link href="/events">
              <Button variant="primary">Browse All Exhibitions</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isRegistrationOpen = event.status === 'REGISTRATION_OPEN';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>All Exhibitions</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowEventQRModal(true)}
            icon={<QrCode className="w-3.5 h-3.5 text-blue-600" />}
          >
            Event QR Code
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleShare}
            icon={<Share2 className="w-3.5 h-3.5" />}
          >
            Share
          </Button>
        </div>
      </div>

      {/* SECTION 1: HERO */}
      <section id="hero" className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="h-64 sm:h-96 w-full relative bg-slate-900">
          {event.banner ? (
            <img
              src={event.banner}
              alt={event.name}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 flex items-center justify-center text-white/25">
              <Trophy className="w-24 h-24" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Badges */}
          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white text-slate-900 shadow-md">
              {event.eventType}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur border border-white/20">
              {event.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Title & Info */}
          <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 text-white space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md">
              {event.name}
            </h1>
            {event.organizer && (
              <p className="text-xs sm:text-sm text-slate-200 font-medium">
                Hosted by <span className="font-bold text-white">{event.organizer}</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Venue</div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm">{event.venue}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Schedule</div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm">
                {formatDate(event.startDate)} &mdash; {formatDate(event.endDate)}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Categories</div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm">
                {categories.length} Divisions
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Exhibits</div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm">
                {projects.length} Participating Teams
              </div>
            </div>
          </div>
        </div>

        {/* Anchor Navigation Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 overflow-x-auto flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="text-[10px] uppercase text-slate-400 font-bold mr-2">Jump to:</span>
          <a href="#about" className="px-3 py-1.5 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
            About
          </a>
          <a href="#info" className="px-3 py-1.5 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
            Event Information
          </a>
          <a href="#categories" className="px-3 py-1.5 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
            Categories ({categories.length})
          </a>
          <a href="#projects" className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition whitespace-nowrap">
            Projects Showcase ({projects.length})
          </a>
          <a href="#results" className="px-3 py-1.5 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
            Results &amp; Podium
          </a>
          <a href="#feedback" className="px-3 py-1.5 rounded-xl hover:bg-slate-100 transition whitespace-nowrap">
            Visitor Feedback
          </a>
        </div>
      </section>

      {/* SECTION 2: ABOUT */}
      <section id="about" className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">About the Exhibition</h2>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-4">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line">
              {event.description ||
                'Welcome to this exhibition. Detailed guidelines and schedules will be updated by the steering committee.'}
            </p>

            {isRegistrationOpen && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs mt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-950">Registration is OPEN!</h4>
                    <p className="text-emerald-800 mt-0.5">
                      Student teams can register entries under the competition categories below.
                    </p>
                  </div>
                </div>
                <Link href="/student">
                  <Button variant="primary" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
                    Student Portal
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* SECTION 3: EVENT INFORMATION */}
      <section id="info" className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Event Information &amp; Rules</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-slate-500 font-bold">Venue &amp; Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-slate-600">
              <div className="font-bold text-slate-900 text-sm">{event.venue}</div>
              <p>Open to visitors, students, educators, and institutional juries.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-slate-500 font-bold">Important Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-900">Exhibition Start:</span> {formatDate(event.startDate)}
              </div>
              <div>
                <span className="font-bold text-slate-900">Grand Finale:</span> {formatDate(event.endDate)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase text-slate-500 font-bold">Contact &amp; Organizing Desk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-slate-600">
              {event.organizer && <div>{event.organizer}</div>}
              {event.contact && <div className="font-semibold text-blue-600">{event.contact}</div>}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 4: CATEGORIES */}
      <section id="categories" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Competition Categories</h2>
          </div>
          <Badge variant="neutral" size="sm">
            {categories.length} Categories
          </Badge>
        </div>

        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-slate-500">
              Competition categories are currently being finalized by the organizing committee.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, idx) => {
              const projectCount = projects.filter((p) => p.category.id === cat._id).length;
              return (
                <div
                  key={cat._id}
                  onClick={() => {
                    setSelectedCategory(cat._id);
                    const el = document.getElementById('projects');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    selectedCategory === cat._id
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 tracking-wider uppercase">
                      Division {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      {projectCount} projects
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900">{cat.name}</h3>

                  {cat.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 5: PROJECTS (EXHIBITION SHOWCASE & SEARCH) */}
      <section id="projects" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Exhibition Projects Showcase</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Explore student prototypes, hardware stalls, and research exhibits. Scan any stall QR code to view full digital specs.
            </p>
          </div>

          <Badge variant="primary" size="md">
            {filteredProjects.length} of {projects.length} Projects Shown
          </Badge>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name, team, stall number, or technology..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Class / Grade Filter */}
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="ALL">All Classes / Grades</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Class / Grade {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 shrink-0">
              Track:
            </span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Tracks ({projects.length})
            </button>
            {categories.map((c) => {
              const count = projects.filter((p) => p.category.id === c._id).length;
              return (
                <button
                  key={c._id}
                  onClick={() => setSelectedCategory(c._id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === c._id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Cards Grid */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center space-y-3">
              <EmptyState
                title="No Projects Match Search Criteria"
                description="Try clearing your search terms or selecting a different competition track division."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setSelectedClass('ALL');
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Stall Number & Category */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black uppercase tracking-wide">
                      {p.stallNumber ? `Booth #${p.stallNumber}` : 'Entry'}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {p.teamCode}
                    </span>
                  </div>

                  {/* Title & Short Abstract */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                      {p.projectTitle}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                      {p.shortDescription}
                    </p>
                  </div>

                  {/* Team & Members */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-900">{p.teamName}</span>
                      {(p.class || p.grade) && (
                        <span className="text-slate-400"> &bull; Cl. {p.class || p.grade}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                      <Users className="w-3.5 h-3.5" />
                      <span>{p.members.length}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForQR(p)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    <span>View QR</span>
                  </button>

                  <Link href={`/events/${slug}/projects/${p.teamCode}`}>
                    <Button size="sm" variant="primary" className="text-xs">
                      <span>View Showcase</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 6: RESULTS & PODIUM */}
      <section id="results" className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Official Competition Results</h2>
        </div>

        {resultSummary.isPublished ? (
          <Card className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-amber-200">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <Badge variant="warning" size="md">
                    Certified Official Standings Published
                  </Badge>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Hall of Champions &amp; Winners Podium
                  </h3>
                  <p className="text-xs text-slate-600">
                    Grand jury scores have been finalized, normalized, and signed off by the steering committee.
                  </p>
                </div>

                <Link href={`/events/${slug}/results`}>
                  <Button variant="primary" icon={<Trophy className="w-4 h-4 text-amber-300" />}>
                    View Full Leaderboard
                  </Button>
                </Link>
              </div>

              {/* Podium Snippet */}
              {resultSummary.top3 && resultSummary.top3.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {resultSummary.top3.map((win, i) => {
                    const badgeStyles = [
                      'border-amber-400 bg-amber-50 text-amber-900', // Gold
                      'border-slate-300 bg-slate-100 text-slate-800', // Silver
                      'border-amber-700/30 bg-amber-900/10 text-amber-950', // Bronze
                    ];
                    const medals = ['Gold Medal', 'Silver Medal', 'Bronze Medal'];

                    return (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border ${badgeStyles[i] || 'border-slate-200 bg-white'} space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            Rank {win.rankOverall} &bull; {medals[i] || 'Honorable Mention'}
                          </span>
                          <span className="text-xs font-black">{win.averageScore.toFixed(1)} pts</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {win.projectTitle}
                        </div>
                        <div className="text-xs text-slate-600 truncate">{win.teamName}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Results Pending Committee Certification</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Evaluator scoring is currently in progress or undergoing official audit. The public Hall of Champions will unlock immediately once approved.
                </p>
              </div>
              <Link href={`/events/${slug}/results`}>
                <Button variant="outline" size="sm">
                  Check Results Status
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* SECTION 7: VISITOR FEEDBACK & ENGAGEMENT */}
      <section id="feedback" className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Visitor Feedback &amp; Review</h2>
        </div>

        <Card className="bg-gradient-to-b from-white to-slate-50">
          <CardHeader>
            <CardTitle>Share Your Exhibition Experience</CardTitle>
            <CardDescription>
              Are you visiting the stalls today? Leave your impressions, praise, and feedback for our student innovators and event organizers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-950">Thank You for Your Feedback!</h4>
                <p className="text-xs text-emerald-800">
                  Your comments and encouragement help inspire the next generation of creative builders.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFeedbackSubmitted(false)}
                  className="mt-2 text-xs"
                >
                  Write Another Note
                </Button>
              </div>
            ) : (
              <form onSubmit={handleGeneralFeedbackSubmit} className="space-y-4 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="e.g. Visitor / Parent"
                      required
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Visitor Role</label>
                    <select
                      value={visitorType}
                      onChange={(e) => setVisitorType(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="General Visitor">General Visitor</option>
                      <option value="Parent / Guardian">Parent / Guardian</option>
                      <option value="Industry Guest">Industry Guest</option>
                      <option value="Educator / Teacher">Educator / Teacher</option>
                      <option value="Student Peer">Student Peer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exhibition Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEventRating(s)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${s <= eventRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">{eventRating} / 5 Stars</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Impressions &amp; Feedback</label>
                  <textarea
                    rows={4}
                    value={eventComments}
                    onChange={(e) => setEventComments(e.target.value)}
                    placeholder="Tell us what impressed you most about the exhibition and student projects..."
                    required
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submittingFeedback}
                  icon={<Send className="w-4 h-4" />}
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Visitor Review'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* MODAL 1: EVENT-LEVEL QR CODE */}
      <Modal
        isOpen={showEventQRModal}
        onClose={() => setShowEventQRModal(false)}
        title="Official Exhibition Gateway QR"
        size="md"
      >
        <div className="p-4">
          <QRBadge
            eventTitle={event.name}
            eventSlug={slug}
            isEventQR={true}
          />
        </div>
      </Modal>

      {/* MODAL 2: INDIVIDUAL STALL / BOOTH QR CODE */}
      <Modal
        isOpen={!!selectedProjectForQR}
        onClose={() => setSelectedProjectForQR(null)}
        title="Official Booth Placard &amp; QR"
        size="md"
      >
        <div className="p-4">
          {selectedProjectForQR && (
            <QRBadge
              teamCode={selectedProjectForQR.teamCode}
              stallNumber={selectedProjectForQR.stallNumber}
              projectTitle={selectedProjectForQR.projectTitle}
              teamName={selectedProjectForQR.teamName}
              categoryName={selectedProjectForQR.category.name}
              institution={selectedProjectForQR.school || selectedProjectForQR.institution}
              eventTitle={event.name}
              eventSlug={slug}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
