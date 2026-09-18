'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  Layers,
  Image as ImageIcon,
  User,
  Phone,
  Link2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';

const EVENT_TYPE_OPTIONS = [
  { value: 'Science', label: 'Science Exhibition' },
  { value: 'IT', label: 'IT / Computer Science Exhibition' },
  { value: 'Cultural', label: 'Cultural Exhibition & Festival' },
  { value: 'Dance', label: 'Dance Competition' },
  { value: 'Sports', label: 'Sports Competition' },
  { value: 'Art', label: 'Art & Design Exhibition' },
  { value: 'Innovation', label: 'Innovation & Maker Faire' },
  { value: 'Robotics', label: 'Robotics Challenge' },
  { value: 'Other', label: 'Custom / Other Discipline' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CreateEventPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugCustomized, setSlugCustomized] = useState(false);
  const [eventType, setEventType] = useState('Science');
  const [customEventType, setCustomEventType] = useState('');
  const [description, setDescription] = useState('');
  const [banner, setBanner] = useState('');
  const [logo, setLogo] = useState('');
  const [venue, setVenue] = useState('Auditorium & Exhibition Hall 1');
  const [startDate, setStartDate] = useState('2026-11-15T09:00');
  const [endDate, setEndDate] = useState('2026-11-17T17:00');
  const [registrationStart, setRegistrationStart] = useState('2026-10-01T08:00');
  const [registrationEnd, setRegistrationEnd] = useState('2026-11-05T23:59');
  const [organizer, setOrganizer] = useState('Inter-University Academic Board');
  const [contact, setContact] = useState('events@academic.portal.edu / +1 (555) 234-5678');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugCustomized) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugCustomized(true);
    setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Event name is required');
      return;
    }
    if (!venue.trim()) {
      setError('Venue is required');
      return;
    }
    if (!startDate || !endDate) {
      setError('Start and End dates are required');
      return;
    }

    const finalEventType = eventType === 'Other' && customEventType.trim() ? customEventType.trim() : eventType;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          description: description.trim(),
          eventType: finalEventType,
          banner: banner.trim(),
          logo: logo.trim(),
          venue: venue.trim(),
          startDate,
          endDate,
          registrationStart,
          registrationEnd,
          organizer: organizer.trim(),
          contact: contact.trim(),
          status: 'DRAFT',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      showToast('Event created successfully!', 'success');
      router.push(`/admin/events/${data.event._id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      showToast(err.message || 'Failed to create event', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events List</span>
        </Link>
      </div>

      <PageHeader
        badge="New Event Setup"
        title="Create Exhibition or Competition"
        description="Initialize an event workspace. Configure discipline type, dates, venue, and public metadata."
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. General Identity</CardTitle>
            <CardDescription>Event title, URL path, discipline, and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. National Robotics & AI Symposium 2026"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                  <span className="bg-slate-50 px-3 py-2 text-xs text-slate-500 font-mono border-r border-slate-200 select-none">
                    /events/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="robotics-symposium-2026"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Discipline / Type <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  options={EVENT_TYPE_OPTIONS}
                />
              </div>

              {eventType === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Custom Discipline Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Aeronautics, Quiz, Culinary"
                    value={customEventType}
                    onChange={(e) => setCustomEventType(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <Textarea
                rows={3}
                placeholder="Comprehensive summary of the event objectives, target participants, and exhibition highlights..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Venue & Scheduling</CardTitle>
            <CardDescription>Location coordinates and operational timeframes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Venue & Hall <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Science Park Pavilion & Hall 3"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Start Date & Time <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event End Date & Time <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Opens</label>
                <Input
                  type="datetime-local"
                  value={registrationStart}
                  onChange={(e) => setRegistrationStart(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration Closes</label>
                <Input
                  type="datetime-local"
                  value={registrationEnd}
                  onChange={(e) => setRegistrationEnd(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Media & Organization</CardTitle>
            <CardDescription>Visual assets, hosting institution, and official contact channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image URL</label>
                <Input
                  placeholder="https://images.unsplash.com/... or /images/..."
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1">Recommended ratio 16:9 for public catalog display</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logo / Badge URL</label>
                <Input
                  placeholder="https://... logo or emblem icon"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organizer</label>
                <Input
                  placeholder="e.g. Department of Engineering & Technology"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email / Phone</label>
                <Input
                  placeholder="e.g. contact@portal.edu / (555) 019-2834"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/events')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              icon={<Sparkles className="w-4 h-4" />}
            >
              {loading ? 'Creating Event...' : 'Create Event (Draft)'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
