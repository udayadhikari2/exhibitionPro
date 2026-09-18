'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Save,
  Layers,
  Image as ImageIcon,
  User,
  Phone,
  Link2,
  CheckCircle2,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/components/ui/toast';
import { IEvent } from '@/types';

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

function formatDatetimeInput(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [eventType, setEventType] = useState('Science');
  const [customEventType, setCustomEventType] = useState('');
  const [description, setDescription] = useState('');
  const [banner, setBanner] = useState('');
  const [logo, setLogo] = useState('');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationEnd, setRegistrationEnd] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [contact, setContact] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch event');
        }

        const evt: IEvent = data.event;
        setName(evt.name || evt.title || '');
        setSlug(evt.slug || '');
        setDescription(evt.description || '');
        setBanner(evt.banner || evt.bannerUrl || '');
        setLogo(evt.logo || '');
        setVenue(evt.venue || '');
        setStartDate(formatDatetimeInput(evt.startDate));
        setEndDate(formatDatetimeInput(evt.endDate));
        setRegistrationStart(formatDatetimeInput(evt.registrationStart));
        setRegistrationEnd(formatDatetimeInput(evt.registrationEnd));
        setOrganizer(evt.organizer || '');
        setContact(evt.contact || '');

        const isStandardType = EVENT_TYPE_OPTIONS.some((opt) => opt.value === evt.eventType);
        if (isStandardType) {
          setEventType(evt.eventType);
        } else {
          setEventType('Other');
          setCustomEventType(evt.eventType);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading event');
        showToast(err.message || 'Failed to load event details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

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

    const finalEventType = eventType === 'Other' && customEventType.trim() ? customEventType.trim() : eventType;

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update event');
      }

      showToast('Event updated successfully!', 'success');
      router.push(`/admin/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LoadingState message="Loading event settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href={`/admin/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Studio</span>
        </Link>
      </div>

      <PageHeader
        badge="Configuration Editor"
        title={`Edit Event: ${name}`}
        description="Update event metadata, schedule dates, registration windows, and branding media."
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
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
            <CardTitle>3. Media & Contact Details</CardTitle>
            <CardDescription>Visual assets, hosting institution, and official contact channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image URL</label>
                <Input
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logo / Badge URL</label>
                <Input
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organizer</label>
                <Input
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email / Phone</label>
                <Input
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
              onClick={() => router.push(`/admin/events/${eventId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              icon={<Save className="w-4 h-4" />}
            >
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
